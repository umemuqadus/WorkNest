from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.exceptions import BadRequest
from app.core.security import hash_password, verify_password
from app.schemas.common import HttpUrlStr, ORMModel

_PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).+$")


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return cleaned

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not _PASSWORD_RE.match(value):
            raise ValueError("Password must contain at least one letter and one number.")
        return value

    def password_hash(self) -> str:
        return hash_password(self.password)


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(ORMModel):
    id: int
    name: str
    email: EmailStr
    location: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: HttpUrlStr = None
    github_url: HttpUrlStr = None
    portfolio_url: HttpUrlStr = None
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    location: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    linkedin_url: HttpUrlStr = None
    github_url: HttpUrlStr = None
    portfolio_url: HttpUrlStr = None


class ChangePasswordInput(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not _PASSWORD_RE.match(value):
            raise ValueError("Password must contain at least one letter and one number.")
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


__all__ = [
    "RegisterInput",
    "LoginInput",
    "UserOut",
    "UserUpdate",
    "ChangePasswordInput",
    "TokenResponse",
    "BadRequest",
    "verify_password",
    "ConfigDict",
]
