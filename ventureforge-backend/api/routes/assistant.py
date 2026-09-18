"""
Human-in-the-loop Q&A assistant.

Answers user questions about the current generation run using the accumulated
pipeline context (orchestrator output, market research, business plan, etc.).
Grounded in the actual StartupState — the agent cannot hallucinate answers
outside what the pipeline has produced.
"""

import json
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.groq_client import FAST_MODEL_NAME
from langchain_groq import ChatGroq
from core.config import settings
from services.run_manager import get_run_state

router = APIRouter()


class AssistantQuery(BaseModel):
    thread_id: str
    question: str
    history: list[dict[str, str]] = []  # [{role: "user"|"assistant", content: str}]


class AssistantResponse(BaseModel):
    answer: str


def _build_context(state: Any) -> str:
    """Flatten the current pipeline state into a context string the LLM can reason over."""
    ctx: dict[str, Any] = {
        "startup_idea": state.idea,
        "startup_name": state.startup_name,
        "industry": state.industry,
        "completed_agents": state.completed_steps,
        "current_step": state.current_step,
    }

    if state.market:
        market = state.market.model_dump() if hasattr(state.market, "model_dump") else state.market
        ctx["market_research"] = {
            "tam": market.get("tam"),
            "sam": market.get("sam"),
            "som": market.get("som"),
            "competitors": market.get("competitors", [])[:5],
            "market_gaps": market.get("market_gaps", []),
            "trends": market.get("trends", []),
        }

    if state.business_plan:
        bp = state.business_plan.model_dump() if hasattr(state.business_plan, "model_dump") else state.business_plan
        ctx["business_plan"] = {
            "problem": bp.get("problem_statement"),
            "solution": bp.get("solution"),
            "value_proposition": bp.get("value_proposition"),
            "target_market": bp.get("target_market"),
            "revenue_model": bp.get("revenue_model"),
            "gtm_strategy": bp.get("gtm_strategy"),
            "key_risks": bp.get("key_risks", []),
            "mitigation_steps": bp.get("mitigation_steps", []),
        }

    if state.financials:
        fin = state.financials.model_dump() if hasattr(state.financials, "model_dump") else state.financials
        ctx["financials"] = fin

    if state.mvp:
        mvp = state.mvp.model_dump() if hasattr(state.mvp, "model_dump") else state.mvp
        ctx["mvp"] = mvp

    if state.legal:
        legal = state.legal.model_dump() if hasattr(state.legal, "model_dump") else state.legal
        ctx["legal"] = legal

    # Keep interactive assistant requests well below Groq's organization TPM
    # limit. The full state remains available to the pipeline; this endpoint
    # only needs the fields useful for founder questions.
    return json.dumps(ctx, separators=(",", ":"), default=str)[:12000]


SYSTEM_PROMPT = """You are the VentureForge Research Assistant — an expert advisor helping a founder
evaluate their startup analysis at the human-review checkpoint.

You have access to the ACTUAL data produced by the AI agent pipeline so far
(market research, competitors, business plan, financial model, etc.). Your job:

1. Answer the founder's questions grounded in this data
2. Explain findings in plain, direct language
3. Highlight risks or gaps you notice
4. Suggest what the founder should consider before approving the run
5. If asked about something not in the context, say so honestly — don't invent facts

Keep responses concise (2-4 paragraphs max). Use bullet points for lists.
Be specific: reference numbers, competitor names, and concrete findings from the data.

CONTEXT (current pipeline state):
{context}
"""


@router.post("/assistant/ask", response_model=AssistantResponse)
async def ask_assistant(payload: AssistantQuery):
    state = get_run_state(payload.thread_id)
    if not state:
        raise HTTPException(status_code=404, detail="Run not found.")

    context = _build_context(state)
    system = SYSTEM_PROMPT.format(context=context)

    # Build conversation
    messages = [{"role": "system", "content": system}]
    for msg in payload.history[-4:]:  # keep the interactive request small
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"][-1200:]})
    messages.append({"role": "user", "content": payload.question[-2000:]})

    try:
        assistant_llm = ChatGroq(
            model=FAST_MODEL_NAME,
            temperature=0.2,
            max_tokens=1200,
            api_key=settings.GROQ_API_KEY,
        )
        response = await assistant_llm.ainvoke(messages)
        answer = response.content if hasattr(response, "content") else str(response)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Assistant failed: {exc}")

    return AssistantResponse(answer=answer)
