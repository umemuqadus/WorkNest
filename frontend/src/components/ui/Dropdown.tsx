import clsx from 'clsx'
import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface DropdownItem {
  label: string
  onClick: () => void
  danger?: boolean
}

export default function Dropdown({
  items,
  align = 'right',
  label = 'More actions',
  trigger,
}: {
  items: DropdownItem[]
  align?: 'left' | 'right'
  label?: string
  trigger?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        {trigger ?? <MoreVertical className="h-4 w-4" />}
      </button>
      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute z-30 mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onClick()
              }}
              className={clsx(
                'block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50',
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
