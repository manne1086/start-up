import json
from io import BytesIO

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from core.config import settings
from services.groq_client import structured_reasoning
from services.image_fetcher import fetch_slide_images
from services.presentations_ai import generate_presentations_ai_pptx
from services.pptx_generator import generate_pitch_deck_pptx
from services.pptx_to_images import get_slide_image_path
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

    idea = str(state.get("idea") or state.get("startup_name") or "")
    pitch_deck = state.get("pitch_deck") or {}

    buffer = None
    prefer_local_flux = bool(payload.get("prefer_local_flux"))

    presenton_url = pitch_deck.get("presenton_download_url")
    if presenton_url and not prefer_local_flux:
        try:
            file_response = httpx.get(presenton_url, timeout=120)
            file_response.raise_for_status()
            buffer = BytesIO(file_response.content)
        except Exception as exc:
            print(f"[Presenton] Pre-generated download failed, regenerating: {exc}")

    if buffer is None and settings.PRESENTATIONS_AI_API_KEY and not prefer_local_flux:
        try:
            buffer = generate_presentations_ai_pptx(state)
        except Exception as exc:
            print(f"[Presenton] Falling back to local PPTX generator: {exc}")

    if buffer is None:
        if not pitch_deck.get("slides"):
            raise HTTPException(
                status_code=422,
                detail="Generation is not complete yet — pitch_deck data is missing. Complete the full generation first.",
            )
        images = await fetch_slide_images(idea)
        try:
            buffer = generate_pitch_deck_pptx(state, images=images)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"PPTX generation failed: {exc}") from exc

    filename = f'{(state.get("startup_name") or state.get("idea") or "pitch-deck").replace(" ", "-").lower()}.pptx'
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", headers=headers)


@router.get("/outputs/{thread_id}/slide-image/{slide_number}")
async def slide_image(thread_id: str, slide_number: int):
    path = get_slide_image_path(thread_id, slide_number)
    if not path:
        raise HTTPException(status_code=404, detail="Slide image not found")
    return FileResponse(path, media_type="image/png")


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
