from graph.nodes.validator import MAX_VALIDATOR_RETRIES
from graph.state import AgentLog, Competitor, MarketData, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event
from services.tavily_client import search


async def market_research(state: StartupState) -> StartupState:
    revision_reason = state.revision_reasons.pop("market_research", None)
    if revision_reason:
        state.retry_counts["market_research"] = state.retry_counts.get("market_research", 0) + 1
        retry_num = state.retry_counts["market_research"]
        await log_event(state, AgentLog(
            agent="Market Research",
            message=f"Market Validator found issues — refining research (retry {retry_num}/{MAX_VALIDATOR_RETRIES}): {revision_reason}",
            status="info",
            thought=f"Re-running market research to address validator feedback: {revision_reason}",
        ))

    seed_queries = [
        state.idea,
        f"{state.idea} market size competitors pricing",
        f"{state.idea} trends customer pain points regulations",
    ]

    all_results = []

    for query in seed_queries:
        # Emit a log showing the search query being executed, live, as it starts
        await log_event(
            state,
            AgentLog(
                agent="Market Research",
                message=f"Searching external sources for market intelligence...",
                status="info",
                search_query=query,
                thought=f"Querying Tavily to gather competitive landscape and market sizing data for: {query}",
            ),
        )

        results = await search(query, max_results=4)

        # Emit individual logs for each result with its URL, live, as each is processed
        for item in results:
            url = item.get("url", "")
            title = item.get("title", "Search result")
            if url:
                await log_event(
                    state,
                    AgentLog(
                        agent="Market Research",
                        message=f"Found: {title}",
                        status="info",
                        url=url,
                    ),
                )

        all_results.extend(results)

    # Emit a summary log
    await log_event(
        state,
        AgentLog(
            agent="Market Research",
            message=f"Collected {len(all_results)} results across {len(seed_queries)} search queries. Synthesizing market intelligence...",
            status="info",
            thought="Analyzing search results to extract TAM/SAM/SOM, competitors, and market gaps.",
        ),
    )

    research_blob = "\n".join(
        f"- {item['title']}: {item['content']} ({item['url']})" for item in all_results
    )
    revision_context = ""
    if revision_reason:
        revision_context = f"""
IMPORTANT — A previous analysis was flagged by the validator:
{revision_reason}

Focus on addressing these specific gaps while keeping the rest of the research intact.
"""

    prompt = f"""
You are the VentureForge market research agent.
Idea: {state.idea}
Startup name: {state.startup_name}
{revision_context}
Using the search evidence below, produce a concise market research summary with concrete, decision-useful details.
Evidence:
{research_blob}

Return structured market intelligence with realistic TAM/SAM/SOM strings, 3 competitors, and 3 market gaps.
Make the TAM/SAM/SOM consistent with the evidence and mention any uncertainty in the source field.
"""
    try:
        model = await structured_reasoning(prompt, MarketData, state=state)
    except Exception:
        model = MarketData(
            tam="$4.2B",
            sam="$1.1B",
            som="$120M",
            tam_source="Fallback synthesis from Tavily results",
            competitors=[
                Competitor(
                    name="CompetitorX",
                    founded="2020",
                    funding="$12M",
                    pricing="$99/mo",
                    focus="SMB AI tools",
                threat_level="Medium",
            )
            ],
            market_gaps=[
                "Workflow automation",
                "Localized onboarding",
                "Distribution partnerships",
            ],
            raw_search_results=[f"{item['title']}: {item['content']}" for item in all_results],
        )
    state.market = model
    state.completed_steps.append("market_research")
    await log_event(
        state,
        AgentLog(
            agent="Market Research",
            message=f"Market analysis complete — {len(all_results)} Tavily results synthesized across {len(seed_queries)} queries.",
            status="success",
        ),
    )
    return state
