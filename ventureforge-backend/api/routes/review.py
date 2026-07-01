from fastapi import APIRouter

from services.run_manager import get_run_state, resume_run

router = APIRouter()


@router.get("/review/{thread_id}")
async def get_review(thread_id: str):
    state = get_run_state(thread_id)
    if not state:
        return {"thread_id": thread_id, "found": False}
    return {
        "thread_id": thread_id,
        "found": True,
        "awaiting_human_review": state.awaiting_human_review,
        "business_plan": state.business_plan.model_dump(mode="json") if state.business_plan else None,
        "agent_logs": [log.model_dump(mode="json") for log in state.agent_logs],
        "state": state.model_dump(mode="json"),
    }


@router.post("/review/approve")
async def approve(payload: dict):
    thread_id = payload.get("thread_id")
    state = await resume_run(thread_id)
    return {"thread_id": thread_id, "approved": True, "state": state.model_dump(mode="json")}


@router.post("/review/patch")
async def patch(payload: dict):
    thread_id = payload.get("thread_id")
    patch_data = payload.get("patch", {})
    state = await resume_run(thread_id, patch_data)
    return {"thread_id": thread_id, "patched": patch_data, "state": state.model_dump(mode="json")}
