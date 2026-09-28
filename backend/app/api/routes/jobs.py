from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.enums import EmploymentType, JobStatus, Priority, RemoteType
from app.schemas.job import JobCreate, JobFilters, JobOut, JobPatch, JobPriorityPatch, JobStatusPatch
from app.schemas.common import Page
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])

StatusQuery = Annotated[Optional[list[JobStatus]], Query(alias="status")]
PriorityQuery = Annotated[Optional[list[Priority]], Query()]
RemoteQuery = Annotated[Optional[list[RemoteType]], Query()]
EmploymentQuery = Annotated[Optional[list[EmploymentType]], Query()]


@router.get("", response_model=Page[JobOut])
def list_jobs(
    db: DbSession,
    user: CurrentUser,
    q: Annotated[Optional[str], Query(max_length=200)] = None,
    status_filter: StatusQuery = None,
    priority: PriorityQuery = None,
    remote_type: RemoteQuery = None,
    employment_type: EmploymentQuery = None,
    company_id: Annotated[Optional[int], Query(ge=1)] = None,
    date_from: Annotated[Optional[date], Query()] = None,
    date_to: Annotated[Optional[date], Query()] = None,
    sort: Annotated[str, Query(pattern="^(created_at|updated_at|title|status|priority|deadline|date_posted)$")] = "created_at",
    order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[JobOut]:
    filters = JobFilters(
        q=q,
        status=status_filter,
        priority=priority,
        remote_type=remote_type,
        employment_type=employment_type,
        company_id=company_id,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        order=order,
        limit=limit,
        offset=offset,
    )
    return JobService(db).list(user.id, filters)  # type: ignore[return-value]


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(payload: JobCreate, db: DbSession, user: CurrentUser) -> JobOut:
    return JobService(db).create(user.id, payload)


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: DbSession, user: CurrentUser) -> JobOut:
    return JobService(db).get(user.id, job_id)


@router.patch("/{job_id}", response_model=JobOut)
def update_job(job_id: int, payload: JobPatch, db: DbSession, user: CurrentUser) -> JobOut:
    return JobService(db).update(user.id, job_id, payload)


@router.patch("/{job_id}/status", response_model=JobOut)
def update_job_status(
    job_id: int, payload: JobStatusPatch, db: DbSession, user: CurrentUser
) -> JobOut:
    return JobService(db).update_status(user.id, job_id, payload.status)


@router.patch("/{job_id}/priority", response_model=JobOut)
def update_job_priority(
    job_id: int, payload: JobPriorityPatch, db: DbSession, user: CurrentUser
) -> JobOut:
    return JobService(db).update_priority(user.id, job_id, payload.priority)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: DbSession, user: CurrentUser) -> None:
    JobService(db).delete(user.id, job_id)
