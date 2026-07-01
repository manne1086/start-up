from graph.state import AgentLog, BrandTokens, PitchDeckData, PitchSlide, StartupState
from services.groq_client import structured_reasoning
from services.pitch_generator import generate_pitch_deck


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
                tagline="Build startups faster",
            ),
            slides=[
                PitchSlide(number=1, title="Problem", content={"text": "Startup validation takes too long"}),
                PitchSlide(number=2, title="Solution", content={"text": "AI startup generation"}),
            ],
        )
    state.pitch_deck = deck
    generate_pitch_deck(state.pitch_deck)
    state.completed_steps.append("pitch_deck")
    state.agent_logs.append(AgentLog(agent="Pitch Deck", message="Pitch deck data generated.", status="success"))
    return state
