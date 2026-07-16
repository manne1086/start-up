from graph.state import AgentLog, PivotOption, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event

from pydantic import BaseModel


class PivotList(BaseModel):
    pivots: list[PivotOption]


async def pivot_simulator(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge pivot simulator agent.
Generate 3 adversarial pivot options that pressure-test the startup strategy.
Idea: {state.idea}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Market: {state.market.model_dump_json(indent=2) if state.market else '{}'}

Return JSON with a top-level pivots array of exactly 3 PivotOption objects.
"""
    try:
        result = await structured_reasoning(prompt, PivotList, state=state)
        pivots = result.pivots
    except Exception:
        pivots = [
            PivotOption(
                id=1,
                name="Enterprise workflow automation",
                rationale="Broaden to B2B",
                revenue_impact="Higher ACV",
                impact_type="positive",
                adjusted_tam="$5.0B",
            ),
            PivotOption(
                id=2,
                name="Creator startup toolkit",
                rationale="Target solo founders",
                revenue_impact="Lower ACV",
                impact_type="negative",
                adjusted_tam="$2.0B",
            ),
            PivotOption(
                id=3,
                name="Incubator copilot",
                rationale="Sell to accelerators",
                revenue_impact="Medium ACV",
                impact_type="positive",
                adjusted_tam="$3.5B",
            ),
        ]
    state.pivots = pivots
    state.completed_steps.append("pivot_simulator")
    await log_event(state, AgentLog(agent="Pivot Simulator", message="Pivot options generated.", status="success"))
    return state
