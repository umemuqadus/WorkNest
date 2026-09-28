from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession
from app.core.rate_limit import auth_rate_limit
from app.schemas.auth import (
    ChangePasswordInput,
    LoginInput,
    RegisterInput,
    TokenResponse,
    UserOut,
    UserUpdate,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(auth_rate_limit())],
)
def register(payload: RegisterInput, db: DbSession) -> TokenResponse:
    token, user = AuthService(db).register(payload)
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(auth_rate_limit())])
def login(payload: LoginInput, db: DbSession) -> TokenResponse:
    token, user = AuthService(db).login(payload)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def me(current_user: CurrentUser) -> UserOut:
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: CurrentUser, db: DbSession) -> UserOut:
    return AuthService(db).update_profile(current_user, payload)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordInput, current_user: CurrentUser, db: DbSession
) -> None:
    AuthService(db).change_password(current_user, payload)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout() -> dict:
    """JWTs are stateless - the client drops the token on logout."""
    return {"detail": "Signed out."}
