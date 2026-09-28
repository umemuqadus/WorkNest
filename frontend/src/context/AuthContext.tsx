import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { getToken, removeToken, setToken } from '@/lib/api'
import { authApi, type LoginPayload, type RegisterPayload } from '@/services/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        removeToken()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      async login(payload) {
        const data = await authApi.login(payload)
        setToken(data.access_token)
        setUser(data.user)
        return data.user
      },
      async register(payload) {
        const data = await authApi.register(payload)
        setToken(data.access_token)
        setUser(data.user)
        return data.user
      },
      async refreshUser() {
        const me = await authApi.me()
        setUser(me)
      },
      logout() {
        removeToken()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
