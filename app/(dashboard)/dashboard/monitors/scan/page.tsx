import { getCurrentUser } from '@/lib/db/users'
import { redirect } from 'next/navigation'
import { getPlanLimits, checkMonitorLimit } from '@/lib/utils/plan-limits'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { ScanClient } from './scan-client'

export default async function ScanPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [limitCheck, planLimits, workspaces] = await Promise.all([
    checkMonitorLimit(user.org_id),
    getPlanLimits(user.org_id),
    getWorkspacesByOrg(user.org_id),
  ])

  const workspace = workspaces[0]
  const existingMonitors = workspace ? await getMonitorsByWorkspace(workspace.id) : []
  const existingCount = limitCheck.currentCount
  const planLimit = limitCheck.limit
  const remaining = planLimit === null ? 999 : Math.max(0, planLimit - existingCount)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Add Monitors</div>
        <div className="db-page-actions">
          <a href="/dashboard/monitors/new/manual" className="btn btn-ghost btn-sm">✏️ Add specific monitor instead</a>
          <a href="/dashboard/monitors" className="btn btn-ghost btn-sm">← Back</a>
        </div>
      </div>
      <ScanClient
        remaining={remaining}
        planLimit={planLimit}
        existingCount={existingCount}
        planName={planLimits.checkIntervalSeconds <= 30 ? 'Scale' : planLimits.checkIntervalSeconds <= 60 ? 'Builder / Lite' : 'Free'}
      />
    </div>
  )
}
