from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings


def configure_middleware(app: FastAPI) -> None:
    # Credentialed browser requests cannot use a wildcard origin. Production
    # requests include the session cookie, so derive the allowed origin from
    # the configured frontend URL unless an explicit allowlist is provided.
    if settings.APP_ENV == "production" and settings.ALLOWED_ORIGINS == "*":
        origins = [settings.FRONTEND_URL.rstrip("/")]
    else:
        origins = [o.strip().rstrip("/") for o in settings.ALLOWED_ORIGINS.split(",")] if settings.ALLOWED_ORIGINS != "*" else ["*"]
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

    @app.exception_handler(Exception)
    async def handler(_: Request, exc: Exception):
        return JSONResponse(status_code=500, content={"detail": str(exc)})

