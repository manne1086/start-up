from __future__ import annotations

import argparse
import time
from pathlib import Path
from typing import Any

from eval.common import RESULTS_DIR, append_jsonl, call_chat_completion, get_env, load_ideas, now_iso, parse_evaluation_output

RUNS_PATH = RESULTS_DIR / "naive_baseline_runs.jsonl"


PROMPT = """You are helping evaluate startup ideas for a research study.
For the idea below, produce a single JSON object with exactly these keys:
market, business_plan, financials, legal, pitch_deck.

Requirements:
- market: include tam, sam, som, tam_source, competitors, market_gaps, raw_search_results.
- business_plan: include problem_statement, solution, target_market, revenue_model, pricing, gtm_strategy, value_proposition, key_risks, mitigation_steps.
- financials: include assumptions, projections, npv, irr, payback_months, fcf_formula.
- legal: include gdpr_compliant, local_regulations, entity_recommendation, entity_notes, action_items, documents_available.
- pitch_deck: include slides, brand, template, presenton_id, presenton_download_url, presenton_edit_url, slide_image_count.
- Keep it internally consistent. Do not add markdown, code fences, or commentary outside JSON.

Idea domain: {domain}
Idea text: {idea_text}
"""


def main() -> None:
    provider = get_env("EVAL_BASELINE_PROVIDER", "groq")
    model = get_env("EVAL_BASELINE_MODEL", get_env("GROQ_MODEL", "llama-3.3-70b-versatile"))
    ideas = load_ideas()
    for idx, idea in enumerate(ideas, start=1):
        print(f"[{idx}/{len(ideas)}] baseline {idea.id} ({idea.domain})")
        started = time.perf_counter()
        raw = call_chat_completion(
            provider,
            model,
            [
                {"role": "system", "content": "You are a precise research assistant that outputs only valid JSON."},
                {"role": "user", "content": PROMPT.format(domain=idea.domain, idea_text=idea.idea_text)},
            ],
            temperature=0.2,
            max_tokens=6000,
        )
        parsed, parse_error = parse_evaluation_output(raw)
        record = {
            "idea_id": idea.id,
            "domain": idea.domain,
            "started_at": now_iso(),
            "provider": provider,
            "model": model,
            "latency_seconds": time.perf_counter() - started,
            "parseable": parsed is not None,
            "parse_error": parse_error,
            "raw_output": raw,
            "parsed_output": parsed.model_dump() if parsed else None,
        }
        append_jsonl(RUNS_PATH, record)
    print(f"Wrote {RUNS_PATH}")


if __name__ == "__main__":
    main()

