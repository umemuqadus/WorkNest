from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import NoteEntityType
from app.schemas.common import ORMModel


class NoteCreate(BaseModel):
    entity_type: NoteEntityType
    entity_id: int
    title: Optional[str] = Field(default=None, max_length=255)
    content: str = Field(min_length=1, max_length=20_000)


class NotePatch(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    content: Optional[str] = Field(default=None, min_length=1, max_length=20_000)


class NoteOut(ORMModel):
    id: int
    user_id: int
    entity_type: NoteEntityType
    entity_id: int
    title: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime
