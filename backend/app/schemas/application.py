from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import ApplicationStatus, JobStatus, Priority
from app.schemas.common import ORMModel
from app.schemas.company import CompanyBrief


class JobBrief(ORMModel):
    id: int
    title: str
    location: Optional[str] = None
    status: JobStatus = JobStatus.SAVED
    priority: Priority = Priority.MEDIUM
    job_url: Optional[str] = None
    company: Optional[CompanyBrief] = None


class StatusHistoryOut(ORMModel):
    id: int
    old_status: Optional[ApplicationStatus] = None
    new_status: ApplicationStatus
    changed_at: datetime


class ApplicationCreate(BaseModel):
    job_id: int
    status: ApplicationStatus = ApplicationStatus.SAVED
    source: Optional[str] = Field(default=None, max_length=100)
    cover_letter: Optional[str] = None
    referral: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None


class ApplicationPatch(BaseModel):
    status: Optional[ApplicationStatus] = None
    source: Optional[str] = Field(default=None, max_length=100)
    cover_letter: Optional[str] = None
    referral: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None


class ApplicationOut(ORMModel):
    id: int
    user_id: int
    job_id: int
    job: Optional[JobBrief] = None
    applied_at: Optional[datetime] = None
    status: ApplicationStatus
    source: Optional[str] = None
    cover_letter: Optional[str] = None
    referral: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ApplicationDetailOut(ApplicationOut):
    history: list[StatusHistoryOut] = []
    interviews: list["InterviewOut"] = []  # populated lazily by service


from app.schemas.interview import InterviewOut  # noqa: E402

ApplicationDetailOut.model_rebuild()
