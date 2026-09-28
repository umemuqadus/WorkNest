import { api } from '@/lib/api'
import type { Contact, Page } from '@/types'

export interface ContactPayload {
  name: string
  email?: string | null
  phone?: string | null
  job_title?: string | null
  linkedin_url?: string | null
  notes?: string | null
  company_id?: number | null
}

export const contactsApi = {
  async list(
    query: { q?: string; company_id?: number; limit?: number; offset?: number } = {},
  ): Promise<Page<Contact>> {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    if (query.company_id) params.set('company_id', String(query.company_id))
    params.set('limit', String(query.limit ?? 20))
    params.set('offset', String(query.offset ?? 0))
    const { data } = await api.get<Page<Contact>>(`/contacts?${params}`)
    return data
  },
  async get(id: number): Promise<Contact> {
    const { data } = await api.get<Contact>(`/contacts/${id}`)
    return data
  },
  async create(payload: ContactPayload): Promise<Contact> {
    const { data } = await api.post<Contact>('/contacts', payload)
    return data
  },
  async update(id: number, payload: Partial<ContactPayload>): Promise<Contact> {
    const { data } = await api.patch<Contact>(`/contacts/${id}`, payload)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/contacts/${id}`)
  },
}
