import clsx from 'clsx'
import type { ReactNode } from 'react'

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('min-w-full divide-y divide-slate-200 text-sm', className)}>{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50/80">
      <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {children}
      </tr>
    </thead>
  )
}

export function TH({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={clsx('px-4 py-3', className)}>{children}</th>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
}

export function TR({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'transition hover:bg-blue-50/60',
        onClick && 'cursor-pointer active:bg-blue-50',
      )}
    >
      {children}
    </tr>
  )
}

export function TD({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx('px-4 py-3 align-middle text-slate-700', className)}>{children}</td>
}
