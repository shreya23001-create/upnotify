import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorStats, getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getRecentIncidents } from '@/lib/db/incidents'
import { getAlertChannelsByOrg } from '@/lib/db/alerts'
import { getStatusPagesByWorkspace } from '@/lib/db/status-pages'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentIncidents } from '@/components/dashboard/recent-incidents'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { PausedMonitors } from '@/components/dashboard/paused-monitors'
import { DisabledAlerts } from '@/components/dashboard/disabled-alerts'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [stats, incidents, alertChannels, workspaces] = await Promise.all([
    getMonitorStats(user.org_id),
    getRecentIncidents(user.org_id, 5),
    getAlertChannelsByOrg(user.org_id),
    getWorkspacesByOrg(user.org_id),
  ])

  const defaultWorkspace = workspaces[0]
  const [statusPages, monitors] = await Promise.all([
    defaultWorkspace ? getStatusPagesByWorkspace(defaultWorkspace.id) : [],
    defaultWorkspace ? getMonitorsByWorkspace(defaultWorkspace.id) : [],
  ])

  const pausedMonitors = monitors.filter(m => m.is_paused)
  const disabledChannels = alertChannels.filter(ch => !ch.is_enabled)

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Dashboard</h1>

      <div style={{ marginBottom: 24 }}>
        <OnboardingChecklist hasMonitors={stats.total > 0} hasAlertChannels={alertChannels.length > 0} hasStatusPages={statusPages.length > 0} />
      </div>

      <StatsCards stats={stats} />

      <DashboardCharts stats={stats} incidents={incidents} />

      {(pausedMonitors.length > 0 || disabledChannels.length > 0) && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {pausedMonitors.length > 0 && <PausedMonitors monitors={pausedMonitors} />}
          {disabledChannels.length > 0 && <DisabledAlerts channels={disabledChannels} />}
        </div>
      )}

      <div className="grid-2">
        <RecentIncidents incidents={incidents} />
      </div>
    </div>
  )
}
