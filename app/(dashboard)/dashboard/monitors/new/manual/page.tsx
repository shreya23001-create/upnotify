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
    <div>
      <div className="page-header">
        <h1 className="page-title">Create Monitor</h1>
        <Link href="/dashboard/monitors/new" className="btn btn-ghost">← Back</Link>
      </div>
      {isPaid ? (
        <PaidMonitorCreator />
      ) : (
        <CreateMonitorForm minCheckInterval={minCheckInterval} />
      )}
    </div>
  )
}
