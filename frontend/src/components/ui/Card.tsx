import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5',
        className,
      )}
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>
}
