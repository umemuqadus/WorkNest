from typing import Annotated, Optional

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.resume import TaskCreate, TaskOut, TaskPatch
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=Page[TaskOut])
def list_tasks(
    db: DbSession,
    user: CurrentUser,
    completed: Annotated[Optional[bool], Query()] = None,
    overdue: Annotated[bool, Query()] = False,
    due_within_days: Annotated[Optional[int], Query(ge=0, le=365)] = None,
    q: Annotated[Optional[str], Query(max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[TaskOut]:
    return TaskService(db).list(  # type: ignore[return-value]
        user.id,
        completed=completed,
        overdue=overdue,
        due_within_days=due_within_days,
        q=q,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: DbSession, user: CurrentUser) -> TaskOut:
    return TaskService(db).create(user.id, payload)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskPatch, db: DbSession, user: CurrentUser) -> TaskOut:
    return TaskService(db).update(user.id, task_id, payload)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: DbSession, user: CurrentUser) -> None:
    TaskService(db).delete(user.id, task_id)
