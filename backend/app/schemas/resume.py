from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import Priority
from app.schemas.common import ORMModel
from app.schemas.company import CompanyBrief


class ResumeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    content: str = Field(min_length=10, max_length=100_000)
    file_url: Optional[str] = Field(default=None, max_length=500)
    is_default: bool = False


class ResumePatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    content: Optional[str] = Field(default=None, min_length=10, max_length=100_000)
    file_url: Optional[str] = Field(default=None, max_length=500)
    is_default: Optional[bool] = None


class ResumeOut(ORMModel):
    id: int
    user_id: int
    name: str
    content: str
    file_url: Optional[str] = None
    is_default: bool
    created_at: datetime
    updated_at: datetime


class ResumeSummary(ORMModel):
    id: int
    name: str
    is_default: bool
    file_url: Optional[str] = None
    preview: str = ""
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Priority = Priority.MEDIUM
    completed: bool = False
    job_id: Optional[int] = None
    application_id: Optional[int] = None


class TaskPatch(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[Priority] = None
    completed: Optional[bool] = None
    job_id: Optional[int] = None
    application_id: Optional[int] = None


class TaskOut(ORMModel):
    id: int
    user_id: int
    job_id: Optional[int] = None
    application_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Priority
    completed: bool
    job_title: Optional[str] = None
    company: Optional[CompanyBrief] = None
    created_at: datetime
    updated_at: datetime
