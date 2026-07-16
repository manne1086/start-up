from collections import defaultdict
from asyncio import Queue
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from graph.state import AgentLog, StartupState

queues: dict[str, Queue] = defaultdict(Queue)


def get_queue(thread_id: str) -> Queue:
    return queues[thread_id]


async def push_event(thread_id: str, event: dict) -> None:
    await get_queue(thread_id).put(event)


async def log_event(state: "StartupState", log: "AgentLog") -> None:
    """Append a log to state and push it to the SSE stream immediately,
    so tool actions (e.g. web searches) are visible as they happen rather
    than only after the whole node finishes."""
    state.agent_logs.append(log)
    await push_event(state.thread_id, {"type": "log", "payload": log.model_dump(mode="json")})

