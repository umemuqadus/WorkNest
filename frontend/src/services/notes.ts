import { api } from '@/lib/api'
import type { Note, NoteEntityType } from '@/types'

export interface NotePayload {
  entity_type: NoteEntityType
  entity_id: number
  title?: string | null
  content: string
}

export const notesApi = {
  async list(entityType: NoteEntityType, entityId: number): Promise<Note[]> {
    const { data } = await api.get<Note[]>(
      `/notes?entity_type=${entityType}&entity_id=${entityId}`,
    )
    return data
  },
  async create(payload: NotePayload): Promise<Note> {
    const { data } = await api.post<Note>('/notes', payload)
    return data
  },
  async update(id: number, payload: { title?: string | null; content?: string }): Promise<Note> {
    const { data } = await api.patch<Note>(`/notes/${id}`, payload)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/notes/${id}`)
  },
}
