from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    EmploymentType,
    JobStatus,
    Priority,
    RemoteType,
    sa_enum,
)
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_analysis import JobAnalysis, JobMatch
    from app.models.application import Application
    from app.models.company import Company
    from app.models.task import Task
    from app.models.user import User


class Job(TimestampMixin, Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True
    )

    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    remote_type: Mapped[Optional[RemoteType]] = mapped_column(
        sa_enum(RemoteType, "remote_type"), nullable=True
    )
    employment_type: Mapped[Optional[EmploymentType]] = mapped_column(
        sa_enum(EmploymentType, "employment_type"), nullable=True
    )

    salary_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="USD")

    job_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    status: Mapped[JobStatus] = mapped_column(
        sa_enum(JobStatus, "job_status"), default=JobStatus.SAVED, index=True
    )
    priority: Mapped[Priority] = mapped_column(
        sa_enum(Priority, "priority"), default=Priority.MEDIUM, index=True
    )

    date_posted: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship(back_populates="jobs")
    company: Mapped[Optional["Company"]] = relationship(back_populates="jobs")
    application: Mapped[Optional["Application"]] = relationship(
        back_populates="job", cascade="all, delete-orphan", uselist=False, passive_deletes=True
    )
    analyses: Mapped[list["JobAnalysis"]] = relationship(
        back_populates="job", cascade="all, delete-orphan", passive_deletes=True
    )
    matches: Mapped[list["JobMatch"]] = relationship(
        back_populates="job", cascade="all, delete-orphan", passive_deletes=True
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="job", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Job {self.title}>"
