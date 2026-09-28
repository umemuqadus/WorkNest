import { api } from '@/lib/api'
import type { AnalyticsOverview, BreakdownItem, DashboardData, SeriesPoint } from '@/types'

export const analyticsApi = {
  async dashboard(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('/analytics/dashboard')
    return data
  },
  async overview(): Promise<AnalyticsOverview> {
    const { data } = await api.get<AnalyticsOverview>('/analytics/overview')
    return data
  },
  async applicationsSeries(days = 30): Promise<SeriesPoint[]> {
    const { data } = await api.get<SeriesPoint[]>(`/analytics/applications?days=${days}`)
    return data
  },
  async statusBreakdown(): Promise<BreakdownItem[]> {
    const { data } = await api.get<BreakdownItem[]>('/analytics/status')
    return data
  },
  async sourceBreakdown(): Promise<BreakdownItem[]> {
    const { data } = await api.get<BreakdownItem[]>('/analytics/sources')
    return data
  },
}
