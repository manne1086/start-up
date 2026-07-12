from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from core.config import settings
from services.presentations_ai import generate_presentations_ai_pptx
from services.pptx_generator import generate_pitch_deck_pptx
from services.run_manager import get_run_state

router = APIRouter()


@router.get("/outputs/{thread_id}")
async def outputs(thread_id: str):
    return {"thread_id": thread_id}


@router.post("/outputs/pptx")
async def generate_pptx(payload: dict):
    state = payload.get("state")
    if state is None:
        thread_id = payload.get("thread_id")
        if not thread_id:
            raise HTTPException(status_code=400, detail="Missing state or thread_id")
        run_state = get_run_state(thread_id)
        if not run_state:
            raise HTTPException(status_code=404, detail="Run not found")
        state = run_state.model_dump(mode="json")

    buffer = None
    if settings.PRESENTATIONS_AI_API_KEY:
        try:
            buffer = generate_presentations_ai_pptx(state)
        except Exception as exc:
            print(f"[Presentations.ai] Falling back to local PPTX generator: {exc}")

    if buffer is None:
        buffer = generate_pitch_deck_pptx(state)

    filename = f'{(state.get("startup_name") or state.get("idea") or "pitch-deck").replace(" ", "-").lower()}.pptx'
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", headers=headers)
