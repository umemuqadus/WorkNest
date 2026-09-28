import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { ApplicationStatusBadge } from '@/components/ui/StatusBadges'
import { useToast } from '@/hooks/useToast'
import { KANBAN_COLUMNS, APPLICATION_STATUS_CHOICES, statusChoice } from '@/lib/labels'
import { formatDate } from '@/lib/utils'
import { applicationsApi, type ApplicationPayload } from '@/services/applications'
import { jobsApi } from '@/services/jobs'
import type { Application, ApplicationStatus } from '@/types'

function KanbanCard({
  app,
  onMove,
  onDelete,
}: {
  app: Application
  onMove: (status: ApplicationStatus) => void
  onDelete: () => void
}) {
  const idx = KANBAN_COLUMNS.indexOf(app.status)
  return (
    <article className="group rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300/70 hover:shadow-md">
      <Link to={`/jobs/${app.job_id}`} className="block">
        <p className="truncate text-sm font-medium text-slate-800">{app.job?.title ?? 'Job'}</p>
        <p className="truncate text-xs text-slate-500">
          {app.job?.company?.name ?? 'No company'} · {formatDate(app.applied_at ?? app.created_at)}
        </p>
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Move left"
            disabled={idx <= 0}
            onClick={() => onMove(KANBAN_COLUMNS[idx - 1])}
            className="rounded-md border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move right"
            disabled={idx >= KANBAN_COLUMNS.length - 1}
            onClick={() => onMove(KANBAN_COLUMNS[idx + 1])}
            className="rounded-md border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-slate-400 hover:text-red-600"
        >
          Remove
        </button>
      </div>
    </article>
  )
}

export default function ApplicationsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('applied')
  const [source, setSource] = useState('')
  const [deleting, setDeleting] = useState<Application | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeysFor(status),
    queryFn: () => applicationsApi.list({ limit: 100 }),
  })

  const jobsQuery = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => jobsApi.list({ limit: 100 }),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['applications'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const moveStatus = useMutation({
    mutationFn: ({ id, next }: { id: number; next: ApplicationStatus }) =>
      applicationsApi.update(id, { status: next }),
    onSuccess: () => {
      invalidate()
      toast.success('Status updated')
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const createApp = useMutation({
    mutationFn: (payload: ApplicationPayload) => applicationsApi.create(payload),
    onSuccess: () => {
      toast.success('Application created')
      setCreateOpen(false)
      setJobId('')
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const removeApp = useMutation({
    mutationFn: (id: number) => applicationsApi.remove(id),
    onSuccess: () => {
      toast.success('Application removed')
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const items = data?.items ?? []
  const filtered = status ? items.filter((a) => a.status === status) : items
  const visibleColumns: ApplicationStatus[] = status ? [status] : KANBAN_COLUMNS

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your applications — move cards with the arrows as they progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            aria-label="Filter by status"
            options={[
              { value: '', label: 'All statuses' },
              ...APPLICATION_STATUS_CHOICES.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New application
          </Button>
        </div>
      </div>

      {isLoading && <ListSkeleton count={5} />}
      {isError && <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          title="No applications"
          description="Create an application from a job to start tracking it here."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New application
            </Button>
          }
        />
      )}

      {filtered.length > 0 && (
        <div
          className={
            visibleColumns.length === 1
              ? 'grid max-w-xl gap-4'
              : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'
          }
        >
          {visibleColumns.map((col) => {
            const cards = filtered.filter((a) => a.status === col)
            return (
              <section
                key={col}
                className="flex flex-col rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3"
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <ApplicationStatusBadge status={col} />
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                    {cards.length}
                  </span>
                </header>
                <div className="flex flex-col gap-3">
                  {cards.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300/70 px-3 py-6 text-center text-xs text-slate-400">
                      Nothing here yet
                    </p>
                  ) : (
                    cards.map((app) => (
                      <KanbanCard
                        key={app.id}
                        app={app}
                        onMove={(next) => moveStatus.mutate({ id: app.id, next })}
                        onDelete={() => setDeleting(app)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Track an application"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={createApp.isPending}
              disabled={!jobId}
              onClick={() =>
                createApp.mutate({
                  job_id: Number(jobId),
                  status,
                  source: source || null,
                })
              }
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Job *"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Select a job"
            options={(jobsQuery.data?.items ?? []).map((j) => ({
              value: String(j.id),
              label: `${j.title}${j.company ? ` · ${j.company.name}` : ''}`,
            }))}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            options={APPLICATION_STATUS_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Select
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Not specified"
            options={['LinkedIn', 'Referral', 'Company Site', 'Job Board', 'Indeed', 'Other'].map(
              (s) => ({ value: s, label: s }),
            )}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Remove application?"
        message="This also removes its status history and interviews."
        loading={removeApp.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeApp.mutate(deleting.id)}
      />
    </div>
  )
}

function queryKeysFor(status: string) {
  return ['applications', { status }]
}
