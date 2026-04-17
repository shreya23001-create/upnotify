import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getUptimeBarData } from '@/lib/db/check-results'
import { MonitorTable } from '@/components/monitors/monitor-table'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MonitorsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const monitors = defaultWorkspace ? await getMonitorsByWorkspace(defaultWorkspace.id) : []

  // Fetch uptime data for all monitors in parallel
  const uptimeEntries = await Promise.all(
    monitors.map(async (m) => [m.id, await getUptimeBarData(m.id)] as const)
  )
  const uptimeData: Record<string, Awaited<ReturnType<typeof getUptimeBarData>>> = Object.fromEntries(uptimeEntries)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitors</h1>
        <Link href="/dashboard/monitors/scan" className="btn btn-ghost">🔭 Scan a Website</Link>
        <Link href="/dashboard/monitors/new" className="btn btn-primary">+ Add Monitor</Link>
      </div>
      <MonitorTable monitors={monitors} uptimeData={uptimeData} />
    </div>
  )
}
