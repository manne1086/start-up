from __future__ import annotations

import argparse
import csv
import sys

from eval.common import RESULTS_DIR, ensure_parent

OUT_PATH = RESULTS_DIR / "user_study_responses.csv"
FIELDNAMES = [
    "participant_id",
    "domain_background",
    "total_time_spent_minutes",
    "q1_business_plan_useful",
    "q1_comment",
    "q2_financial_plausible",
    "q2_comment",
    "q3_legal_relevant",
    "q3_comment",
    "q4_trust_starting_point",
    "q4_comment",
    "q5_human_review_meaningful",
    "q5_comment",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Append a VentureForge user study response row.")
    for field in FIELDNAMES:
        parser.add_argument(f"--{field.replace('_', '-')}", dest=field)
    args = parser.parse_args()
    ensure_parent(OUT_PATH)
    if not OUT_PATH.exists():
        with OUT_PATH.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writeheader()
    row = {field: getattr(args, field) for field in FIELDNAMES if getattr(args, field) is not None}
    if row:
        with OUT_PATH.open("a", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writerow({field: row.get(field, "") for field in FIELDNAMES})
        print(f"Appended response to {OUT_PATH}")
        return
    print("No values provided. Pass the questionnaire fields as CLI flags to append one response row.")
    print(f"CSV target: {OUT_PATH}")
    sys.exit(1)


if __name__ == "__main__":
    main()
