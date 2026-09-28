from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import Priority, sa_enum
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.job import Job
    from app.models.user import User


class Task(TimestampMixin, Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    job_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True
    )
    application_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True
    )

    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    priority: Mapped[Priority] = mapped_column(
        sa_enum(Priority, "task_priority"), default=Priority.MEDIUM
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    user: Mapped["User"] = relationship(back_populates="tasks")
    job: Mapped[Optional["Job"]] = relationship(back_populates="tasks")
    application: Mapped[Optional["Application"]] = relationship(back_populates="tasks")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Task {self.title}>"
