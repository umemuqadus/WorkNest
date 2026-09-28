"""Import every model so Alembic autogenerate can see the full schema."""

from app.models.ai_analysis import (
    ApplicationSuggestion,
    InterviewPreparation,
    JobAnalysis,
    JobMatch,
)
from app.models.application import Application, ApplicationStatusHistory
from app.models.company import Company
from app.models.contact import Contact
from app.models.enums import (
    ApplicationStatus,
    EmploymentType,
    InterviewResult,
    InterviewType,
    JobStatus,
    NoteEntityType,
    Priority,
    RemoteType,
)
from app.models.interview import Interview
from app.models.job import Job
from app.models.note import Note
from app.models.resume import Resume
from app.models.task import Task
from app.models.user import User

__all__ = [
    "User",
    "Company",
    "Contact",
    "Job",
    "Application",
    "ApplicationStatusHistory",
    "Resume",
    "Interview",
    "Task",
    "Note",
    "JobAnalysis",
    "JobMatch",
    "InterviewPreparation",
    "ApplicationSuggestion",
    "ApplicationStatus",
    "EmploymentType",
    "InterviewResult",
    "InterviewType",
    "JobStatus",
    "NoteEntityType",
    "Priority",
    "RemoteType",
]
