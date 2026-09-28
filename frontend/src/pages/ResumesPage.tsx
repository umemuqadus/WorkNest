import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Star, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/Skeleton'
import Textarea from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import { resumesApi, type ResumePayload } from '@/services/resumes'
import type { Resume, ResumeSummary } from '@/types'

export default function ResumesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<Resume | null>(null)
  const [editing, setEditing] = useState<Resume | null>(null)
  const [deleting, setDeleting] = useState<ResumeSummary | null>(null)
  const [form, setForm] = useState<ResumePayload>({ name: '', content: '', file_url: '' })

  const { data: resumes = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeysFor(),
    queryFn: resumesApi.list,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['resumes'] })

  const saveResume = useMutation({
    mutationFn: (payload: ResumePayload) =>
      editing ? resumesApi.update(editing.id, payload) : resumesApi.create(payload),
    onSuccess: () => {
      toast.success(editing ? 'Resume updated' : 'Resume added')
      setModalOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const setDefault = useMutation({
    mutationFn: (id: number) => resumesApi.setDefault(id),
    onSuccess: () => {
      toast.success('Default resume updated')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const removeResume = useMutation({
    mutationFn: (id: number) => resumesApi.remove(id),
    onSuccess: () => {
      toast.success('Resume deleted')
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', content: '', file_url: '' })
    setModalOpen(true)
  }

  async function openView(id: number) {
    try {
      const full = await resumesApi.get(id)
      setViewing(full)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function openEdit(resume: ResumeSummary) {
    try {
      const full = await resumesApi.get(resume.id)
      setEditing(full)
      setForm({ name: full.name, content: full.content, file_url: full.file_url ?? '' })
      setModalOpen(true)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Resumes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Store resume versions — used by AI matching and interview prep.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add resume
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} lines={4} />
          ))}
        </div>
      )}

      {isError && <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />}

      {!isLoading && !isError && resumes.length === 0 && (
        <EmptyState
          title="No resumes yet"
          description="Add a resume (paste the text) so AI can match it against jobs."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add resume
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resumes.map((resume) => (
          <article key={resume.id} className="card card-hover flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="truncate text-sm font-semibold text-slate-900">{resume.name}</h3>
                  <p className="text-xs text-slate-500">Added {formatDate(resume.created_at)}</p>
                </div>
              </div>
              {resume.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <Star className="h-3 w-3" /> Default
                </span>
              )}
            </div>

            <p className="mt-3 line-clamp-3 min-h-[3.5rem] whitespace-pre-wrap text-xs text-slate-600">
              {resume.preview || 'No preview available.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <Button size="sm" variant="secondary" onClick={() => void openView(resume.id)}>
                View
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openEdit(resume)}>
                Edit
              </Button>
              {!resume.is_default && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={setDefault.isPending}
                  onClick={() => setDefault.mutate(resume.id)}
                >
                  <Star className="h-3.5 w-3.5" /> Make default
                </Button>
              )}
              <button
                type="button"
                aria-label="Delete resume"
                onClick={() => setDeleting(resume)}
                className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit resume' : 'Add resume'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveResume.isPending}
              disabled={!form.name.trim() || form.content.trim().length < 10}
              onClick={() => saveResume.mutate({ ...form, name: form.name.trim() })}
            >
              {editing ? 'Save changes' : 'Create resume'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Name *"
            placeholder="Senior Frontend Resume"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="File URL (optional)"
            placeholder="https://.../resume.pdf"
            value={form.file_url ?? ''}
            onChange={(e) => setForm({ ...form, file_url: e.target.value })}
            hint={
              <span className="inline-flex items-center gap-1">
                <Upload className="h-3 w-3" /> Storage is link-based in this build.
              </span>
            }
          />
          <Textarea
            label="Resume content *"
            rows={12}
            placeholder="Paste your resume text here (used for AI matching)..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            hint={`${form.content.trim().length} characters (min 10)`}
          />
        </div>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? 'Resume'}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {viewing?.content}
        </p>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete resume?"
        message="AI matches that used this resume keep their stored results, but the resume will no longer be selectable."
        loading={removeResume.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeResume.mutate(deleting.id)}
      />
    </div>
  )
}

function queryKeysFor() {
  return ['resumes']
}
