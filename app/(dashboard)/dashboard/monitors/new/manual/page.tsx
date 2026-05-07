import { CreateMonitorForm } from '@/components/monitors/create-monitor-form'
import { PaidMonitorCreator } from '@/components/monitors/paid-monitor-creator'
import { getCurrentUser } from '@/lib/db/users'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import Link from 'next/link'

export default async function NewMonitorManualPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>
}): Promise<React.ReactElement> {
  const { paid } = await searchParams
  const isPaid = paid === 'true'

  const user = await getCurrentUser()
  const planLimits = user ? await getPlanLimits(user.org_id) : null
  const minCheckInterval = planLimits?.checkIntervalSeconds ?? 600

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Create Monitor</div>
        <div className="db-page-actions">
          <Link href="/dashboard/monitors" className="btn btn-ghost btn-sm">← Back</Link>
        </div>
      </div>
      {isPaid ? (
        <PaidMonitorCreator />
      ) : (
        <CreateMonitorForm minCheckInterval={minCheckInterval} />
      )}
    </div>
  )
}
