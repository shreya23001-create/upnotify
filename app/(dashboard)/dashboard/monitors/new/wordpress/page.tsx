import { CreateMonitorForm } from '@/components/monitors/create-monitor-form'
import { getCurrentUser } from '@/lib/db/users'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NewWordPressMonitorPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const planLimits = await getPlanLimits(user.org_id)
  const minCheckInterval = planLimits?.checkIntervalSeconds ?? 600

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Create Monitor</div>
        <div className="db-page-actions">
          <Link href="/dashboard/monitors/scan" className="btn btn-ghost btn-sm">← Back</Link>
        </div>
      </div>
      <CreateMonitorForm minCheckInterval={minCheckInterval} defaultType="wordpress" />
    </div>
  )
}
