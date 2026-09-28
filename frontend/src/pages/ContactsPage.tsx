import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Phone, Plus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { ListSkeleton } from '@/components/ui/Skeleton'
import Textarea from '@/components/ui/Textarea'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryClient'
import { companiesApi } from '@/services/companies'
import { contactsApi, type ContactPayload } from '@/services/contacts'
import type { Contact } from '@/types'

const PAGE_SIZE = 12

type ContactForm = {
  name: string
  email: string
  phone: string
  job_title: string
  linkedin_url: string
  notes: string
  company_id: number | ''
}

export default function ContactsPage() {
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 350)
  const page = Number(params.get('page') ?? '1')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)

  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    job_title: '',
    linkedin_url: '',
    notes: '',
    company_id: '',
  })

  const query = { q: debounced || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }
  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts(query),
    queryFn: () => contactsApi.list(query),
  })

  const companiesQuery = useQuery({
    queryKey: queryKeys.companies({ all: true }),
    queryFn: () => companiesApi.list({ limit: 100 }),
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['contacts'] })

  const saveContact = useMutation({
    mutationFn: (payload: ContactPayload) =>
      editing ? contactsApi.update(editing.id, payload) : contactsApi.create(payload),
    onSuccess: () => {
      toast.success(editing ? 'Contact updated' : 'Contact added')
      setModalOpen(false)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const removeContact = useMutation({
    mutationFn: (id: number) => contactsApi.remove(id),
    onSuccess: () => {
      toast.success('Contact deleted')
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', job_title: '', linkedin_url: '', notes: '', company_id: '' })
    setModalOpen(true)
  }

  function openEdit(contact: Contact) {
    setEditing(contact)
    setForm({
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      job_title: contact.job_title ?? '',
      linkedin_url: contact.linkedin_url ?? '',
      notes: contact.notes ?? '',
      company_id: contact.company_id ?? '',
    })
    setModalOpen(true)
  }

  const items = contactsQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">Recruiters, referrers and hiring managers.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add contact
        </Button>
      </div>

      <Input
        placeholder="Search name, email, job title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search contacts"
      />

      {contactsQuery.isLoading && <ListSkeleton count={5} />}
      {contactsQuery.isError && (
        <ErrorState
          message={(contactsQuery.error as Error)?.message}
          onRetry={() => void contactsQuery.refetch()}
        />
      )}

      {!contactsQuery.isLoading && !contactsQuery.isError && items.length === 0 && (
        <EmptyState
          title={debounced ? 'No contacts match' : 'No contacts yet'}
          description="Keep the people behind each application in one place."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add contact
            </Button>
          }
        />
      )}

      {items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((contact) => (
              <div key={contact.id} className="card card-hover p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{contact.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[contact.job_title, contact.company?.name].filter(Boolean).join(' · ') ||
                        'No company'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {contact.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-800">
                        {contact.email}
                      </a>
                    </p>
                  )}
                  {contact.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {contact.phone}
                    </p>
                  )}
                </div>

                {contact.notes && (
                  <p className="mt-3 line-clamp-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    {contact.notes}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  {contact.linkedin_url ? (
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-blue-900 hover:text-blue-800"
                    >
                      LinkedIn profile
                    </a>
                  ) : (
                    <span />
                  )}
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="font-medium text-blue-900 hover:text-blue-800"
                      onClick={() => openEdit(contact)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="font-medium text-red-500 hover:text-red-600"
                      onClick={() => setDeleting(contact)}
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
              totalPages={contactsQuery.data?.page_meta.pages ?? 1}
              onPage={(p) => {
                const next = new URLSearchParams(params)
                next.set('page', String(p))
                setParams(next)
              }}
            />
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit contact' : 'Add contact'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveContact.isPending}
              disabled={!form.name.trim()}
              onClick={() =>
                saveContact.mutate({
                  name: form.name.trim(),
                  email: form.email || null,
                  phone: form.phone || null,
                  job_title: form.job_title || null,
                  linkedin_url: form.linkedin_url || null,
                  notes: form.notes || null,
                  company_id: form.company_id === '' ? null : form.company_id,
                })
              }
            >
              {editing ? 'Save changes' : 'Create contact'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Job title"
              value={form.job_title ?? ''}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            />
            <Select
              label="Company"
              value={String(form.company_id)}
              onChange={(e) =>
                setForm({ ...form, company_id: e.target.value ? Number(e.target.value) : '' })
              }
              placeholder="No company"
              options={(companiesQuery.data?.items ?? []).map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
            />
          </div>
          <Input
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/..."
            value={form.linkedin_url ?? ''}
            onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
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
        title="Delete contact?"
        message="This contact will be permanently removed."
        loading={removeContact.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeContact.mutate(deleting.id)}
      />
    </div>
  )
}
