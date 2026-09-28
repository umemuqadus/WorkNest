from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import InterviewResult, InterviewType, sa_enum
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.application import Application


class Interview(TimestampMixin, Base):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )

    type: Mapped[InterviewType] = mapped_column(
        sa_enum(InterviewType, "interview_type"), default=InterviewType.VIDEO
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # minutes
    interviewer: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    meeting_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result: Mapped[InterviewResult] = mapped_column(
        sa_enum(InterviewResult, "interview_result"), default=InterviewResult.PENDING
    )

    application: Mapped["Application"] = relationship(back_populates="interviews")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Interview {self.id} {self.type}>"
