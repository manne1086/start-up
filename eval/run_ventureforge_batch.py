from __future__ import annotations

import argparse
import asyncio
import time
from typing import Any

import httpx

from eval.common import RESULTS_DIR, append_jsonl, load_ideas, now_iso, summarize_numbers, validate_run_state_payload, write_json

BASE_URL = "http://localhost:8000"
RUNS_PATH = RESULTS_DIR / "ventureforge_runs.jsonl"
SUMMARY_PATH = RESULTS_DIR / "ventureforge_summary.json"


async def wait_for_review(client: httpx.AsyncClient, thread_id: str, timeout_s: int = 3600) -> dict[str, Any]:
    started = time.perf_counter()
    while True:
        resp = await client.get(f"/api/review/{thread_id}")
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("found") and payload.get("awaiting_human_review"):
            return payload
        if time.perf_counter() - started > timeout_s:
            raise TimeoutError(f"Timed out waiting for review checkpoint for {thread_id}")
        await asyncio.sleep(2)


async def run_one(client: httpx.AsyncClient, idea: dict[str, Any]) -> dict[str, Any]:
    start_wall = time.perf_counter()
    started_at = now_iso()
    result: dict[str, Any] = {
        "idea_id": idea["id"],
        "domain": idea["domain"],
        "started_at": started_at,
        "checkpoint_auto_approval": True,
        "checkpoint_auto_approval_note": "Human-review checkpoint was auto-approved for unattended batch execution.",
    }
    try:
        resp = await client.post("/api/generate", json={"idea": idea["idea_text"], "user_id": "eval-batch"})
        resp.raise_for_status()
        data = resp.json()
        thread_id = data["thread_id"]
        result["thread_id"] = thread_id
        review = await wait_for_review(client, thread_id)
        review_state = review.get("state") or {}
        result["review_checkpoint_reached"] = True
        result["review_latency_seconds"] = time.perf_counter() - start_wall
        schema_ok, schema_errors = validate_run_state_payload(review_state)
        result["schema_validation_passed"] = schema_ok
        result["schema_validation_errors"] = schema_errors
        result["validator_loop_market_reinvocations"] = int(review_state.get("retry_counts", {}).get("market_research", 0))
        result["validator_loop_financial_reinvocations"] = int(review_state.get("retry_counts", {}).get("financial_engineering", 0))
        approve_started = time.perf_counter()
        approve = await client.post("/api/review/approve", json={"thread_id": thread_id})
        approve.raise_for_status()
        approve_data = approve.json()
        result["approve_latency_seconds"] = time.perf_counter() - approve_started
        result["ended_at"] = now_iso()
        final_state = approve_data.get("state") or {}
        result["status"] = final_state.get("status", data.get("status", "unknown"))
        result["completed"] = result["status"] == "complete"
        result["end_to_end_seconds"] = time.perf_counter() - start_wall
        result["final_state"] = final_state
    except Exception as exc:
        result.setdefault("thread_id", None)
        result["review_checkpoint_reached"] = False
        result["review_latency_seconds"] = None
        result["schema_validation_passed"] = False
        result["schema_validation_errors"] = [repr(exc)]
        result["validator_loop_market_reinvocations"] = None
        result["validator_loop_financial_reinvocations"] = None
        result["approve_latency_seconds"] = None
        result["ended_at"] = now_iso()
        result["status"] = "failed"
        result["completed"] = False
        result["end_to_end_seconds"] = time.perf_counter() - start_wall
        result["error"] = repr(exc)
    append_jsonl(RUNS_PATH, result)
    return result


async def main() -> None:
    ideas = load_ideas()
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=600) as client:
        results = []
        for idx, idea in enumerate(ideas, start=1):
            print(f"[{idx}/{len(ideas)}] running {idea.id} ({idea.domain})")
            results.append(await run_one(client, idea.model_dump()))
    summary = {
        "n_runs": len(results),
        "completion_rate": sum(1 for r in results if r.get("completed")) / len(results) if results else None,
        "checkpoint_latency_seconds": summarize_numbers([r.get("review_latency_seconds") for r in results if r.get("review_latency_seconds") is not None]),
        "end_to_end_seconds": summarize_numbers([r.get("end_to_end_seconds") for r in results if r.get("end_to_end_seconds") is not None]),
        "schema_conformance_rate": sum(1 for r in results if r.get("schema_validation_passed")) / len(results) if results else None,
        "mean_validator_loop_count": summarize_numbers([
            float((r.get("validator_loop_market_reinvocations") or 0) + (r.get("validator_loop_financial_reinvocations") or 0))
            for r in results
            if r.get("review_checkpoint_reached")
        ])["mean"],
        "note": "Human-review checkpoint was auto-approved for unattended batch execution.",
    }
    write_json(SUMMARY_PATH, summary)
    print(f"Wrote {RUNS_PATH}")
    print(f"Wrote {SUMMARY_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
