import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import AuthShell from '@/components/layout/AuthShell'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage, getFieldErrors } from '@/lib/api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: () => navigate(from, { replace: true }),
    onError: (error) => {
      setFieldErrors(getFieldErrors(error))
    },
  })

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your WorkNest account">
      <form
        className="card space-y-4 p-6 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault()
          setFieldErrors({})
          mutation.mutate()
        }}
      >
        {mutation.isError && !Object.keys(fieldErrors).length && (
          <div
            role="alert"
            className="rounded-xl border border-red-200/70 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {getErrorMessage(mutation.error)}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email ?? fieldErrors.body ?? null}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password ?? null}
        />
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Sign in
        </Button>
        <p className="text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="font-semibold text-blue-900 hover:text-blue-800">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
