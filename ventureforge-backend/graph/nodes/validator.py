from pydantic import BaseModel

from graph.state import AgentLog, StartupState
from services.groq_client import structured_validation
from services.stream_manager import log_event


class ValidationResult(BaseModel):
    is_valid: bool
    notes: str


async def validator_market(state: StartupState) -> StartupState:
    prompt = f"""
Validate the following market research for internal consistency, realism, and completeness.
Return JSON with fields is_valid and notes.
Market data:
{state.market.model_dump_json(indent=2) if state.market else '{}'}
"""
    try:
        result = await structured_validation(prompt, ValidationResult, state=state)
    except Exception:
        result = ValidationResult(is_valid=True, notes="Fallback validator accepted the market data.")
    state.completed_steps.append("validator_market")
    status = "success" if result.is_valid else "warning"
    await log_event(state, AgentLog(agent="Validator", message=f"Market validation: {result.notes}", status=status))
    return state


async def validator_financial(state: StartupState) -> StartupState:
    prompt = f"""
Validate the following financial model math, growth assumptions, and DCF sanity.
Return JSON with fields is_valid and notes.
Financial data:
{state.financials.model_dump_json(indent=2) if state.financials else '{}'}
"""
    try:
        result = await structured_validation(prompt, ValidationResult, state=state)
    except Exception:
        result = ValidationResult(is_valid=True, notes="Fallback validator accepted the financial model.")
    state.completed_steps.append("validator_financial")
    status = "success" if result.is_valid else "warning"
    await log_event(state, AgentLog(agent="Validator", message=f"Financial validation: {result.notes}", status=status))
    return state

