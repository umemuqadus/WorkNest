import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ErrorState from '@/components/ui/ErrorState'
import Select from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApplicationStatusBadge, JobStatusBadge, PriorityBadge } from '@/components/ui/StatusBadges'
import AiInsights from '@/features/AiInsights'
import JobFormModal from '@/features/JobFormModal'
import NotesPanel from '@/features/NotesPanel'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryClient'
import { JOB_STATUS_CHOICES, PRIORITY_CHOICES } from '@/lib/labels'
import { formatSalary, formatDate, humanize } from '@/lib/utils'
import { applicationsApi } from '@/services/applications'
import { companiesApi } from '@/services/companies'
import { jobsApi } from '@/services/jobs'
import { resumesApi } from '@/services/resumes'

export default function JobDetailPage() {
  const { id } = useParams()
  const jobId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const jobQuery = useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: () => jobsApi.get(jobId),
    enabled: Number.isFinite(jobId),
  })

  const companiesQuery = useQuery({
    queryKey: queryKeys.companies({ all: true }),
    queryFn: () => companiesApi.list({ limit: 100 }),
  })

  const resumesQuery = useQuery({
    queryKey: queryKeys.resumes,
    queryFn: resumesApi.list,
  })

  const job = jobQuery.data

  const updateJob = useMutation({
    mutationFn: (payload: Parameters<typeof jobsApi.update>[1]) => jobsApi.update(jobId, payload),
    onSuccess: () => {
      toast.success('Job updated')
      setEditOpen(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) })
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => jobsApi.updateStatus(jobId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) })
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Status updated')
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const updatePriority = useMutation({
    mutationFn: (priority: string) => jobsApi.updatePriority(jobId, priority),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) })
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const deleteJob = useMutation({
    mutationFn: () => jobsApi.remove(jobId),
    onSuccess: () => {
      toast.success('Job deleted')
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate('/jobs')
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const createApplication = useMutation({
    mutationFn: () => applicationsApi.create({ job_id: jobId, status: 'applied' }),
    onSuccess: () => {
      toast.success('Application created')
      void queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) })
      void queryClient.invalidateQueries({ queryKey: ['applications'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  if (jobQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (jobQuery.isError || !job) {
    return (
      <ErrorState
        message={
          (jobQuery.error as { response?: { status?: number } })?.response?.status === 404
            ? 'This job does not exist or you do not have access to it.'
            : (jobQuery.error as Error)?.message
        }
        onRetry={() => void jobQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <div className="card overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="page-title">{job.title}</h1>
              <JobStatusBadge status={job.status} />
              <PriorityBadge priority={job.priority} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {job.company && (
                <Link
                  to={`/companies/${job.company.id}`}
                  className="pill transition hover:bg-blue-50 hover:text-blue-900"
                >
                  <Building2 className="h-3.5 w-3.5" /> {job.company.name}
                </Link>
              )}
              {job.location && (
                <span className="pill">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </span>
              )}
              {job.deadline && (
                <span className="pill">
                  <CalendarClock className="h-3.5 w-3.5" /> Deadline {formatDate(job.deadline)}
                </span>
              )}
              <span className="pill bg-blue-50 font-semibold text-blue-900">
                {formatSalary(job.salary_min, job.salary_max, job.currency ?? 'USD')}
              </span>
              {job.employment_type && (
                <span className="pill capitalize">{humanize(job.employment_type)}</span>
              )}
              {job.remote_type && <span className="pill capitalize">{humanize(job.remote_type)}</span>}
              {job.source && <span className="pill">via {job.source}</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.job_url && (
              <a href={job.job_url} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-4 w-4" /> Posting
                </Button>
              </a>
            )}
            {!job.application_id && (
              <Button
                size="sm"
                loading={createApplication.isPending}
                onClick={() => createApplication.mutate()}
              >
                Mark as applied
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-slate-100 bg-white/70 p-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={job.status}
            onChange={(e) => updateStatus.mutate(e.target.value)}
            options={JOB_STATUS_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Select
            label="Priority"
            value={job.priority}
            onChange={(e) => updatePriority.mutate(e.target.value)}
            options={PRIORITY_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
          />
        </div>

        {job.application_status && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Application status:
            <ApplicationStatusBadge status={job.application_status} />
            <Link to="/applications" className="ml-auto text-xs font-medium text-blue-900">
              Open pipeline →
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <header className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">Job description</h3>
            </header>
            <div className="px-5 py-4">
              {job.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {job.description}
                </p>
              ) : (
                <p className="text-sm text-slate-500">No description saved for this job.</p>
              )}
            </div>
          </section>

          <section className="card">
            <header className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
                AI copilot
                <span className="pill bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                  beta
                </span>
              </h3>
            </header>
            <div className="px-5 py-4">
              <AiInsights jobId={job.id} resumes={resumesQuery.data ?? []} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <NotesPanel entityType="job" entityId={job.id} />
        </div>
      </div>

      <JobFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        job={job}
        companies={companiesQuery.data?.items ?? []}
        saving={updateJob.isPending}
        error={updateJob.error}
        onSubmit={(payload) => updateJob.mutate(payload)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this job?"
        message="The job, its AI results and linked notes will be permanently removed. Applications linked to it are also deleted."
        loading={deleteJob.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteJob.mutate()}
      />
    </div>
  )
}
