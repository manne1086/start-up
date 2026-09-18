import asyncio
import json
from functools import wraps
from typing import Any, TypeVar

import groq
from langchain_groq import ChatGroq
from pydantic import BaseModel

from core.config import settings
from graph.state import AgentLog, StartupState

# Groq's recommended replacement for the deprecated Llama 3.3 70B model.
# GPT-OSS 120B supports the same 131K-token context-window class.
MODEL_NAME = settings.GROQ_MODEL or "openai/gpt-oss-120b"

reasoning_llm = ChatGroq(
    model=MODEL_NAME,
    temperature=0.3,
    max_tokens=8192,
    api_key=settings.GROQ_API_KEY,
)

code_llm = ChatGroq(
    model=MODEL_NAME,
    temperature=0.3,
    max_tokens=8192,
    api_key=settings.GROQ_API_KEY,
)

validator_llm = ChatGroq(
    model=MODEL_NAME,
    temperature=0.2,
    max_tokens=4096,
    api_key=settings.GROQ_API_KEY,
)

T = TypeVar("T", bound=BaseModel)


class DailyTokenLimitError(Exception):
    """The Groq per-day token budget is spent — retrying cannot help today."""


def _is_daily_limit(exc: Exception) -> bool:
    """
    Distinguish a per-DAY quota from a per-minute burst limit.

    Per-minute limits clear in seconds and are worth retrying. Per-day limits
    reset hours later, so retrying only burns wall-clock time and still fails.
    """
    msg = str(exc).lower()
    return "per day" in msg or "tpd" in msg or "rpd" in msg


def retry_groq(fn):
    @wraps(fn)
    async def wrapper(*args, **kwargs):
        state: StartupState | None = kwargs.get("state")
        last_exc: Exception | None = None
        for attempt in range(3):
            try:
                return await fn(*args, **kwargs)
            except (groq.RateLimitError, groq.APIError) as exc:
                last_exc = exc

                if isinstance(exc, groq.RateLimitError) and _is_daily_limit(exc):
                    if state is not None:
                        state.agent_logs.append(
                            AgentLog(
                                agent="Groq Client",
                                message=(
                                    "Daily token limit reached on the Groq free tier. "
                                    "Skipping retries — the quota resets on Groq's schedule."
                                ),
                                status="warning",
                            )
                        )
                    raise DailyTokenLimitError(str(exc)) from exc

                if state is not None:
                    state.agent_logs.append(
                        AgentLog(
                            agent="Groq Client",
                            message=f"Retry {attempt + 1}/3 after {exc.__class__.__name__}: {exc}",
                            status="warning",
                        )
                    )
                if attempt < 2:
                    await asyncio.sleep(2 * (2**attempt))
        if last_exc is not None:
            raise last_exc
        return None

    return wrapper


def _json_dump(model: BaseModel | dict[str, Any] | list[Any]) -> str:
    if isinstance(model, BaseModel):
        return model.model_dump_json()
    return json.dumps(model)


@retry_groq
async def structured_reasoning(prompt: str, output_model: type[T], *, state: StartupState | None = None) -> T:
    structured = reasoning_llm.with_structured_output(output_model)
    return await structured.ainvoke(prompt)


@retry_groq
async def structured_validation(prompt: str, output_model: type[T], *, state: StartupState | None = None) -> T:
    structured = validator_llm.with_structured_output(output_model)
    return await structured.ainvoke(prompt)


@retry_groq
async def structured_code(prompt: str, output_model: type[T], *, state: StartupState | None = None) -> T:
    structured = code_llm.with_structured_output(output_model)
    return await structured.ainvoke(prompt)
