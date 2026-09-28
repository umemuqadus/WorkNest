"""Provider selection: real providers when configured, mock otherwise."""

from __future__ import annotations

from app.ai.base import AIProvider
from app.ai.gemini import GeminiProvider
from app.ai.mock import MockProvider
from app.ai.openai_compatible import OpenAICompatibleProvider
from app.core.config import settings


def resolve_provider() -> tuple[AIProvider, bool]:
    """Return ``(provider, using_fallback)``.

    ``using_fallback`` is True when a real provider was requested but no API key
    is configured - callers surface this so the UI can tell the user.
    """
    requested = (settings.AI_PROVIDER or "mock").strip().lower()

    if requested == "gemini":
        if settings.GEMINI_API_KEY:
            return GeminiProvider(settings.GEMINI_API_KEY), False
        return MockProvider(), True

    if requested in {"openai", "openai-compatible"}:
        if settings.OPENAI_API_KEY:
            return OpenAICompatibleProvider(settings.OPENAI_API_KEY), False
        return MockProvider(), True

    if requested in {"auto", "any"}:
        if settings.GEMINI_API_KEY:
            return GeminiProvider(settings.GEMINI_API_KEY), False
        if settings.OPENAI_API_KEY:
            return OpenAICompatibleProvider(settings.OPENAI_API_KEY), False
        return MockProvider(), True

    # explicit mock (or unknown value -> safe default)
    return MockProvider(), False


def provider_status() -> dict:
    provider, fallback = resolve_provider()
    return {
        "provider": provider.name,
        "configured": not fallback,
        "fallback": fallback,
    }
