from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequest
from app.models.application import Application
from app.models.job import Job
from app.models.task import Task
from app.repositories.task import TaskRepository
from app.schemas.common import build_page
from app.schemas.company import CompanyBrief
from app.schemas.resume import TaskCreate, TaskOut, TaskPatch


class TaskService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = TaskRepository(session)

    def list(
        self,
        user_id: int,
        *,
        completed: bool | None = None,
        overdue: bool = False,
        due_within_days: int | None = None,
        q: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        from datetime import datetime, timedelta, timezone

        today = datetime.now(timezone.utc).date()
        rows, total = self.repo.list(
            user_id,
            completed=completed,
            overdue_before=today if overdue else None,
            due_before=today + timedelta(days=due_within_days) if due_within_days else None,
            q=q,
            limit=limit,
            offset=offset,
        )
        items = [self._to_out(row) for row in rows]
        return build_page(items, total, limit, offset)

    def get(self, user_id: int, task_id: int) -> TaskOut:
        return self._to_out(self.repo.get_for_user(task_id, user_id))

    def create(self, user_id: int, payload: TaskCreate) -> TaskOut:
        data = payload.model_dump()
        self._assert_links(user_id, data.get("job_id"), data.get("application_id"))
        task = Task(user_id=user_id, **data)
        self.repo.add(task)
        self.repo.commit()
        self.repo.refresh(task)
        return self._to_out(task)

    def update(self, user_id: int, task_id: int, payload: TaskPatch) -> TaskOut:
        task = self.repo.get_for_user(task_id, user_id)
        data = payload.model_dump(exclude_unset=True)
        self._assert_links(user_id, data.get("job_id"), data.get("application_id"))
        for key, value in data.items():
            setattr(task, key, value)
        self.repo.commit()
        self.repo.refresh(task)
        return self._to_out(task)

    def delete(self, user_id: int, task_id: int) -> None:
        task = self.repo.get_for_user(task_id, user_id)
        self.repo.delete(task)
        self.repo.commit()

    def _assert_links(
        self, user_id: int, job_id: int | None, application_id: int | None
    ) -> None:
        if job_id is not None:
            job = self.session.get(Job, job_id)
            if job is None or job.user_id != user_id:
                raise BadRequest("Unknown job.", field="job_id")
        if application_id is not None:
            application = self.session.get(Application, application_id)
            if application is None or application.user_id != user_id:
                raise BadRequest("Unknown application.", field="application_id")

    def _to_out(self, task: Task) -> TaskOut:
        out = TaskOut.model_validate(task)
        if task.job is not None:
            out.job_title = task.job.title
            out.company = (
                CompanyBrief.model_validate(task.job.company) if task.job.company else None
            )
        return out
