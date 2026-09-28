import clsx from 'clsx'
import { forwardRef, useId, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string | null
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="label-base">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={clsx(
          'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-700/15',
          className,
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default Select
