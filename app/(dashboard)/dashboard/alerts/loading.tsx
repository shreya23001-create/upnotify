import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

export default function AlertsLoading(): React.ReactElement {
  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="skeleton skeleton-title" style={{ width: 160, height: 28 }} />
      </div>
      <LoadingSkeleton type="table" />
    </div>
  )
}
