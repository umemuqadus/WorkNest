import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { ListSkeleton } from '@/components/ui/Skeleton'
import Textarea from '@/components/ui/Textarea'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryClient'
import { companiesApi, type CompanyPayload } from '@/services/companies'
import type { Company } from '@/types'

const PAGE_SIZE = 12

function CompanyForm({
  open,
  onClose,
  company,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  company?: Company | null
  onSaved: () => void
}) {
  const toast = useToast()
  const [form, setForm] = useState<CompanyPayload>({
    name: '',
    website: '',
    industry: '',
    location: '',
    description: '',
    logo_url: '',
  })
  const [seeded, setSeeded] = useState<number | null>(null)

  if (open && seeded !== (company?.id ?? null)) {
    setSeeded(company?.id ?? null)
    setForm({
      name: company?.name ?? '',
      website: company?.website ?? '',
      industry: company?.industry ?? '',
      location: company?.location ?? '',
      description: company?.description ?? '',
      logo_url: company?.logo_url ?? '',
    })
  }

  const mutation = useMutation({
    mutationFn: (payload: CompanyPayload) =>
      company ? companiesApi.update(company.id, payload) : companiesApi.create(payload),
    onSuccess: () => {
      toast.success(company ? 'Company updated' : 'Company added')
      onSaved()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  function field(key: keyof CompanyPayload) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={company ? 'Edit company' : 'Add company'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={!form.name.trim()}
            onClick={() => mutation.mutate({ ...form, name: form.name.trim() })}
          >
            {company ? 'Save changes' : 'Create company'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Name *" value={form.name} onChange={field('name')} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Website" placeholder="https://..." value={form.website ?? ''} onChange={field('website')} />
          <Input label="Industry" value={form.industry ?? ''} onChange={field('industry')} />
          <Input label="Location" value={form.location ?? ''} onChange={field('location')} />
          <Input label="Logo URL" placeholder="https://..." value={form.logo_url ?? ''} onChange={field('logo_url')} />
        </div>
        <Textarea label="Description" rows={4} value={form.description ?? ''} onChange={field('description')} />
      </div>
    </Modal>
  )
}

export default function CompaniesPage() {
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 350)
  const page = Number(params.get('page') ?? '1')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState<Company | null>(null)

  const query = { q: debounced || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.companies(query),
    queryFn: () => companiesApi.list(query),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['companies'] })
  }

  const removeCompany = useMutation({
    mutationFn: (id: number) => companiesApi.remove(id),
    onSuccess: () => {
      toast.success('Company deleted')
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="mt-1 text-sm text-slate-500">Organizations you are applying to.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Add company
        </Button>
      </div>

      <Input
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search companies"
      />

      {isLoading && <ListSkeleton count={5} />}
      {isError && <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title={debounced ? 'No companies match' : 'No companies yet'}
          description="Add companies to link jobs and contacts together."
          action={
            <Button
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Add company
            </Button>
          }
        />
      )}

      {items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((company) => (
              <div key={company.id} className="card card-hover flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-900">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/companies/${company.id}`}
                      className="truncate text-base font-semibold text-slate-900 hover:text-blue-900"
                    >
                      {company.name}
                    </Link>
                    <p className="truncate text-sm text-slate-500">
                      {[company.industry, company.location].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{company.job_count} jobs · {company.contact_count} contacts</span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="font-medium text-blue-900 hover:text-blue-800"
                      onClick={() => {
                        setEditing(company)
                        setModalOpen(true)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="font-medium text-red-500 hover:text-red-600"
                      onClick={() => setDeleting(company)}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <Pagination
              page={page}
              totalPages={data?.page_meta.pages ?? 1}
              onPage={(p) => {
                const next = new URLSearchParams(params)
                next.set('page', String(p))
                setParams(next)
              }}
            />
          </div>
        </>
      )}

      <CompanyForm
        open={modalOpen}
        company={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false)
          invalidate()
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete company?"
        message="Jobs and contacts linked to this company will keep their data but lose the link."
        loading={removeCompany.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeCompany.mutate(deleting.id)}
      />
    </div>
  )
}
