import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelsByOrg } from '@/lib/db/alerts'
import { getStatusPagesByWorkspace } from '@/lib/db/status-pages'
import { getMonitorStats, getMonitorsByWorkspace } from '@/lib/db/monitors'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { PausedMonitors } from '@/components/dashboard/paused-monitors'
import { DisabledAlerts } from '@/components/dashboard/disabled-alerts'
import { WorkspaceDashboard } from '@/components/dashboard/workspace-dashboard'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [alertChannels, workspaces, stats] = await Promise.all([
    getAlertChannelsByOrg(user.org_id),
    getWorkspacesByOrg(user.org_id),
    getMonitorStats(user.org_id),
  ])

  const defaultWorkspace = workspaces[0]
  const [statusPages, monitors] = await Promise.all([
    defaultWorkspace ? getStatusPagesByWorkspace(defaultWorkspace.id) : Promise.resolve([]),
    defaultWorkspace ? getMonitorsByWorkspace(defaultWorkspace.id) : Promise.resolve([]),
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
        <OnboardingChecklist
          hasMonitors={stats.total > 0}
          hasAlertChannels={alertChannels.length > 0}
          hasStatusPages={statusPages.length > 0}
        />
      </div>

      {/* Workspace-aware stats, charts, and incidents — client component */}
      <WorkspaceDashboard />

      {/* Warnings — paused monitors / disabled channels */}
      {(pausedMonitors.length > 0 || disabledChannels.length > 0) && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {pausedMonitors.length > 0 && <PausedMonitors monitors={pausedMonitors} />}
          {disabledChannels.length > 0 && <DisabledAlerts channels={disabledChannels} />}
        </div>
      )}
    </div>
  )
}
