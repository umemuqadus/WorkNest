import { api } from '@/lib/api'
import type { Interview, Page } from '@/types'

export interface InterviewPayload {
  application_id: number
  type: string
  scheduled_at: string
  duration?: number | null
  interviewer?: string | null
  meeting_url?: string | null
  location?: string | null
  notes?: string | null
  result?: string
}

export const interviewsApi = {
  async list(
    query: { upcoming?: boolean; from?: string; to?: string; limit?: number; offset?: number } = {},
  ): Promise<Page<Interview>> {
    const params = new URLSearchParams()
    if (query.upcoming) params.set('upcoming', 'true')
    if (query.from) params.set('from', query.from)
    if (query.to) params.set('to', query.to)
    params.set('limit', String(query.limit ?? 100))
    params.set('offset', String(query.offset ?? 0))
    const { data } = await api.get<Page<Interview>>(`/interviews?${params}`)
    return data
  },
  async get(id: number): Promise<Interview> {
    const { data } = await api.get<Interview>(`/interviews/${id}`)
    return data
  },
  async create(payload: InterviewPayload): Promise<Interview> {
    const { data } = await api.post<Interview>('/interviews', payload)
    return data
  },
  async update(id: number, payload: Partial<Omit<InterviewPayload, 'application_id'>>): Promise<Interview> {
    const { data } = await api.patch<Interview>(`/interviews/${id}`, payload)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/interviews/${id}`)
  },
}
