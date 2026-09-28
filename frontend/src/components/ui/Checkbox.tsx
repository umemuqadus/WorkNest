import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export default function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={clsx('inline-flex items-center gap-2 text-sm text-slate-700', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded-md border-slate-300 text-blue-800 focus:ring-blue-700/30"
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  )
}
