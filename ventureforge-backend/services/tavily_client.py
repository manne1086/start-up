from __future__ import annotations

from typing import Any

from core.config import settings


async def search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    try:
        from tavily import AsyncTavilyClient

        client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
        response = await client.search(query=query, max_results=max_results, include_answer=True, include_raw_content=False)
        results = response.get("results", [])
        return [
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0),
            }
            for item in results
        ]
    except Exception:
        return [
            {
                "title": f"Fallback result for {query}",
                "url": "",
                "content": f"No Tavily key configured. Using fallback research signal for {query}.",
                "score": 0,
            }
        ]

