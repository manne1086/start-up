from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AgentLog(BaseModel):
    agent: str
    message: str
    status: Literal["info", "success", "warning", "error"]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    search_query: str | None = None
    url: str | None = None
    thought: str | None = None


class Competitor(BaseModel):
    name: str
    founded: str
    funding: str
    pricing: str
    focus: str
    threat_level: Literal["High", "Medium", "Low"]


class MarketData(BaseModel):
    tam: str
    sam: str
    som: str
    tam_source: str
    competitors: list[Competitor] = []
    market_gaps: list[str] = []
    raw_search_results: list[str] = []


class BusinessPlan(BaseModel):
    problem_statement: str
    solution: str
    target_market: str
    revenue_model: str
    pricing: str
    gtm_strategy: str
    value_proposition: str
    key_risks: list[str] = []
    mitigation_steps: list[str] = []


class StartupIdentity(BaseModel):
    startup_name: str
    industry: str


class FinancialAssumptions(BaseModel):
    monthly_subscriptions_y1: int
    price_per_unit: float
    churn_rate: float
    tax_rate: float
    cagr: float


class YearProjection(BaseModel):
    year: int
    revenue: float
    cogs: float
    gross_profit: float
    ebitda: float
    fcf: float


class FinancialModel(BaseModel):
    assumptions: FinancialAssumptions
    projections: list[YearProjection]
    npv: float
    irr: float
    payback_months: int
    fcf_formula: str


class RegulationStatus(BaseModel):
    name: str
    status: Literal["Compliant", "Review Needed", "Non-Compliant"]
    note: str


class ComplianceAction(BaseModel):
    title: str
    priority: Literal["Critical", "Medium", "Low"]
    description: str


class LegalReport(BaseModel):
    gdpr_compliant: bool
    local_regulations: list[RegulationStatus] = []
    entity_recommendation: str
    entity_notes: str
    action_items: list[ComplianceAction] = []
    documents_available: list[str] = []


class PitchSlide(BaseModel):
    number: int
    title: str
    content: dict


class BrandTokens(BaseModel):
    primary_color: str
    secondary_color: str
    font: str
    tagline: str


class PitchDeckData(BaseModel):
    slides: list[PitchSlide] = []
    brand: BrandTokens
    template: str = "pritzker"  # pritzker | fashion | indie
    presenton_id: str | None = None
    presenton_download_url: str | None = None
    presenton_edit_url: str | None = None
    slide_image_count: int = 0


class StackItem(BaseModel):
    layer: str
    technology: str
    reason: str
    complexity: Literal["Low", "Medium", "High"]


class RoadmapPhase(BaseModel):
    phase: int
    title: str
    weeks: str
    tasks: list[str] = []


class MVPData(BaseModel):
    recommended_stack: list[StackItem] = []
    architecture_diagram: str
    roadmap_phases: list[RoadmapPhase] = []
    estimated_weeks: int
    estimated_cost_inr: str
    team_size: int


class PivotOption(BaseModel):
    id: int
    name: str
    rationale: str
    revenue_impact: str
    impact_type: Literal["positive", "negative"]
    adjusted_tam: str


class GlossaryTerm(BaseModel):
    """A jargon term explained in the context of THIS specific startup."""
    term: str
    plain_meaning: str          # what it means in everyday words
    why_it_matters: str         # why the founder should care
    this_startup: str = ""      # the actual value/answer for this venture


class ScoreCard(BaseModel):
    """A single judgement, expressed the way an investor would say it out loud."""
    label: str                  # "Market Size", "Competition", ...
    verdict: str                # "Strong", "Crowded", "Needs work"
    score: int                  # 0-100
    plain_english: str          # one sentence, no jargon
    evidence: str = ""          # the number/fact behind the judgement


class ExecutiveBriefing(BaseModel):
    """
    The plain-English translation layer over the whole pipeline.

    Everything a non-technical founder needs to understand their own venture
    brief without looking up a single acronym.
    """
    headline: str                            # one-line verdict on the venture
    verdict: Literal["promising", "mixed", "challenging"] = "mixed"
    confidence: int = 50                     # 0-100, how sure the analysis is
    elevator_pitch: str = ""                 # 2 sentences, how to describe it at a party
    what_you_are_building: str = ""          # plain restatement of the idea
    who_pays_and_why: str = ""               # customer + motivation, no jargon
    how_you_make_money: str = ""             # revenue model in plain words
    scorecards: list[ScoreCard] = []         # 4-6 dimensions judged
    biggest_strengths: list[str] = []        # 3 concrete strengths
    biggest_risks: list[str] = []            # 3 concrete risks
    do_this_next: list[str] = []             # 3-5 concrete next actions
    glossary: list[GlossaryTerm] = []        # every acronym used, explained


class StartupState(BaseModel):
    thread_id: str
    user_id: str
    idea: str
    startup_name: str = ""
    industry: str = ""
    current_step: int = 0
    completed_steps: list[str] = []
    agent_logs: list[AgentLog] = []
    status: Literal["running", "paused", "complete", "failed"] = "running"
    error: str | None = None
    market: MarketData | None = None
    business_plan: BusinessPlan | None = None
    financials: FinancialModel | None = None
    legal: LegalReport | None = None
    pitch_deck: PitchDeckData | None = None
    mvp: MVPData | None = None
    pivots: list[PivotOption] = []
    briefing: ExecutiveBriefing | None = None
    awaiting_human_review: bool = False
    human_approved: bool = False
    human_patch: dict = {}
    retry_counts: dict[str, int] = {}
    revision_reasons: dict[str, str] = {}

