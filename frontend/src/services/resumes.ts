import { api } from '@/lib/api'
import type { Resume, ResumeSummary } from '@/types'

export interface ResumePayload {
  name: string
  content: string
  file_url?: string | null
  is_default?: boolean
}

export const resumesApi = {
  async list(): Promise<ResumeSummary[]> {
    const { data } = await api.get<ResumeSummary[]>('/resumes')
    return data
  },
  async get(id: number): Promise<Resume> {
    const { data } = await api.get<Resume>(`/resumes/${id}`)
    return data
  },
  async create(payload: ResumePayload): Promise<Resume> {
    const { data } = await api.post<Resume>('/resumes', payload)
    return data
  },
  async update(id: number, payload: Partial<ResumePayload>): Promise<Resume> {
    const { data } = await api.patch<Resume>(`/resumes/${id}`, payload)
    return data
  },
  async setDefault(id: number): Promise<Resume> {
    const { data } = await api.post<Resume>(`/resumes/${id}/default`)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/resumes/${id}`)
  },
}
