import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspaceById } from '@/lib/db/workspaces'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getIncidentsByWorkspace } from '@/lib/db/incidents'
import { MonitorTable } from '@/components/monitors/monitor-table'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const workspace = await getWorkspaceById(id)
  if (!workspace) notFound()

  const [monitors, incidents] = await Promise.all([
    getMonitorsByWorkspace(workspace.id),
    getIncidentsByWorkspace(workspace.id, { limit: 5 }),
  ])

  const openIncidents = incidents.filter((i) => i.status !== 'resolved')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{workspace.name}</h1>
        {openIncidents.length > 0 && <span className="badge badge-danger">{openIncidents.length} open incidents</span>}
      </div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card"><div className="card-content-compact"><div className="stat-label">Total Monitors</div><div className="stat-value">{monitors.length}</div></div></div>
        <div className="card"><div className="card-content-compact"><div className="stat-label">Up</div><div className="stat-value stat-value-green">{monitors.filter(m => m.status === 'up').length}</div></div></div>
        <div className="card"><div className="card-content-compact"><div className="stat-label">Down</div><div className="stat-value stat-value-red">{monitors.filter(m => m.status === 'down').length}</div></div></div>
      </div>
      <MonitorTable monitors={monitors} />
    </div>
  )
}
