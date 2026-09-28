from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ApplicationStatus, sa_enum
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.interview import Interview
    from app.models.job import Job
    from app.models.task import Task
    from app.models.user import User


class Application(TimestampMixin, Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, index=True
    )

    applied_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        sa_enum(ApplicationStatus, "application_status"),
        default=ApplicationStatus.SAVED,
        index=True,
    )
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    cover_letter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    referral: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="applications")
    job: Mapped["Job"] = relationship(back_populates="application")
    history: Mapped[list["ApplicationStatusHistory"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ApplicationStatusHistory.id.desc()",
    )
    interviews: Mapped[list["Interview"]] = relationship(
        back_populates="application", cascade="all, delete-orphan", passive_deletes=True
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="application", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Application {self.id} status={self.status}>"


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )
    old_status: Mapped[Optional[ApplicationStatus]] = mapped_column(
        sa_enum(ApplicationStatus, "history_old_status"), nullable=True
    )
    new_status: Mapped[ApplicationStatus] = mapped_column(
        sa_enum(ApplicationStatus, "history_new_status")
    )
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    application: Mapped["Application"] = relationship(back_populates="history")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<StatusHistory {self.old_status} -> {self.new_status}>"
