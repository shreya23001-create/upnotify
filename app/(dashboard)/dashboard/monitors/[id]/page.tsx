import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { getIncidentsByWorkspace } from '@/lib/db/incidents'
import { MonitorStatusBadge } from '@/components/monitors/monitor-status-badge'

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const monitor = await getMonitorById(id)
  if (!monitor) notFound()

  const incidents = await getIncidentsByWorkspace(monitor.workspace_id, { limit: 5 })

  return (
    <div>
      <div className="monitor-header">
        <h1 className="page-title">{monitor.name}</h1>
        <MonitorStatusBadge status={monitor.status} />
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Configuration</div></div>
          <div className="card-content">
            <div className="info-row"><span className="info-row-label">Type</span><span className="info-row-value">{monitor.type}</span></div>
            <div className="info-row"><span className="info-row-label">Target</span><span className="info-row-value">{monitor.target}</span></div>
            <div className="info-row"><span className="info-row-label">Interval</span><span className="info-row-value">{monitor.check_interval_seconds}s</span></div>
            <div className="info-row"><span className="info-row-label">Timeout</span><span className="info-row-value">{monitor.timeout_ms}ms</span></div>
            <div className="info-row"><span className="info-row-label">Severity</span><span className="info-row-value">{monitor.severity}</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Check History</div></div>
          <div className="card-content">
            <p style={{ fontSize: 14, color: '#71717a' }}>Check history will appear here once monitoring is active.</p>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><div className="card-title">Recent Incidents</div></div>
        <div className="card-content">
          {incidents.length === 0 ? (
            <p style={{ fontSize: 14, color: '#71717a' }}>No incidents for this monitor.</p>
          ) : (
            <div className="space-y-sm">
              {incidents.map((inc) => (
                <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>{inc.title}</span>
                  <span className={`badge ${inc.status === 'resolved' ? 'badge-outline' : 'badge-danger'}`}>{inc.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
