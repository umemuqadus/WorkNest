"""Defensive JSON extraction for model output."""

from __future__ import annotations

import json
import re
from typing import Any, Optional


def extract_json(text: str) -> Optional[dict[str, Any]]:
    """Best effort extraction of a JSON object from model output."""
    if not text:
        return None

    candidate = text.strip()

    # 1. straight JSON
    parsed = _loads(candidate)
    if parsed is not None:
        return parsed

    # 2. ```json ... ``` fences
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", candidate, re.DOTALL)
    if fence:
        parsed = _loads(fence.group(1))
        if parsed is not None:
            return parsed

    # 3. first {...} block
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end > start:
        parsed = _loads(candidate[start : end + 1])
        if parsed is not None:
            return parsed

    # 4. last resort - repair trailing commas
    repaired = re.sub(r",\s*([}\]])", r"\1", candidate)
    start = repaired.find("{")
    end = repaired.rfind("}")
    if start != -1 and end > start:
        return _loads(repaired[start : end + 1])
    return None


def _loads(value: str) -> Optional[dict[str, Any]]:
    try:
        data = json.loads(value)
    except (json.JSONDecodeError, TypeError, ValueError):
        return None
    return data if isinstance(data, dict) else None
