"""Authentication and profile management."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import Conflict, Unauthorized
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import ChangePasswordInput, LoginInput, RegisterInput, UserOut, UserUpdate


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.users = UserRepository(session)

    def register(self, payload: RegisterInput) -> tuple[str, UserOut]:
        email = payload.email.lower().strip()
        if self.users.email_exists(email):
            raise Conflict("An account with this email already exists.", field="email")

        user = User(
            name=payload.name,
            email=email,
            password_hash=payload.password_hash(),
        )
        self.users.add(user)
        self.users.commit()
        self.users.refresh(user)

        token = create_access_token(str(user.id))
        return token, UserOut.model_validate(user)

    def login(self, payload: LoginInput) -> tuple[str, UserOut]:
        user = self.users.find_by_email(str(payload.email))
        if user is None or not verify_password(payload.password, user.password_hash):
            # Same message for unknown email / wrong password: no user enumeration.
            raise Unauthorized("Invalid email or password.", code="invalid_credentials")
        token = create_access_token(str(user.id))
        return token, UserOut.model_validate(user)

    def update_profile(self, user: User, payload: UserUpdate) -> UserOut:
        data = payload.model_dump(exclude_unset=True)
        if "email" in data:
            new_email = str(data["email"]).lower().strip()
            existing = self.users.find_by_email(new_email)
            if existing is not None and existing.id != user.id:
                raise Conflict("An account with this email already exists.", field="email")
            data["email"] = new_email

        for key, value in data.items():
            setattr(user, key, value)
        self.session.flush()
        self.session.commit()
        self.session.refresh(user)
        return UserOut.model_validate(user)

    def change_password(self, user: User, payload: ChangePasswordInput) -> None:
        if not verify_password(payload.current_password, user.password_hash):
            raise Unauthorized("Current password is incorrect.", code="invalid_credentials")
        user.password_hash = hash_password(payload.new_password)
        self.session.flush()
        self.session.commit()
