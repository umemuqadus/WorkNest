import clsx from 'clsx'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_8px_18px_-10px_rgba(30,58,138,0.75)] hover:from-blue-700 hover:to-blue-800 focus-visible:outline-blue-800 disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400 disabled:text-slate-400',
  danger:
    'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_8px_18px_-10px_rgba(220,38,38,0.7)] hover:from-red-400 hover:to-red-500 focus-visible:outline-red-600 disabled:from-red-300 disabled:to-red-300 disabled:shadow-none',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400 disabled:text-slate-400',
  outline:
    'border border-blue-200/80 text-blue-900 bg-blue-50/70 hover:bg-blue-100 focus-visible:outline-blue-700 disabled:text-blue-300',
}

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" light={variant === 'primary' || variant === 'danger'} />}
      {children}
    </button>
  )
})

export default Button
