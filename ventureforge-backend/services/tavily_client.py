from __future__ import annotations

from typing import Any

from core.config import settings


async def search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    try:
        from tavily import AsyncTavilyClient

        client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
        response = await client.search(
            query=query,
            max_results=max_results,
            include_answer=True,
            include_raw_content=False,
            search_depth="advanced",
        )
        results = response.get("results", [])
        answer = response.get("answer", "")
        normalized = [
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0),
                "source_type": "search_result",
            }
            for item in results
        ]
        if answer:
            normalized.insert(
                0,
                {
                    "title": f"Tavily answer for {query}",
                    "url": "",
                    "content": answer,
                    "score": 1,
                    "source_type": "answer",
                },
            )
        return normalized
    except Exception:
        return [
            {
                "title": f"Fallback result for {query}",
                "url": "",
                "content": f"No Tavily key configured. Using fallback research signal for {query}.",
                "score": 0,
                "source_type": "fallback",
            }
        ]
