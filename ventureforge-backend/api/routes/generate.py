from uuid import uuid4

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from graph.state import AgentLog
from graph.state import StartupState
from services.run_manager import start_run

router = APIRouter()


@router.post("/generate")
async def generate(payload: dict):
    thread_id = payload.get("thread_id") or str(uuid4())
    state = StartupState(thread_id=thread_id, user_id=payload.get("user_id", "anonymous"), idea=payload["idea"])
    state.agent_logs.append(
        AgentLog(
            agent="Input",
            message="Startup idea received. Initializing the agent workflow.",
            status="info",
        )
    )
    await start_run(state)
    return {"thread_id": thread_id, "status": state.status, "state": state.model_dump(mode="json")}


@router.get("/stream/{thread_id}")
async def stream(thread_id: str):
    from services.run_manager import get_next_event

    async def event_generator():
        yield "event: ready\ndata: {\"thread_id\": \"%s\"}\n\n" % thread_id
        while True:
            event = await get_next_event(thread_id)
            yield f"event: {event['type']}\ndata: {json.dumps(event['payload'])}\n\n"
            if event["type"] in {"complete", "error"}:
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")
