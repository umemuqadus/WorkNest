import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Textarea from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { formatRelative } from '@/lib/utils'
import { notesApi } from '@/services/notes'
import type { Note, NoteEntityType } from '@/types'

export default function NotesPanel({ entityType, entityId }: { entityType: NoteEntityType; entityId: number }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [deleting, setDeleting] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const key = ['notes', entityType, entityId]
  const { data: notes = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => notesApi.list(entityType, entityId),
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['notes'] })

  const saveNote = useMutation({
    mutationFn: async () => {
      if (editing) return notesApi.update(editing.id, { title: title || null, content })
      return notesApi.create({ entity_type: entityType, entity_id: entityId, title: title || null, content })
    },
    onSuccess: () => {
      toast.success(editing ? 'Note updated' : 'Note added')
      setModalOpen(false)
      setEditing(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const removeNote = useMutation({
    mutationFn: (id: number) => notesApi.remove(id),
    onSuccess: () => {
      toast.success('Note deleted')
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  function openCreate() {
    setEditing(null)
    setTitle('')
    setContent('')
    setModalOpen(true)
  }

  function openEdit(note: Note) {
    setEditing(note)
    setTitle(note.title ?? '')
    setContent(note.content)
    setModalOpen(true)
  }

  return (
    <section className="card">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <NotebookPen className="h-4 w-4 text-blue-800" /> Notes
        </h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add note
        </Button>
      </header>

      <div className="space-y-3 px-5 py-4">
        {isLoading && <p className="text-sm text-slate-500">Loading notes…</p>}
        {!isLoading && notes.length === 0 && (
          <p className="text-sm text-slate-500">No notes yet. Jot down follow-ups or context.</p>
        )}
        {notes.map((note) => (
          <article key={note.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {note.title && <h4 className="text-sm font-medium text-slate-800">{note.title}</h4>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{note.content}</p>
                <p className="mt-2 text-xs text-slate-400">Updated {formatRelative(note.updated_at)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Edit note"
                  onClick={() => openEdit(note)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-blue-800"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Delete note"
                  onClick={() => setDeleting(note)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit note' : 'New note'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveNote.isPending}
              disabled={!content.trim()}
              onClick={() => saveNote.mutate()}
            >
              Save note
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Follow up with recruiter"
          />
          <Textarea
            label="Note *"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete note?"
        message="This note will be permanently removed."
        loading={removeNote.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeNote.mutate(deleting.id)}
      />
    </section>
  )
}
