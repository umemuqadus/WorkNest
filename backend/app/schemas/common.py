"""Shared response envelopes and reusable field types."""

from __future__ import annotations

import math
from typing import Annotated, Any, Generic, Optional, TypeVar
from urllib.parse import urlparse

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

T = TypeVar("T")


def _empty_to_none(value: Any) -> Any:
    if value == "":
        return None
    return value


def _validate_optional_url(value: Any) -> Optional[str]:
    """Validate http(s) URLs while keeping a plain ``str`` (DB + JSON friendly)."""
    if value is None or value == "":
        return None
    if not isinstance(value, str):
        raise ValueError("Invalid URL.")
    candidate = value.strip()
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("URL must start with http:// or https://")
    return candidate


#: Optional http(s) URL field: "" becomes None, anything invalid fails validation.
HttpUrlStr = Annotated[Optional[str], BeforeValidator(_validate_optional_url)]


class PageMeta(BaseModel):
    total: int
    limit: int
    offset: int
    page: int
    pages: int


class Page(BaseModel, Generic[T]):
    items: list[T]
    page_meta: PageMeta


def build_page(items: list[Any], total: int, limit: int, offset: int) -> dict[str, Any]:
    page = math.floor(offset / limit) + 1 if limit else 1
    return {
        "items": items,
        "page_meta": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "page": page,
            "pages": math.ceil(total / limit) if limit else 1,
        },
    }


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Message(BaseModel):
    detail: str
