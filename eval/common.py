from __future__ import annotations

import csv
import json
import os
import re
import statistics
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "ventureforge-backend"
RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)
USER_STUDY_DIR = Path(__file__).resolve().parent / "user_study"


class Idea(BaseModel):
    id: str
    domain: str
    idea_text: str


class MarketData(BaseModel):
    tam: str = ""
    sam: str = ""
    som: str = ""
    tam_source: str = ""
    competitors: list[dict[str, Any]] = Field(default_factory=list)
    market_gaps: list[str] = Field(default_factory=list)
    raw_search_results: list[str] = Field(default_factory=list)


class BusinessPlan(BaseModel):
    problem_statement: str = ""
    solution: str = ""
    target_market: str = ""
    revenue_model: str = ""
    pricing: str = ""
    gtm_strategy: str = ""
    value_proposition: str = ""
    key_risks: list[str] = Field(default_factory=list)
    mitigation_steps: list[str] = Field(default_factory=list)


class FinancialAssumptions(BaseModel):
    monthly_subscriptions_y1: int = 0
    price_per_unit: float = 0.0
    churn_rate: float = 0.0
    tax_rate: float = 0.0
    cagr: float = 0.0


class YearProjection(BaseModel):
    year: int = 0
    revenue: float = 0.0
    cogs: float = 0.0
    gross_profit: float = 0.0
    ebitda: float = 0.0
    fcf: float = 0.0


class FinancialModel(BaseModel):
    assumptions: FinancialAssumptions = Field(default_factory=FinancialAssumptions)
    projections: list[YearProjection] = Field(default_factory=list)
    npv: float = 0.0
    irr: float = 0.0
    payback_months: int = 0
    fcf_formula: str = ""


class LegalReport(BaseModel):
    gdpr_compliant: bool = False
    local_regulations: list[dict[str, Any]] = Field(default_factory=list)
    entity_recommendation: str = ""
    entity_notes: str = ""
    action_items: list[dict[str, Any]] = Field(default_factory=list)
    documents_available: list[str] = Field(default_factory=list)


class PitchDeckData(BaseModel):
    slides: list[dict[str, Any]] = Field(default_factory=list)
    brand: dict[str, Any] = Field(default_factory=dict)
    template: str = ""
    presenton_id: str | None = None
    presenton_download_url: str | None = None
    presenton_edit_url: str | None = None
    slide_image_count: int = 0


class EvaluationOutput(BaseModel):
    market: MarketData | None = None
    business_plan: BusinessPlan | None = None
    financials: FinancialModel | None = None
    legal: LegalReport | None = None
    pitch_deck: PitchDeckData | None = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_ideas() -> list[Idea]:
    return [Idea.model_validate(item) for item in json.loads((Path(__file__).parent / "test_ideas.json").read_text(encoding="utf-8"))]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def append_jsonl(path: Path, record: dict[str, Any]) -> None:
    ensure_parent(path)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=True) + "\n")


def write_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")


def csv_dict_writer(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    ensure_parent(path)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def summarize_numbers(values: list[float]) -> dict[str, float | None]:
    clean = [v for v in values if v is not None]
    if not clean:
        return {"mean": None, "median": None, "p95": None}
    return {
        "mean": statistics.mean(clean),
        "median": statistics.median(clean),
        "p95": sorted(clean)[min(len(clean) - 1, max(0, int(len(clean) * 0.95) - 1))],
    }


def get_env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def pick_provider(preferred: str, fallback: str = "groq") -> str:
    return get_env(preferred, fallback)


def call_chat_completion(provider: str, model: str, messages: list[dict[str, str]], *, temperature: float = 0.2, max_tokens: int = 4096) -> str:
    provider = provider.lower()
    if provider == "groq":
        api_key = get_env("GROQ_API_KEY")
        base_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}"}
    elif provider == "openai":
        api_key = get_env("OPENAI_API_KEY")
        base_url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}"}
    else:
        raise ValueError(f"Unsupported provider: {provider}")
    if not api_key:
        raise RuntimeError(f"{provider.upper()}_API_KEY is not configured.")
    payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    with httpx.Client(timeout=180) as client:
        resp = client.post(base_url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


def extract_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def parse_evaluation_output(raw: str) -> tuple[EvaluationOutput | None, str | None]:
    try:
        payload = extract_json(raw)
        return EvaluationOutput.model_validate(payload), None
    except Exception as exc:
        return None, str(exc)


def validate_run_state_payload(state: dict[str, Any]) -> tuple[bool, list[str]]:
    errors: list[str] = []
    checks = [
        ("market", MarketData),
        ("business_plan", BusinessPlan),
        ("financials", FinancialModel),
        ("legal", LegalReport),
        ("pitch_deck", PitchDeckData),
    ]
    for key, model in checks:
        payload = state.get(key)
        if payload is None:
            errors.append(f"{key}: missing")
            continue
        try:
            model.model_validate(payload)
        except Exception as exc:
            errors.append(f"{key}: {exc}")
    return (len(errors) == 0, errors)
