"""Standalone seed script: inserts 15 realistic startup ideas into the database.

Usage:
    python seed_ideas.py

Requires DATABASE_URL env var (or defaults to localhost:5433/ventureforge).
Creates a dummy seed user and inserts ideas with pre-filled ai_summary_json
so the community feed looks populated during demos.
"""

import asyncio
import os
import sys
import json
from uuid import uuid4

import psycopg
from psycopg.types.json import Json

# Psycopg async connections require a selector loop on Windows (same fix as main.py).
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/ventureforge",
)

SEED_USER_ID = "seed-demo-user-001"
SEED_USER_EMAIL = "demo@ventureforge.dev"
SEED_USER_NAME = "Demo Founder"
SEED_USER_USERNAME = "demo-founder"

IDEAS = [
    {
        "title": "FinLens — AI-Powered Personal Finance Dashboard",
        "one_liner": "A unified dashboard that aggregates bank accounts, investments, and crypto portfolios with AI-driven spending insights and anomaly detection.",
        "domain": "Fintech",
        "score": 82,
        "summary": {
            "market": {
                "tam": "$12.4B",
                "sam": "$3.1B",
                "som": "$180M",
                "tam_source": "Allied Market Research — Personal Finance Software 2024",
                "competitors": [
                    {"name": "Mint", "focus": "Budgeting", "threat_level": "Medium"},
                    {"name": "Copilot Money", "focus": "Premium tracking", "threat_level": "High"},
                    {"name": "Monarch Money", "focus": "Family finance", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "No single tool covers bank + crypto + brokerage in one view",
                    "Existing tools lack real-time anomaly alerts",
                    "Gen-Z users want social/gamified finance features",
                ],
            },
            "icp": "Tech-savvy millennials (25-38) with 3+ financial accounts, earning $60-150K, who feel overwhelmed managing money across platforms.",
            "business": {
                "problem": "Users juggle 5-8 financial apps with no unified view, missing fraud, overspending, and investment opportunities.",
                "solution": "Single pane of glass for all finances with AI that flags anomalies, suggests optimizations, and forecasts cash flow.",
                "value_proposition": "See your entire financial life in one dashboard — AI catches what you miss.",
                "revenue_model": "Freemium SaaS",
                "pricing": "$9.99/mo Premium, $19.99/mo Family",
                "gtm_strategy": "Content marketing via personal finance subreddits, TikTok finance creators, referral program with $5 credits.",
            },
            "financials": {"npv": 2400000, "irr": 0.34, "payback_months": 18},
            "mvp": {"estimated_weeks": 10, "estimated_cost_inr": "₹18L", "team_size": 3},
        },
    },
    {
        "title": "MediSync — Remote Patient Monitoring Platform",
        "one_liner": "A HIPAA-compliant platform that connects wearable health data to physician dashboards with AI triage for early intervention alerts.",
        "domain": "Healthtech",
        "score": 88,
        "summary": {
            "market": {
                "tam": "$71.9B",
                "sam": "$8.2B",
                "som": "$320M",
                "tam_source": "Grand View Research — Remote Patient Monitoring 2024",
                "competitors": [
                    {"name": "Biofourmis", "focus": "Clinical-grade RPM", "threat_level": "High"},
                    {"name": "Livongo", "focus": "Chronic conditions", "threat_level": "Medium"},
                    {"name": "Current Health", "focus": "Hospital at home", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "Most RPM solutions require proprietary hardware",
                    "Poor integration with consumer wearables (Apple Watch, Fitbit)",
                    "Physicians overwhelmed by data volume without intelligent filtering",
                ],
            },
            "icp": "Mid-size cardiology and pulmonology clinics (10-50 physicians) managing 500+ chronic condition patients remotely.",
            "business": {
                "problem": "Physicians can't monitor patients between visits; critical deterioration goes undetected until ER admission.",
                "solution": "AI filters wearable data streams, surfaces only actionable alerts, and auto-generates patient summaries for physicians.",
                "value_proposition": "Catch patient deterioration 48 hours earlier — without drowning in data.",
                "revenue_model": "B2B SaaS per-patient-per-month",
                "pricing": "$15/patient/month (enterprise volume discounts)",
                "gtm_strategy": "Partner with 3 regional health systems for pilot, present at HIMSS, publish outcomes study.",
            },
            "financials": {"npv": 5800000, "irr": 0.42, "payback_months": 14},
            "mvp": {"estimated_weeks": 14, "estimated_cost_inr": "₹28L", "team_size": 4},
        },
    },
    {
        "title": "LearnPath AI — Adaptive Exam Prep Platform",
        "one_liner": "An AI tutor that builds personalized study plans from diagnostic tests, adapts in real-time to student performance, and predicts exam scores.",
        "domain": "Edtech",
        "score": 76,
        "summary": {
            "market": {
                "tam": "$8.5B",
                "sam": "$2.1B",
                "som": "$95M",
                "tam_source": "Research and Markets — Online Test Prep 2024",
                "competitors": [
                    {"name": "Magoosh", "focus": "GRE/GMAT prep", "threat_level": "Medium"},
                    {"name": "Khan Academy", "focus": "Free education", "threat_level": "Low"},
                    {"name": "Unacademy", "focus": "Indian competitive exams", "threat_level": "High"},
                ],
                "market_gaps": [
                    "Static course content doesn't adapt to individual weaknesses",
                    "Students waste time on topics they've already mastered",
                    "No reliable score prediction before actual exam day",
                ],
            },
            "icp": "College students (18-24) preparing for competitive exams (UPSC, CAT, GATE) in India, spending 4-6 hours daily on prep.",
            "business": {
                "problem": "Students follow generic study plans, waste 40% of time on mastered topics, and can't gauge exam readiness.",
                "solution": "AI diagnostic identifies weak areas, generates micro-lessons targeting gaps, and runs simulated exams with score predictions.",
                "value_proposition": "Study smarter not harder — know your score before exam day.",
                "revenue_model": "Subscription + per-exam-pack upsell",
                "pricing": "₹499/mo base, ₹1999 per exam-specific pack",
                "gtm_strategy": "Campus ambassadors at top 50 colleges, YouTube shorts with study tips, free diagnostic test as lead magnet.",
            },
            "financials": {"npv": 1800000, "irr": 0.28, "payback_months": 22},
            "mvp": {"estimated_weeks": 8, "estimated_cost_inr": "₹12L", "team_size": 3},
        },
    },
    {
        "title": "CarbonTrail — Supply Chain Emissions Tracker",
        "one_liner": "An API-first platform that calculates Scope 3 emissions across supplier networks using AI to parse invoices, shipping data, and energy bills.",
        "domain": "Climate",
        "score": 91,
        "summary": {
            "market": {
                "tam": "$28.9B",
                "sam": "$4.8B",
                "som": "$210M",
                "tam_source": "MarketsandMarkets — Carbon Accounting Software 2024",
                "competitors": [
                    {"name": "Watershed", "focus": "Enterprise carbon accounting", "threat_level": "High"},
                    {"name": "Persefoni", "focus": "Financial-grade carbon data", "threat_level": "High"},
                    {"name": "Plan A", "focus": "EU compliance", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "Scope 3 (supply chain) data is 80% of emissions but hardest to measure",
                    "SME suppliers can't afford expensive carbon consultants",
                    "No automated invoice-to-emissions pipeline exists",
                ],
            },
            "icp": "Mid-market manufacturers ($50M-$500M revenue) with 100+ suppliers facing upcoming CSRD/SEC disclosure mandates.",
            "business": {
                "problem": "Companies face regulatory deadlines for Scope 3 reporting but their supplier data is trapped in PDFs, emails, and spreadsheets.",
                "solution": "AI reads supplier invoices/shipping docs, maps to emission factors, builds auditable Scope 3 reports automatically.",
                "value_proposition": "Scope 3 compliance in weeks not months — no supplier surveys needed.",
                "revenue_model": "Platform fee + per-supplier pricing",
                "pricing": "$2,000/mo platform + $50/supplier/month",
                "gtm_strategy": "Partner with Big 4 sustainability practices, attend COP/climate conferences, publish benchmark reports.",
            },
            "financials": {"npv": 7200000, "irr": 0.48, "payback_months": 12},
            "mvp": {"estimated_weeks": 12, "estimated_cost_inr": "₹24L", "team_size": 4},
        },
    },
    {
        "title": "CodeReview.ai — Automated PR Review Agent",
        "one_liner": "An AI code reviewer that integrates with GitHub/GitLab, catches bugs before humans review, and learns team-specific coding standards over time.",
        "domain": "AI Tools",
        "score": 79,
        "summary": {
            "market": {
                "tam": "$5.2B",
                "sam": "$1.4B",
                "som": "$65M",
                "tam_source": "Gartner — AI-Augmented Software Engineering 2024",
                "competitors": [
                    {"name": "CodeRabbit", "focus": "AI PR reviews", "threat_level": "High"},
                    {"name": "Sourcery", "focus": "Python refactoring", "threat_level": "Medium"},
                    {"name": "Codacy", "focus": "Static analysis", "threat_level": "Low"},
                ],
                "market_gaps": [
                    "Generic linters don't understand team conventions",
                    "Senior engineers spend 30% of time on routine PR reviews",
                    "No tool correlates code changes with production incident patterns",
                ],
            },
            "icp": "Engineering teams (10-100 devs) at Series A-C startups shipping 20+ PRs/day who want faster review cycles.",
            "business": {
                "problem": "PRs sit in review queues for 24-48 hours; 60% of review comments are style/convention issues a bot could catch.",
                "solution": "AI reviewer comments on PRs within minutes, learns team patterns, and escalates only genuinely complex changes to humans.",
                "value_proposition": "Ship 2x faster — AI handles the routine reviews so humans focus on architecture.",
                "revenue_model": "Per-seat SaaS",
                "pricing": "$29/dev/month",
                "gtm_strategy": "Free tier for open-source repos, DevTool Twitter community, sponsor engineering podcasts.",
            },
            "financials": {"npv": 3100000, "irr": 0.36, "payback_months": 16},
            "mvp": {"estimated_weeks": 8, "estimated_cost_inr": "₹15L", "team_size": 3},
        },
    },
    {
        "title": "PayBridge — Cross-Border B2B Payment Rails",
        "one_liner": "Instant cross-border B2B payments for SMEs using stablecoin settlement behind a familiar bank-transfer UX.",
        "domain": "Fintech",
        "score": 85,
        "summary": {
            "market": {
                "tam": "$39.3B",
                "sam": "$5.6B",
                "som": "$140M",
                "tam_source": "McKinsey Global Payments Report 2024",
                "competitors": [
                    {"name": "Wise Business", "focus": "Multi-currency accounts", "threat_level": "High"},
                    {"name": "Payoneer", "focus": "Marketplace payouts", "threat_level": "Medium"},
                    {"name": "Thunes", "focus": "Emerging market rails", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "SWIFT transfers take 3-5 days and cost 3-6% for SMEs",
                    "Stablecoin rails exist but UX requires crypto literacy",
                    "No single platform handles compliance + FX + settlement for small businesses",
                ],
            },
            "icp": "Export-oriented SMEs ($1M-$20M revenue) in India/SEA sending 10+ international invoices per month.",
            "business": {
                "problem": "SME exporters lose 4-6% on each cross-border payment to bank fees and poor FX rates, and wait days for settlement.",
                "solution": "Stablecoin-settled rails abstracted behind a simple invoice-pay interface; compliance handled automatically.",
                "value_proposition": "Cross-border payments in minutes at 0.5% — no crypto knowledge needed.",
                "revenue_model": "Transaction fee (0.5%) + FX spread",
                "pricing": "0.5% per transaction, no monthly fee",
                "gtm_strategy": "Partner with export associations, integrate with Tally/Zoho Books, target textile/pharma export clusters.",
            },
            "financials": {"npv": 9500000, "irr": 0.52, "payback_months": 10},
            "mvp": {"estimated_weeks": 16, "estimated_cost_inr": "₹35L", "team_size": 5},
        },
    },
    {
        "title": "TherapyBot — AI-Assisted CBT Companion",
        "one_liner": "A conversational AI that delivers structured CBT exercises between therapy sessions, with therapist-visible progress dashboards.",
        "domain": "Healthtech",
        "score": 73,
        "summary": {
            "market": {
                "tam": "$17.8B",
                "sam": "$3.4B",
                "som": "$85M",
                "tam_source": "Fortune Business Insights — Digital Mental Health 2024",
                "competitors": [
                    {"name": "Woebot", "focus": "CBT chatbot", "threat_level": "High"},
                    {"name": "Wysa", "focus": "Emotional wellness", "threat_level": "Medium"},
                    {"name": "Headspace", "focus": "Meditation/mindfulness", "threat_level": "Low"},
                ],
                "market_gaps": [
                    "Therapists have no visibility into patient practice between sessions",
                    "Existing bots are standalone — not integrated into clinical workflows",
                    "CBT homework compliance drops to 30% without reinforcement",
                ],
            },
            "icp": "Licensed therapists (CBT practitioners) with 20+ active patients who want to extend care between weekly sessions.",
            "business": {
                "problem": "Patients forget CBT techniques between sessions; therapists can't monitor or reinforce practice.",
                "solution": "AI companion guides daily CBT exercises, tracks mood/thought patterns, and gives therapists a real-time progress dashboard.",
                "value_proposition": "Your therapist's methods, available 24/7 — with full clinical oversight.",
                "revenue_model": "B2B2C — therapists subscribe, patients use free",
                "pricing": "$49/therapist/month (unlimited patients)",
                "gtm_strategy": "Partner with therapy training institutes, present at APA conference, free pilot with 50 therapists.",
            },
            "financials": {"npv": 1500000, "irr": 0.24, "payback_months": 24},
            "mvp": {"estimated_weeks": 10, "estimated_cost_inr": "₹16L", "team_size": 3},
        },
    },
    {
        "title": "SkillForge — AI Resume & Interview Coach",
        "one_liner": "An AI career platform that rewrites resumes for ATS optimization, generates tailored cover letters, and conducts mock interviews with real-time feedback.",
        "domain": "Edtech",
        "score": 71,
        "summary": {
            "market": {
                "tam": "$4.1B",
                "sam": "$1.2B",
                "som": "$45M",
                "tam_source": "Technavio — Online Career Services Market 2024",
                "competitors": [
                    {"name": "Jobscan", "focus": "ATS optimization", "threat_level": "Medium"},
                    {"name": "Interviewing.io", "focus": "Mock interviews", "threat_level": "Medium"},
                    {"name": "Resume.io", "focus": "Resume builder", "threat_level": "Low"},
                ],
                "market_gaps": [
                    "No tool combines resume, cover letter, and interview prep in one flow",
                    "Mock interview tools don't give real-time body language feedback",
                    "Job-specific tailoring requires manual effort each application",
                ],
            },
            "icp": "Job seekers applying to 20+ positions, especially career switchers and fresh graduates in tech/consulting.",
            "business": {
                "problem": "Applicants spend 45 min per application tailoring materials, still get rejected by ATS filters.",
                "solution": "One-click resume tailoring per job posting, AI cover letter generation, and video mock interviews with feedback.",
                "value_proposition": "Apply to 10 jobs in the time it used to take for 1 — and actually get interviews.",
                "revenue_model": "Freemium subscription",
                "pricing": "$19/mo job seeker, $99/mo career coach tier",
                "gtm_strategy": "LinkedIn content marketing, university career center partnerships, Reddit job search communities.",
            },
            "financials": {"npv": 1200000, "irr": 0.22, "payback_months": 26},
            "mvp": {"estimated_weeks": 6, "estimated_cost_inr": "₹10L", "team_size": 2},
        },
    },
    {
        "title": "GridShift — Residential Energy Storage Optimizer",
        "one_liner": "AI software for home battery owners that arbitrages electricity rates, sells back to the grid at peak, and maximizes solar self-consumption.",
        "domain": "Climate",
        "score": 84,
        "summary": {
            "market": {
                "tam": "$15.6B",
                "sam": "$2.8B",
                "som": "$110M",
                "tam_source": "BloombergNEF — Behind-the-Meter Storage 2024",
                "competitors": [
                    {"name": "Tesla Autobidder", "focus": "Utility-scale optimization", "threat_level": "Low"},
                    {"name": "Amber Electric", "focus": "Wholesale rate access", "threat_level": "Medium"},
                    {"name": "Powervault", "focus": "UK home batteries", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "Most home battery software uses simple time-of-use rules, not ML forecasting",
                    "No platform aggregates residential batteries for virtual power plant participation",
                    "Homeowners leave $500-1200/year on the table with default settings",
                ],
            },
            "icp": "Homeowners with solar + battery systems (Tesla Powerwall, Enphase) in markets with time-of-use or dynamic pricing.",
            "business": {
                "problem": "Home battery owners use manufacturer defaults that don't optimize for their specific rate plan or solar generation.",
                "solution": "ML predicts solar generation, household load, and electricity prices; optimally charges/discharges battery every 15 minutes.",
                "value_proposition": "Earn $800+/year more from your home battery — set it and forget it.",
                "revenue_model": "Revenue share on savings generated",
                "pricing": "20% of additional savings (avg $160/year per household)",
                "gtm_strategy": "Solar installer partnerships, r/solar community, integration with Home Assistant.",
            },
            "financials": {"npv": 4200000, "irr": 0.38, "payback_months": 15},
            "mvp": {"estimated_weeks": 12, "estimated_cost_inr": "₹20L", "team_size": 3},
        },
    },
    {
        "title": "DocuAgent — AI Contract Analysis Tool",
        "one_liner": "Upload any contract and get instant risk analysis, clause comparison against your templates, and negotiation suggestions powered by GPT-4.",
        "domain": "AI Tools",
        "score": 77,
        "summary": {
            "market": {
                "tam": "$3.8B",
                "sam": "$980M",
                "som": "$42M",
                "tam_source": "Precedence Research — AI in Legal Tech 2024",
                "competitors": [
                    {"name": "Ironclad", "focus": "CLM platform", "threat_level": "Medium"},
                    {"name": "Spellbook", "focus": "AI contract drafting", "threat_level": "High"},
                    {"name": "Luminance", "focus": "Due diligence", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "Enterprise CLM tools cost $50K+ and take months to implement",
                    "Startups review contracts manually or skip review entirely",
                    "No tool offers instant risk scoring with plain-English explanations",
                ],
            },
            "icp": "Startup founders and ops managers (Seed to Series B) reviewing 5-15 vendor/partner contracts per month without in-house counsel.",
            "business": {
                "problem": "Startups sign contracts without proper legal review because lawyers cost $500/hr and take days to respond.",
                "solution": "Upload a contract, get instant risk score, flagged clauses with explanations, and suggested redlines in 30 seconds.",
                "value_proposition": "Lawyer-grade contract review in 30 seconds for $1 per document.",
                "revenue_model": "Usage-based + subscription",
                "pricing": "Free (3 docs/mo), $49/mo (50 docs), $199/mo (unlimited)",
                "gtm_strategy": "Product Hunt launch, YC founder community, integrate with DocuSign/PandaDoc.",
            },
            "financials": {"npv": 2800000, "irr": 0.32, "payback_months": 17},
            "mvp": {"estimated_weeks": 6, "estimated_cost_inr": "₹12L", "team_size": 2},
        },
    },
    {
        "title": "FarmSense — Precision Agriculture IoT Platform",
        "one_liner": "Low-cost soil sensors + satellite imagery + AI recommendations for smallholder farmers to optimize irrigation and fertilizer use.",
        "domain": "Climate",
        "score": 80,
        "summary": {
            "market": {
                "tam": "$9.4B",
                "sam": "$2.2B",
                "som": "$75M",
                "tam_source": "MarketsandMarkets — Precision Farming 2024",
                "competitors": [
                    {"name": "CropX", "focus": "Soil sensing", "threat_level": "Medium"},
                    {"name": "Cropin", "focus": "Farm management", "threat_level": "High"},
                    {"name": "Fasal", "focus": "Indian horticulture", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "Existing precision ag tools designed for large Western farms (100+ acres)",
                    "Smallholders (2-10 acres) can't afford $5K sensor setups",
                    "Recommendations don't account for local soil types and regional crop varieties",
                ],
            },
            "icp": "Progressive smallholder farmers (2-10 acres) in India growing high-value crops (cotton, sugarcane, grapes) with smartphone access.",
            "business": {
                "problem": "Smallholders over-irrigate by 40% and over-fertilize by 30%, wasting money and degrading soil.",
                "solution": "$50 soil sensor + free satellite data + AI app gives WhatsApp-delivered daily irrigation and fertilizer recommendations.",
                "value_proposition": "Save 30% on water and fertilizer while increasing yield — instructions via WhatsApp.",
                "revenue_model": "Hardware sale + subscription for AI recommendations",
                "pricing": "₹3,500 sensor kit + ₹199/month subscription",
                "gtm_strategy": "Partner with FPOs (Farmer Producer Organizations), demo at Krishi Melas, agri-input dealer channel.",
            },
            "financials": {"npv": 3500000, "irr": 0.30, "payback_months": 20},
            "mvp": {"estimated_weeks": 14, "estimated_cost_inr": "₹22L", "team_size": 4},
        },
    },
    {
        "title": "SynthData — Privacy-Safe Synthetic Data Generator",
        "one_liner": "Generate statistically identical synthetic datasets from production data for safe ML training, testing, and analytics without privacy risk.",
        "domain": "AI Tools",
        "score": 86,
        "summary": {
            "market": {
                "tam": "$2.1B",
                "sam": "$680M",
                "som": "$35M",
                "tam_source": "Gartner — Synthetic Data Generation Market 2024",
                "competitors": [
                    {"name": "Mostly AI", "focus": "Tabular synthetic data", "threat_level": "High"},
                    {"name": "Gretel.ai", "focus": "Developer-focused", "threat_level": "High"},
                    {"name": "Hazy", "focus": "Enterprise banking", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "Existing tools require data science expertise to configure",
                    "No solution handles mixed-type data (tabular + time-series + text) in one tool",
                    "Validation reports don't satisfy compliance teams without manual review",
                ],
            },
            "icp": "Data teams at regulated enterprises (banking, insurance, healthcare) with 50+ ML engineers needing test data.",
            "business": {
                "problem": "ML teams wait weeks for anonymized production data; poor test data causes 30% of production ML failures.",
                "solution": "One-click synthetic data generation that preserves statistical properties, with automated privacy guarantees and compliance reports.",
                "value_proposition": "Production-quality test data in minutes — zero privacy risk, auditor-ready reports.",
                "revenue_model": "Platform SaaS + volume pricing",
                "pricing": "$5,000/mo base + $0.01 per synthetic row",
                "gtm_strategy": "Target CDOs at banking conferences, publish privacy research papers, free tier for open datasets.",
            },
            "financials": {"npv": 4800000, "irr": 0.40, "payback_months": 13},
            "mvp": {"estimated_weeks": 10, "estimated_cost_inr": "₹20L", "team_size": 3},
        },
    },
    {
        "title": "NutriPlan — AI Meal Planning for Dietary Restrictions",
        "one_liner": "An AI nutritionist that generates weekly meal plans accounting for allergies, medical conditions, taste preferences, and local grocery availability.",
        "domain": "Healthtech",
        "score": 68,
        "summary": {
            "market": {
                "tam": "$6.8B",
                "sam": "$1.5B",
                "som": "$55M",
                "tam_source": "Grand View Research — Diet & Nutrition App Market 2024",
                "competitors": [
                    {"name": "Eat This Much", "focus": "Auto meal planning", "threat_level": "Medium"},
                    {"name": "Noom", "focus": "Psychology-based weight loss", "threat_level": "Low"},
                    {"name": "PlateJoy", "focus": "Personalized plans", "threat_level": "Medium"},
                ],
                "market_gaps": [
                    "No app handles complex multi-constraint planning (diabetes + vegan + nut allergy)",
                    "Plans ignore what's actually available at nearby stores",
                    "Indian/Asian cuisines poorly represented in Western meal planners",
                ],
            },
            "icp": "Health-conscious adults (30-55) managing dietary restrictions (diabetes, celiac, allergies) who cook 4+ meals per week.",
            "business": {
                "problem": "People with multiple dietary constraints spend 3+ hours weekly planning meals that meet all requirements.",
                "solution": "AI generates constraint-satisfying meal plans with recipes, auto-generates grocery lists synced to local store inventory.",
                "value_proposition": "Delicious meals that meet ALL your dietary needs — planned in 30 seconds.",
                "revenue_model": "Subscription + grocery affiliate revenue",
                "pricing": "$7.99/mo individual, $12.99/mo family",
                "gtm_strategy": "Partnerships with dietitians, diabetes support communities, grocery delivery app integrations.",
            },
            "financials": {"npv": 900000, "irr": 0.20, "payback_months": 28},
            "mvp": {"estimated_weeks": 6, "estimated_cost_inr": "₹8L", "team_size": 2},
        },
    },
    {
        "title": "BuildSpec — AI Architecture Document Generator",
        "one_liner": "Describe your app in plain English and get a complete technical spec: system architecture, API contracts, database schema, and deployment plan.",
        "domain": "AI Tools",
        "score": 74,
        "summary": {
            "market": {
                "tam": "$3.2B",
                "sam": "$850M",
                "som": "$38M",
                "tam_source": "IDC — AI-Assisted Software Development 2024",
                "competitors": [
                    {"name": "Eraser.io", "focus": "AI diagrams", "threat_level": "Medium"},
                    {"name": "Swimm", "focus": "Auto-documentation", "threat_level": "Low"},
                    {"name": "Cursor", "focus": "AI code editor", "threat_level": "Low"},
                ],
                "market_gaps": [
                    "AI coding tools help write code but not plan systems",
                    "Architecture decisions are made ad-hoc without documenting trade-offs",
                    "No tool generates deployment-ready specs from natural language",
                ],
            },
            "icp": "Technical founders and lead engineers at early-stage startups (pre-seed to Series A) building their first production system.",
            "business": {
                "problem": "Founders skip architecture planning and accumulate tech debt; or spend weeks writing specs that become outdated immediately.",
                "solution": "Describe your product, get a living architecture document with diagrams, schemas, and deployment configs that updates as you build.",
                "value_proposition": "From idea to production-ready architecture in 10 minutes — not 2 weeks.",
                "revenue_model": "Subscription SaaS",
                "pricing": "$39/mo solo, $149/mo team (5 seats)",
                "gtm_strategy": "Indie Hackers community, Twitter tech audience, integration with Linear/Notion for spec tracking.",
            },
            "financials": {"npv": 1600000, "irr": 0.26, "payback_months": 21},
            "mvp": {"estimated_weeks": 8, "estimated_cost_inr": "₹14L", "team_size": 3},
        },
    },
    {
        "title": "FleetZero — EV Fleet Charging Orchestrator",
        "one_liner": "AI scheduling software for commercial EV fleets that minimizes electricity costs by optimizing charge timing against route plans and grid tariffs.",
        "domain": "Climate",
        "score": 87,
        "summary": {
            "market": {
                "tam": "$18.2B",
                "sam": "$3.6B",
                "som": "$150M",
                "tam_source": "McKinsey — Electric Fleet Management 2024",
                "competitors": [
                    {"name": "Driivz", "focus": "EV charging management", "threat_level": "Medium"},
                    {"name": "Nuvve", "focus": "V2G technology", "threat_level": "Medium"},
                    {"name": "Geotab", "focus": "Fleet telematics", "threat_level": "Low"},
                ],
                "market_gaps": [
                    "Fleet managers use dumb first-come-first-served charging",
                    "No tool jointly optimizes routes + charge schedules + grid tariffs",
                    "Demand charges (peak kW penalties) ignored by current solutions",
                ],
            },
            "icp": "Last-mile delivery companies (50-500 EVs) and municipal bus operators transitioning from diesel to electric fleets.",
            "business": {
                "problem": "EV fleets charging simultaneously spike demand charges by $2K-10K/month; vehicles aren't ready when routes need them.",
                "solution": "AI knows tomorrow's routes, stagger-charges vehicles overnight at lowest tariff, avoids demand charge spikes.",
                "value_proposition": "Cut fleet charging costs 35% while guaranteeing every vehicle is route-ready.",
                "revenue_model": "SaaS per vehicle",
                "pricing": "$45/vehicle/month",
                "gtm_strategy": "Pilot with 3 delivery companies, present at ACT Expo, partner with charger OEMs (ABB, ChargePoint).",
            },
            "financials": {"npv": 6100000, "irr": 0.44, "payback_months": 13},
            "mvp": {"estimated_weeks": 12, "estimated_cost_inr": "₹25L", "team_size": 4},
        },
    },
]


async def seed():
    conn = await psycopg.AsyncConnection.connect(DATABASE_URL)
    async with conn:
        async with conn.cursor() as cur:
            # Ensure seed user exists
            await cur.execute(
                """
                INSERT INTO users (id, email, name, picture, username, bio)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
                """,
                (
                    SEED_USER_ID,
                    SEED_USER_EMAIL,
                    SEED_USER_NAME,
                    None,
                    SEED_USER_USERNAME,
                    "Demo user for seeded community ideas.",
                ),
            )

            for idea in IDEAS:
                idea_id = str(uuid4())
                await cur.execute(
                    """
                    INSERT INTO ideas (id, title, one_liner, domain, owner_id,
                                       is_public, ai_validation_score, ai_summary_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (
                        idea_id,
                        idea["title"],
                        idea["one_liner"],
                        idea["domain"],
                        SEED_USER_ID,
                        True,
                        idea["score"],
                        Json(idea["summary"]),
                    ),
                )
                print(f"  [ok] {idea['title']}")

        await conn.commit()

    print(f"\nSeeded {len(IDEAS)} ideas under user @{SEED_USER_USERNAME}")


if __name__ == "__main__":
    asyncio.run(seed())
