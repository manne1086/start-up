import asyncio
import json
from functools import wraps
from typing import Any, TypeVar

import groq
from langchain_groq import ChatGroq
from pydantic import BaseModel

from core.config import settings
from graph.state import AgentLog, StartupState

reasoning_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    max_tokens=4096,
    api_key=settings.GROQ_API_KEY,
)

code_llm = ChatGroq(
    model="llama-3.1-70b-versatile",
    temperature=0.3,
    max_tokens=4096,
    api_key=settings.GROQ_API_KEY,
)

validator_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    max_tokens=2048,
    api_key=settings.GROQ_API_KEY,
)

T = TypeVar("T", bound=BaseModel)


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

