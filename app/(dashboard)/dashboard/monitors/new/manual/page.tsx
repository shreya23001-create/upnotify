import { CreateMonitorForm } from '@/components/monitors/create-monitor-form'
import { getCurrentUser } from '@/lib/db/users'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import Link from 'next/link'

// engineering-app#55 — removed the `?paid=true` branch and its companion
// PaidMonitorCreator. They were leftover from the old per-monitor usage
// billing model (removed in earlier refactor) and used a localStorage-fed
// server action that bypassed plan limits entirely. Now this page always
// renders the standard CreateMonitorForm, which is plan-limit-gated.
export default async function NewMonitorManualPage(): Promise<React.ReactElement> {
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
      <CreateMonitorForm minCheckInterval={minCheckInterval} />
    </div>
  )
}
