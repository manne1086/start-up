# VentureForge

VentureForge is an AI startup generator that turns a raw idea into a structured venture brief through a multi-agent workflow.

The project combines:

- a React + Vite + Tailwind frontend
- a FastAPI backend
- a LangGraph-based agent pipeline
- Groq-powered reasoning and validation
- Tavily-powered market research
- PostgreSQL checkpointing and persistence

## What it does

The app guides a user through a startup-generation flow:

1. Landing page
2. Agent progress with live stream logs
3. Human review checkpoint
4. Results dashboard
5. Deep-dive views for market research, financials, legal, pitch deck, MVP architecture, and pivot simulation

The backend is designed to:

- accept a startup idea
- run a multi-agent LangGraph pipeline
- stream agent logs over SSE
- pause for human approval
- resume after approval or patching
- persist checkpointed state in PostgreSQL
- return structured JSON for each output card in the UI

## Repository Structure

```text
startup/
├── src/                      # Frontend app
├── ventureforge-backend/      # FastAPI + LangGraph backend
├── assets/
├── package.json
├── vite.config.ts
└── README.md
```

### Backend layout

```text
ventureforge-backend/
├── main.py
├── .env.example
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── core/
├── graph/
├── api/
├── services/
└── tests/
```

## Frontend

The frontend lives in `src/` and is already wired around the VentureForge user journey.

### Run the frontend

```bash
npm install
npm run dev
```

The app runs at:

- `http://localhost:3000`

## Backend

The backend is located in `ventureforge-backend/`.

### Key features

- FastAPI app with lifespan startup/shutdown
- LangGraph state machine with checkpointing support
- SSE endpoint for live agent logs
- Human review routes for approval and patching
- PostgreSQL storage for project state
- Groq and Tavily integrations for LLM reasoning and web research

### Run the backend locally

1. Create a virtual environment
2. Install backend dependencies:

```bash
cd ventureforge-backend
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and fill in the keys you need
4. Start PostgreSQL and Redis:

```bash
docker compose up -d
```

5. Start the API from inside `ventureforge-backend/`:

```bash
uvicorn main:app --reload --port 8000
```

The API runs at:

- `http://localhost:8000`

### If LangGraph is missing

If the backend starts but prints that LangGraph is inactive, install the full agent stack inside the same virtual environment:

```bash
pip install langgraph langchain langchain-groq tavily-python psycopg[binary,pool] authlib itsdangerous
```

If you see a PostgreSQL connection string error, make sure `DATABASE_URL` uses `postgresql://...` and not `postgresql+psycopg://...`.

## Environment Variables

Set these in `ventureforge-backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ventureforge
REDIS_URL=redis://localhost:6379/0
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
PRESENTATIONS_AI_API_KEY=your_presentations_ai_key
PRESENTATIONS_AI_BASE_URL=https://api.presentations.ai
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
SESSION_SECRET=change-this-to-a-long-random-string
ALLOWED_ORIGINS=http://localhost:3000
APP_ENV=development
```

### Presentations.ai export

When the Presentations.ai key is set, the pitch deck export route sends a topic-based JSON request to:

- `POST https://api.presentations.ai/api/v1/topic/document`

The backend builds the `topic` from the current startup state and includes:

- `slideCount`
- `language`
- `domain`
- `targetAudience`
- `tone`
- `exportType: pptx`

It also validates the key first with:

- `GET https://api.presentations.ai/api/v1/authenticate`

If Presentations.ai returns a poll URL, the backend keeps polling until the export is ready and then downloads the PPTX.

### Google OAuth

If you enable Google login, add:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
SESSION_SECRET=your_session_secret
```

In Google Cloud Console, use:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:8000/api/auth/google/callback`

### Google OAuth routes

The backend now exposes:

- `GET /api/auth/oauth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/me`
- `POST /api/auth/logout`

`/api/auth/me` returns the current session user after login.

## API Overview

### Generation flow

- `POST /api/generate`
  - starts a startup generation run
  - returns a `thread_id`

- `GET /api/stream/{thread_id}`
  - SSE stream of agent logs and run events

- `GET /api/review/{thread_id}`
  - returns the paused state and business plan for review

- `POST /api/review/approve`
  - resumes the run after approval

- `POST /api/review/patch`
  - applies a patch and resumes the run

### Output endpoints

The backend also exposes result endpoints for dashboard cards:

- market research
- business plan
- financial model
- legal report
- pitch deck
- MVP architecture
- pivot options

## Core Workflow

The generation pipeline is built around this flow:

1. `orchestrator`
2. `market_research`
3. `validator_market`
4. `business_planning`
5. human review pause
6. `financial_engineering`
7. `validator_financial`
8. `legal_compliance`
9. `pitch_deck`
10. `mvp_architecture`
11. `pivot_simulator`
12. `aggregator`

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS

### Backend

- Python 3.11+
- FastAPI
- LangGraph
- Groq via `langchain-groq`
- PostgreSQL
- psycopg3
- Tavily
- python-pptx
- pandas
- numpy-financial
- Pydantic v2

## Development Notes

- The backend uses a structured state model in `graph/state.py`.
- The SSE stream is currently coordinated through an in-memory run manager for local development.
- PostgreSQL checkpointing is initialized on backend startup.
- The graph is designed to pause before financial modeling for human review.

## Testing

Backend placeholder tests are located in:

- `ventureforge-backend/tests/test_graph.py`
- `ventureforge-backend/tests/test_agents.py`
- `ventureforge-backend/tests/test_api.py`

Run them with your preferred test runner after installing dependencies.

## License

No license has been specified yet.
