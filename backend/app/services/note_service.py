"""Notes attached to any user-owned entity."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequest, NotFound
from app.models.application import Application
from app.models.company import Company
from app.models.contact import Contact
from app.models.enums import NoteEntityType
from app.models.interview import Interview
from app.models.job import Job
from app.models.note import Note
from app.repositories.note import NoteRepository
from app.schemas.note import NoteCreate, NoteOut, NotePatch


class NoteService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = NoteRepository(session)

    def list(
        self, user_id: int, entity_type: NoteEntityType, entity_id: int
    ) -> list[NoteOut]:
        self._assert_entity(user_id, entity_type, entity_id)
        return [
            NoteOut.model_validate(note)
            for note in self.repo.for_entity(user_id, entity_type, entity_id)
        ]

    def create(self, user_id: int, payload: NoteCreate) -> NoteOut:
        self._assert_entity(user_id, payload.entity_type, payload.entity_id)
        note = Note(
            user_id=user_id,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            title=payload.title,
            content=payload.content,
        )
        self.repo.add(note)
        self.repo.commit()
        self.repo.refresh(note)
        return NoteOut.model_validate(note)

    def update(self, user_id: int, note_id: int, payload: NotePatch) -> NoteOut:
        note = self._get_owned_or_404(note_id, user_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(note, key, value)
        self.repo.commit()
        self.repo.refresh(note)
        return NoteOut.model_validate(note)

    def delete(self, user_id: int, note_id: int) -> None:
        note = self._get_owned_or_404(note_id, user_id)
        self.repo.delete(note)
        self.repo.commit()

    def _get_owned_or_404(self, note_id: int, user_id: int) -> Note:
        note = self.repo.get_owned(note_id, user_id)
        if note is None:
            raise NotFound("note not found.")
        return note

    def _assert_entity(self, user_id: int, entity_type: NoteEntityType, entity_id: int) -> None:
        model = {
            NoteEntityType.JOB: Job,
            NoteEntityType.COMPANY: Company,
            NoteEntityType.APPLICATION: Application,
            NoteEntityType.CONTACT: Contact,
        }.get(entity_type)

        if entity_type == NoteEntityType.INTERVIEW:
            interview = self.session.get(Interview, entity_id)
            application = interview.application if interview else None
            if interview is None or application is None or application.user_id != user_id:
                raise BadRequest("Unknown entity.", field="entity_id")
            return

        if model is None:
            raise BadRequest("Unsupported note target.", field="entity_type")

        entity = self.session.get(model, entity_id)
        if entity is None or getattr(entity, "user_id", None) != user_id:
            raise BadRequest("Unknown entity.", field="entity_id")
