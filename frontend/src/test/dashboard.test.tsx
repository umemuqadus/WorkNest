import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { setToken, removeToken } from '@/lib/api'
import type { DashboardData } from '@/types'

const user = {
  id: 1,
  name: 'Demo User',
  email: 'demo@example.com',
  location: null,
  phone: null,
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const dashboard: DashboardData = {
  stats: {
    total_jobs: 7,
    total_applications: 5,
    interviews: 2,
    upcoming_interviews: 1,
    offers: 1,
    rejected: 1,
    overdue_tasks: 0,
    response_rate: 60,
    interview_rate: 40,
    offer_rate: 20,
    avg_applications_per_week: 2,
  },
  applications_over_time: [{ key: '2026-09', count: 3 }],
  applications_by_status: [{ key: 'applied', label: 'Applied', count: 3 }],
  jobs_by_source: [{ key: 'LinkedIn', label: 'LinkedIn', count: 4 }],
  jobs_by_company: [{ key: 'TechCorp', label: 'TechCorp', count: 2 }],
  interview_conversion: [{ key: 'screen', label: 'Screen', count: 2 }],
  activity: [{ key: '2026-09-24', count: 1 }],
  recent_applications: [
    {
      id: 1,
      job_id: 1,
      status: 'applied',
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      job_title: 'Frontend Engineer',
      company_name: 'TechCorp',
    },
  ],
  upcoming_interviews: [],
  follow_up_tasks: [],
  high_priority_jobs: [],
}

vi.mock('@/services/auth', () => ({
  authApi: {
    me: vi.fn(async () => user),
    login: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('@/services/analytics', () => ({
  analyticsApi: {
    dashboard: vi.fn(async () => dashboard),
    overview: vi.fn(async () => ({ stats: dashboard.stats })),
    applicationsSeries: vi.fn(async () => []),
    statusBreakdown: vi.fn(async () => []),
    sourceBreakdown: vi.fn(async () => []),
  },
}))

vi.mock('@/services/tasks', () => ({
  tasksApi: {
    list: vi.fn(async () => ({ items: [], page_meta: { total: 0, limit: 100, offset: 0, page: 1, pages: 1 } })),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@/services/search', () => ({
  searchApi: {
    search: vi.fn(async () => ({ jobs: [], companies: [], contacts: [], applications: [] })),
  },
}))

describe('App dashboard render', () => {
  it('renders the dashboard for an authenticated user', async () => {
    setToken('test-token')
    const { container } = render(<App />)

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Total jobs')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(container.querySelector('nav, aside')).toBeTruthy()

    removeToken()
  })
})
