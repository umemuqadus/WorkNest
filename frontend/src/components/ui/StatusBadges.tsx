import Badge from './Badge'
import clsx from 'clsx'
import type { ApplicationStatus, JobStatus, Priority } from '@/types'
import {
  APPLICATION_STATUS_CHOICES,
  JOB_STATUS_CHOICES,
  PRIORITY_CHOICES,
  statusChoice,
} from '@/lib/labels'

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const c = statusChoice(status, JOB_STATUS_CHOICES)
  return (
    <Badge tone="slate" className={clsx(c.badge, 'ring-0')}>
      {c.label}
    </Badge>
  )
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const c = statusChoice(status, APPLICATION_STATUS_CHOICES)
  return (
    <Badge tone="slate" className={clsx(c.badge, 'ring-0')}>
      {c.label}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = statusChoice(priority, PRIORITY_CHOICES)
  return (
    <Badge tone="slate" className={clsx(c.badge, 'ring-0')}>
      {c.label}
    </Badge>
  )
}

export function MatchScore({ score }: { score?: number | null }) {
  if (score === null || score === undefined) return <span className="text-slate-400">—</span>
  const tone = score >= 75 ? 'bg-emerald-50 text-emerald-700' : score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
  return <Badge tone="slate" className={clsx(tone, 'ring-0')}>{score}% match</Badge>
}
