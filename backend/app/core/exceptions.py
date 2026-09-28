"""Consistent, user-safe application errors.

Every error returned to the client has the shape::

    {"detail": "...", "code": "...", "field": null | "name"}
"""

from __future__ import annotations

from typing import Any, Optional


class AppError(Exception):
    """Base class for all errors that are safe to show to the client."""

    status_code: int = 400
    code: str = "bad_request"

    def __init__(
        self,
        detail: str,
        *,
        code: Optional[str] = None,
        field: Optional[str] = None,
        status_code: Optional[int] = None,
        extra: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.field = field
        self.extra = extra or {}
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {"detail": self.detail, "code": self.code, "field": self.field}
        payload.update(self.extra)
        return payload


class BadRequest(AppError):
    status_code = 400
    code = "bad_request"


class Unauthorized(AppError):
    status_code = 401
    code = "unauthorized"


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"


class NotFound(AppError):
    status_code = 404
    code = "not_found"


class Conflict(AppError):
    status_code = 409
    code = "conflict"


class UnprocessableEntity(AppError):
    status_code = 422
    code = "validation_error"


class RateLimitError(AppError):
    status_code = 429
    code = "rate_limited"


class AIUnavailable(AppError):
    """The AI provider is not configured or could not be reached."""

    status_code = 503
    code = "ai_unavailable"


class AIInvalidResponse(AppError):
    """The AI provider returned something we could not validate."""

    status_code = 502
    code = "ai_invalid_response"
