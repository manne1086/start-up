from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_ENV_FILE, extra="ignore")

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5433/ventureforge"
    REDIS_URL: str = "redis://localhost:6379/0"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_REASONING_MODEL: str = ""
    GROQ_FAST_MODEL: str = "openai/gpt-oss-20b"
    GROQ_VALIDATOR_MODEL: str = "openai/gpt-oss-20b"
    TAVILY_API_KEY: str = ""
    # Image generation (Hugging Face Inference API). HF_TOKEN is accepted as an
    # alias so the service also works with the conventional variable name.
    HUGGINGFACE_API_KEY: str = ""
    HF_TOKEN: str = ""
    FLUX_MODEL: str = "black-forest-labs/FLUX.1-schnell"
    UNSPLASH_ACCESS_KEY: str = ""
    PRESENTATIONS_AI_API_KEY: str = ""
    PRESENTATIONS_AI_BASE_URL: str = "https://api.presenton.ai"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"
    SESSION_SECRET: str = "change-me-in-production"
    ALLOWED_ORIGINS: str = "*"
    APP_ENV: str = "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
# Force uvicorn reload
