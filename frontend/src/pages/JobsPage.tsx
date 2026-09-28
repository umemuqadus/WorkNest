import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MapPin, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { JobStatusBadge, PriorityBadge } from '@/components/ui/StatusBadges'
import JobFormModal from '@/features/JobFormModal'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryClient'
import {
  EMPLOYMENT_CHOICES,
  JOB_STATUS_CHOICES,
  PRIORITY_CHOICES,
  REMOTE_CHOICES,
} from '@/lib/labels'
import { companiesApi } from '@/services/companies'
import { jobsApi, type JobQuery } from '@/services/jobs'
import { formatSalary } from '@/lib/utils'

const PAGE_SIZE = 12

export default function JobsPage() {
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [search, setSearch] = useState(params.get('q') ?? '')
  const debouncedSearch = useDebounce(search, 350)
  const status = params.get('status') ?? ''
  const priority = params.get('priority') ?? ''
  const remote = params.get('remote') ?? ''
  const employment = params.get('employment') ?? ''
  const page = Number(params.get('page') ?? '1')

  const [modalOpen, setModalOpen] = useState(false)

  const query: JobQuery = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status: status ? [status] : undefined,
      priority: priority ? [priority] : undefined,
      remote_type: remote ? [remote] : undefined,
      employment_type: employment ? [employment] : undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      sort: 'created_at',
      order: 'desc',
    }),
    [debouncedSearch, status, priority, remote, employment, page],
  )

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs(query),
    queryFn: () => jobsApi.list(query),
  })

  const companiesQuery = useQuery({
    queryKey: queryKeys.companies({ all: true }),
    queryFn: () => companiesApi.list({ limit: 100 }),
  })

  const createJob = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: (job) => {
      toast.success('Job created')
      setModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const totalPages = jobsQuery.data?.page_meta.pages ?? 1
  const jobs = jobsQuery.data?.items ?? []
  const hasFilters = !!(debouncedSearch || status || priority || remote || employment)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Track every role you are considering.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add job
        </Button>
      </div>

      <div className="card bg-slate-50/60 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            placeholder="Search title, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              const next = new URLSearchParams(params)
              if (e.target.value) next.set('q', e.target.value)
              else next.delete('q')
              next.delete('page')
              setParams(next, { replace: true })
            }}
            aria-label="Search jobs"
          />
          <Select
            value={status}
            onChange={(e) => setParam('status', e.target.value)}
            placeholder="Any status"
            aria-label="Filter by status"
            options={JOB_STATUS_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Select
            value={priority}
            onChange={(e) => setParam('priority', e.target.value)}
            placeholder="Any priority"
            aria-label="Filter by priority"
            options={PRIORITY_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Select
            value={remote}
            onChange={(e) => setParam('remote', e.target.value)}
            placeholder="Any work mode"
            aria-label="Filter by remote type"
            options={REMOTE_CHOICES}
          />
          <Select
            value={employment}
            onChange={(e) => setParam('employment', e.target.value)}
            placeholder="Any type"
            aria-label="Filter by employment type"
            options={EMPLOYMENT_CHOICES}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setParams(new URLSearchParams(), { replace: true })
            }}
            className="mt-3 text-xs font-medium text-blue-900 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {jobsQuery.isLoading && <ListSkeleton count={6} />}

      {jobsQuery.isError && (
        <ErrorState
          message={(jobsQuery.error as Error)?.message}
          onRetry={() => void jobsQuery.refetch()}
        />
      )}

      {jobsQuery.isSuccess && jobs.length === 0 && (
        <EmptyState
          title={hasFilters ? 'No jobs match these filters' : 'No jobs yet'}
          description={
            hasFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Add your first job to start building your pipeline.'
          }
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setParams(new URLSearchParams(), { replace: true })
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> Add job
              </Button>
            )
          }
        />
      )}

      {jobs.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="card card-hover group flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-blue-900">
                      {job.title}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      {job.company?.name ?? 'No company'}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {job.location && (
                    <span className="pill">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                  )}
                  {job.remote_type && <span className="pill capitalize">{job.remote_type}</span>}
                  {job.employment_type && (
                    <span className="pill capitalize">{job.employment_type.replace('_', ' ')}</span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-medium text-slate-700">
                    {formatSalary(job.salary_min, job.salary_max, job.currency ?? 'USD')}
                  </span>
                  <div className="flex items-center gap-2">
                    {job.match_score != null && (
                      <span className="text-xs font-medium text-emerald-600">
                        {job.match_score}% match
                      </span>
                    )}
                    <PriorityBadge priority={job.priority} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="card">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={(p) => setParam('page', String(p))}
            />
          </div>
        </>
      )}

      <JobFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => createJob.mutate(payload)}
        companies={companiesQuery.data?.items ?? []}
        saving={createJob.isPending}
        error={createJob.error}
      />
    </div>
  )
}
