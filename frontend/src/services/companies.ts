import { api } from '@/lib/api'
import type { Company, Page } from '@/types'

export interface CompanyPayload {
  name: string
  website?: string | null
  industry?: string | null
  location?: string | null
  description?: string | null
  logo_url?: string | null
}

export const companiesApi = {
  async list(query: { q?: string; limit?: number; offset?: number } = {}): Promise<Page<Company>> {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    params.set('limit', String(query.limit ?? 20))
    params.set('offset', String(query.offset ?? 0))
    const { data } = await api.get<Page<Company>>(`/companies?${params}`)
    return data
  },
  async get(id: number): Promise<Company> {
    const { data } = await api.get<Company>(`/companies/${id}`)
    return data
  },
  async create(payload: CompanyPayload): Promise<Company> {
    const { data } = await api.post<Company>('/companies', payload)
    return data
  },
  async update(id: number, payload: Partial<CompanyPayload>): Promise<Company> {
    const { data } = await api.patch<Company>(`/companies/${id}`, payload)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/companies/${id}`)
  },
}
