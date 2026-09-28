import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-semibold text-blue-900">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        The page you are looking for doesn’t exist or was moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
