import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import { JOB_STATUS_CHOICES, statusChoice } from '@/lib/labels'
import { getErrorMessage, setToken, getToken, removeToken } from '@/lib/api'

vi.mock('@/services/auth', () => ({
  authApi: {
    me: vi.fn(async () => ({
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
    })),
    login: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
  },
}))

function renderWithAuth(path = '/') {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/login" element={<div>login-page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>private-page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects anonymous users to /login', async () => {
    renderWithAuth('/')
    expect(await screen.findByText('login-page')).toBeInTheDocument()
  })

  it('renders children for authenticated users', async () => {
    setToken('test-token')
    renderWithAuth('/')
    expect(await screen.findByText('private-page')).toBeInTheDocument()
    removeToken()
  })
})

describe('auth token storage', () => {
  it('stores and removes the token', () => {
    expect(getToken()).toBeNull()
    setToken('abc')
    expect(getToken()).toBe('abc')
    removeToken()
    expect(getToken()).toBeNull()
  })
})

describe('labels', () => {
  it('resolves known job statuses', () => {
    expect(statusChoice('interview', JOB_STATUS_CHOICES).label).toBe('Interview')
  })

  it('falls back safely for unknown values', () => {
    expect(statusChoice('nope', JOB_STATUS_CHOICES).label).toBe('Unknown')
  })
})

describe('getErrorMessage', () => {
  it('prefers the API detail message', () => {
    const err = { response: { data: { detail: 'Invalid credentials' }, status: 401 } }
    expect(getErrorMessage(err)).toBe('Invalid credentials')
  })

  it('falls back to a generic message', () => {
    expect(getErrorMessage({})).toBe('Something went wrong. Please try again.')
  })
})

describe('UI smoke', () => {
  it('renders a button and fires clicks', () => {
    const onClick = vi.fn()
    render(<button onClick={onClick}>Save</button>)
    fireEvent.click(screen.getByText('Save'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
