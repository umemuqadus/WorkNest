from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.enums import NoteEntityType
from app.schemas.note import NoteCreate, NoteOut, NotePatch
from app.services.note_service import NoteService

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
def list_notes(
    db: DbSession,
    user: CurrentUser,
    entity_type: Annotated[NoteEntityType, Query()],
    entity_id: Annotated[int, Query(ge=1)],
) -> list[NoteOut]:
    return NoteService(db).list(user.id, entity_type, entity_id)


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: DbSession, user: CurrentUser) -> NoteOut:
    return NoteService(db).create(user.id, payload)


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NotePatch, db: DbSession, user: CurrentUser) -> NoteOut:
    return NoteService(db).update(user.id, note_id, payload)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: DbSession, user: CurrentUser) -> None:
    NoteService(db).delete(user.id, note_id)
