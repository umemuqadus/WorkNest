from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.job import Job
    from app.models.note import Note
    from app.models.resume import Resume
    from app.models.task import Task


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    companies: Mapped[list["Company"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    jobs: Mapped[list["Job"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    contacts: Mapped[list["Contact"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    applications: Mapped[list["Application"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    resumes: Mapped[list["Resume"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<User {self.email}>"
