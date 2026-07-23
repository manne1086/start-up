from graph.state import AgentLog, MVPData, RoadmapPhase, StackItem, StartupState
from services.groq_client import structured_reasoning
from services.stream_manager import log_event


async def mvp_architecture(state: StartupState) -> StartupState:
    prompt = f"""
You are the VentureForge MVP architecture agent.

Design a REAL, tailored MVP architecture for THIS specific startup idea. Do NOT
default to a generic ReactJS/NodeJS/MongoDB three-node diagram. Instead, pick a
stack and topology that ACTUALLY fits the idea — including AI services, caches,
queues, external APIs, mobile clients, edge functions, or whatever the idea
truly needs.

Idea: {state.idea}
Industry: {state.industry or 'General'}
Business plan: {state.business_plan.model_dump_json(indent=2) if state.business_plan else '{}'}
Financials: {state.financials.model_dump_json(indent=2) if state.financials else '{}'}

Return a complete MVPData object. Critical field:

`architecture_diagram` — Valid Mermaid `flowchart LR` syntax that produces a
rich, multi-layer architecture diagram with 8-14 nodes across subgraphs.

REQUIREMENTS for architecture_diagram:
- Start with: `flowchart LR`
- Group nodes into 3-5 subgraphs by layer (e.g. Client, Frontend, Backend, AI,
  Data, External, Infra) — choose layers that fit the idea.
- Use node shapes to convey type:
  * `["Label"]` — rectangles for services/APIs
  * `(["Label"])` — stadium for UI/frontend
  * `{{"Label"}}` — hexagons for AI/LLM/agents
  * `[("Label")]` — cylinders for databases/storage
  * `(("Label"))` — circles for users/external systems
- Include edge labels describing the interaction (e.g. `-->|GraphQL|`, `-->|Publish|`, `-->|Prompt|`).
- ALWAYS apply these colorful classDef styles at the top and assign each node to one class:
    classDef ui       fill:#00D4AA,stroke:#00FFCC,stroke-width:3px,color:#0A0A0F,font-weight:bold
    classDef backend  fill:#6C47FF,stroke:#9B7DFF,stroke-width:3px,color:#FFFFFF,font-weight:bold
    classDef ai       fill:#FF6B9D,stroke:#FF8FB6,stroke-width:3px,color:#FFFFFF,font-weight:bold
    classDef data     fill:#FFB800,stroke:#FFCC33,stroke-width:3px,color:#0A0A0F,font-weight:bold
    classDef external fill:#4EA8DE,stroke:#7CC0EB,stroke-width:3px,color:#FFFFFF,font-weight:bold
    classDef cache    fill:#F76F53,stroke:#FF8F70,stroke-width:3px,color:#FFFFFF,font-weight:bold
    classDef queue    fill:#B47AEA,stroke:#CB9CF5,stroke-width:3px,color:#FFFFFF,font-weight:bold
  Then use `class NodeId classname` for each node.
- Node IDs must be alphanumeric + underscores only, no spaces or special chars.
- Do NOT wrap the diagram in triple backticks or markdown fences — return raw Mermaid syntax only.

EXAMPLE structure (for a food delivery app — DO NOT copy verbatim, tailor to the actual idea):

flowchart LR
  classDef ui       fill:#00D4AA,stroke:#00FFCC,stroke-width:3px,color:#0A0A0F,font-weight:bold
  classDef backend  fill:#6C47FF,stroke:#9B7DFF,stroke-width:3px,color:#FFFFFF,font-weight:bold
  classDef ai       fill:#FF6B9D,stroke:#FF8FB6,stroke-width:3px,color:#FFFFFF,font-weight:bold
  classDef data     fill:#FFB800,stroke:#FFCC33,stroke-width:3px,color:#0A0A0F,font-weight:bold
  classDef external fill:#4EA8DE,stroke:#7CC0EB,stroke-width:3px,color:#FFFFFF,font-weight:bold
  classDef cache    fill:#F76F53,stroke:#FF8F70,stroke-width:3px,color:#FFFFFF,font-weight:bold
  classDef queue    fill:#B47AEA,stroke:#CB9CF5,stroke-width:3px,color:#FFFFFF,font-weight:bold

  subgraph Client["Client Apps"]
    MobileApp(["React Native App"])
    WebApp(["Next.js Web"])
  end
  subgraph API["Backend Services"]
    Gateway["API Gateway"]
    OrderSvc["Order Service"]
    UserSvc["User Service"]
  end
  subgraph AI["AI Layer"]
    Recommender{{"Recommender Engine"}}
    LLM{{"GPT-4 Assistant"}}
  end
  subgraph Data["Data Layer"]
    PG[("PostgreSQL")]
    RedisCache[("Redis Cache")]
    Events[("Kafka Events")]
  end
  subgraph External["External Services"]
    Stripe(("Stripe"))
    Maps(("Google Maps"))
  end

  MobileApp -->|REST| Gateway
  WebApp -->|GraphQL| Gateway
  Gateway --> OrderSvc
  Gateway --> UserSvc
  OrderSvc -->|Prompt| Recommender
  Recommender --> LLM
  OrderSvc -->|Read/Write| PG
  UserSvc -->|Sessions| RedisCache
  OrderSvc -->|Publish| Events
  OrderSvc -->|Charge| Stripe
  Gateway -->|Geocode| Maps

  class MobileApp,WebApp ui
  class Gateway,OrderSvc,UserSvc backend
  class Recommender,LLM ai
  class PG data
  class RedisCache cache
  class Events queue
  class Stripe,Maps external

Now generate the tailored MVPData for the given idea.
"""
    try:
        mvp = await structured_reasoning(prompt, MVPData, state=state)
    except Exception as exc:
        await log_event(state, AgentLog(agent="MVP Architecture", message=f"Structured generation failed, using fallback: {exc}", status="warning"))
        mvp = MVPData(
            recommended_stack=[StackItem(layer="Backend", technology="FastAPI", reason="Async API", complexity="Low")],
            architecture_diagram="flowchart LR\n  A([Frontend]) --> B[API] --> C[(Database)]",
            roadmap_phases=[RoadmapPhase(phase=1, title="Prototype", weeks="1-2", tasks=["API scaffold"])],
            estimated_weeks=6,
            estimated_cost_inr="₹2,50,000",
            team_size=3,
        )

    # Strip any accidental markdown fencing the LLM might add
    if mvp.architecture_diagram:
        cleaned = mvp.architecture_diagram.strip()
        if cleaned.startswith("```"):
            # Remove leading ```mermaid or ```
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
            cleaned = cleaned.rstrip("`").rstrip()
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].rstrip()
        mvp.architecture_diagram = cleaned

    state.mvp = mvp
    state.completed_steps.append("mvp_architecture")
    await log_event(state, AgentLog(agent="MVP Architecture", message="Architecture defined.", status="success"))
    return state
