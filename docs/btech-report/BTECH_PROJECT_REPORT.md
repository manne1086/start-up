# B.TECH PROJECT REPORT: VentureForge (manne1086/start-up)

**Project Title:** VentureForge — Multi-Agent Startup Brief Generation Platform  
**Repository:** `manne1086/start-up`  
**Report Scope:** Source-evidence-based documentation from current repository snapshot  
**Evidence Policy:**
- **[Implemented]**: directly verified from repository code/config.
- **[Assumption]**: engineering estimate, not explicitly encoded in repository.
- **[Pending Verification]**: plausible but not execution-verified in this session.

---

## 1. INTRODUCTION

### 1.1 Introduction to Project
VentureForge is a monorepo application that converts a raw startup idea into a structured venture brief through a staged AI pipeline. The frontend is a React 19 + Vite SPA with authenticated and public/community routes, while the backend is a FastAPI service that coordinates generation, review pause/resume, output export, and community interactions. [Implemented] The system includes live Server-Sent Events (SSE) for progress, human-in-the-loop review, and publication of generated ideas to a community board.

### 1.2 Motivation
Early-stage founders often need market framing, business model articulation, initial financial reasoning, legal checklisting, and pitch narrative preparation before external validation. VentureForge addresses this by chaining specialized agents and exposing intermediate state to users at a review checkpoint, reducing manual context switching. [Implemented] This motivation is reflected by the explicit review gate before financial modeling and the assistant endpoint grounded in run state.

### 1.3 Objective of the Project
The verified project objectives are:
1. Run a multi-stage startup-analysis pipeline from a user-provided idea. [Implemented]
2. Provide live observability of agent actions via SSE logs. [Implemented]
3. Pause for human review and resume with approve/patch controls. [Implemented]
4. Persist project/run state in PostgreSQL-backed tables and checkpointer setup. [Implemented]
5. Generate output artifacts (including PPTX export path and slide utilities). [Implemented]
6. Support community sharing, commenting, reactions, forks, and interest tracking. [Implemented]

### 1.4 Existing System
General single-agent LLM tools usually produce one-pass outputs without structured multi-stage validation and explicit user checkpointing. [General observation] Research on LLM multi-agent systems reports coordination gains but also reliability/validation challenges [4], [5], [6]. [Implemented comparison basis: this repository includes separate validator nodes and retry logic.] 

### 1.5 Proposed System
The proposed and implemented system uses:
- React SPA for user interaction and route-level feature modules.
- FastAPI API layer with session-based Google OAuth.
- AI pipeline state model (`StartupState`) and node-by-node execution.
- Hybrid orchestration: LangGraph graph compilation exists, while active runtime pause/resume is explicitly handled in `services/run_manager.py`.
- PostgreSQL tables for projects, run states, and community entities.

**Documentation drift note:** README/CLAUDE mention older terminology such as “aggregator” and 12-node wording. Current verified code ends with `briefing` and uses `run_manager` for pause/resume flow. [Implemented]

---

## 2. REQUIREMENT ENGINEERING

### 2.1 Hardware Requirements
**Table 2.1: Hardware Requirements**

| Environment | Minimum | Recommended | Evidence Type |
|---|---|---|---|
| Developer machine | 2-core CPU, 8 GB RAM, 10 GB free disk | 4+ cores, 16 GB RAM, SSD | [Assumption] |
| Backend container host | Able to run Python 3.11 + Docker | 2 vCPU+, 4 GB RAM+ | [Assumption] |
| Database host | PostgreSQL 16 compatible | Managed PostgreSQL with backups | [Implemented/Assumption] (`render.yaml` config + estimate) |
| Network | Stable internet for OAuth/LLM/search APIs | Low-latency broadband | [Assumption] |

### 2.2 Software Requirements
**Table 2.2: Software Requirements (Repository-Derived)**

| Component | Version / Spec (when verifiable) | Purpose |
|---|---|---|
| Node.js | `>=18` (`package.json`) | Frontend build/dev runtime |
| React | `^19.0.1` | SPA UI layer |
| Vite | `^6.2.3` | Frontend bundling/dev server |
| Tailwind CSS | `^4.1.14` | Utility-first styling |
| TypeScript | `~5.8.2` | Frontend type checking (`tsc --noEmit`) |
| Python | `3.11` (`Dockerfile`) | Backend runtime |
| FastAPI | `>=0.115` | API framework |
| LangGraph | `>=0.2.30` | Graph definition/checkpoint integration |
| langchain-groq / groq | `>=0.2.0` / `>=0.9.0` | LLM integration |
| Tavily client | `tavily-python>=0.5.0` | Web research retrieval |
| PostgreSQL | 16 in Render config, pgvector image in compose | Primary persistence |
| Redis | `redis:7-alpine` in compose | Configured auxiliary service |
| Authlib | `>=1.3.1` | Google OAuth client integration |
| Deployment configs | `vercel.json`, `render.yaml` | Target deployment settings |

---

## 3. LITERATURE SURVEY

VentureForge’s architecture aligns with the current shift from single LLM calls to orchestrated multi-agent workflows with explicit control points. LangGraph breakpoints/interrupts and durable execution patterns are directly relevant for user-in-the-loop workflows [1], [2]. FastAPI offers async API composition suitable for SSE-based progress updates [3]. Broader MAS surveys identify strengths (task decomposition, specialization) and risks (coordination overhead, reliability), which are visible design tensions in this codebase [4], [5], [6].

**Table 3.1: Literature Comparison**

| Source | Approach | Key Contributions | Limitations | Relevance to VentureForge |
|---|---|---|---|---|
| LangGraph Breakpoints Docs [1] | Interrupt-based control flow | Formal pause/interrupt semantics | Framework-level guidance, not app-specific policy | Matches human-review pause requirement |
| LangGraph Durable Execution Docs [2] | Checkpoint persistence and resumability | Recovery patterns for long runs | Requires integration discipline | Relevant to checkpointer setup and state persistence |
| FastAPI First Steps [3] | Async API framework baseline | Lightweight route structure and ASGI model | Intro-level, not workflow-specific | Relevant to backend route architecture |
| MAS Survey (arXiv:2402.01680) [4] | Multi-agent LLM taxonomy | Coordination/communication design space | Survey-level, not implementation recipe | Supports specialized-node pipeline rationale |
| MAS Survey (arXiv:2412.17481) [5] | Recent LLM-MAS advances | Expanded application frontiers | Rapidly evolving benchmarks | Context for future enhancements |
| LLM Agents for SE Survey (arXiv:2409.02977) [6] | SE-oriented agent analysis | Reliability and evaluation concerns | Domain focus broader than startups | Informs testing/evaluation gap discussion |

---

## 4. TECHNOLOGY

### 4.1 React + React Router + Context Providers
React is used for the SPA interface with route-driven pages and provider composition (`AuthProvider`, `NotificationsProvider`, `GenerationProvider`) in `src/App.tsx`. It separates auth/session state, run lifecycle state, and notification state. [Implemented]

### 4.2 Vite + TypeScript
Vite handles frontend dev/build; TypeScript lint command performs compile-time checks (`tsc --noEmit`) rather than behavioral testing. [Implemented]

### 4.3 FastAPI + Starlette Middleware
FastAPI exposes route modules for auth, generation, review, outputs, images, assistant, and community features. SessionMiddleware and CORS middleware support cross-origin cookie auth in production/local variants. [Implemented]

### 4.4 LangGraph + Run Manager Orchestration
`graph/graph.py` defines a `StateGraph` with validator-condition edges and `interrupt_before=["financial_engineering"]`. Separately, `services/run_manager.py` executes concrete pause/resume loops and emits SSE events. [Implemented] This duality is important: graph compile-time interruption exists, but run-manager flow is the verified active runtime path in route handlers.

### 4.5 Groq + Tavily Integration
Groq-backed structured output functions (`structured_reasoning`, `structured_code`, `structured_validation`) are used by agent nodes; Tavily powers market research search evidence collection. [Implemented]

### 4.6 PostgreSQL + Raw SQL + pgvector-capable image
The backend initializes schema via raw SQL in `core/database.py`, including run/project tables and community tables with foreign keys, uniqueness constraints, and query indexes. [Implemented]

### 4.7 Output/Media Tooling
PPTX generation is handled via Presenton-compatible API integration and local `python-pptx` fallback path; image endpoints support generation and served files with path validation. [Implemented] Hugging Face/Unsplash keys are optional config paths, not execution-verified here. [Pending Verification]

### 4.8 Deployment Tooling
`vercel.json` configures static Vite output; `render.yaml` configures Docker backend service and managed PostgreSQL 16 target. These are deployment intentions/configs, not proof of successful production deployment. [Implemented + Pending Verification]

---

## 5. DESIGN REQUIREMENT ENGINEERING

System design follows a layered approach:
1. UI interaction and routing layer.
2. API boundary and session handling layer.
3. AI orchestration/runtime state layer.
4. Persistence and community data layer.
5. External service integration layer.

### 5.1 Use-Case Diagram
Figure 5.1 source: `docs/btech-report/diagrams/use-case.mmd`.

### 5.2 Class Diagram
Figure 5.2 source: `docs/btech-report/diagrams/class.mmd`.

### 5.3 Activity Diagram
Figure 5.3 source: `docs/btech-report/diagrams/activity.mmd`.

### 5.4 Sequence Diagram
Figure 5.4 source: `docs/btech-report/diagrams/sequence.mmd`.

### 5.5 Deployment Diagram
Figure 5.5 source: `docs/btech-report/diagrams/deployment.mmd`.

### 5.6 System Architecture
Figure 5.6 source: `docs/btech-report/diagrams/architecture.mmd`.

Architectural highlights:
- Frontend state is event-driven and persisted for recent runs in browser storage. [Implemented]
- Backend exposes SSE stream for fine-grained workflow visibility. [Implemented]
- Generation run can pause at review and resume with optional human patch payload. [Implemented]
- Community module is integrated with session auth and relational constraints. [Implemented]

---

## 6. IMPLEMENTATION

### 6.1 Frontend Implementation
**Entry and composition**
- `src/main.tsx`: app bootstrap + service worker registration. [Implemented]
- `src/App.tsx`: lazy-loaded routes and provider composition. [Implemented]
- `src/router.tsx`: legacy enum-to-path adapter preserving old navigation semantics. [Implemented]

**State modules**
- `src/auth.tsx`: `/api/auth/me` and logout flow using `credentials: 'include'`. [Implemented]
- `src/generation.tsx`: start/stream/review/approve/patch logic, local storage run history, SSE listeners for `status/log/step/review/complete/error`. [Implemented]
- `src/notifications.tsx`: authenticated polling and read/mark-all actions. [Implemented]

### 6.2 Backend Implementation
**Application entry**
- `ventureforge-backend/main.py`: startup lifespan initializes database and checkpointer, mounts routers, sets session middleware flags by environment. [Implemented]

**Core route groups (selected)**
- Auth: `/api/auth/oauth/google`, callback, `/api/auth/me`, `/api/auth/logout`.
- Generation: `/api/generate`, `/api/stream/{thread_id}`.
- Review: `/api/review/{thread_id}`, `/api/review/approve`, `/api/review/patch`.
- Assistant: `/api/assistant/ask`.
- Outputs: `/api/outputs/pptx`, slide image/regeneration endpoints.
- Community: ideas CRUD, forking, comments, reactions, interests.
- Notifications and user profile routes.

### 6.3 Database Implementation
Schema is initialized via SQL statements in `core/database.py`.

**Table 6.1: Primary Tables and Constraints**

| Table | Key Fields | Notes |
|---|---|---|
| `ventureforge_projects` | `thread_id` PK, `payload` JSONB | project metadata/state envelope |
| `ventureforge_run_states` | `thread_id` PK, `state` JSONB, `paused`, `done` | persisted run snapshots |
| `users` | `id` PK, `username` UNIQUE | OAuth identity mapping |
| `ideas` | UUID PK, `owner_id` FK, `forked_from_id` self FK | community ideas |
| `comments` | UUID PK, `idea_id` FK, `parent_comment_id` self FK | threaded comments |
| `reactions` | UUID PK, unique `(idea_id,user_id,type)` | reaction toggle integrity |
| `interests` | UUID PK, unique `(idea_id,user_id)` | one interest per user/idea |
| `notifications` | UUID PK, FK to users and ideas | read/unread notification stream |

Indexed columns include owner visibility filters, parent threads, and notification lookups. [Implemented]

### 6.4 AI/Processing Implementation
`StartupState` includes output artifacts (`market`, `business_plan`, `financials`, `legal`, `pitch_deck`, `mvp`, `pivots`, `briefing`) and control flags (`awaiting_human_review`, retries, revision reasons). [Implemented]

**Verified execution order in current code**
- Initial run (run manager): orchestrator → market_research → validator_market (possible retries through revision logic) → business_planning → pause.
- Resume run: financial_engineering → validator_financial (possible retries) → legal_compliance → pitch_deck → mvp_architecture → pivot_simulator → briefing.

### 6.5 API Implementation
**Table 6.2: Significant Endpoints**

| Method | Route | Purpose | Auth | Req/Resp (high-level) |
|---|---|---|---|---|
| POST | `/api/generate` | Start run | optional session | idea payload -> thread/state |
| GET | `/api/stream/{thread_id}` | SSE progress events | same-origin session context | event stream |
| GET | `/api/review/{thread_id}` | Get paused/current state | session optional | found/state payload |
| POST | `/api/review/approve` | Resume paused run | session-bound usage | thread_id -> updated state |
| POST | `/api/review/patch` | Resume with human patch | session-bound usage | thread_id + patch |
| POST | `/api/assistant/ask` | Grounded Q&A on run | run must exist | thread_id/question/history |
| POST | `/api/outputs/pptx` | Export PPTX | run state required | file response |
| GET | `/api/ideas` | List public ideas | public | ideas + pagination |
| POST | `/api/ideas` | Create idea | required | IdeaCreate -> IdeaResponse |
| POST | `/api/ideas/from-run` | Publish run to community | required | thread_id -> IdeaResponse |
| POST | `/api/ideas/{id}/comment/react/interest` | Social interactions | required | action responses |
| GET/PATCH | `/api/users/{username}`, `/api/users/me` | Public profile / profile edit | mixed | profile schema |

### 6.6 Security Implementation
- Session-based Google OAuth via Authlib and Starlette SessionMiddleware. [Implemented]
- CORS configurable via `ALLOWED_ORIGINS`; production cookie mode uses `SameSite=None` + `https_only=True`. [Implemented]
- SQL uses parameterized placeholders (`%s`) in helper functions. [Implemented]
- Image file route validates traversal attempts (`..`, separators, resolved path prefix). [Implemented]

**Observed security gaps / risks (code-level):**
- Exception handler currently returns raw exception text in 500 response body (information exposure risk). [Implemented observation]
- `/api/generate` accepts `user_id` from payload and defaults to anonymous; ownership linkage is not enforced at route boundary. [Implemented observation]

---

## 7. SOFTWARE TESTING

### 7.1 Unit Testing
Repository test files (`test_graph.py`, `test_agents.py`, `test_api.py`) each contain only `test_placeholder(): assert True`. This indicates scaffolded placeholders, not functional unit coverage. [Implemented]

### 7.2 Integration Testing
No repository evidence of implemented integration test suites for API+DB+external services was found in current test files. [Implemented]

### 7.3 Acceptance Testing
**Table 7.1: Acceptance Scenarios (Specification-Level, Current Status)**

| TC ID | Feature | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| AT-01 | Generate startup run | Backend configured; user on `/home` | Submit idea | thread created, SSE events begin | Not executed in this session | Pending Verification |
| AT-02 | Human review pause | Active run reaches business planning | Open `/review` | state shows awaiting review | Not executed in this session | Pending Verification |
| AT-03 | Resume with approve | Paused run exists | POST approve | downstream agents complete | Not executed in this session | Pending Verification |
| AT-04 | Publish idea from run | Authenticated user, run state available | Publish to community | idea row with optional AI summary | Not executed in this session | Pending Verification |
| AT-05 | Notification read flow | Authenticated user with notifications | list/read/mark all | unread count updates | Not executed in this session | Pending Verification |

### 7.4 Testing on Our System
- **Verified repository-level evidence:** placeholder backend tests exist and would trivially pass if executed.
- **No verified execution logs** of pytest, frontend UI tests, load/performance tests, or deployment smoke tests are available in this task context.
- **Frontend testing note:** `npm run lint` is TypeScript checking only; no configured frontend unit test framework is present.

---

## 8. RESULTS

### 8.1 Implemented Outputs and Behaviors
1. End-to-end run state model with pause/resume control. [Implemented]
2. SSE-based live progress stream and log/event types. [Implemented]
3. AI output artifact structure up to executive briefing. [Implemented]
4. Community board with ownership, reactions, comments, interests, forks, notifications, and user profiles. [Implemented]
5. Configured deployment descriptors for static frontend and Dockerized backend. [Implemented]

### 8.2 Verified vs Unverified Result Artifacts
**Table 8.1: Result Evidence Classification**

| Artifact | Status |
|---|---|
| Source code for major modules | Verified from repository |
| Diagram source files in this report | Added in this change |
| Runtime screenshots | Not available in repository evidence |
| Test execution output | Not available in provided evidence |
| Production deployment success | Not verified (configs only) |

### 8.3 Screenshot Evidence Handling
No repository screenshots were available. Required capture points and insertion plan are provided in `docs/btech-report/SCREENSHOTS.md`.

### 8.4 Known Limitations
- Placeholder tests do not validate pipeline correctness.
- Runtime run-state continuity partly depends on in-memory map and DB fallback semantics.
- External API behavior depends on secrets/config not validated here.

---

## 9. CONCLUSION AND FUTURE ENHANCEMENTS

### 9.1 Conclusion
VentureForge implements a practically meaningful multi-agent startup-analysis workflow with explicit human review controls, community publication, and output export capabilities. The codebase demonstrates clear modularization across frontend state providers, FastAPI route groups, raw-SQL persistence, and AI-node orchestration. The most important evaluation caveat is testing maturity: current tests are placeholders and execution evidence is pending. Therefore, the project is functionally rich in implementation scope but requires stronger verification depth for production-readiness.

### 9.2 Future Enhancements
1. Replace placeholder tests with real unit/integration suites for pipeline nodes, route auth boundaries, and SQL behaviors.
2. Add deterministic replay/evaluation fixtures for agent outputs and validator retry branches.
3. Strengthen auth/authorization checks for generation ownership consistency.
4. Improve operational observability (structured logging, metrics, failure taxonomy, CI evidence capture).
5. Add migration tooling for schema evolution instead of startup-time DDL only.
6. Introduce frontend automated tests (component + route integration) to complement TypeScript checks.

---

## 10. BIBLIOGRAPHY

[1] LangChain, “LangGraph Concepts: Breakpoints/Interrupts,” 2025. [Online]. Available: https://langchain-ai.github.io/langgraph/concepts/breakpoints/  
[2] LangChain, “LangGraph Concepts: Durable Execution,” 2025. [Online]. Available: https://langchain-ai.github.io/langgraph/concepts/durable_execution/  
[3] FastAPI, “First Steps,” [Online]. Available: https://fastapi.tiangolo.com/tutorial/first-steps/  
[4] X. Wang *et al*., “Large Language Model based Multi-Agents: A Survey of Progress and Challenges,” arXiv:2402.01680, 2024. [Online]. Available: https://arxiv.org/abs/2402.01680  
[5] H. Guo *et al*., “A Survey on LLM-based Multi-Agent System: Recent Advances and New Frontiers in Application,” arXiv:2412.17481, 2024. [Online]. Available: https://arxiv.org/abs/2412.17481  
[6] Y. Zhang *et al*., “Large Language Model-Based Agents for Software Engineering: A Survey,” arXiv:2409.02977, 2024. [Online]. Available: https://arxiv.org/abs/2409.02977

---

## Appendix A: Repository Evidence Map (Claim-to-Source)

| Claim | Source Evidence |
|---|---|
| Frontend entrypoint and App provider composition | `src/main.tsx:1-16`, `src/App.tsx:114-128` |
| Routes include landing/home/progress/review/results/community/profile | `src/App.tsx:88-109` |
| Auth fetch/logout and session model | `src/auth.tsx:34-59`, `src/auth.tsx:61-68` |
| Generation SSE event handling and review/complete transitions | `src/generation.tsx:266-336`, `src/generation.tsx:386-426` |
| Backend startup initializes DB/checkpointer and routers | `ventureforge-backend/main.py:30-39`, `:56-65` |
| Session middleware production/local differences | `ventureforge-backend/main.py:48-54` |
| Graph nodes and interrupt_before config | `ventureforge-backend/graph/graph.py:33-63`, `:68-71` |
| Active pause/resume orchestration in run manager | `ventureforge-backend/services/run_manager.py:108-135`, `:137-168`, `:170-195` |
| StartupState output model fields | `ventureforge-backend/graph/state.py:193-217` |
| Database schema tables/constraints/indexes | `ventureforge-backend/core/database.py:31-55`, `:68-187` |
| Community endpoints and ownership checks | `ventureforge-backend/routers/community.py:254-344`, `:346-520`, `:602-818` |
| Notifications endpoints | `ventureforge-backend/routers/notifications.py:10-84` |
| User profile endpoints | `ventureforge-backend/routers/users.py:93-135` |
| Placeholder tests only | `ventureforge-backend/tests/test_graph.py:1-2`, `test_agents.py:1-2`, `test_api.py:1-2` |
| Deployment config targets | `vercel.json:1-8`, `render.yaml:1-43`, `ventureforge-backend/Dockerfile:1-9` |
| README pipeline mentions “aggregator” | `README.md:228-242` |

