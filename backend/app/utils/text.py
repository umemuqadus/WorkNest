"""Small text helpers shared by services."""

from __future__ import annotations

from typing import Optional


def humanize(value: Optional[str]) -> str:
    """``full_time`` -> ``Full Time``."""
    if not value:
        return "Unknown"
    return str(value).replace("_", " ").strip().title()


def truncate(text: Optional[str], length: int = 120) -> str:
    if not text:
        return ""
    cleaned = " ".join(str(text).split())
    return cleaned if len(cleaned) <= length else cleaned[: length - 1].rstrip() + "…"
