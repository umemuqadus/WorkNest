from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from pydantic import BaseModel

from app.models.enums import ApplicationStatus, JobStatus, Priority
from app.schemas.common import ORMModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class StatBlock(BaseModel):
    total_jobs: int = 0
    total_applications: int = 0
    interviews: int = 0
    upcoming_interviews: int = 0
    offers: int = 0
    rejected: int = 0
    overdue_tasks: int = 0
    response_rate: float = 0.0
    interview_rate: float = 0.0
    offer_rate: float = 0.0
    avg_applications_per_week: float = 0.0


class SeriesPoint(BaseModel):
    key: str
    count: int


class BreakdownItem(BaseModel):
    key: str
    label: str
    count: int


class RecentApplicationItem(BaseModel):
    id: int
    job_id: int
    status: ApplicationStatus
    applied_at: Optional[datetime] = None
    created_at: datetime
    job_title: str
    company_name: Optional[str] = None


class UpcomingInterviewItem(BaseModel):
    id: int
    application_id: int
    job_title: str
    company_name: Optional[str] = None
    type: str
    scheduled_at: datetime
    duration: Optional[int] = None
    interviewer: Optional[str] = None
    meeting_url: Optional[str] = None


class HighPriorityJobItem(BaseModel):
    id: int
    title: str
    status: JobStatus
    priority: Priority
    company_name: Optional[str] = None
    deadline: Optional[date] = None


class TaskItem(BaseModel):
    id: int
    title: str
    due_date: Optional[date] = None
    priority: Priority
    completed: bool
    overdue: bool = False
    job_title: Optional[str] = None


class DashboardOut(BaseModel):
    stats: StatBlock
    applications_over_time: list[SeriesPoint] = []
    applications_by_status: list[BreakdownItem] = []
    jobs_by_source: list[BreakdownItem] = []
    jobs_by_company: list[BreakdownItem] = []
    interview_conversion: list[BreakdownItem] = []
    activity: list[SeriesPoint] = []
    recent_applications: list[RecentApplicationItem] = []
    upcoming_interviews: list[UpcomingInterviewItem] = []
    follow_up_tasks: list[TaskItem] = []
    high_priority_jobs: list[HighPriorityJobItem] = []


class AnalyticsOverviewOut(BaseModel):
    stats: StatBlock
    applications_per_week: list[SeriesPoint] = []
    applications_per_month: list[SeriesPoint] = []
    status_breakdown: list[BreakdownItem] = []
    source_breakdown: list[BreakdownItem] = []
    location_breakdown: list[BreakdownItem] = []
    job_type_breakdown: list[BreakdownItem] = []
    avg_days_to_interview: Optional[float] = None
    rejection_rate: float = 0.0
    response_rate: float = 0.0
    interview_conversion_rate: float = 0.0
    offer_conversion_rate: float = 0.0
