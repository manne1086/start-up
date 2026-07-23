"""
Pitch deck agent — produces structured slide content for the 3 in-app
templates: Pritzker (editorial architecture), Fashion Weekly Digest
(luxury magazine), and Indie Bookstore Zine Guide (DIY handcrafted).

The agent picks a template based on industry vibe, but the user can
switch templates in the UI without regenerating content.
"""

from graph.state import AgentLog, BrandTokens, PitchDeckData, PitchSlide, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event


# Template presets — colors & tagline seed
TEMPLATE_PRESETS = {
    "pritzker": {
        "primary_color": "#594A3C",
        "secondary_color": "#B8935A",
        "accent_color": "#E8C788",
        "background": "#F5F2EC",
        "font": "Georgia, serif",
        "vibe": "editorial architecture — sophisticated, minimal",
    },
    "fashion": {
        "primary_color": "#2B1810",
        "secondary_color": "#B8935A",
        "accent_color": "#D4A574",
        "background": "#F5F0EB",
        "font": "Playfair Display, serif",
        "vibe": "luxury fashion magazine — editorial, refined",
    },
    "indie": {
        "primary_color": "#3A2E2E",
        "secondary_color": "#E85D75",
        "accent_color": "#F4A261",
        "background": "#F5EFE0",
        "font": "Courier New, monospace",
        "vibe": "indie zine — DIY, hand-crafted, playful",
    },
}


def _pick_template(industry: str | None) -> str:
    """Pick a default template based on the industry vibe."""
    if not industry:
        return "pritzker"
    ind = industry.lower()
    if any(k in ind for k in ("fashion", "beauty", "luxury", "retail", "lifestyle", "cosmetic")):
        return "fashion"
    if any(k in ind for k in ("creative", "art", "media", "content", "publish", "music", "gaming", "entertainment")):
        return "indie"
    return "pritzker"


async def pitch_deck(state: StartupState) -> StartupState:
    template_key = _pick_template(state.industry)
    preset = TEMPLATE_PRESETS[template_key]

    prompt = f"""
You are the VentureForge pitch deck agent. Generate a professional 10-slide
pitch deck structure. The deck will be rendered in a {preset['vibe']} template.

Startup idea: {state.idea}
Startup name: {state.startup_name or 'TBD'}
Industry: {state.industry or 'General'}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Market: {state.market.model_dump_json(indent=2) if state.market else '{}'}
Financials: {state.financials.model_dump_json(indent=2) if state.financials else '{}'}

Return a PitchDeckData with EXACTLY these 10 slides, each with a `content` dict
containing the fields listed:

1. title="Cover"   content: {{ "startup": str, "tagline": str, "subtitle": str }}
2. title="Problem"  content: {{ "headline": str, "body": str, "stat": str }}
3. title="Solution" content: {{ "headline": str, "body": str, "features": [str, str, str] }}
4. title="Market"   content: {{ "tam": str, "sam": str, "som": str, "insight": str }}
5. title="Product"  content: {{ "headline": str, "body": str, "highlights": [str, str, str] }}
6. title="Business Model" content: {{ "model": str, "pricing": str, "unit_economics": str }}
7. title="Go-To-Market"   content: {{ "strategy": str, "channels": [str, str, str] }}
8. title="Competition"    content: {{ "headline": str, "advantage": str, "competitors": [str, str, str] }}
9. title="Team"           content: {{ "headline": str, "body": str }}
10. title="Ask"           content: {{ "amount": str, "use_of_funds": [str, str, str], "closing": str }}

Set brand.primary_color = "{preset['primary_color']}",
brand.secondary_color = "{preset['secondary_color']}",
brand.font = "{preset['font']}",
brand.tagline = short investor-facing tagline for the startup.
Set template = "{template_key}".

Keep each text field concise. Body text under 40 words. Headlines under 8 words.
"""

    try:
        deck = await structured_reasoning(prompt, PitchDeckData, state=state)
        deck.template = template_key
        # Sanity-fill brand if the LLM omitted anything
        if not deck.brand.primary_color:
            deck.brand.primary_color = preset["primary_color"]
        if not deck.brand.secondary_color:
            deck.brand.secondary_color = preset["secondary_color"]
        if not deck.brand.font:
            deck.brand.font = preset["font"]
        if not deck.brand.tagline:
            deck.brand.tagline = f"{state.startup_name or state.idea}"
    except Exception as exc:
        await log_event(
            state,
            AgentLog(agent="Pitch Deck", message=f"Structured generation failed, using fallback: {exc}", status="warning"),
        )
        deck = _fallback_deck(state, template_key, preset)

    state.pitch_deck = deck
    state.completed_steps.append("pitch_deck")
    await log_event(
        state,
        AgentLog(
            agent="Pitch Deck",
            message=f"Pitch deck generated using '{template_key}' template ({len(deck.slides)} slides).",
            status="success",
        ),
    )
    return state


def _fallback_deck(state: StartupState, template_key: str, preset: dict) -> PitchDeckData:
    """Minimal deck if the LLM call fails — keeps the pipeline moving."""
    name = state.startup_name or state.idea
    bp = state.business_plan
    problem = bp.problem_statement if bp else state.idea
    solution = bp.solution if bp else "Our solution"
    market = state.market
    return PitchDeckData(
        template=template_key,
        brand=BrandTokens(
            primary_color=preset["primary_color"],
            secondary_color=preset["secondary_color"],
            font=preset["font"],
            tagline=name[:80],
        ),
        slides=[
            PitchSlide(number=1, title="Cover", content={"startup": name, "tagline": name[:80], "subtitle": state.industry or ""}),
            PitchSlide(number=2, title="Problem", content={"headline": "The Problem", "body": problem, "stat": ""}),
            PitchSlide(number=3, title="Solution", content={"headline": "Our Solution", "body": solution, "features": []}),
            PitchSlide(number=4, title="Market", content={
                "tam": market.tam if market else "TBD",
                "sam": market.sam if market else "TBD",
                "som": market.som if market else "TBD",
                "insight": "",
            }),
            PitchSlide(number=5, title="Product", content={"headline": "Product", "body": solution, "highlights": []}),
            PitchSlide(number=6, title="Business Model", content={"model": bp.revenue_model if bp else "TBD", "pricing": "", "unit_economics": ""}),
            PitchSlide(number=7, title="Go-To-Market", content={"strategy": bp.gtm_strategy if bp else "TBD", "channels": []}),
            PitchSlide(number=8, title="Competition", content={"headline": "Competitive Edge", "advantage": "", "competitors": []}),
            PitchSlide(number=9, title="Team", content={"headline": "Our Team", "body": "Founding team with deep domain expertise."}),
            PitchSlide(number=10, title="Ask", content={"amount": "TBD", "use_of_funds": [], "closing": "Join us in building the future."}),
        ],
    )
