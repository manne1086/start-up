from graph.nodes.business_planning import business_planning
from graph.nodes.financial_engineering import financial_engineering
from graph.nodes.legal_compliance import legal_compliance
from graph.nodes.market_research import market_research
from graph.nodes.mvp_architecture import mvp_architecture
from graph.nodes.orchestrator import orchestrator
from graph.nodes.pitch_deck import pitch_deck
from graph.nodes.pivot_simulator import pivot_simulator
from graph.nodes.validator import MAX_VALIDATOR_RETRIES, validator_financial, validator_market
from graph.state import StartupState
import graph.checkpointer as checkpointer_module

try:
    from langgraph.graph import END, StateGraph

    def route_after_market_validation(state: StartupState) -> str:
        if (
            "market_research" in state.revision_reasons
            and state.retry_counts.get("market_research", 0) < MAX_VALIDATOR_RETRIES
        ):
            return "market_research"
        return "business_planning"

    def route_after_financial_validation(state: StartupState) -> str:
        if (
            "financial_engineering" in state.revision_reasons
            and state.retry_counts.get("financial_engineering", 0) < MAX_VALIDATOR_RETRIES
        ):
            return "financial_engineering"
        return "legal_compliance"

    workflow = StateGraph(StartupState)
    workflow.add_node("orchestrator", orchestrator)
    workflow.add_node("market_research", market_research)
    workflow.add_node("validator_market", validator_market)
    workflow.add_node("business_planning", business_planning)
    workflow.add_node("financial_engineering", financial_engineering)
    workflow.add_node("validator_financial", validator_financial)
    workflow.add_node("legal_compliance", legal_compliance)
    workflow.add_node("pitch_deck", pitch_deck)
    workflow.add_node("mvp_architecture", mvp_architecture)
    workflow.add_node("pivot_simulator", pivot_simulator)

    workflow.set_entry_point("orchestrator")
    workflow.add_edge("orchestrator", "market_research")
    workflow.add_edge("market_research", "validator_market")
    workflow.add_conditional_edges("validator_market", route_after_market_validation, {
        "market_research": "market_research",
        "business_planning": "business_planning",
    })
    workflow.add_edge("business_planning", "financial_engineering")
    workflow.add_edge("financial_engineering", "validator_financial")
    workflow.add_conditional_edges("validator_financial", route_after_financial_validation, {
        "financial_engineering": "financial_engineering",
        "legal_compliance": "legal_compliance",
    })
    workflow.add_edge("legal_compliance", "pitch_deck")
    workflow.add_edge("pitch_deck", "mvp_architecture")
    workflow.add_edge("mvp_architecture", "pivot_simulator")
    workflow.add_edge("pivot_simulator", END)
except ModuleNotFoundError:
    workflow = None


def get_compiled_graph():
    if workflow is None:
        return None
    return workflow.compile(checkpointer=checkpointer_module.checkpointer, interrupt_before=["financial_engineering"])
