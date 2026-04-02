import { getAllPublicMonitors } from '@/lib/db/public-monitors'
import { TrackerManager } from '@/components/admin/tracker-manager'
import Link from 'next/link'

export default async function AdminTrackerPage(): Promise<React.ReactElement> {
  const monitors = await getAllPublicMonitors()

  const activeCount = monitors.filter(m => m.is_active).length
  const downCount = monitors.filter(m => m.last_status === 'down').length

  return (
    <div>
      <div className="card-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Public Tracker</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Manage publicly tracked websites. These appear on /tracker for SEO and lead generation.
          </p>
        </div>
        <Link href="/admin" className="btn btn-secondary btn-sm">Back to Admin</Link>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Total Sites</div>
            <div className="stat-value">{monitors.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Active</div>
            <div className="stat-value">{activeCount}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Currently Down</div>
            <div className="stat-value" style={{ color: downCount > 0 ? 'var(--color-danger, #ef4444)' : undefined }}>
              {downCount}
            </div>
          </div>
        </div>
      </div>

      <TrackerManager monitors={monitors} />
    </div>
  )
}
