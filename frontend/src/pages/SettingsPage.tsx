import { useMutation, useQuery } from '@tanstack/react-query'
import { Bot, KeyRound, Lock, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import { queryKeys } from '@/lib/queryClient'
import { aiApi } from '@/services/ai'
import { authApi, type ProfilePayload } from '@/services/auth'

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfilePayload>({
    name: '',
    email: '',
    location: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
  })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    setProfile({
      name: user.name,
      email: user.email,
      location: user.location ?? '',
      phone: user.phone ?? '',
      linkedin_url: user.linkedin_url ?? '',
      github_url: user.github_url ?? '',
      portfolio_url: user.portfolio_url ?? '',
    })
  }, [user])

  const aiStatus = useQuery({
    queryKey: queryKeys.aiStatus,
    queryFn: aiApi.status,
    staleTime: 60_000,
  })

  const saveProfile = useMutation({
    mutationFn: () => authApi.updateProfile(clean(profile)),
    onSuccess: async () => {
      toast.success('Profile saved')
      setProfileErrors({})
      await refreshUser()
    },
    onError: (e) => {
      setProfileErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(passwords),
    onSuccess: () => {
      toast.success('Password changed')
      setPasswords({ current_password: '', new_password: '' })
      setPasswordErrors({})
    },
    onError: (e) => {
      setPasswordErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  function field(key: keyof ProfilePayload) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfile({ ...profile, [key]: e.target.value })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile, security and AI provider.</p>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-800" /> Profile
            </span>
          }
          subtitle={user ? `Member since ${formatDate(user.created_at)}` : undefined}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={profile.name ?? ''} onChange={field('name')} error={profileErrors.name ?? null} />
            <Input label="Email" type="email" value={profile.email ?? ''} onChange={field('email')} error={profileErrors.email ?? null} />
            <Input label="Location" value={profile.location ?? ''} onChange={field('location')} />
            <Input label="Phone" value={profile.phone ?? ''} onChange={field('phone')} />
            <Input label="LinkedIn URL" value={profile.linkedin_url ?? ''} onChange={field('linkedin_url')} />
            <Input label="GitHub URL" value={profile.github_url ?? ''} onChange={field('github_url')} />
            <Input label="Portfolio URL" value={profile.portfolio_url ?? ''} onChange={field('portfolio_url')} />
          </div>
          <div className="flex justify-end">
            <Button loading={saveProfile.isPending} onClick={() => saveProfile.mutate()}>
              Save profile
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-800" /> Change password
            </span>
          }
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              value={passwords.current_password}
              onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
              error={passwordErrors.current_password ?? null}
            />
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              value={passwords.new_password}
              onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
              error={passwordErrors.new_password ?? null}
              hint="At least 8 characters."
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              loading={changePassword.isPending}
              disabled={!passwords.current_password || passwords.new_password.length < 8}
              onClick={() => changePassword.mutate()}
            >
              Update password
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-sky-700" /> AI provider
            </span>
          }
          subtitle="Provider-agnostic: Gemini, any OpenAI-compatible endpoint, or a local mock."
        />
        <CardBody className="space-y-3">
          {aiStatus.data ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-sky-700" /> Provider:
                <Badge tone="cyan">{aiStatus.data.provider}</Badge>
              </span>
              <Badge tone={aiStatus.data.configured ? 'emerald' : 'amber'}>
                {aiStatus.data.configured ? 'API key configured' : 'No API key'}
              </Badge>
              {aiStatus.data.fallback && (
                <Badge tone="amber">Using deterministic mock fallback</Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Checking provider…</p>
          )}
          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            Configure in <code className="font-mono">backend/.env</code>:
            <br />
            <code className="font-mono">AI_PROVIDER=gemini|openai|mock</code>,
            <code className="font-mono"> AI_API_KEY=...</code>,
            <code className="font-mono"> AI_MODEL=...</code>,
            <code className="font-mono"> AI_BASE_URL=...</code>
            <br />
            Without a key the app degrades gracefully to the mock provider — no feature breaks and
            results are cached, so nothing is charged twice.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Session" subtitle="Sign out of this device." />
        <CardBody>
          <Button
            variant="danger"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Log out
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

function clean(payload: ProfilePayload): ProfilePayload {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    out[key] = value === '' ? null : value
  }
  return out as ProfilePayload
}

function queryKeysAi() {
  return ['ai', 'status']
}
