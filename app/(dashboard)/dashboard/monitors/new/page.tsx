import { CreateMonitorForm } from '@/components/monitors/create-monitor-form'
import { PaidMonitorCreator } from '@/components/monitors/paid-monitor-creator'
import { getCurrentUser } from '@/lib/db/users'
import { getPlanLimits } from '@/lib/utils/plan-limits'

export default async function NewMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>
}) {
  const { paid } = await searchParams
  const isPaid = paid === 'true'

  const user = await getCurrentUser()
  const planLimits = user ? await getPlanLimits(user.org_id) : null
  const minCheckInterval = planLimits?.checkIntervalSeconds ?? 600

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Create Monitor</h1>
      {isPaid ? (
        <PaidMonitorCreator />
      ) : (
        <div className="card">
          <div className="card-content">
            <CreateMonitorForm minCheckInterval={minCheckInterval} />
          </div>
        </div>
      )}
    </div>
  )
}
