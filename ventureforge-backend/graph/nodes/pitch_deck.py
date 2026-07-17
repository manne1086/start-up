import httpx

from core.config import settings
from graph.state import AgentLog, BrandTokens, PitchDeckData, PitchSlide, StartupState
from services.groq_client import structured_reasoning
from services.pitch_generator import generate_pitch_deck
from services.presentations_ai import generate_presenton_presentation, parse_pptx_slides
from services.pptx_to_images import convert_pptx_to_images
from services.stream_manager import log_event


async def pitch_deck(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge pitch deck agent.
Generate a concise pitch deck structure from the business plan and market research.
Startup idea: {state.idea}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Market: {state.market.model_dump_json(indent=2) if state.market else '{}'}

Return PitchDeckData with brand tokens and at least 6 slides.
"""
    try:
        deck = await structured_reasoning(prompt, PitchDeckData, state=state)
    except Exception:
        deck = PitchDeckData(
            brand=BrandTokens(
                primary_color="#0F172A",
                secondary_color="#22C55E",
                font="Inter",
                tagline=f"{state.startup_name or state.idea} — pitch deck",
            ),
            slides=[
                PitchSlide(number=1, title="Problem", content={"text": state.business_plan.problem_statement if state.business_plan else state.idea}),
                PitchSlide(number=2, title="Solution", content={"text": state.business_plan.solution if state.business_plan else "Our solution"}),
            ],
        )

    if settings.PRESENTATIONS_AI_API_KEY:
        await log_event(state, AgentLog(agent="Pitch Deck", message="Generating presentation via Presenton AI...", status="info"))
        try:
            state_dict = state.model_dump(mode="json")
            result = await generate_presenton_presentation(state_dict)
            deck.presenton_id = result["presentation_id"]
            deck.presenton_download_url = result["path"]
            deck.presenton_edit_url = result["edit_path"]

            async with httpx.AsyncClient(timeout=120) as client:
                pptx_resp = await client.get(result["path"])
                pptx_resp.raise_for_status()
            pptx_bytes = pptx_resp.content

            parsed = parse_pptx_slides(pptx_bytes)
            if parsed:
                deck.slides = [PitchSlide(**s) for s in parsed]

            await log_event(state, AgentLog(agent="Pitch Deck", message="Converting slides to images via PowerPoint...", status="info"))
            try:
                count = await convert_pptx_to_images(pptx_bytes, state.thread_id)
                deck.slide_image_count = count
                await log_event(state, AgentLog(agent="Pitch Deck", message=f"Presenton presentation ready — {count} slide images generated.", status="success"))
            except Exception as img_exc:
                await log_event(state, AgentLog(agent="Pitch Deck", message=f"Slide image conversion skipped: {img_exc}", status="warning"))

        except Exception as exc:
            await log_event(state, AgentLog(agent="Pitch Deck", message=f"Presenton generation failed: {exc}", status="warning"))

    state.pitch_deck = deck
    generate_pitch_deck(state.pitch_deck)
    state.completed_steps.append("pitch_deck")
    await log_event(state, AgentLog(agent="Pitch Deck", message="Pitch deck data generated.", status="success"))
    return state
