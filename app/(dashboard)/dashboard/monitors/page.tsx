import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsByWorkspacePaged } from '@/lib/db/monitors'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getUptimeBarData } from '@/lib/db/check-results'
import { MonitorTable } from '@/components/monitors/monitor-table'
import { AddMonitorButton } from '@/components/monitors/add-monitor-button'
import { redirect } from 'next/navigation'
import { parsePage, getPaginationMeta, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'

export default async function MonitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { search, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const { data: monitors, total } = defaultWorkspace
    ? await getMonitorsByWorkspacePaged(defaultWorkspace.id, page, pageSize)
    : { data: [], total: 0 }

  const pagination = getPaginationMeta(page, pageSize, total)

  const uptimeEntries = await Promise.all(
    monitors.map(async (m) => [m.id, await getUptimeBarData(m.id, m.check_interval_seconds)] as const)
  )
  const uptimeData: Record<string, Awaited<ReturnType<typeof getUptimeBarData>>> = Object.fromEntries(uptimeEntries)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Monitors</div>
        <div className="db-page-actions">
          <AddMonitorButton hasMonitors={total > 0} />
        </div>
      </div>
      <MonitorTable monitors={monitors} uptimeData={uptimeData} initialSearch={search ?? ''} pagination={pagination} />
    </div>
  )
}
