"""
Executive Briefing agent — the plain-English translation layer.

Runs last. Reads everything the pipeline produced (market, plan, financials,
legal, MVP, pivots) and rewrites it the way a smart friend would explain it
over coffee: no acronyms left unexplained, a clear verdict, and concrete
next actions.

This is what a non-technical founder actually reads. The rest of the
dashboard becomes supporting detail.
"""

from graph.state import (
    AgentLog,
    ExecutiveBriefing,
    GlossaryTerm,
    ScoreCard,
    StartupState,
)
from services.groq_client import DailyTokenLimitError, structured_reasoning
from services.stream_manager import log_event


def _compact(state: StartupState) -> str:
    """Condense the pipeline output so the whole picture fits in one prompt."""
    parts: list[str] = [f"IDEA: {state.idea}", f"NAME: {state.startup_name or 'TBD'}", f"INDUSTRY: {state.industry or 'General'}"]

    if state.market:
        m = state.market
        comp = ", ".join((c.name for c in m.competitors[:5])) if m.competitors else "none found"
        parts.append(
            f"MARKET: TAM={m.tam} SAM={m.sam} SOM={m.som} (source: {m.tam_source}). "
            f"Competitors: {comp}. Gaps: {'; '.join(m.market_gaps[:4])}"
        )

    if state.business_plan:
        b = state.business_plan
        parts.append(
            f"PLAN: problem={b.problem_statement} | solution={b.solution} | "
            f"customer={b.target_market} | revenue={b.revenue_model} | pricing={b.pricing} | "
            f"gtm={b.gtm_strategy} | risks={'; '.join(b.key_risks[:4])}"
        )

    if state.financials:
        parts.append(f"FINANCIALS: {state.financials.model_dump_json()[:1200]}")

    if state.legal:
        parts.append(f"LEGAL: {state.legal.model_dump_json()[:700]}")

    if state.mvp:
        stack = ", ".join(s.technology for s in state.mvp.recommended_stack[:8])
        parts.append(
            f"MVP: stack=[{stack}] weeks={state.mvp.estimated_weeks} "
            f"team={state.mvp.team_size} cost={state.mvp.estimated_cost_inr}"
        )

    if state.pivots:
        parts.append("PIVOTS: " + "; ".join(f"{p.name} ({p.revenue_impact})" for p in state.pivots[:3]))

    return "\n\n".join(parts)


PROMPT = """You are the VentureForge Executive Briefing agent.

Your reader is a smart but NON-TECHNICAL founder. They have never taken a
finance class. They do not know what TAM, CAC, LTV, EBITDA, NPV, COGS, ARR,
burn rate, or runway mean. Your job is to make them fully understand their own
venture brief without looking up a single term.

RULES — these are not suggestions:
1. In `headline`, `elevator_pitch`, `what_you_are_building`, `who_pays_and_why`,
   `how_you_make_money`, every `plain_english` field, `biggest_strengths`,
   `biggest_risks`, and `do_this_next`: use ZERO acronyms and ZERO finance
   jargon. Write like you are explaining to a friend. Say "the total money
   people spend on this each year" — not "TAM".
2. Use REAL NUMBERS from the analysis wherever possible. "A $4.2 billion market"
   beats "a large market". Vague praise is worthless.
3. Be honest. If the market is crowded or the numbers are thin, say so plainly
   in `biggest_risks` and lower the `confidence`. A founder who is misled loses
   real money. Do not inflate.
4. `do_this_next` must be actions the founder can start THIS WEEK — specific and
   concrete. "Interview 10 people who currently pay for [specific alternative]"
   — not "conduct market research".
5. `glossary` is the ONLY place jargon appears. Include every acronym that shows
   up anywhere in the analysis (TAM, SAM, SOM, CAC, LTV, MVP, GTM, EBITDA, NPV,
   runway, burn rate, churn, and any others used). For each, fill `this_startup`
   with the ACTUAL figure or answer for this venture, not a generic definition.
6. `scorecards`: judge 4-6 dimensions — Market Size, Competition, Money Model,
   Build Difficulty, Timing, Legal Risk. `verdict` is one or two words a person
   would actually say ("Strong", "Crowded", "Unproven", "Needs work"). `evidence`
   carries the number behind the judgement.
   `score` MUST be on a 0-100 scale, NOT 0-10. Strong = 75-90, Good = 60-74,
   Mixed = 40-59, Weak = 20-39. Write 80, never 8.
7. `verdict` overall: "promising" only when the evidence genuinely supports it.
   Use "mixed" or "challenging" honestly when it does not.

THE ANALYSIS:
{context}

Now write the ExecutiveBriefing.
"""


def _fallback(state: StartupState, reason: str = "") -> ExecutiveBriefing:
    """
    Build a genuine briefing from data the pipeline already computed, with no
    model call.

    The earlier version just said "could not be generated", which threw away
    ten agents' worth of real work. Everything below is assembled from figures
    already in state, so the founder still gets something usable when the model
    is unavailable.
    """
    name = state.startup_name or state.idea
    bp = state.business_plan
    mk = state.market
    fin = state.financials

    scorecards: list[ScoreCard] = []
    if mk:
        n_comp = len(mk.competitors)
        crowded = n_comp >= 5
        scorecards.append(ScoreCard(
            label="Market Size",
            verdict="Measured" if mk.tam else "Unknown",
            score=70 if mk.tam else 0,
            plain_english=f"The total yearly spending in this space is {mk.tam}. The part you could realistically reach is {mk.som}.",
            evidence=f"Total {mk.tam} · reachable {mk.sam} · realistic {mk.som} (source: {mk.tam_source})",
        ))
        scorecards.append(ScoreCard(
            label="Competition",
            verdict="Crowded" if crowded else "Open",
            score=35 if crowded else 65,
            plain_english=(
                f"{n_comp} established rivals turned up in the research, so standing out will take real work."
                if crowded else
                f"Only {n_comp} direct rivals turned up, which suggests room to move."
            ),
            evidence=", ".join(c.name for c in mk.competitors[:5]),
        ))
    if fin:
        positive = fin.npv > 0
        scorecards.append(ScoreCard(
            label="Money Model",
            verdict="Profitable on paper" if positive else "Loses money on paper",
            score=70 if positive else 30,
            plain_english=(
                f"After covering costs, the projection shows the business is worth about {fin.npv:,.0f} in today's money, "
                f"paying back the initial spend in roughly {fin.payback_months} months."
                if positive else
                "The current projection does not yet cover its own costs. The pricing or cost assumptions need work."
            ),
            evidence=f"NPV {fin.npv:,.0f} · payback {fin.payback_months} months",
        ))
    if state.mvp:
        scorecards.append(ScoreCard(
            label="Build Difficulty",
            verdict="Moderate" if state.mvp.estimated_weeks <= 24 else "Heavy",
            score=65 if state.mvp.estimated_weeks <= 24 else 40,
            plain_english=f"A first working version takes about {state.mvp.estimated_weeks} weeks with {state.mvp.team_size} people.",
            evidence=f"{state.mvp.estimated_weeks} weeks · {state.mvp.team_size} people · {state.mvp.estimated_cost_inr}",
        ))

    strengths: list[str] = []
    if mk and mk.market_gaps:
        strengths += [f"There is a real gap here: {g}" for g in mk.market_gaps[:2]]
    if fin and fin.npv > 0:
        strengths.append(f"The numbers work on paper — the plan pays back its costs in about {fin.payback_months} months.")
    if bp and bp.value_proposition:
        strengths.append(bp.value_proposition)

    risks: list[str] = list(bp.key_risks[:3]) if bp and bp.key_risks else []
    if mk and len(mk.competitors) >= 5:
        risks.append(f"{len(mk.competitors)} established rivals already serve this market.")

    next_steps: list[str] = []
    if mk and mk.competitors:
        next_steps.append(f"Talk to 10 people who currently use {mk.competitors[0].name} and ask what frustrates them.")
    if bp and bp.pricing:
        next_steps.append(f"Test whether people will actually pay {bp.pricing} before building anything.")
    if state.mvp:
        next_steps.append(f"Scope the first {state.mvp.estimated_weeks}-week build down to the single feature that proves the idea.")

    note = "The plain-English summary was written from the analysis directly, without the AI writer."
    if reason:
        note += f" ({reason})"

    return ExecutiveBriefing(
        headline=(
            f"{name}: a {mk.som} realistic opportunity in a {mk.tam} market."
            if mk and mk.som and mk.tam else
            f"Analysis for {name} is complete — see the details below."
        ),
        verdict="mixed",
        confidence=35,  # honest: assembled from rules, not judged by a model
        elevator_pitch=(bp.value_proposition if bp and bp.value_proposition else state.idea)[:280],
        what_you_are_building=(bp.solution if bp and bp.solution else state.idea),
        who_pays_and_why=(bp.target_market if bp else "Not yet identified."),
        how_you_make_money=(f"{bp.revenue_model} ({bp.pricing})" if bp and bp.pricing else (bp.revenue_model if bp else "Not yet defined.")),
        scorecards=scorecards,
        biggest_strengths=strengths[:3],
        biggest_risks=(risks[:3] or ["No specific risks were captured in the analysis."]),
        do_this_next=(next_steps[:3] or ["Re-run the analysis once the writing step is available again."]) + [note],
        glossary=[],  # topped up by the guaranteed-essentials block below
    )


async def briefing(state: StartupState) -> StartupState:
    await log_event(state, AgentLog(agent="Executive Briefing", message="Translating the analysis into plain English...", status="info"))

    try:
        result = await structured_reasoning(PROMPT.format(context=_compact(state)), ExecutiveBriefing, state=state)
    except DailyTokenLimitError:
        await log_event(state, AgentLog(
            agent="Executive Briefing",
            message="Groq daily token limit reached — building the summary from the analysis instead.",
            status="warning",
        ))
        result = _fallback(state, "The daily AI usage limit was reached.")
    except Exception as exc:
        await log_event(state, AgentLog(agent="Executive Briefing", message=f"Briefing generation failed: {exc}", status="warning"))
        result = _fallback(state)

    # Models frequently answer on a 0-10 scale despite the instruction. The UI
    # renders `score` directly as a percentage bar, so an unscaled 8 would show
    # a "Strong" rating as an 8% bar. Rescale when every score looks like 0-10.
    if result.scorecards:
        scores = [s.score for s in result.scorecards]
        if max(scores) <= 10 and any(s > 0 for s in scores):
            for sc in result.scorecards:
                sc.score = min(100, sc.score * 10)
        for sc in result.scorecards:
            sc.score = max(0, min(100, sc.score))

    result.confidence = max(0, min(100, result.confidence))

    # Guarantee the glossary covers the terms the dashboard actually renders,
    # so no acronym can reach the founder without an explanation.
    covered = {t.term.upper() for t in result.glossary}
    essentials = [
        ("TAM", "The total money spent on this type of product each year, by everyone.",
         "It shows the ceiling — how big this could ever get.",
         state.market.tam if state.market else ""),
        ("SAM", "The slice of that market you could realistically sell to.",
         "It narrows the huge number down to the part you can actually reach.",
         state.market.sam if state.market else ""),
        ("SOM", "What you could realistically capture in the first few years.",
         "This is the number to plan and budget against.",
         state.market.som if state.market else ""),
        ("MVP", "The smallest version of the product that is still useful.",
         "It is what you build first to test the idea without spending everything.",
         f"{state.mvp.estimated_weeks} weeks with {state.mvp.team_size} people" if state.mvp else ""),
    ]
    for term, meaning, why, value in essentials:
        if term not in covered:
            result.glossary.append(GlossaryTerm(term=term, plain_meaning=meaning, why_it_matters=why, this_startup=value or "Not calculated"))

    state.briefing = result
    state.completed_steps.append("briefing")
    await log_event(state, AgentLog(agent="Executive Briefing", message="Plain-English briefing ready.", status="success"))
    return state
