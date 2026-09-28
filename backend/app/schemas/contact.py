from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import HttpUrlStr, ORMModel
from app.schemas.company import CompanyBrief


class ContactBase(ORMModel):
    name: str = Field(min_length=1, max_length=150)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    job_title: Optional[str] = Field(default=None, max_length=150)
    linkedin_url: HttpUrlStr = None
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    company_id: Optional[int] = None


class ContactPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    job_title: Optional[str] = Field(default=None, max_length=150)
    linkedin_url: HttpUrlStr = None
    notes: Optional[str] = None
    company_id: Optional[int] = None


class ContactOut(ContactBase):
    id: int
    user_id: int
    company_id: Optional[int] = None
    company: Optional[CompanyBrief] = None
    created_at: datetime
    updated_at: datetime
