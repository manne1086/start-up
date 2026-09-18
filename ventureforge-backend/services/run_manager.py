import asyncio
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from graph.nodes.briefing import briefing
from graph.nodes.business_planning import business_planning
from graph.nodes.financial_engineering import financial_engineering
from graph.nodes.legal_compliance import legal_compliance
from graph.nodes.market_research import market_research
from graph.nodes.mvp_architecture import mvp_architecture
from graph.nodes.orchestrator import orchestrator
from graph.nodes.pitch_deck import pitch_deck
from graph.nodes.pivot_simulator import pivot_simulator
from graph.nodes.validator import validator_financial, validator_market
from graph.state import AgentLog, StartupState
from core.database import execute, fetch_one
from services.stream_manager import push_event, get_queue


@dataclass
class RunRecord:
    state: StartupState
    paused: bool = False
    done: bool = False
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    task: asyncio.Task | None = None


RUNS: dict[str, RunRecord] = {}
RUN_STATE_DIR = Path(__file__).resolve().parents[1] / ".run_states"
RUN_STATE_DIR.mkdir(exist_ok=True)


async def _persist_run_state(state: StartupState, paused: bool, done: bool) -> None:
    payload = {"state": json.loads(state.model_dump_json()), "paused": paused, "done": done}
    try:
        await execute(
            """
            INSERT INTO ventureforge_run_states (thread_id, state, paused, done, updated_at)
            VALUES (%s, %s::jsonb, %s, %s, NOW())
            ON CONFLICT (thread_id)
            DO UPDATE SET
                state = EXCLUDED.state,
                paused = EXCLUDED.paused,
                done = EXCLUDED.done,
                updated_at = NOW()
            """,
            (state.thread_id, state.model_dump_json(), paused, done),
        )
    except Exception:
        (RUN_STATE_DIR / f"{state.thread_id}.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


async def _load_persisted_state(thread_id: str) -> StartupState | None:
    try:
        row = await fetch_one("SELECT state FROM ventureforge_run_states WHERE thread_id = %s", (thread_id,))
        if row:
            return StartupState.model_validate(row["state"])
    except Exception:
        pass
    path = RUN_STATE_DIR / f"{thread_id}.json"
    if not path.exists():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    return StartupState.model_validate(payload["state"])


def _humanize_node_name(node_name: str) -> str:
    return {
        "orchestrator": "Orchestrator",
        "market_research": "Market Research",
        "validator_market": "Market Validation",
        "business_planning": "Business Planning",
        "financial_engineering": "Financial Engineering",
        "validator_financial": "Financial Validation",
        "legal_compliance": "Legal Compliance",
        "pitch_deck": "Pitch Deck",
        "mvp_architecture": "MVP Architecture",
        "pivot_simulator": "Pivot Simulator",
        "briefing": "Executive Briefing",
    }.get(node_name, node_name.replace("_", " ").title())


async def emit(thread_id: str, event_type: str, payload: dict[str, Any]) -> None:
    await push_event(thread_id, {"type": event_type, "payload": payload})


async def emit_log(thread_id: str, log: AgentLog) -> None:
    await emit(thread_id, "log", log.model_dump(mode="json"))


async def trace_node_start(thread_id: str, state: StartupState, node_name: str) -> None:
    label = _humanize_node_name(node_name)
    log = AgentLog(agent=label, message=f"Calling {label} agent.", status="info")
    state.agent_logs.append(log)
    await emit_log(thread_id, log)


async def trace_node_complete(thread_id: str, state: StartupState, node_name: str) -> None:
    label = _humanize_node_name(node_name)
    log = AgentLog(agent=label, message=f"{label} agent completed.", status="success")
    state.agent_logs.append(log)
    await emit_log(thread_id, log)


async def run_until_pause(thread_id: str) -> None:
    record = RUNS[thread_id]
    async with record.lock:
        state = record.state
        await emit(thread_id, "status", {"status": "running", "thread_id": thread_id})

        for node_name, node in [
            ("orchestrator", orchestrator),
            ("market_research", market_research),
            ("validator_market", validator_market),
            ("business_planning", business_planning),
        ]:
            await emit(thread_id, "step", {"node": node_name, "status": "started"})
            await trace_node_start(thread_id, state, node_name)
            # Nodes push their own logs live via services.stream_manager.log_event
            # as they happen (e.g. Tavily search queries/URLs), not just at the end.
            state = await node(state)
            await trace_node_complete(thread_id, state, node_name)
            await emit(thread_id, "step", {"node": node_name, "status": "completed"})

        state.awaiting_human_review = True
        state.status = "paused"
        record.state = state
        record.paused = True
        await _persist_run_state(state, paused=True, done=False)
        await emit(thread_id, "review", {"awaiting_human_review": True, "state": state.model_dump(mode="json")})
        await emit(thread_id, "status", {"status": "paused", "thread_id": thread_id})


async def run_after_resume(thread_id: str) -> None:
    record = RUNS[thread_id]
    async with record.lock:
        state = record.state
        state.awaiting_human_review = False
        state.human_approved = True
        state.status = "running"
        await emit(thread_id, "status", {"status": "running", "thread_id": thread_id})

        for node_name, node in [
            ("financial_engineering", financial_engineering),
            ("validator_financial", validator_financial),
            ("legal_compliance", legal_compliance),
            ("pitch_deck", pitch_deck),
            ("mvp_architecture", mvp_architecture),
            ("pivot_simulator", pivot_simulator),
            ("briefing", briefing),
        ]:
            await emit(thread_id, "step", {"node": node_name, "status": "started"})
            await trace_node_start(thread_id, state, node_name)
            # Nodes push their own logs live via services.stream_manager.log_event
            # as they happen, not just at the end.
            state = await node(state)
            await trace_node_complete(thread_id, state, node_name)
            await emit(thread_id, "step", {"node": node_name, "status": "completed"})

        state.status = "complete"
        record.state = state
        record.done = True
        await _persist_run_state(state, paused=False, done=True)
        await emit(thread_id, "complete", {"thread_id": thread_id, "state": state.model_dump(mode="json")})


async def start_run(state: StartupState) -> StartupState:
    record = RunRecord(state=state)
    RUNS[state.thread_id] = record
    await _persist_run_state(state, paused=False, done=False)
    record.task = asyncio.create_task(run_until_pause(state.thread_id))
    return state


class RunNotFoundError(Exception):
    """The run is no longer in memory — usually the server restarted mid-run."""


async def resume_run(thread_id: str, patch: dict[str, Any] | None = None) -> StartupState:
    record = RUNS.get(thread_id)
    if record is None:
        persisted = await _load_persisted_state(thread_id)
        if persisted is None:
            raise RunNotFoundError(thread_id)
        record = RunRecord(state=persisted, paused=persisted.awaiting_human_review, done=persisted.status == "complete")
        RUNS[thread_id] = record
    if patch:
        record.state.human_patch.update(patch)
    if not record.task or record.task.done():
        record.task = asyncio.create_task(run_after_resume(thread_id))
    await record.task
    return record.state


def get_run_state(thread_id: str) -> StartupState | None:
    record = RUNS.get(thread_id)
    if record:
        return record.state
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return None
    if loop.is_running():
        # Best-effort sync helper is intentionally in-memory only; callers that
        # need persisted state after restart should use resume_run().
        return None
    return None


async def get_next_event(thread_id: str) -> dict[str, Any]:
    queue = get_queue(thread_id)
    return await queue.get()

