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
        <div>
          <div className="db-page-title">Create a New Monitor</div>
          <p className="db-page-subtitle">Set up monitoring for your website, domain, API, or other services.</p>
        </div>
        <div className="db-page-actions">
          <Link href="/dashboard/monitors" className="mon-create-back-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Monitors
          </Link>
        </div>
      </div>
      <CreateMonitorForm minCheckInterval={minCheckInterval} />
    </div>
  )
}
