from __future__ import annotations

import asyncio
from io import BytesIO
from typing import Any

import httpx

from core.config import settings

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

    if not settings.UNSPLASH_ACCESS_KEY:
        return images

    idea_suffix = f" {idea[:30]}" if idea else ""

    async def _fetch(slide_key: str, query: str):
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
