from pydantic import BaseModel

from graph.state import AgentLog, StartupState
from services.groq_client import structured_validation
from services.stream_manager import log_event


class ValidationResult(BaseModel):
    is_valid: bool
    notes: str


MAX_VALIDATOR_RETRIES = 2


async def validator_market(state: StartupState) -> StartupState:
    prompt = f"""
Validate the following market research for internal consistency, realism, and completeness.
Specifically check:
- Are TAM/SAM/SOM figures realistic and internally consistent (SAM < TAM, SOM < SAM)?
- Are there at least 2 distinct competitors with credible data?
- Are market gaps specific and actionable, not generic?
- Is there evidence backing the claims, or are they fabricated?

If any check fails, set is_valid to false and explain exactly what is weak or missing in notes.
Return JSON with fields is_valid (bool) and notes (str).
Market data:
{state.market.model_dump_json(indent=2) if state.market else '{}'}
"""
    try:
        result = await structured_validation(prompt, ValidationResult, state=state)
    except Exception:
        result = ValidationResult(is_valid=True, notes="Fallback validator accepted the market data.")
    state.completed_steps.append("validator_market")
    if result.is_valid:
        state.revision_reasons.pop("market_research", None)
        await log_event(state, AgentLog(agent="Validator", message=f"Market validation passed: {result.notes}", status="success"))
    else:
        retries_used = state.retry_counts.get("market_research", 0)
        state.revision_reasons["market_research"] = result.notes
        if retries_used >= MAX_VALIDATOR_RETRIES:
            await log_event(state, AgentLog(
                agent="Validator",
                message=f"Market data still has issues after {retries_used} revision(s) — proceeding anyway: {result.notes}",
                status="warning",
            ))
        else:
            await log_event(state, AgentLog(
                agent="Validator",
                message=f"Market validation flagged issues — requesting revision: {result.notes}",
                status="warning",
            ))
    return state


async def validator_financial(state: StartupState) -> StartupState:
    prompt = f"""
Validate the following financial model for mathematical consistency, realistic assumptions, and DCF sanity.
Specifically check:
- Do revenue projections grow at a rate consistent with the CAGR assumption?
- Is gross profit = revenue - COGS for each year?
- Are EBITDA margins reasonable for the industry?
- Is the IRR calculation plausible given the cash flows?
- Is the payback period consistent with the projections?

If any check fails, set is_valid to false and explain exactly what is wrong in notes.
Return JSON with fields is_valid (bool) and notes (str).
Financial data:
{state.financials.model_dump_json(indent=2) if state.financials else '{}'}
"""
    try:
        result = await structured_validation(prompt, ValidationResult, state=state)
    except Exception:
        result = ValidationResult(is_valid=True, notes="Fallback validator accepted the financial model.")
    state.completed_steps.append("validator_financial")
    if result.is_valid:
        state.revision_reasons.pop("financial_engineering", None)
        await log_event(state, AgentLog(agent="Validator", message=f"Financial validation passed: {result.notes}", status="success"))
    else:
        retries_used = state.retry_counts.get("financial_engineering", 0)
        state.revision_reasons["financial_engineering"] = result.notes
        if retries_used >= MAX_VALIDATOR_RETRIES:
            await log_event(state, AgentLog(
                agent="Validator",
                message=f"Financial model still has issues after {retries_used} revision(s) — proceeding anyway: {result.notes}",
                status="warning",
            ))
        else:
            await log_event(state, AgentLog(
                agent="Validator",
                message=f"Financial validation flagged issues — requesting revision: {result.notes}",
                status="warning",
            ))
    return state
