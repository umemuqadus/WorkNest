import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

export default function Spinner({
  size = 'md',
  light = false,
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  light?: boolean
  className?: string
}) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <Loader2
      className={clsx('animate-spin', dim, light ? 'text-white' : 'text-blue-900', className)}
      aria-label="Loading"
    />
  )
}
