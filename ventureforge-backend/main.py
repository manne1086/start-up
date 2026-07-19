import asyncio
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

# Psycopg async connections require a selector loop on Windows.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from api.middleware import configure_middleware
from api.routes.auth import router as auth_router
from api.routes.generate import router as generate_router
from api.routes.outputs import router as outputs_router
from api.routes.projects import router as projects_router
from api.routes.review import router as review_router
from routers.community import router as community_router
from routers.users import router as users_router
from core.database import close_database, init_database
from core.config import settings
from graph.checkpointer import init_checkpointer
from graph.graph import get_compiled_graph


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database()
    await init_checkpointer()
    app.state.graph = get_compiled_graph()
    langgraph_status = "active" if app.state.graph is not None else "inactive"
    print(f"[VentureForge] Startup complete. LangGraph is {langgraph_status}.")
    yield
    await close_database()


app = FastAPI(title="VentureForge Backend", version="1.0.0", lifespan=lifespan)
configure_middleware(app)

# Cross-domain deployments (Vercel frontend + Render backend) require
# SameSite=None + Secure for the session cookie to be sent on fetch()
# requests with credentials: 'include'. Locally, frontend/backend share
# the "localhost" site, so Lax + non-secure keeps http:// dev working.
is_production = settings.APP_ENV == "production"
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    same_site="none" if is_production else "lax",
    https_only=is_production,
)

app.include_router(auth_router, prefix="/api")
app.include_router(generate_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(outputs_router, prefix="/api")
app.include_router(community_router, prefix="/api")
app.include_router(users_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/auth/google/callback")
async def legacy_google_callback():
    return RedirectResponse(url="/api/auth/google/callback", status_code=307)
