# Repository Guidelines

## Project Structure & Module Organization

Monorepo with a React/TypeScript frontend (`src/`) and a Python FastAPI backend (`ventureforge-backend/`).

**Frontend** — Vite + React 19 + Tailwind v4. Components live in `src/components/`. Routing uses react-router-dom with a custom `RouterProvider` adapter in `src/router.tsx` that maps an enum of screen names to URL paths. Auth, notifications, and generation state are managed via React Context providers (`src/auth.tsx`, `src/notifications.tsx`, `src/generation.tsx`), all composed in `src/App.tsx`.

**Backend** — FastAPI with a LangGraph agent pipeline. The core flow is defined in `ventureforge-backend/graph/graph.py` as a `StateGraph` with 10 agent nodes (orchestrator → market_research → validator → business_planning → financial_engineering → validator → legal_compliance → pitch_deck → mvp_architecture → pivot_simulator). Validators can loop agents back for revision. Routes live in `api/routes/` (auth, generate, outputs, projects, review) and `routers/` (community, notifications, users). Database layer uses psycopg3 with raw SQL in `core/database.py`.

## Build, Test, and Development Commands

### Frontend
```bash
npm install              # install dependencies
npm run dev              # Vite dev server on port 3000
npm run build            # production build
npm run lint             # tsc --noEmit (type check only)
```

### Backend
```bash
cd ventureforge-backend
pip install -r requirements.txt
docker compose up -d                          # PostgreSQL (port 5433) + Redis (port 6379)
uvicorn main:app --reload --port 8000         # dev server
```

### Environment
Both frontend and backend require `.env` files. Frontend uses `VITE_API_URL` (defaults to `http://localhost:8000`). Backend requires Google OAuth credentials, Groq API key, Tavily API key, PostgreSQL connection string, and session secret — see `core/config.py` for the full list.

## Coding Style & Naming Conventions

- **TypeScript**: target ES2022, JSX react-jsx, `allowJs: true`. No strict mode. No linter or formatter configured — follow existing patterns.
- **CSS**: Tailwind v4 utility classes. Design tokens: `#0A0A0F` (page bg), `#111118` (card bg), `#6C47FF` (primary purple), `#00D4AA` (accent green), `#F0F0F0` (text), `#888899` (muted). Neo-brutalist accents with `shadow-[4px_4px_0px_#6C47FF]`.
- **Python**: No formatter config. FastAPI routes use `async def`. Database queries use raw SQL via psycopg3.
- **Animations**: `motion` (framer-motion v12) for scroll-triggered animations. CSS keyframes defined in `src/index.css` (`fadeInUp`, `scaleIn`, etc.). Glass utility class: `.glass`.

## Testing Guidelines

No test framework is configured for the frontend. Backend has a `tests/` directory. Run `npm run lint` to type-check the frontend before committing.

## Commit & Pull Request Guidelines

No enforced convention. Recent history uses short imperative descriptions (e.g., "Fix Presenton PPT integration, add pitch deck preview"). Prefer descriptive messages over generic "update" commits.
