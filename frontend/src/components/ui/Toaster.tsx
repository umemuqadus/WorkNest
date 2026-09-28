import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToastStore } from '@/hooks/useToast'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones = {
  success: 'text-emerald-600 border-l-emerald-500',
  error: 'text-red-600 border-l-red-500',
  info: 'text-blue-900 border-l-blue-700',
}

export default function Toaster() {
  const { toasts, dismiss } = useToastStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => {
        const Icon = icons[t.kind]
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-[slideIn_200ms_ease-out] items-start gap-3 rounded-xl border border-l-4 border-slate-200 bg-white px-4 py-3 shadow-xl ${tones[t.kind]}`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
