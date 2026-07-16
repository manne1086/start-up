import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from core.config import settings
from services.groq_client import structured_reasoning
from services.presentations_ai import generate_presentations_ai_pptx
from services.pptx_generator import generate_pitch_deck_pptx
from services.run_manager import get_run_state

router = APIRouter()


class SlideRegenerateRequest(BaseModel):
    state: dict
    slide_title: str
    slide_type: str | None = None


class SlideContentSuggestion(BaseModel):
    text: str
    bullets: list[str] = []


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

    if not state.get("pitch_deck") or not state["pitch_deck"].get("slides"):
        raise HTTPException(
            status_code=422,
            detail="Generation is not complete yet — pitch_deck data is missing. Complete the full generation first.",
        )

    buffer = None
    if settings.PRESENTATIONS_AI_API_KEY:
        try:
            buffer = generate_presentations_ai_pptx(state)
        except Exception as exc:
            print(f"[Presentations.ai] Falling back to local PPTX generator: {exc}")

    if buffer is None:
        try:
            buffer = generate_pitch_deck_pptx(state)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"PPTX generation failed: {exc}") from exc

    filename = f'{(state.get("startup_name") or state.get("idea") or "pitch-deck").replace(" ", "-").lower()}.pptx'
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", headers=headers)


@router.post("/outputs/regenerate-slide")
async def regenerate_slide(payload: SlideRegenerateRequest):
    state = payload.state
    prompt = f"""
You are the VentureForge pitch deck agent. Regenerate concise, investor-grade content for ONE pitch deck slide.
Startup idea: {state.get("idea", "")}
Startup name: {state.get("startup_name", "")}
Business plan: {json.dumps(state.get("business_plan") or {})}
Market research: {json.dumps(state.get("market") or {})}
Slide title: {payload.slide_title}
Slide layout type: {payload.slide_type or "content"}

Return a short paragraph (text, 1-3 sentences) and 3-5 punchy bullet points (bullets) suitable for this
slide. Keep it concrete and specific to the idea, not generic filler.
"""
    try:
        result = await structured_reasoning(prompt, SlideContentSuggestion)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Slide regeneration failed: {exc}") from exc

    return {"content": result.model_dump()}
