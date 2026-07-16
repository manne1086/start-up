from graph.state import AgentLog, StartupIdentity, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event


async def _fallback_identity(state: StartupState) -> StartupIdentity:
    words = [word for word in state.idea.replace("/", " ").replace("&", " ").split() if word]
    seed = [word.strip(".,:;!?()[]{}\"'`").lower() for word in words if len(word.strip(".,:;!?()[]{}\"'`")) > 2]
    core = seed[:3]
    if not core:
        return StartupIdentity(startup_name="IdeaPilot", industry="AI / SaaS")

    title = " ".join(part.capitalize() for part in core)
    return StartupIdentity(startup_name=f"{title} Studio", industry="AI / SaaS")


async def orchestrator(state: StartupState) -> StartupState:
    prompt = f"""
Create a concise startup identity for this idea.
Keep the tone neutral and specific to the idea. Do not use the product or platform name VentureForge.
Idea: {state.idea}

Return a startup name that sounds apt for the concept, plus a broad industry label.
"""

    try:
        identity = await structured_reasoning(prompt, StartupIdentity, state=state)
    except Exception:
        identity = await _fallback_identity(state)

    state.startup_name = identity.startup_name.strip() or state.startup_name or "Idea Studio"
    state.industry = identity.industry.strip() or state.industry or "AI / SaaS"
    state.current_step = 1
    state.completed_steps.append("orchestrator")
    await log_event(state, AgentLog(agent="Orchestrator", message=f"Startup identity set to {state.startup_name}.", status="success"))
    return state

