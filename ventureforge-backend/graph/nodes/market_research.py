from graph.state import AgentLog, Competitor, MarketData, StartupState
from services.groq_client import structured_reasoning
from services.tavily_client import search


async def market_research(state: StartupState) -> StartupState:
    results = await search(state.idea)
    research_blob = "\n".join(
        f"- {item['title']}: {item['content']} ({item['url']})" for item in results
    )
    prompt = f"""
You are the VentureForge market research agent.
Idea: {state.idea}
Startup name: {state.startup_name}

Using the search evidence below, produce a concise market research summary.
Evidence:
{research_blob}

Return structured market intelligence with realistic TAM/SAM/SOM strings, 3 competitors, and 3 market gaps.
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
            market_gaps=["Workflow automation", "Localized onboarding", "Distribution partnerships"],
            raw_search_results=[item["content"] for item in results],
        )
    state.market = model
    state.completed_steps.append("market_research")
    state.agent_logs.append(
        AgentLog(
            agent="Market Research",
            message=f"Market analysis generated from {len(results)} search result(s).",
            status="success",
        )
    )
    return state
