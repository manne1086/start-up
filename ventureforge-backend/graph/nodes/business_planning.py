from graph.state import AgentLog, BusinessPlan, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event


async def business_planning(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge business planning agent.
Idea: {state.idea}
Startup name: {state.startup_name}
Industry: {state.industry}

Market research:
{state.market.model_dump_json(indent=2) if state.market else '{}'}

Write a neutral, investor-grade business plan with the following fields:
problem_statement, solution, target_market, revenue_model, pricing, gtm_strategy, value_proposition, key_risks, mitigation_steps.
Ground the plan in the market research, mention the most relevant segment, and make pricing/GTM feel concrete.
Balance upside with realistic downside analysis.
Include at least 3 key risks and a matching prevention or mitigation step for each.
Avoid hype, promotional language, or one-sided framing.
"""
    try:
        plan = await structured_reasoning(prompt, BusinessPlan, state=state)
    except Exception:
        plan = BusinessPlan(
            problem_statement="Founders waste days stitching together market research, positioning, and launch plans before they can validate a startup idea.",
            solution="A multi-agent startup studio that researches the market, drafts a business plan, and guides the user through validation steps.",
            target_market="Early-stage founders, accelerator cohorts, and innovation teams that need faster pre-seed validation.",
            revenue_model="Subscription tiers for founders plus higher-touch plans for accelerators and enterprise innovation teams.",
            pricing="$29/mo starter, $99/mo pro, custom enterprise pricing",
            gtm_strategy="Ship through founder communities, accelerator partnerships, and SEO-driven content around startup validation workflows.",
            value_proposition="Turn an idea into a research-backed startup blueprint with less guesswork and more confidence.",
            key_risks=[
                "Demand may be overestimated before users validate a real pain point.",
                "Acquisition costs can rise quickly if the target audience is broad.",
                "Execution complexity may slow delivery if the product promises too many features.",
            ],
            mitigation_steps=[
                "Run quick customer interviews and landing-page tests before heavy buildout.",
                "Focus GTM on one narrow segment and measure CAC early.",
                "Ship in phases with a scoped MVP and explicit feature gates.",
            ],
        )
    state.business_plan = plan
    state.completed_steps.append("business_planning")
    await log_event(state, AgentLog(agent="Business Planning", message="Business plan created.", status="success"))
    return state
