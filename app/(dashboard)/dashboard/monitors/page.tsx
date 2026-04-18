import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getUptimeBarData } from '@/lib/db/check-results'
import { MonitorTable } from '@/components/monitors/monitor-table'
import { AddMonitorButton } from '@/components/monitors/add-monitor-button'
import { redirect } from 'next/navigation'

export default async function MonitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { search } = await searchParams

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const monitors = defaultWorkspace ? await getMonitorsByWorkspace(defaultWorkspace.id) : []

  const uptimeEntries = await Promise.all(
    monitors.map(async (m) => [m.id, await getUptimeBarData(m.id)] as const)
  )
  const uptimeData: Record<string, Awaited<ReturnType<typeof getUptimeBarData>>> = Object.fromEntries(uptimeEntries)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitors</h1>
        <AddMonitorButton hasMonitors={monitors.length > 0} />
      </div>
      <MonitorTable monitors={monitors} uptimeData={uptimeData} initialSearch={search ?? ''} />
    </div>
  )
}
