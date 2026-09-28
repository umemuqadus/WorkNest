"""Shared FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import Unauthorized
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

DbSession = Annotated[Session, Depends(get_db)]


def get_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization:
        raise Unauthorized("Authentication credentials were not provided.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise Unauthorized("Authentication credentials were not provided.")
    return token.strip()


def get_current_user(db: DbSession, token: Annotated[str, Depends(get_token)]) -> User:
    payload = decode_access_token(token)
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise Unauthorized("Invalid authentication token.") from exc

    user = db.get(User, user_id)
    if user is None:
        raise Unauthorized("This account no longer exists.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
