import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import Logo from '@/components/ui/Logo'

const POINTS = [
  'Jobs, companies and contacts in one tidy pipeline',
  'AI insights on roles, resumes and interview prep',
  'Tasks, interviews and deadlines at a glance',
]

/**
 * Two-column auth frame: gradient brand panel (desktop) + form column.
 * The panel is purely presentational — no functionality lives here.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-full max-w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 15% 0%, rgba(2, 132, 199, 0.4), transparent 60%)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <Logo className="h-10 w-10 rounded-xl bg-white text-xl text-blue-900" />
          <span className="text-base font-semibold tracking-tight">WorkNest</span>
        </div>

        <div className="relative">
          <p className="max-w-md text-[1.75rem] font-semibold leading-snug tracking-tight">
            Your whole job search, <span className="text-sky-400">nestled in one place.</span>
          </p>
          <ul className="mt-7 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-blue-50/90">
                <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">Offer to offer, organized.</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-[riseIn_300ms_ease-out]">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-600 text-2xl text-white shadow-[0_10px_24px_-12px_rgba(2,132,199,0.9)] lg:hidden" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
