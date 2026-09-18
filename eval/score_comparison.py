from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from eval.common import RESULTS_DIR, call_chat_completion, extract_json, get_env, load_ideas

VF_RUNS = RESULTS_DIR / "ventureforge_runs.jsonl"
BASELINE_RUNS = RESULTS_DIR / "naive_baseline_runs.jsonl"
CSV_PATH = RESULTS_DIR / "comparison_summary.csv"
MD_PATH = RESULTS_DIR / "comparison_summary.md"


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    if not path.exists():
        return rows
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


JUDGE_PROMPT = """You are an expert evaluator for startup strategy artifacts. Score the candidate on a 1-5 scale for each metric:
1) market_sizing_specificity
2) financial_model_completeness
3) legal_checklist_relevance
4) structural_consistency

Use only the provided idea and output. Do not invent facts.
Return strict JSON with keys:
scores: object with the four metrics as integers 1-5
justifications: object with the four metrics as one-line strings
reasoning: short paragraph explaining your judgment

Idea domain: {domain}
Idea text: {idea_text}

Reference output:
{output_json}
"""


def main() -> None:
    provider = get_env("EVAL_JUDGE_PROVIDER", "groq")
    model = get_env("EVAL_JUDGE_MODEL", "llama-3.1-8b-instant")
    vf_runs = {r["idea_id"]: r for r in load_jsonl(VF_RUNS)}
    baseline_runs = {r["idea_id"]: r for r in load_jsonl(BASELINE_RUNS)}
    ideas = load_ideas()
    rows: list[dict[str, Any]] = []
    aggregates = {"ventureforge": {k: [] for k in range(4)}, "baseline": {k: [] for k in range(4)}}
    metrics = ["market_sizing_specificity", "financial_model_completeness", "legal_checklist_relevance", "structural_consistency"]
    for idea in ideas:
        for system_name, run in [("ventureforge", vf_runs.get(idea.id)), ("baseline", baseline_runs.get(idea.id))]:
            if not run:
                continue
            output_json = run.get("final_state") if system_name == "ventureforge" else run.get("parsed_output")
            if output_json is None:
                output_json = {"raw_output": run.get("raw_output", ""), "parse_error": run.get("parse_error")}
            raw_judgment = call_chat_completion(
                provider,
                model,
                [
                    {"role": "system", "content": "You are a strict but fair evaluator. Output only JSON."},
                    {"role": "user", "content": JUDGE_PROMPT.format(domain=idea.domain, idea_text=idea.idea_text, output_json=json.dumps(output_json, ensure_ascii=True, indent=2))},
                ],
                temperature=0.0,
                max_tokens=2000,
            )
            judgment = extract_json(raw_judgment)
            score_row = {
                "idea_id": idea.id,
                "system": system_name,
                "market_sizing_specificity": judgment["scores"]["market_sizing_specificity"],
                "financial_model_completeness": judgment["scores"]["financial_model_completeness"],
                "legal_checklist_relevance": judgment["scores"]["legal_checklist_relevance"],
                "structural_consistency": judgment["scores"]["structural_consistency"],
                "raw_reasoning": judgment.get("reasoning", ""),
                "justification_market_sizing_specificity": judgment["justifications"]["market_sizing_specificity"],
                "justification_financial_model_completeness": judgment["justifications"]["financial_model_completeness"],
                "justification_legal_checklist_relevance": judgment["justifications"]["legal_checklist_relevance"],
                "justification_structural_consistency": judgment["justifications"]["structural_consistency"],
            }
            rows.append(score_row)
            for idx, metric in enumerate(metrics):
                aggregates[system_name][idx].append(score_row[metric])
    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else ["idea_id", "system"])
        writer.writeheader()
        writer.writerows(rows)
    md = ["# Comparison Summary", ""]
    for idx, metric in enumerate(metrics):
        vf_vals = aggregates["ventureforge"][idx]
        base_vals = aggregates["baseline"][idx]
        vf_avg = sum(vf_vals) / len(vf_vals) if vf_vals else None
        base_avg = sum(base_vals) / len(base_vals) if base_vals else None
        md.append(f"- {metric}: VentureForge {vf_avg:.2f} vs baseline {base_avg:.2f}" if vf_avg is not None and base_avg is not None else f"- {metric}: insufficient data")
    MD_PATH.write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"Wrote {CSV_PATH}")
    print(f"Wrote {MD_PATH}")


if __name__ == "__main__":
    main()
