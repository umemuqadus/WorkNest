"""Polymorphic notes attached to jobs, companies, applications, contacts or interviews."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import NoteEntityType, sa_enum
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Note(TimestampMixin, Base):
    """Polymorphic note attached to a job, company, application, contact or interview.

    The target is stored as ``(entity_type, entity_id)`` so a single note table
    serves every module; :class:`app.services.note_service.NoteService` verifies
    the target belongs to the current user before any write.
    """

    __tablename__ = "notes"
    __table_args__ = (
        Index("ix_notes_entity", "entity_type", "entity_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    entity_type: Mapped[NoteEntityType] = mapped_column(sa_enum(NoteEntityType, "note_entity_type"))
    entity_id: Mapped[int] = mapped_column()

    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="notes")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Note {self.entity_type}:{self.entity_id}>"
