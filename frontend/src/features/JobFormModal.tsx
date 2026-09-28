import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import {
  EMPLOYMENT_CHOICES,
  JOB_SOURCES,
  JOB_STATUS_CHOICES,
  PRIORITY_CHOICES,
  REMOTE_CHOICES,
} from '@/lib/labels'
import type { Company, Job, JobPayload } from '@/types'

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  company_id: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  remote_type: z.string().optional(),
  employment_type: z.string().optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  currency: z.string().optional(),
  job_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  deadline: z.string().optional(),
})

export type JobFormValues = z.infer<typeof jobSchema>

const empty: JobFormValues = {
  title: '',
  company_id: '',
  description: '',
  location: '',
  remote_type: '',
  employment_type: '',
  salary_min: '',
  salary_max: '',
  currency: 'USD',
  job_url: '',
  source: '',
  status: 'saved',
  priority: 'medium',
  deadline: '',
}

function toPayload(values: JobFormValues) {
  const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : null)
  return {
    title: values.title.trim(),
    company_id: values.company_id ? Number(values.company_id) : null,
    description: values.description?.trim() || null,
    location: values.location?.trim() || null,
    remote_type: (values.remote_type || null) as JobPayload['remote_type'],
    employment_type: (values.employment_type || null) as JobPayload['employment_type'],
    salary_min: num(values.salary_min),
    salary_max: num(values.salary_max),
    currency: values.currency || null,
    job_url: values.job_url || null,
    source: values.source || null,
    status: (values.status || 'saved') as Job['status'],
    priority: (values.priority || 'medium') as Job['priority'],
    deadline: values.deadline || null,
  }
}

export function jobToValues(job: Job): JobFormValues {
  return {
    title: job.title,
    company_id: job.company_id ? String(job.company_id) : '',
    description: job.description ?? '',
    location: job.location ?? '',
    remote_type: job.remote_type ?? '',
    employment_type: job.employment_type ?? '',
    salary_min: job.salary_min != null ? String(job.salary_min) : '',
    salary_max: job.salary_max != null ? String(job.salary_max) : '',
    currency: job.currency ?? 'USD',
    job_url: job.job_url ?? '',
    source: job.source ?? '',
    status: job.status,
    priority: job.priority,
    deadline: job.deadline ?? '',
  }
}

export { toPayload }

export default function JobFormModal({
  open,
  onClose,
  onSubmit,
  companies,
  job,
  saving,
  error,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: ReturnType<typeof toPayload>) => void
  companies: Company[]
  job?: Job | null
  saving?: boolean
  error?: unknown
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: empty,
  })

  useEffect(() => {
    if (open) reset(job ? jobToValues(job) : empty)
  }, [open, job, reset])

  useEffect(() => {
    if (!error) return
    const fieldErrors = getFieldErrors(error)
    const entries = Object.entries(fieldErrors)
    if (entries.length) {
      entries.forEach(([field, message]) => {
        if (field in empty) setError(field as keyof JobFormValues, { message })
      })
    }
  }, [error, setError])

  const select = (opts: { value: string; label: string }[]) => opts

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job ? 'Edit job' : 'Add job'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="job-form" type="submit" loading={saving}>
            {job ? 'Save changes' : 'Create job'}
          </Button>
        </>
      }
    >
      <form id="job-form" onSubmit={handleSubmit((v) => onSubmit(toPayload(v)))} className="space-y-4">
        {Boolean(error) && !Object.keys(errors).length && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getErrorMessage(error)}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Job title *" {...register('title')} error={errors.title?.message} />
          </div>
          <Select
            label="Company"
            {...register('company_id')}
            error={errors.company_id?.message}
            placeholder="No company"
            options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <Input label="Location" {...register('location')} error={errors.location?.message} />
          <Select
            label="Remote type"
            {...register('remote_type')}
            options={select(REMOTE_CHOICES)}
            placeholder="Not specified"
          />
          <Select
            label="Employment type"
            {...register('employment_type')}
            options={select(EMPLOYMENT_CHOICES)}
            placeholder="Not specified"
          />
          <Select
            label="Status"
            {...register('status')}
            options={JOB_STATUS_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Select
            label="Priority"
            {...register('priority')}
            options={PRIORITY_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Input
            label="Salary min"
            type="number"
            inputMode="numeric"
            {...register('salary_min')}
            error={errors.salary_min?.message}
          />
          <Input
            label="Salary max"
            type="number"
            inputMode="numeric"
            {...register('salary_max')}
            error={errors.salary_max?.message}
          />
          <Input label="Currency" {...register('currency')} error={errors.currency?.message} />
          <Select
            label="Source"
            {...register('source')}
            options={JOB_SOURCES.map((s) => ({ value: s, label: s }))}
            placeholder="Not specified"
          />
          <Input
            label="Application deadline"
            type="date"
            {...register('deadline')}
            error={errors.deadline?.message}
          />
          <Input
            label="Job URL"
            placeholder="https://..."
            {...register('job_url')}
            error={errors.job_url?.message}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              rows={5}
              placeholder="Paste the job description here..."
              {...register('description')}
              error={errors.description?.message}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
