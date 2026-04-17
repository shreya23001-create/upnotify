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
    <div>
      <div className="page-header">
        <h1 className="page-title">Scan a Website</h1>
        <a href="/dashboard/monitors" className="btn btn-ghost">← Back to Monitors</a>
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
