from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.services.search_service import SearchHit, SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    db: DbSession,
    user: CurrentUser,
    q: Annotated[str, Query(min_length=1, max_length=200)],
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
) -> dict[str, list[SearchHit]]:
    return SearchService(db).search(user.id, q, limit=limit)
