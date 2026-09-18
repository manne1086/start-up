from graph.state import AgentLog, MVPData, RoadmapPhase, StackItem, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event


async def mvp_architecture(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge MVP architecture agent.

Design a real, tailored MVP architecture for this startup idea. Do not default
to a generic React/Node/MongoDB diagram. Pick a stack and topology that fits
the idea, including AI services, caches, queues, external APIs, mobile clients,
edge functions, or whatever the idea truly needs.

Idea: {state.idea}
Industry: {state.industry or 'General'}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Financials: {state.financials.model_dump_json(indent=2) if state.financials else '{}'}

Return a complete MVPData object.

Critical field: architecture_diagram

architecture_diagram must be valid D2 syntax using ONLY simple directed edges.

Rules:
- Use only lines in the form source_id -> target_id.
- Node IDs must use lowercase letters, numbers, and underscores only.
- Do not include node declarations.
- Do not include labels.
- Do not include containers.
- Do not include braces, quotes, colons, or style blocks.
- Include 6-12 edges that represent the real architecture flow.
- Return raw D2 syntax only, with no markdown fences.

Example:

web_app -> api_gateway
mobile_app -> api_gateway
api_gateway -> core_service
core_service -> postgres
core_service -> redis
core_service -> llm_api

Now generate the tailored MVPData for the given idea.
"""
    try:
        mvp = await structured_reasoning(prompt, MVPData, state=state)
    except Exception as exc:
        await log_event(state, AgentLog(agent="MVP Architecture", message=f"Structured generation failed, using fallback: {exc}", status="warning"))
        mvp = MVPData(
            recommended_stack=[StackItem(layer="Backend", technology="FastAPI", reason="Async API", complexity="Low")],
            architecture_diagram="frontend -> api\napi -> database",
            roadmap_phases=[RoadmapPhase(phase=1, title="Prototype", weeks="1-2", tasks=["API scaffold"])],
            estimated_weeks=6,
            estimated_cost_inr="INR 2,50,000",
            team_size=3,
        )

    if mvp.architecture_diagram:
        cleaned = mvp.architecture_diagram.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
            cleaned = cleaned.rstrip("`").rstrip()
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].rstrip()
        mvp.architecture_diagram = cleaned

    state.mvp = mvp
    state.completed_steps.append("mvp_architecture")
    await log_event(state, AgentLog(agent="MVP Architecture", message="Architecture defined.", status="success"))
    return state
