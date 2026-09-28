from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.models.enums import (
    ApplicationStatus,
    EmploymentType,
    JobStatus,
    Priority,
    RemoteType,
)
from app.schemas.common import HttpUrlStr, ORMModel
from app.schemas.company import CompanyBrief


class JobBase(ORMModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=255)
    remote_type: Optional[RemoteType] = None
    employment_type: Optional[EmploymentType] = None
    salary_min: Optional[int] = Field(default=None, ge=0, le=100_000_000)
    salary_max: Optional[int] = Field(default=None, ge=0, le=100_000_000)
    currency: Optional[str] = Field(default="USD", max_length=10)
    job_url: HttpUrlStr = None
    source: Optional[str] = Field(default=None, max_length=100)
    status: JobStatus = JobStatus.SAVED
    priority: Priority = Priority.MEDIUM
    date_posted: Optional[date] = None
    deadline: Optional[date] = None

    @model_validator(mode="after")
    def salary_range_valid(self) -> "JobBase":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("salary_max must be greater than or equal to salary_min.")
        return self


class JobCreate(JobBase):
    company_id: Optional[int] = None


class JobPatch(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=255)
    remote_type: Optional[RemoteType] = None
    employment_type: Optional[EmploymentType] = None
    salary_min: Optional[int] = Field(default=None, ge=0, le=100_000_000)
    salary_max: Optional[int] = Field(default=None, ge=0, le=100_000_000)
    currency: Optional[str] = Field(default=None, max_length=10)
    job_url: HttpUrlStr = None
    source: Optional[str] = Field(default=None, max_length=100)
    status: Optional[JobStatus] = None
    priority: Optional[Priority] = None
    date_posted: Optional[date] = None
    deadline: Optional[date] = None
    company_id: Optional[int] = None

    @model_validator(mode="after")
    def salary_range_valid(self) -> "JobPatch":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("salary_max must be greater than or equal to salary_min.")
        return self


class JobStatusPatch(BaseModel):
    status: JobStatus


class JobPriorityPatch(BaseModel):
    priority: Priority


class JobOut(JobBase):
    id: int
    user_id: int
    company_id: Optional[int] = None
    company: Optional[CompanyBrief] = None
    created_at: datetime
    updated_at: datetime

    # Denormalised helpers so list views avoid N+1 round trips.
    has_analysis: bool = False
    application_status: Optional[ApplicationStatus] = None
    application_id: Optional[int] = None
    match_score: Optional[int] = None
    matched_resume_id: Optional[int] = None
    upcoming_interview_at: Optional[datetime] = None


class JobFilters(BaseModel):
    """Query string contract for ``GET /api/jobs``."""

    q: Optional[str] = None
    status: Optional[list[JobStatus]] = None
    priority: Optional[list[Priority]] = None
    remote_type: Optional[list[RemoteType]] = None
    employment_type: Optional[list[EmploymentType]] = None
    company_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    sort: str = "created_at"
    order: str = "desc"
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
