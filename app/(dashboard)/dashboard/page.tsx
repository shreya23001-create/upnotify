import { getCurrentUser } from '@/lib/db/users'
import { getMonitorStats } from '@/lib/db/monitors'
import { getRecentIncidents } from '@/lib/db/incidents'
import { getAlertChannelsByOrg } from '@/lib/db/alerts'
import { getStatusPagesByWorkspace } from '@/lib/db/status-pages'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentIncidents } from '@/components/dashboard/recent-incidents'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [stats, incidents, alertChannels, workspaces] = await Promise.all([
    getMonitorStats(user.org_id),
    getRecentIncidents(user.org_id, 5),
    getAlertChannelsByOrg(user.org_id),
    getWorkspacesByOrg(user.org_id),
  ])

  const defaultWorkspace = workspaces[0]
  const statusPages = defaultWorkspace
    ? await getStatusPagesByWorkspace(defaultWorkspace.id)
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <StatsCards stats={stats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentIncidents incidents={incidents} />
        <OnboardingChecklist
          hasMonitors={stats.total > 0}
          hasAlertChannels={alertChannels.length > 0}
          hasStatusPages={statusPages.length > 0}
        />
      </div>
    </div>
  )
}
