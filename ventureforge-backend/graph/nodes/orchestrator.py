from graph.state import AgentLog, StartupState


async def orchestrator(state: StartupState) -> StartupState:
    state.startup_name = state.startup_name or "VentureForge Venture"
    state.industry = state.industry or "AI / SaaS"
    state.current_step = 1
    state.completed_steps.append("orchestrator")
    state.agent_logs.append(AgentLog(agent="Orchestrator", message="Idea decomposed and startup identity set.", status="success"))
    return state

