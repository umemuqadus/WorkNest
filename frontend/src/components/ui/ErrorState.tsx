import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-red-200/70 bg-gradient-to-b from-red-50 to-white px-6 py-10 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100/80 text-red-500 ring-1 ring-red-200/70">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="mt-3 max-w-md text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  )
}
