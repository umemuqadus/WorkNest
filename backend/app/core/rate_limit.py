"""Minimal in-process sliding-window rate limiter.

This is intentionally dependency free: it documents the rate limiting
architecture and protects the expensive (AI) endpoints. Swap the storage
layer for Redis when running multiple workers.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Callable, Deque, Dict

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import RateLimitError

ScopeKey = str


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: Dict[ScopeKey, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: ScopeKey, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        with self._lock:
            bucket = self._hits[key]
            cutoff = now - window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                raise RateLimitError(
                    "Too many requests. Please slow down and try again shortly.",
                    extra={"retry_after": retry_after},
                )
            bucket.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = SlidingWindowLimiter()


def rate_limit(scope: str, limit: int, window_seconds: int = 60) -> Callable[..., None]:
    """FastAPI dependency factory enforcing ``limit`` calls per window."""

    def dependency(request: Request) -> None:
        if not settings.RATE_LIMIT_ENABLED:
            return None
        identity = "anon"
        authorization = request.headers.get("Authorization", "")
        if authorization:
            identity = authorization[-12:]
        client = request.client.host if request.client else "unknown"
        limiter.check(f"{scope}:{client}:{identity}", limit, window_seconds)

    return dependency


def auth_rate_limit() -> Callable[..., None]:
    return rate_limit("auth", settings.RATE_LIMIT_AUTH_PER_MINUTE)


def ai_rate_limit() -> Callable[..., None]:
    return rate_limit("ai", settings.RATE_LIMIT_AI_PER_MINUTE)
