"""OpenAI-compatible chat completions provider (works with OpenAI, Together, Groq...)."""

from __future__ import annotations

import httpx

from app.ai.base import AIProvider, AIRequest
from app.core.config import settings
from app.core.exceptions import AIUnavailable


class OpenAICompatibleProvider(AIProvider):
    name = "openai"

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        model: str | None = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = (base_url or settings.OPENAI_BASE_URL).rstrip("/")
        self._model = model or settings.OPENAI_MODEL

    async def complete(self, request: AIRequest) -> str:
        payload = {
            "model": self._model,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }
        try:
            async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    f"{self._base_url}/chat/completions",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                )
        except httpx.HTTPError as exc:
            raise AIUnavailable("The AI provider could not be reached.", code="ai_network_error") from exc

        if response.status_code >= 400:
            raise AIUnavailable("The AI provider rejected the request.", code="ai_provider_error")

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIUnavailable("The AI provider returned an empty response.") from exc

        if not content or not str(content).strip():
            raise AIUnavailable("The AI provider returned an empty response.")
        return str(content)
