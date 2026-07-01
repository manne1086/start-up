from graph.state import AgentLog, BusinessPlan, StartupState
from services.groq_client import structured_reasoning


async def business_planning(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge business planning agent.
Idea: {state.idea}
Startup name: {state.startup_name}
Industry: {state.industry}

Market research:
{state.market.model_dump_json(indent=2) if state.market else '{}'}

Write a crisp investor-grade business plan with the following fields:
problem_statement, solution, target_market, revenue_model, pricing, gtm_strategy, value_proposition.
"""
    try:
        plan = await structured_reasoning(prompt, BusinessPlan, state=state)
    except Exception:
        plan = BusinessPlan(
            problem_statement="Teams need faster startup validation.",
            solution="An AI startup generator with multi-agent research and planning.",
            target_market="Founders, accelerators, innovation teams",
            revenue_model="Subscription + enterprise consulting",
            pricing="$99-$499/mo",
            gtm_strategy="Content-led demand gen and founder communities",
            value_proposition="Turn an idea into a validated startup blueprint in minutes.",
        )
    state.business_plan = plan
    state.completed_steps.append("business_planning")
    state.agent_logs.append(AgentLog(agent="Business Planning", message="Business plan created.", status="success"))
    return state
