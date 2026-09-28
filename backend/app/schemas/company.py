from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import HttpUrlStr, ORMModel


class CompanyBase(ORMModel):
    name: str = Field(min_length=1, max_length=200)
    website: HttpUrlStr = None
    industry: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    logo_url: HttpUrlStr = None


class CompanyCreate(CompanyBase):
    pass


class CompanyPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    website: HttpUrlStr = None
    industry: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    logo_url: HttpUrlStr = None


class CompanyOut(CompanyBase):
    id: int
    user_id: int
    job_count: int = 0
    contact_count: int = 0
    created_at: datetime
    updated_at: datetime


class CompanyBrief(ORMModel):
    id: int
    name: str
    logo_url: HttpUrlStr = None
    industry: Optional[str] = None
    location: Optional[str] = None
