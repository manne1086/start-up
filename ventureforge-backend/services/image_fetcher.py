from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

import httpx

from core.config import settings
from services.image_service import IMAGES_DIR, image_generator

_cache: dict[str, bytes] = {}

SLIDE_IMAGE_QUERIES: dict[str, str] = {
    "cover": "startup pitch presentation dark",
    "executive_summary": "business strategy meeting",
    "market": "market analysis graph data",
    "architecture": "software architecture server technology",
    "tech_stack": "modern coding developer workspace",
    "financial": "financial growth investment chart",
    "roadmap": "project planning roadmap timeline",
    "competitor": "competitive business analysis",
    "risks": "risk management strategy corporate",
}

FLUX_SLIDE_TOPICS: dict[str, str] = {
    "cover": "premium investor pitch deck cover background, cinematic startup technology brand world, abstract product ecosystem, dark clean presentation canvas",
    "executive_summary": "executive strategy presentation background, refined business operating system, subtle dashboards and decision pathways, dark premium visual design",
    "market": "market opportunity presentation background, abstract growth funnel and expanding data landscape, investor-grade, clean open space for charts",
    "architecture": "software architecture presentation background, cloud infrastructure layers, subtle connected systems, clean technical blueprint atmosphere",
    "tech_stack": "modern engineering stack presentation background, abstract code modules and product infrastructure, polished enterprise technology aesthetic",
    "financial": "financial growth presentation background, subtle revenue curve, investment analytics, premium dark boardroom data visual atmosphere",
    "roadmap": "product roadmap presentation background, abstract milestone path and launch timeline, clean investor deck style with open content space",
    "competitor": "competitive landscape presentation background, abstract market positioning grid and strategic comparison field, polished business design",
    "risks": "risk and mitigation presentation background, abstract safeguards, compliance signals and operational resilience, clean premium pitch deck style",
}


def _generated_image_bytes(local_path: str | None, image_url: str | None) -> bytes | None:
    candidates: list[Path] = []
    if local_path:
        candidates.append(Path(__file__).resolve().parents[1] / local_path)
    if image_url:
        candidates.append(IMAGES_DIR / Path(image_url).name)

    for path in candidates:
        try:
            resolved = path.resolve()
            if resolved.is_file() and str(resolved).startswith(str(IMAGES_DIR.resolve())):
                return resolved.read_bytes()
        except Exception:
            continue
    return None


async def generate_flux_slide_background(slide_key: str, idea: str = "") -> bytes | None:
    if not image_generator.provider.is_configured:
        return None

    base_topic = FLUX_SLIDE_TOPICS.get(slide_key, "premium investor pitch deck background")
    idea_context = f" for startup idea: {idea[:120]}" if idea else ""
    topic = (
        f"{base_topic}{idea_context}. "
        "No words, no typography, no numbers, no logos, no watermarks. "
        "Leave generous negative space for real slide text and charts."
    )

    try:
        result = await image_generator.generate_slide_background(topic, use_cache=True)
        if not result.success:
            print(f"[ImageFetcher] Flux background failed for '{slide_key}': {result.error}")
            return None
        return _generated_image_bytes(result.local_path, result.image_url)
    except Exception as exc:
        print(f"[ImageFetcher] Flux background failed for '{slide_key}': {exc}")
        return None


async def fetch_unsplash_image(
    query: str,
    width: int = 1200,
    height: int = 675,
) -> bytes | None:
    if query in _cache:
        return _cache[query]

    access_key = settings.UNSPLASH_ACCESS_KEY
    if not access_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://api.unsplash.com/search/photos",
                params={
                    "query": query,
                    "per_page": 1,
                    "orientation": "landscape",
                },
                headers={"Authorization": f"Client-ID {access_key}"},
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                return None

            image_url = results[0]["urls"]["regular"]
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()

            _cache[query] = img_resp.content
            return img_resp.content
    except Exception as exc:
        print(f"[ImageFetcher] Failed for '{query}': {exc}")
        return None


async def fetch_slide_images(
    idea: str = "",
) -> dict[str, bytes]:
    images: dict[str, bytes] = {}

    idea_suffix = f" {idea[:30]}" if idea else ""
    flux_semaphore = asyncio.Semaphore(2)

    async def _fetch(slide_key: str, query: str):
        async with flux_semaphore:
            data = await generate_flux_slide_background(slide_key, idea)
        if not data and settings.UNSPLASH_ACCESS_KEY:
            data = await fetch_unsplash_image(query + idea_suffix)
        if data:
            images[slide_key] = data

    tasks = [_fetch(key, query) for key, query in SLIDE_IMAGE_QUERIES.items()]
    await asyncio.gather(*tasks, return_exceptions=True)

    return images


def fetch_slide_images_sync(idea: str = "") -> dict[str, bytes]:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, fetch_slide_images(idea))
            return future.result(timeout=60)
    else:
        return asyncio.run(fetch_slide_images(idea))
