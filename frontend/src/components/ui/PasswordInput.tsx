import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input, { type InputProps } from './Input'

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>

/**
 * Text field with a reveal toggle. The value never changes - only `type`
 * flips between `password` and `text`, so form state stays untouched.
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="rounded-md p-1.5 text-slate-400 transition hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  )
})

export default PasswordInput
