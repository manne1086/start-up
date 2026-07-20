from graph.nodes.validator import MAX_VALIDATOR_RETRIES
from graph.state import AgentLog, FinancialModel, StartupState
from services.financial_engine import build_financial_model
from services.groq_client import structured_code
from services.stream_manager import log_event


async def financial_engineering(state: StartupState) -> StartupState:
    revision_reason = state.revision_reasons.pop("financial_engineering", None)
    if revision_reason:
        state.retry_counts["financial_engineering"] = state.retry_counts.get("financial_engineering", 0) + 1
        retry_num = state.retry_counts["financial_engineering"]
        await log_event(state, AgentLog(
            agent="Financial Engineering",
            message=f"Financial Validator found issues — refining model (retry {retry_num}/{MAX_VALIDATOR_RETRIES}): {revision_reason}",
            status="info",
            thought=f"Re-running financial model to address validator feedback: {revision_reason}",
        ))

    revision_context = ""
    if revision_reason:
        revision_context = f"""
IMPORTANT — A previous financial model was flagged by the validator:
{revision_reason}

Fix the specific issues noted above while preserving the rest of the model.
"""

    prompt = f"""
You are the VentureForge financial engineering agent.
Build a 5-year DCF-ready financial model for the following startup.
Idea: {state.idea}
{revision_context}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Market research: {state.market.model_dump_json(indent=2) if state.market else '{}'}

Return the model as structured data matching the FinancialModel schema.
"""
    try:
        model = await structured_code(prompt, FinancialModel, state=state)
    except Exception:
        model = build_financial_model(state.idea)
    state.financials = model
    state.completed_steps.append("financial_engineering")
    await log_event(state, AgentLog(agent="Financial Engineering", message="DCF model generated.", status="success"))
    return state
