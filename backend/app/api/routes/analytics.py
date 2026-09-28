from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.analytics import (
    AnalyticsOverviewOut,
    BreakdownItem,
    DashboardOut,
    SeriesPoint,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: DbSession, user: CurrentUser) -> DashboardOut:
    return AnalyticsService(db).dashboard(user.id)


@router.get("/overview", response_model=AnalyticsOverviewOut)
def overview(db: DbSession, user: CurrentUser) -> AnalyticsOverviewOut:
    return AnalyticsService(db).overview(user.id)


@router.get("/applications", response_model=list[SeriesPoint])
def applications(
    db: DbSession,
    user: CurrentUser,
    days: Annotated[int, Query(ge=1, le=365)] = 30,
) -> list[SeriesPoint]:
    return AnalyticsService(db).applications_series(user.id, days=days)


@router.get("/status", response_model=list[BreakdownItem])
def by_status(db: DbSession, user: CurrentUser) -> list[BreakdownItem]:
    return AnalyticsService(db).status_breakdown(user.id)


@router.get("/sources", response_model=list[BreakdownItem])
def by_sources(db: DbSession, user: CurrentUser) -> list[BreakdownItem]:
    return AnalyticsService(db).source_breakdown(user.id)
