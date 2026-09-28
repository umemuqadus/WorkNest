"""Provider-agnostic AI contract.

The rest of the application only ever talks to :class:`AIProvider`, so swapping
Gemini for any OpenAI-compatible endpoint is a one line change in
``AI_PROVIDER``.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AIRequest:
    task: str
    system_prompt: str
    user_prompt: str
    context: dict[str, Any] = field(default_factory=dict)

    def correction(self, invalid_output: str) -> "AIRequest":
        """Build the single retry prompt used when the reply is not valid JSON."""
        return AIRequest(
            task=self.task,
            system_prompt=self.system_prompt,
            user_prompt=(
                "Your previous reply could not be parsed as JSON.\n\n"
                f"Previous reply:\n{invalid_output[:4000]}\n\n"
                "Reply again with ONLY one valid JSON object that matches the required "
                "schema. No markdown fences, no commentary before or after."
            ),
            context=self.context,
        )


class AIProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def complete(self, request: AIRequest) -> str:
        """Return the raw model output for ``request``."""

    async def aclose(self) -> None:  # pragma: no cover - default no-op
        return None
