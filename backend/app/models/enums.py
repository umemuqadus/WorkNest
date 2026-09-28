"""Shared enum definitions.

Columns are stored as plain VARCHAR values (``native_enum=False``) so the
schema stays portable and Pydantic remains the single validation authority.
"""

from __future__ import annotations

from enum import Enum

from sqlalchemy import Enum as SAEnum


class RemoteType(str, Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"


class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class JobStatus(str, Enum):
    SAVED = "saved"
    APPLYING = "applying"
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ApplicationStatus(str, Enum):
    SAVED = "saved"
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class InterviewType(str, Enum):
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"


class InterviewResult(str, Enum):
    PENDING = "pending"
    SELECTED = "selected"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class NoteEntityType(str, Enum):
    JOB = "job"
    COMPANY = "company"
    APPLICATION = "application"
    CONTACT = "contact"
    INTERVIEW = "interview"


def sa_enum(enum_cls: type[Enum], name: str) -> SAEnum:
    """Build a portable SQLAlchemy enum column type storing string values."""
    return SAEnum(
        enum_cls,
        name=name,
        native_enum=False,
        values_callable=lambda members: [member.value for member in members],
    )
