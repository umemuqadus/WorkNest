import { api } from '@/lib/api'
import type { Page, Task } from '@/types'

export interface TaskPayload {
  title: string
  description?: string | null
  due_date?: string | null
  priority?: string
  completed?: boolean
  job_id?: number | null
  application_id?: number | null
}

export const tasksApi = {
  async list(
    query: {
      completed?: boolean
      overdue?: boolean
      due_within_days?: number
      q?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<Page<Task>> {
    const params = new URLSearchParams()
    if (query.completed !== undefined) params.set('completed', String(query.completed))
    if (query.overdue) params.set('overdue', 'true')
    if (query.due_within_days !== undefined)
      params.set('due_within_days', String(query.due_within_days))
    if (query.q) params.set('q', query.q)
    params.set('limit', String(query.limit ?? 100))
    params.set('offset', String(query.offset ?? 0))
    const { data } = await api.get<Page<Task>>(`/tasks?${params}`)
    return data
  },
  async create(payload: TaskPayload): Promise<Task> {
    const { data } = await api.post<Task>('/tasks', payload)
    return data
  },
  async update(id: number, payload: Partial<TaskPayload>): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${id}`, payload)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },
}
