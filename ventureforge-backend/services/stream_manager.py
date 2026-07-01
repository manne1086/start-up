from collections import defaultdict
from asyncio import Queue

queues: dict[str, Queue] = defaultdict(Queue)


def get_queue(thread_id: str) -> Queue:
    return queues[thread_id]


async def push_event(thread_id: str, event: dict) -> None:
    await get_queue(thread_id).put(event)

