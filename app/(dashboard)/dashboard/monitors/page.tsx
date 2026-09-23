import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsByWorkspacePaged, getMonitorsGroupedByWebsite, getMonitorWorkspaceSummary } from '@/lib/db/monitors'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getWebsiteSubscriptions } from '@/lib/db/subscriptions'
import { hasGrandfatheredBaseSubscription, getWebsiteSlotUsage } from '@/lib/utils/plan-limits'
import { getUptimeBarData, getRecentCheckResultsByMonitorIds } from '@/lib/db/check-results'
import { MonitorTable } from '@/components/monitors/monitor-table'
import { MonitorChecklist } from '@/components/monitors/monitor-checklist'
import { AddMonitorButton } from '@/components/monitors/add-monitor-button'
import { MonitorStatsBar } from '@/components/monitors/monitor-stats-bar'
import { redirect } from 'next/navigation'
import { parsePage, getPaginationMeta, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'

export default async function MonitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; type?: string; page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)

  const { search, status, type, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE
  const hasActiveFilters = Boolean(search || status || type)

  const isGrandfathered = await hasGrandfatheredBaseSubscription(user.org_id)

  // Per-website billing orgs: show one grouped checklist section per paid
  // website (like Incidents), with a monitor count instead of a flat list.
  let paidDomains: string[] = []
  let groupedByDomain: Record<string, Awaited<ReturnType<typeof getMonitorsGroupedByWebsite>>[number]> = {}
  let canAddMonitor = true
  if (!isGrandfathered) {
    const [websiteSubs, groups, slotUsage] = await Promise.all([
      getWebsiteSubscriptions(user.org_id),
      getMonitorsGroupedByWebsite(user.org_id),
      getWebsiteSlotUsage(user.org_id),
    ])
    paidDomains = Array.from(new Set(
      websiteSubs
        .filter(s => ['active', 'cancelling', 'past_due'].includes(s.status))
        .flatMap(s => s.domains ?? [])
    ))
    groupedByDomain = Object.fromEntries(groups.map(g => [g.domain, g]))
    // Add Monitor is disabled once purchased capacity is fully used —
    // buying more websites is required before adding anything else.
    canAddMonitor = slotUsage.remaining > 0
  }

  // Real uptime/response-time/status for each domain group's command-center
  // row — fetched once for all grouped monitors' ids and sliced per domain.
  const groupedMonitorIds = paidDomains.flatMap(d => (groupedByDomain[d]?.monitors ?? []).map(m => m.id))
  const domainCheckResults = groupedMonitorIds.length > 0
    ? await getRecentCheckResultsByMonitorIds(groupedMonitorIds, 30)
    : []

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const [{ data: monitors, total }, summary] = defaultWorkspace
    ? await Promise.all([
        getMonitorsByWorkspacePaged(defaultWorkspace.id, page, pageSize, { search, status, type, excludeDomains: paidDomains }),
        getMonitorWorkspaceSummary(defaultWorkspace.id),
      ])
    : [{ data: [], total: 0 }, { total: 0, active: 0, paused: 0, issues: 0 }]

  const pagination = getPaginationMeta(page, pageSize, total)

  // If the requested page is past the end of the (filtered) result set the
  // range query returns an empty slice while the pager clamps to a valid page —
  // that mismatch is what renders a "blank" page. Redirect to the last real page.
  if (total > 0 && page > pagination.totalPages) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    if (pagination.totalPages > 1) params.set('page', String(pagination.totalPages))
    const qs = params.toString()
    redirect(qs ? `/dashboard/monitors?${qs}` : '/dashboard/monitors')
  }

  const uptimeEntries = await Promise.all(
    monitors.map(async (m) => [m.id, await getUptimeBarData(m.id, m.check_interval_seconds)] as const)
  )
  const uptimeData: Record<string, Awaited<ReturnType<typeof getUptimeBarData>>> = Object.fromEntries(uptimeEntries)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Monitors</div>
          <p className="db-page-subtitle">Track and manage all your active monitoring configurations from one place.</p>
        </div>
        <div className="db-page-actions">
          <AddMonitorButton disabled={!canAddMonitor} />
        </div>
      </div>

      <MonitorStatsBar total={summary.total} active={summary.active} paused={summary.paused} issues={summary.issues} />

      {!isGrandfathered && paidDomains.length > 0 && (
        <div className="mon-domain-list">
          {paidDomains.map(domain => (
            <MonitorChecklist
              key={domain}
              domain={domain}
              monitors={groupedByDomain[domain]?.monitors ?? []}
              checkResults={domainCheckResults}
            />
          ))}
        </div>
      )}

      {(total > 0 || hasActiveFilters || paidDomains.length === 0) && (
        <MonitorTable
          monitors={monitors}
          uptimeData={uptimeData}
          initialSearch={search ?? ''}
          initialStatus={status ?? ''}
          initialType={type ?? ''}
          pagination={pagination}
        />
      )}
    </div>
  )
}
