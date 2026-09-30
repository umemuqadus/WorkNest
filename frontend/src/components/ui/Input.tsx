import clsx from 'clsx'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  hint?: ReactNode
  /** Rendered inside the field on the right (e.g. a reveal toggle). */
  trailing?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, trailing, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label-base">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={clsx(
            'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-700/15',
            trailing && 'pr-11',
            className,
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
})

export default Input
