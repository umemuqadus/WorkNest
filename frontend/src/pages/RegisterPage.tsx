import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import AuthShell from '@/components/layout/AuthShell'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage, getFieldErrors } from '@/lib/api'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => register(form),
    onSuccess: () => navigate('/', { replace: true }),
    onError: (error) => setFieldErrors(getFieldErrors(error)),
  })

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })
  }

  return (
    <AuthShell title="Create your account" subtitle="Start tracking your job search today">
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
          label="Full name"
          autoComplete="name"
          required
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name ?? null}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email ?? null}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password ?? null}
          hint="At least 8 characters."
        />
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Create account
        </Button>
        <p className="text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-900 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
