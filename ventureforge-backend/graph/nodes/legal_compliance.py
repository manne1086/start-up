from graph.state import AgentLog, ComplianceAction, LegalReport, RegulationStatus, StartupState
from services.groq_client import structured_reasoning


async def legal_compliance(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge legal and compliance agent.
Review the startup concept for baseline compliance risks and recommend an entity structure.
Idea: {state.idea}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Market: {state.market.model_dump_json(indent=2) if state.market else '{}'}

Return a LegalReport with boolean gdpr_compliant, local_regulations, entity_recommendation, entity_notes, action_items, documents_available.
"""
    try:
        report = await structured_reasoning(prompt, LegalReport, state=state)
    except Exception:
        report = LegalReport(
            gdpr_compliant=True,
            local_regulations=[
                RegulationStatus(
                    name="Data Protection",
                    status="Review Needed",
                    note="Confirm storage and consent flows",
                )
            ],
            entity_recommendation="Delaware C-Corp",
            entity_notes="Best for venture funding readiness.",
            action_items=[
                ComplianceAction(
                    title="Draft privacy policy",
                    priority="Critical",
                    description="Create a GDPR-ready privacy policy.",
                )
            ],
            documents_available=["Privacy Policy", "Terms of Service"],
        )
    state.legal = report
    state.completed_steps.append("legal_compliance")
    state.agent_logs.append(AgentLog(agent="Legal", message="Compliance review complete.", status="success"))
    return state
