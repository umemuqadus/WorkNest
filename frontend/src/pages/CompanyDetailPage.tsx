import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, Globe, MapPin, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ErrorState from '@/components/ui/ErrorState'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { JobStatusBadge } from '@/components/ui/StatusBadges'
import NotesPanel from '@/features/NotesPanel'
import { queryKeys } from '@/lib/queryClient'
import { formatDate, formatSalary } from '@/lib/utils'
import { companiesApi } from '@/services/companies'
import { contactsApi } from '@/services/contacts'
import { jobsApi } from '@/services/jobs'

export default function CompanyDetailPage() {
  const { id } = useParams()
  const companyId = Number(id)

  const companyQuery = useQuery({
    queryKey: queryKeys.company(companyId),
    queryFn: () => companiesApi.get(companyId),
    enabled: Number.isFinite(companyId),
  })

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs({ company_id: companyId }),
    queryFn: () => jobsApi.list({ company_id: companyId, limit: 50 }),
    enabled: Number.isFinite(companyId),
  })

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts({ company_id: companyId }),
    queryFn: () => contactsApi.list({ company_id: companyId, limit: 50 }),
    enabled: Number.isFinite(companyId),
  })

  if (companyQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <ErrorState
        message="This company does not exist or you do not have access to it."
        onRetry={() => void companyQuery.refetch()}
      />
    )
  }

  const company = companyQuery.data
  const jobs = jobsQuery.data?.items ?? []
  const contacts = contactsQuery.data?.items ?? []

  return (
    <div className="space-y-6">
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to companies
      </Link>

      <div className="card flex flex-wrap items-start gap-5 bg-gradient-to-br from-white via-white to-blue-50/70 p-6">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-900 ring-1 ring-blue-100">
          {company.logo_url ? (
            <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{company.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {company.industry && <span className="pill">{company.industry}</span>}
            {company.location && (
              <span className="pill">
                <MapPin className="h-3.5 w-3.5" /> {company.location}
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="pill transition hover:bg-blue-50 hover:text-blue-900"
              >
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            )}
            <span className="pill">
              <Users className="h-3.5 w-3.5" /> {company.contact_count} contacts
            </span>
            <span className="pill">Added {formatDate(company.created_at)}</span>
          </div>
          {company.description && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
              {company.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Jobs at this company" subtitle={`${jobs.length} listed`} />
            <CardBody className="space-y-2">
              {jobs.length === 0 && <p className="text-sm text-slate-500">No jobs recorded yet.</p>}
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-blue-300/70 hover:bg-blue-50/40 hover:shadow-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {job.title}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {[job.location, formatSalary(job.salary_min, job.salary_max, job.currency ?? 'USD')]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <JobStatusBadge status={job.status} />
                </Link>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Contacts" subtitle={`${contacts.length} people`} />
            <CardBody className="space-y-2">
              {contacts.length === 0 && (
                <p className="text-sm text-slate-500">No contacts linked to this company.</p>
              )}
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-blue-300/70 hover:shadow-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {contact.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {[contact.job_title, contact.email].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {contact.linkedin_url && (
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-900"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <NotesPanel entityType="company" entityId={company.id} />
      </div>
    </div>
  )
}
