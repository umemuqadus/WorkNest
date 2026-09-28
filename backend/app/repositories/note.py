from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import NoteEntityType
from app.models.note import Note
from app.repositories.base import BaseRepository


class NoteRepository(BaseRepository[Note]):
    model = Note

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def for_entity(
        self, user_id: int, entity_type: NoteEntityType, entity_id: int
    ) -> list[Note]:
        stmt = (
            select(Note)
            .where(
                Note.user_id == user_id,
                Note.entity_type == entity_type,
                Note.entity_id == entity_id,
            )
            .order_by(Note.updated_at.desc())
        )
        return list(self.session.scalars(stmt).all())

    def get_owned(self, note_id: int, user_id: int) -> Note | None:
        stmt = select(Note).where(Note.id == note_id, Note.user_id == user_id)
        return self.session.scalars(stmt).first()
