from __future__ import annotations

import time
from io import BytesIO
from typing import Any

import httpx

from core.config import settings


def _safe_str(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    if isinstance(value, (int, float)):
        return f"{value:,}"
    text = str(value).strip()
    return text if text else fallback


def _join_list(values: Any, fallback: str = "") -> str:
    if not isinstance(values, list) or not values:
        return fallback
    cleaned = [_safe_str(value) for value in values if _safe_str(value)]
    return ", ".join(cleaned) if cleaned else fallback


def build_presentations_topic(state: dict[str, Any]) -> str:
    startup_name = _safe_str(state.get("startup_name") or state.get("idea"), "VentureForge Startup")
    idea = _safe_str(state.get("idea"), "A startup concept")
    business = state.get("business_plan") or {}
    market = state.get("market") or {}
    financials = state.get("financials") or {}
    mvp = state.get("mvp") or {}
    legal = state.get("legal") or {}
    pitch = state.get("pitch_deck") or {}

    slide_outline = [
        "1. Title and positioning",
        "2. Problem and customer pain",
        "3. Solution and product workflow",
        "4. Market opportunity and TAM/SAM/SOM",
        "5. Business model and revenue",
        "6. MVP architecture and system flow",
        "7. Roadmap and delivery plan",
        "8. Financial highlights and assumptions",
        "9. Risks, compliance, and mitigation",
        "10. Closing summary and call to action",
    ]

    architecture = state.get("architecture") or {}
    architecture_nodes = architecture.get("nodes") or []
    architecture_edges = architecture.get("edges") or []

    topic_lines = [
        f"Create an investor-ready startup presentation for {startup_name}.",
        f"Core idea: {idea}.",
        "Audience: founders, investors, and potential customers.",
        "Tone: professional, clear, and product-focused.",
        "Goal: explain how the application works, why it helps customers, and why the business is viable.",
        "",
        "Include these content cues:",
        f"- Problem: {_safe_str(business.get('problem_statement'), 'Problem statement pending')}.",
        f"- Solution: {_safe_str(business.get('solution'), 'Solution pending')}.",
        f"- Value proposition: {_safe_str(business.get('value_proposition'), 'Value proposition pending')}.",
        f"- Target market: {_safe_str(business.get('target_market'), 'Target market pending')}.",
        f"- Revenue model: {_safe_str(business.get('revenue_model'), 'Revenue model pending')}.",
        f"- Market size: TAM {_safe_str(market.get('tam'), 'TBD')}, SAM {_safe_str(market.get('sam'), 'TBD')}, SOM {_safe_str(market.get('som'), 'TBD')}.",
        f"- Top competitors: {_join_list([item.get('name') for item in (market.get('competitors') or [])[:3]], 'Not yet researched')}.",
        f"- Financial signal: NPV {_safe_str(financials.get('npv'), 'TBD')}, IRR {_safe_str(financials.get('irr'), 'TBD')}, payback {_safe_str(financials.get('payback_months'), 'TBD')} months.",
        f"- MVP team size: {_safe_str(mvp.get('team_size'), 'TBD')}.",
        f"- MVP estimate: {_safe_str(mvp.get('estimated_weeks'), 'TBD')} weeks and {_safe_str(mvp.get('estimated_cost_inr'), 'TBD')}.",
        f"- Legal posture: GDPR {_safe_str(legal.get('gdpr_compliant'), 'TBD')}, entity recommendation {_safe_str(legal.get('entity_recommendation'), 'TBD')}.",
        f"- Brand tagline: {_safe_str((pitch.get('brand') or {}).get('tagline'), 'Investor-ready startup deck')}.",
        f"- Architecture nodes: {_join_list([node.get('label') for node in architecture_nodes[:8]], 'No architecture yet')}.",
        f"- Architecture edges: {_join_list([f"{edge.get('from')} -> {edge.get('to')}" for edge in architecture_edges[:8]], 'No architecture links yet')}.",
        "",
        "Suggested slide outline:",
        *[f"- {item}" for item in slide_outline],
        "",
        "Design direction: dark premium theme, bold typography, concise bullets, and clear visual hierarchy.",
        "Focus on customer value first, then explain the system architecture that makes it possible.",
    ]

    return "\n".join(topic_lines)


def build_presentations_payload(state: dict[str, Any], *, slide_count: int = 10) -> dict[str, Any]:
    return {
        "topic": build_presentations_topic(state),
        "slideCount": slide_count,
        "language": "en",
        "domain": "business",
        "targetAudience": "founders, investors, and customers",
        "tone": "professional",
        "exportType": "pptx",
        "immediatePollUrl": True,
    }


def _extract_poll_job_id(poll_url: str) -> str:
    return poll_url.rstrip("/").rsplit("/", 1)[-1]


def _wait_for_download_url(client: httpx.Client, headers: dict[str, str], poll_url: str) -> str:
    job_id = _extract_poll_job_id(poll_url)
    deadline = time.monotonic() + 120
    delay = 10

    while time.monotonic() < deadline:
        response = client.get(f"/api/v1/polljob/{job_id}", headers=headers)
        response.raise_for_status()
        data = response.json()
        if data.get("status") == 0 and data.get("url"):
            return data["url"]
        if data.get("error"):
            raise RuntimeError(_safe_str(data.get("error"), "Presentations.ai job failed"))
        time.sleep(delay)
        delay = min(delay + 5, 15)

    raise TimeoutError("Presentations.ai presentation generation timed out")


def generate_presentations_ai_pptx(state: dict[str, Any]) -> BytesIO:
    if not settings.PRESENTATIONS_AI_API_KEY:
        raise RuntimeError("Presentations.ai API key is not configured")

    headers = {"Authorization": f"Bearer {settings.PRESENTATIONS_AI_API_KEY}"}
    payload = build_presentations_payload(state)

    with httpx.Client(base_url=settings.PRESENTATIONS_AI_BASE_URL, timeout=60) as client:
        auth_response = client.get("/api/v1/authenticate", headers=headers)
        auth_response.raise_for_status()

        response = client.post("/api/v1/topic/document", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        download_url = data.get("url")
        poll_url = data.get("pollUrl")

        if not download_url and poll_url:
            download_url = _wait_for_download_url(client, headers, poll_url)

    if not download_url:
        raise RuntimeError(f"Presentations.ai did not return a download URL: {data}")

    file_response = httpx.get(download_url, timeout=120)
    file_response.raise_for_status()
    return BytesIO(file_response.content)