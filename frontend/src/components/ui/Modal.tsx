import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Move focus into the dialog on open, hand it back on close.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      cancelAnimationFrame(frame)
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus()
      }
    }
  }, [open])

  if (!open) return null

  const width = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-md' : 'max-w-xl'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative z-10 w-full ${width} max-h-[90vh] animate-[popIn_180ms_ease-out] overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none ring-1 ring-slate-900/5`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600 hover:shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
