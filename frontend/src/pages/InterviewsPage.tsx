import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Clock, MapPin, Video } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeleton'
import Textarea from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { INTERVIEW_RESULT_CHOICES, INTERVIEW_TYPE_CHOICES } from '@/lib/labels'
import { formatDateTime, humanize } from '@/lib/utils'
import { applicationsApi } from '@/services/applications'
import { interviewsApi, type InterviewPayload } from '@/services/interviews'
import type { Interview } from '@/types'

function resultTone(result: string) {
  return (
    {
      pending: 'bg-sky-50 text-sky-700',
      selected: 'bg-emerald-50 text-emerald-700',
      rejected: 'bg-red-50 text-red-700',
      cancelled: 'bg-slate-100 text-slate-600',
    }[result] ?? 'bg-slate-100 text-slate-600'
  )
}

export default function InterviewsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Interview | null>(null)
  const [deleting, setDeleting] = useState<Interview | null>(null)
  const [upcomingOnly, setUpcomingOnly] = useState(false)

  const [form, setForm] = useState<InterviewPayload>({
    application_id: 0,
    type: 'video',
    scheduled_at: '',
    duration: 45,
    interviewer: '',
    meeting_url: '',
    location: '',
    notes: '',
    result: 'pending',
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeysFor(upcomingOnly),
    queryFn: () => interviewsApi.list({ upcoming: upcomingOnly, limit: 100 }),
  })

  const applicationsQuery = useQuery({
    queryKey: queryKeysApps(),
    queryFn: () => applicationsApi.list({ limit: 100 }),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['interviews'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveInterview = useMutation({
    mutationFn: (payload: InterviewPayload) =>
      editing ? interviewsApi.update(editing.id, payload) : interviewsApi.create(payload),
    onSuccess: () => {
      toast.success(editing ? 'Interview updated' : 'Interview scheduled')
      setModalOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const removeInterview = useMutation({
    mutationFn: (id: number) => interviewsApi.remove(id),
    onSuccess: () => {
      toast.success('Interview removed')
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  function openCreate() {
    setEditing(null)
    setForm({
      application_id: 0,
      type: 'video',
      scheduled_at: '',
      duration: 45,
      interviewer: '',
      meeting_url: '',
      location: '',
      notes: '',
      result: 'pending',
    })
    setModalOpen(true)
  }

  function openEdit(interview: Interview) {
    setEditing(interview)
    setForm({
      application_id: interview.application_id,
      type: interview.type,
      scheduled_at: interview.scheduled_at.slice(0, 16),
      duration: interview.duration ?? 45,
      interviewer: interview.interviewer ?? '',
      meeting_url: interview.meeting_url ?? '',
      location: interview.location ?? '',
      notes: interview.notes ?? '',
      result: interview.result,
    })
    setModalOpen(true)
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="mt-1 text-sm text-slate-500">Schedule and log your interviews.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => setUpcomingOnly(e.target.checked)}
              className="h-4 w-4 rounded-md border-slate-300 text-blue-800 focus:ring-blue-700/30"
            />
            Upcoming only
          </label>
          <Button onClick={openCreate}>
            <CalendarPlus className="h-4 w-4" /> Schedule
          </Button>
        </div>
      </div>

      {isLoading && <ListSkeleton count={4} />}
      {isError && <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title={upcomingOnly ? 'No upcoming interviews' : 'No interviews scheduled'}
          description="Schedule an interview from an application to see it here."
          action={
            <Button onClick={openCreate}>
              <CalendarPlus className="h-4 w-4" /> Schedule interview
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {items.map((interview) => (
          <article key={interview.id} className="card card-hover p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {interview.job_title ?? 'Interview'}
                  </h3>
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {humanize(interview.type)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${resultTone(interview.result)}`}
                  >
                    {humanize(interview.result)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>{interview.company_name ?? 'No company'}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {formatDateTime(interview.scheduled_at)}
                    {interview.duration ? ` · ${interview.duration} min` : ''}
                  </span>
                  {interview.interviewer && <span>with {interview.interviewer}</span>}
                  {interview.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {interview.location}
                    </span>
                  )}
                </div>
                {interview.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{interview.notes}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {interview.meeting_url && (
                  <a href={interview.meeting_url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="secondary">
                      <Video className="h-4 w-4" /> Join
                    </Button>
                  </a>
                )}
                <Button size="sm" variant="secondary" onClick={() => openEdit(interview)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting(interview)}>
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit interview' : 'Schedule interview'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveInterview.isPending}
              disabled={!form.application_id || !form.scheduled_at}
              onClick={() =>
                saveInterview.mutate({
                  ...form,
                  scheduled_at: new Date(form.scheduled_at).toISOString(),
                  meeting_url: form.meeting_url || null,
                  interviewer: form.interviewer || null,
                  location: form.location || null,
                  notes: form.notes || null,
                })
              }
            >
              {editing ? 'Save changes' : 'Schedule'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {!editing && (
            <Select
              label="Application *"
              value={form.application_id ? String(form.application_id) : ''}
              onChange={(e) => setForm({ ...form, application_id: Number(e.target.value) })}
              placeholder="Select an application"
              options={(applicationsQuery.data?.items ?? []).map((a) => ({
                value: String(a.id),
                label: `${a.job?.title ?? 'Job'}${a.job?.company ? ` · ${a.job.company.name}` : ''}`,
              }))}
            />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={INTERVIEW_TYPE_CHOICES}
            />
            <Select
              label="Result"
              value={form.result ?? 'pending'}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
              options={INTERVIEW_RESULT_CHOICES}
            />
            <Input
              label="When *"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              max={600}
              value={form.duration ?? ''}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || undefined })}
            />
            <Input
              label="Interviewer"
              value={form.interviewer ?? ''}
              onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
            />
            <Input
              label="Location"
              value={form.location ?? ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <Input
            label="Meeting URL"
            placeholder="https://zoom.us/j/..."
            value={form.meeting_url ?? ''}
            onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete interview?"
        message="The interview record will be permanently removed."
        loading={removeInterview.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeInterview.mutate(deleting.id)}
      />
    </div>
  )
}

function queryKeysFor(upcoming: boolean) {
  return ['interviews', { upcoming }]
}

function queryKeysApps() {
  return ['applications', 'all']
}
