from graph.state import AgentLog, MVPData, RoadmapPhase, StackItem, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event


async def mvp_architecture(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge MVP architecture agent.
Design an MVP stack, architecture diagram, roadmap, effort estimate, and team size.
Idea: {state.idea}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Financials: {state.financials.model_dump_json(indent=2) if state.financials else '{}'}

Return a complete MVPData object.
"""
    try:
        mvp = await structured_reasoning(prompt, MVPData, state=state)
    except Exception:
        mvp = MVPData(
            recommended_stack=[StackItem(layer="Backend", technology="FastAPI", reason="Async API", complexity="Low")],
            architecture_diagram="graph TD; A[Frontend] --> B[API]",
            roadmap_phases=[RoadmapPhase(phase=1, title="Prototype", weeks="1-2", tasks=["API scaffold"])],
            estimated_weeks=6,
            estimated_cost_inr="₹2,50,000",
            team_size=3,
        )
    state.mvp = mvp
    state.completed_steps.append("mvp_architecture")
    await log_event(state, AgentLog(agent="MVP Architecture", message="Architecture defined.", status="success"))
    return state
