import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-blue-800 ring-1 ring-blue-100">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-3.5 text-[15px] font-semibold tracking-tight text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
