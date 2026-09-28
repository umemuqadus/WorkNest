"""Google Gemini provider."""

from __future__ import annotations

import httpx

from app.ai.base import AIProvider, AIRequest
from app.core.config import settings
from app.core.exceptions import AIUnavailable

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self, api_key: str, model: str | None = None) -> None:
        self._api_key = api_key
        self._model = model or settings.GEMINI_MODEL

    async def complete(self, request: AIRequest) -> str:
        url = f"{_BASE_URL}/models/{self._model}:generateContent"
        payload = {
            "systemInstruction": {"parts": [{"text": request.system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": request.user_prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }
        try:
            async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    url,
                    params={"key": self._api_key},
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
        except httpx.HTTPError as exc:  # network / timeout
            raise AIUnavailable("The AI provider could not be reached.", code="ai_network_error") from exc

        if response.status_code >= 400:
            raise AIUnavailable(
                "The AI provider rejected the request.",
                code="ai_provider_error",
            )

        data = response.json()
        try:
            parts = data["candidates"][0]["content"]["parts"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIUnavailable("The AI provider returned an empty response.") from exc

        text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
        if not text.strip():
            raise AIUnavailable("The AI provider returned an empty response.")
        return text
