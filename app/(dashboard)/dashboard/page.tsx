import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorStats, getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getRecentIncidents } from '@/lib/db/incidents'
import { getAlertChannelsByOrg } from '@/lib/db/alerts'
import { getStatusPagesByWorkspace } from '@/lib/db/status-pages'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getRecentCheckResultsByOrg } from '@/lib/db/check-results'
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

  const [stats, incidents, alertChannels, workspaces, checkResults] = await Promise.all([
    getMonitorStats(user.org_id),
    getRecentIncidents(user.org_id, 5),
    getAlertChannelsByOrg(user.org_id),
    getWorkspacesByOrg(user.org_id),
    getRecentCheckResultsByOrg(user.org_id, 30),
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
      {/* Page header with date */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Onboarding checklist */}
      <div style={{ marginBottom: 24 }}>
        <OnboardingChecklist hasMonitors={stats.total > 0} hasAlertChannels={alertChannels.length > 0} hasStatusPages={statusPages.length > 0} />
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <DashboardCharts stats={stats} incidents={incidents} checkResults={checkResults} />

      {/* Warnings — paused monitors / disabled channels */}
      {(pausedMonitors.length > 0 || disabledChannels.length > 0) && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {pausedMonitors.length > 0 && <PausedMonitors monitors={pausedMonitors} />}
          {disabledChannels.length > 0 && <DisabledAlerts channels={disabledChannels} />}
        </div>
      )}

      {/* Recent incidents */}
      <div className="grid-2">
        <RecentIncidents incidents={incidents} />
      </div>
    </div>
  )
}
