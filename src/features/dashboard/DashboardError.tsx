import { RotateCw } from 'lucide-react'
import { Button } from '../../components/Button'

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card dashboard-error" role="alert">
      <p className="dashboard-error__title">We couldn't load your dashboard.</p>
      <p className="dashboard-error__body">Check your connection and try again.</p>
      <Button onClick={onRetry}>
        <RotateCw aria-hidden="true" size={18} />
        Retry
      </Button>
    </div>
  )
}
