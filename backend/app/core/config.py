"""Application settings loaded from environment variables / .env files."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    PROJECT_NAME: str = "WorkNest"
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    # --- database -------------------------------------------------------
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/ai_job_tracker"

    # --- auth -----------------------------------------------------------
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- AI provider ----------------------------------------------------
    # "gemini" | "openai" | "mock". When the requested provider has no API
    # key configured the application transparently falls back to "mock".
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    AI_TIMEOUT_SECONDS: float = 45.0

    # --- CORS -----------------------------------------------------------
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = []

    # --- rate limiting --------------------------------------------------
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_AI_PER_MINUTE: int = 12
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20

    @property
    def cors_origins(self) -> List[str]:
        origins = [origin for origin in self.CORS_ORIGINS if origin]
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
