from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import InterviewResult, InterviewType
from app.schemas.common import HttpUrlStr, ORMModel


class InterviewCreate(BaseModel):
    application_id: int
    type: InterviewType = InterviewType.VIDEO
    scheduled_at: datetime
    duration: Optional[int] = Field(default=None, ge=5, le=600)
    interviewer: Optional[str] = Field(default=None, max_length=150)
    meeting_url: HttpUrlStr = None
    location: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    result: InterviewResult = InterviewResult.PENDING


class InterviewPatch(BaseModel):
    type: Optional[InterviewType] = None
    scheduled_at: Optional[datetime] = None
    duration: Optional[int] = Field(default=None, ge=5, le=600)
    interviewer: Optional[str] = Field(default=None, max_length=150)
    meeting_url: HttpUrlStr = None
    location: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    result: Optional[InterviewResult] = None


class InterviewOut(ORMModel):
    id: int
    application_id: int
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    type: InterviewType
    scheduled_at: datetime
    duration: Optional[int] = None
    interviewer: Optional[str] = None
    meeting_url: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    result: InterviewResult
    created_at: datetime
    updated_at: datetime
