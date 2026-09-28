from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def find_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower().strip())
        return self.session.scalars(stmt).first()

    def email_exists(self, email: str) -> bool:
        return self.find_by_email(email) is not None
