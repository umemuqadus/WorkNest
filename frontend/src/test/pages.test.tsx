import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFoundPage from '@/pages/NotFoundPage'
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
    total_jobs: 0,
    total_applications: 0,
    interviews: 0,
    upcoming_interviews: 0,
    offers: 0,
    rejected: 0,
    overdue_tasks: 0,
    response_rate: 0,
    interview_rate: 0,
    offer_rate: 0,
    avg_applications_per_week: 0,
  },
  applications_over_time: [],
  applications_by_status: [],
  jobs_by_source: [],
  jobs_by_company: [],
  interview_conversion: [],
  activity: [],
  recent_applications: [],
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
    list: vi.fn(async () => ({
      items: [],
      page_meta: { total: 0, limit: 100, offset: 0, page: 1, pages: 1 },
    })),
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

describe('NotFoundPage', () => {
  it('shows the 404 heading and copy', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(
      screen.getByText(/looking for doesn/i),
    ).toBeInTheDocument()
  })

  it('links back to the dashboard', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/')
  })
})

describe('routing', () => {
  it('redirects an unauthenticated visitor to /login', async () => {
    removeToken()
    render(<App />)
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the 404 page for an unknown path', async () => {
    setToken('test-token')
    window.history.pushState({}, '', '/definitely-not-a-page')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    removeToken()
    window.history.pushState({}, '', '/')
  })
})
