from __future__ import annotations

import csv
from pathlib import Path
from statistics import mean, median

from eval.common import RESULTS_DIR

RESPONSES = RESULTS_DIR / "user_study_responses.csv"
SUMMARY = RESULTS_DIR / "user_study_summary.md"


def load_rows():
    if not RESPONSES.exists():
        return []
    with RESPONSES.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def values(rows, key):
    out = []
    for row in rows:
        try:
            out.append(float(row[key]))
        except Exception:
            pass
    return out


def main() -> None:
    rows = load_rows()
    if not rows:
        SUMMARY.write_text("# User Study Summary\n\nNo responses recorded yet.\n", encoding="utf-8")
        print(f"Wrote {SUMMARY}")
        return
    metrics = [
        ("business_plan_useful", "q1_business_plan_useful"),
        ("financial_plausible", "q2_financial_plausible"),
        ("legal_relevant", "q3_legal_relevant"),
        ("trust_starting_point", "q4_trust_starting_point"),
        ("human_review_meaningful", "q5_human_review_meaningful"),
    ]
    lines = ["# User Study Summary", "", f"- n respondents: {len(rows)}"]
    for label, key in metrics:
        vals = values(rows, key)
        if vals:
            lines.append(f"- {label}: mean {mean(vals):.2f}, median {median(vals):.2f}")
        else:
            lines.append(f"- {label}: insufficient data")
    SUMMARY.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {SUMMARY}")


if __name__ == "__main__":
    main()

