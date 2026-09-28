"""Repository layer: every SQL statement lives here."""

from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFound

ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, entity_id: int) -> Optional[ModelT]:
        return self.session.get(self.model, entity_id)

    def get_or_404(self, entity_id: int) -> ModelT:
        entity = self.get(entity_id)
        if entity is None:
            raise NotFound(f"{self.model.__name__.lower()} not found.")
        return entity

    def get_for_user(self, entity_id: int, user_id: int) -> ModelT:
        """Fetch a row that owns a ``user_id`` column, or raise 404."""
        entity = self.session.get(self.model, entity_id)
        if entity is None or getattr(entity, "user_id", None) != user_id:
            # Deliberately 404 (not 403) so we never leak other users' data.
            raise NotFound(f"{self.model.__name__.lower()} not found.")
        return entity

    def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        self.session.flush()
        return entity

    def delete(self, entity: ModelT) -> None:
        self.session.delete(entity)
        self.session.flush()

    def commit(self) -> None:
        self.session.commit()

    def refresh(self, entity: ModelT) -> ModelT:
        self.session.refresh(entity)
        return entity

    def all_for_user(self, user_id: int) -> list[ModelT]:
        stmt = select(self.model).where(self.model.user_id == user_id)  # type: ignore[attr-defined]
        return list(self.session.scalars(stmt).all())

    @staticmethod
    def _apply_in(column: Any, values: Optional[list[Any]], stmt: Any) -> Any:
        if values:
            return stmt.where(column.in_(values))
        return stmt
