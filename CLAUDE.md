# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VentureForge is an AI startup generator that turns raw startup ideas into structured venture briefs through a multi-agent workflow. It combines React/Vite/Tailwind on the frontend with FastAPI/LangGraph/Groq on the backend, using PostgreSQL for persistence and Tavily for market research.

## Frontend Commands

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (http://localhost:3000)
npm run build            # Build for production
npm run lint             # Type-check with TypeScript (tsc --noEmit)
npm run preview          # Preview production build
npm run clean            # Remove dist/ and server.js
```

## Backend Commands

```bash
cd ventureforge-backend
pip install -r requirements.txt    # Install dependencies in venv
docker compose up -d               # Start PostgreSQL and Redis
uvicorn main:app --reload          # Start FastAPI dev server (http://localhost:8000)
```

## Architecture Overview

### Frontend (React 19 + Vite + Tailwind v4)

**Key files & patterns:**
- `src/App.tsx` — Main app entry, route definitions
- `src/router.tsx` — Custom routing hook for screen navigation
- `src/generation.tsx` — GenerationProvider for run state (thread, logs, business plan)
- `src/auth.tsx` — AuthProvider for session-based Google OAuth
- `src/components/` — UI components organized by feature

**Design system:**
- Colors: `#07070C` (bg), `#0D0D14` (panels), `#111118` (cards), `#6C47FF` (purple), `#00D4AA` (cyan)
- Spacing: 4px base scale (w-1, py-2, gap-4, etc.)
- Icons: Lucide React
- Animations: Framer Motion with scroll-triggered fade-ins

**Key pages:**
- `Landing.tsx` — Public landing, sign-in CTA
- `AuthenticatedHome.tsx` — 3-panel layout (Your Ideas / Brainstorm / Community Feed)
- `AgentProgress.tsx` — Live agent logs with compact pipeline timeline
- `HumanReview.tsx` — Review business plan, approve/patch, chat with Research Assistant
- `ResultsDashboard.tsx` — Output cards for market, financials, legal, pitch, MVP, pivots
- `IdeaDetail.tsx` — Community idea view with interested contributors and their messages
- `IdeaFeed.tsx` — Community projects grid with delete buttons for owners

### Backend (FastAPI + LangGraph + Groq + Tavily)

**Core structure:**
- `main.py` — FastAPI app setup, lifespan (init DB & graph on startup)
- `core/config.py` — Environment variables & Pydantic settings
- `core/database.py` — PostgreSQL connection pool & query helpers
- `core/models.py` — User, Idea, Reaction, Comment, Interest, Notification models
- `graph/graph.py` — Compiled LangGraph state machine
- `graph/state.py` — StartupState dataclass (idea, industry, market, business_plan, financials, etc.)
- `graph/nodes/` — Agent implementations (market_research, financial_engineering, business_planning, etc.)
- `api/routes/` — FastAPI routers (auth, generate, review, outputs, projects, assistant)
- `routers/` — Additional routers (community, notifications, users)
- `services/` — Groq/Tavily clients, run manager, email service

**Agent pipeline (12 nodes):**
1. Orchestrator
2. Market Research (Tavily)
3. Market Validator
4. Business Planning
5. **Human Review Pause**
6. Financial Engineering
7. Financial Validator
8. Legal Compliance
9. Pitch Deck
10. MVP Architecture
11. Pivot Simulator
12. Aggregator

**Key endpoints:**
- `POST /api/generate` — Start a run, returns thread_id
- `GET /api/stream/{thread_id}` — SSE stream of agent logs
- `GET /api/review/{thread_id}` — Get paused state for review
- `POST /api/review/approve` — Resume after approval
- `POST /api/review/patch` — Apply patch and resume
- `POST /api/assistant/ask` — Q&A assistant grounded in pipeline context
- `GET /api/ideas` — Community ideas feed
- `POST /api/ideas` — Create idea
- `DELETE /api/ideas/{idea_id}` — Delete idea (owner only)
- `POST /api/ideas/{idea_id}/interest` — Express interest
- `GET /api/auth/oauth/google` — Google OAuth login
- `GET /api/auth/google/login` — Legacy alias for OAuth login
- `POST /api/auth/logout` — Clear session

## Development Workflow

### Frontend Patterns

1. **State management:** React Context (AuthProvider, GenerationProvider, NotificationsProvider)
2. **Routing:** Custom useRouter hook → `router.tsx` maps screen names to paths
3. **API calls:** Fetch with `credentials: 'include'` for session cookies
4. **TypeScript:** ES2022 target, isolated modules, no emit (type-check only)
5. **Styling:** Tailwind v4 with custom color tokens, no tailwind.config needed

### Backend Patterns

1. **Async/await:** All I/O is async (FastAPI, psycopg3, httpx)
2. **Structured output:** Pydantic v2 models for type safety
3. **Error handling:** HTTPException for API errors, try/except for external services (Groq, Tavily)
4. **Sessions:** Starlette SessionMiddleware for Google OAuth → request.session dict
5. **Database:** Raw SQL queries with psycopg, connection pooling via `core.database`
6. **Environment:** python-dotenv loads `.env`, Pydantic settings validates required keys

### Common Tasks

**Add a new frontend page:**
1. Create component in `src/components/`
2. Add screen type to `src/router.tsx` Screen enum
3. Add route mapping in router.tsx
4. Import & mount in `src/App.tsx`

**Add a new backend API route:**
1. Create router in `api/routes/` or `routers/`
2. Define request/response Pydantic models
3. Implement endpoint with proper error handling
4. Register router in `main.py` with `app.include_router()`

**Add a new agent node:**
1. Create node function in `graph/nodes/{name}.py`
2. Define input/output in `graph/state.py` StartupState
3. Add to graph compilation in `graph/graph.py`
4. Wire into the pipeline sequence

## Key Design Decisions

- **Session-based auth:** Google OAuth → session cookie (not JWT), simplifies CSRF handling
- **SSE for live logs:** Agent logs stream to frontend in real-time without polling
- **Human review pause:** Graph halts after business planning for founder input before expensive financial modeling
- **Structured Groq output:** All agent nodes use `with_structured_output()` for type safety
- **PostgreSQL checkpointing:** LangGraph state persisted per thread for long-running pipelines
- **Tailwind v4:** No config file needed, uses inline tokens; colors hard-coded in classes
- **Neo-brutalist design:** Bold borders, flat colors, high contrast; glassmorphism accents

## TypeScript & Linting

- Target: `ES2022`, modules: `ESNext`
- Check types: `npm run lint` (runs `tsc --noEmit`)
- No emit: TypeScript compiles to memory only; Vite handles actual transpilation
- Strict mode: `isolatedModules` and `moduleDetection: "force"` enforced

## Environment Setup

**Frontend (.env.local or VITE_API_URL):**
```
VITE_API_URL=http://localhost:8000
```

**Backend (ventureforge-backend/.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ventureforge
REDIS_URL=redis://localhost:6379/0
GROQ_API_KEY=your_key
TAVILY_API_KEY=your_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
SESSION_SECRET=your_secret
ALLOWED_ORIGINS=http://localhost:3000
APP_ENV=development
```

## Deployment Notes

- **Frontend:** Vercel (Next.js-style env loading via VITE_* prefix)
- **Backend:** Render (build step runs `pip install -r requirements.txt`)
- **Database:** Managed PostgreSQL (DATABASE_URL in production)
- **CORS & sessions:** SameSite=none + Secure flag in production for cross-domain cookies

## Debugging Tips

- **Frontend:** Check Network tab for 404s on `/api/auth/google/login` (use `/api/auth/oauth/google` instead)
- **Backend:** Enable print statements in agent nodes; they appear in SSE stream as "info" logs
- **Database:** Verify `DATABASE_URL` format is `postgresql://...` not `postgresql+psycopg://...`
- **Google OAuth:** Ensure redirect URIs match exactly in Google Cloud Console
- **Agent state:** Use `state.agent_logs` to trace execution; logs persist in PostgreSQL

## Testing

Placeholder test files exist in `ventureforge-backend/tests/`. Run with pytest after installing dev dependencies. Focus integration tests on:
- Auth flow (login → session creation)
- Generate endpoint (thread creation, graph execution)
- SSE stream (log delivery)
- Review endpoints (state retrieval, approval/patch)

## Monorepo Structure

Frontend and backend are in the same repo root but are **independently deployable**:
- Frontend: `npm run build` → Vercel
- Backend: Push to Render → auto-runs `pip install` and starts `uvicorn`

Both connect via `VITE_API_URL` and `FRONTEND_URL` env vars; no hard-coded hostnames.
