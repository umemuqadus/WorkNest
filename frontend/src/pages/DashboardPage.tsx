import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ClipboardList, Hourglass, Inbox, TrendingUp, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { CardSkeleton, ListSkeleton } from '@/components/ui/Skeleton'
import { ApplicationStatusBadge, JobStatusBadge, PriorityBadge } from '@/components/ui/StatusBadges'
import { queryKeys } from '@/lib/queryClient'
import { formatDate, formatRelative, humanize } from '@/lib/utils'
import { analyticsApi } from '@/services/analytics'
import { tasksApi } from '@/services/tasks'

function Stat({
  label,
  value,
  icon: Icon,
  tone = 'teal',
}: {
  label: string
  value: string | number
  icon: typeof Inbox
  tone?: 'teal' | 'emerald' | 'violet' | 'amber' | 'red' | 'sky'
}) {
  const tones = {
    teal: 'from-blue-700 to-blue-800',
    emerald: 'from-emerald-400 to-emerald-500',
    violet: 'from-violet-500 to-indigo-500',
    amber: 'from-amber-400 to-amber-500',
    red: 'from-red-400 to-red-500',
    sky: 'from-sky-600 to-sky-500',
  }
  return (
    <Card className="card-hover relative overflow-hidden p-5">
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${tones[tone]} opacity-[0.12] blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`rounded-xl bg-gradient-to-b p-2.5 text-white shadow-[0_6px_14px_-8px_rgba(15,23,42,0.6)] ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: analyticsApi.dashboard,
  })

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks({ dashboard: true }),
    queryFn: () => tasksApi.list({ completed: false, limit: 6 }),
  })

  const toggleTask = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      tasksApi.update(id, { completed }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
  }

  const { stats } = data
  const tasks = tasksQuery.data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your job search at a glance — updated {formatRelative(new Date().toISOString())}.
          </p>
        </div>
        <Link
          to="/jobs"
          className="text-sm font-medium text-blue-900 hover:text-blue-800"
        >
          View all jobs →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total jobs" value={stats.total_jobs} icon={Inbox} tone="teal" />
        <Stat label="Applications" value={stats.total_applications} icon={ClipboardList} tone="sky" />
        <Stat label="Interviews" value={stats.interviews} icon={Hourglass} tone="violet" />
        <Stat label="Offers" value={stats.offers} icon={Trophy} tone="emerald" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Response rate" value={`${Math.round(stats.response_rate)}%`} icon={TrendingUp} tone="amber" />
        <Stat label="Interview rate" value={`${Math.round(stats.interview_rate)}%`} icon={CalendarDays} tone="violet" />
        <Stat label="Offer rate" value={`${Math.round(stats.offer_rate)}%`} icon={Trophy} tone="emerald" />
        <Stat
          label="Overdue tasks"
          value={stats.overdue_tasks}
          icon={ClipboardList}
          tone={stats.overdue_tasks > 0 ? 'red' : 'sky'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent applications" subtitle="Latest moves in your pipeline" />
          <CardBody className="space-y-3">
            {data.recent_applications.length === 0 && (
              <EmptyState
                title="No applications yet"
                description="Create a job and mark it applied to see activity here."
              />
            )}
            {data.recent_applications.map((app) => (
              <Link
                key={app.id}
                to="/applications"
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{app.job_title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {app.company_name ?? 'No company'} · {formatDate(app.applied_at ?? app.created_at)}
                  </p>
                </div>
                <ApplicationStatusBadge status={app.status} />
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Upcoming interviews" />
          <CardBody className="space-y-3">
            {data.upcoming_interviews.length === 0 && (
              <p className="text-sm text-slate-500">Nothing scheduled. 🎉</p>
            )}
            {data.upcoming_interviews.map((iv) => (
              <Link
                key={iv.id}
                to="/interviews"
                className="block rounded-xl border border-slate-100 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/40"
              >
                <p className="truncate text-sm font-medium text-slate-800">{iv.job_title}</p>
                <p className="text-xs text-slate-500">
                  {humanize(iv.type)} · {formatDate(iv.scheduled_at, 'MMM d, h:mm a')}
                </p>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Follow-up tasks" action={<Link to="/tasks" className="text-xs font-medium text-blue-900">All tasks</Link>} />
          <CardBody className="space-y-2">
            {tasks.length === 0 && <p className="text-sm text-slate-500">No open tasks.</p>}
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-blue-800 focus:ring-blue-700/30"
                  checked={task.completed}
                  onChange={(e) => toggleTask.mutate({ id: task.id, completed: e.target.checked })}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-700">{task.title}</span>
                  <span className="text-xs text-slate-500">
                    {task.due_date ? `Due ${formatDate(task.due_date)}` : 'No due date'}
                  </span>
                </span>
                <PriorityBadge priority={task.priority} />
              </label>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="High priority jobs" />
          <CardBody className="space-y-2">
            {data.high_priority_jobs.length === 0 && (
              <p className="text-sm text-slate-500">Nothing flagged as high priority.</p>
            )}
            {data.high_priority_jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5 transition hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">{job.title}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {job.company_name ?? 'No company'}
                    {job.deadline ? ` · deadline ${formatDate(job.deadline)}` : ''}
                  </span>
                </span>
                <JobStatusBadge status={job.status} />
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Jobs by source" subtitle="Where your leads come from" />
          <CardBody className="space-y-3">
            {data.jobs_by_source.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
            {data.jobs_by_source.map((item) => {
              const max = Math.max(...data.jobs_by_source.map((i) => i.count), 1)
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-800">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-sky-600"
                      style={{ width: `${(item.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
