import clsx from 'clsx'
import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  hint?: ReactNode
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="label-base">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        aria-invalid={!!error}
        className={clsx(
          'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:bg-slate-50',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-700/15',
          className,
        )}
        {...rest}
      />
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

export default Textarea
