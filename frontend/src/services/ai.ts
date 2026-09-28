import { api } from '@/lib/api'
import type {
  AIStatus,
  ApplicationSuggestion,
  InterviewPrep,
  JobAnalysis,
  JobMatch,
} from '@/types'

export const aiApi = {
  async status(): Promise<AIStatus> {
    const { data } = await api.get<AIStatus>('/ai/status')
    return data
  },

  async getAnalysis(jobId: number): Promise<JobAnalysis | null> {
    const { data } = await api.get<JobAnalysis | null>(`/ai/jobs/${jobId}/analysis`)
    return data
  },

  async analyze(jobId: number, refresh = false): Promise<JobAnalysis> {
    const { data } = await api.post<JobAnalysis>(
      `/ai/jobs/${jobId}/analyze?refresh=${refresh}`,
    )
    return data
  },

  async getMatch(jobId: number, resumeId?: number): Promise<JobMatch | null> {
    const params = resumeId ? `?resume_id=${resumeId}` : ''
    const { data } = await api.get<JobMatch | null>(`/ai/jobs/${jobId}/match${params}`)
    return data
  },

  async match(jobId: number, resumeId?: number, refresh = false): Promise<JobMatch> {
    const params = new URLSearchParams({ refresh: String(refresh) })
    if (resumeId) params.set('resume_id', String(resumeId))
    const { data } = await api.post<JobMatch>(`/ai/jobs/${jobId}/match?${params}`)
    return data
  },

  async getPrep(jobId: number): Promise<InterviewPrep | null> {
    const { data } = await api.get<InterviewPrep | null>(`/ai/jobs/${jobId}/interview-prep`)
    return data
  },

  async prep(jobId: number, resumeId?: number, refresh = false): Promise<InterviewPrep> {
    const params = new URLSearchParams({ refresh: String(refresh) })
    if (resumeId) params.set('resume_id', String(resumeId))
    const { data } = await api.post<InterviewPrep>(`/ai/jobs/${jobId}/interview-prep?${params}`)
    return data
  },

  async deletePrep(jobId: number): Promise<void> {
    await api.delete(`/ai/jobs/${jobId}/interview-prep`)
  },

  async getSuggestions(jobId: number): Promise<ApplicationSuggestion | null> {
    const { data } = await api.get<ApplicationSuggestion | null>(
      `/ai/jobs/${jobId}/application-suggestions`,
    )
    return data
  },

  async suggest(jobId: number, resumeId?: number, refresh = false): Promise<ApplicationSuggestion> {
    const params = new URLSearchParams({ refresh: String(refresh) })
    if (resumeId) params.set('resume_id', String(resumeId))
    const { data } = await api.post<ApplicationSuggestion>(
      `/ai/jobs/${jobId}/application-suggestions?${params}`,
    )
    return data
  },
}
