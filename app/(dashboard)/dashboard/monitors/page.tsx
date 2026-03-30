import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { MonitorTable } from '@/components/monitors/monitor-table'
import { redirect } from 'next/navigation'

export default async function MonitorsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const monitors = defaultWorkspace ? await getMonitorsByWorkspace(defaultWorkspace.id) : []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitors</h1>
        <button className="btn btn-primary" disabled>+ Add Monitor</button>
      </div>
      <MonitorTable monitors={monitors} />
    </div>
  )
}
