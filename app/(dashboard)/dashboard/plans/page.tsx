import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWebsiteSubscriptions, getInvoicesByWebsiteSubscription } from '@/lib/db/subscriptions'
import { getMonitorSummaryByDomain } from '@/lib/db/monitors'
import { hasGrandfatheredBaseSubscription } from '@/lib/utils/plan-limits'
import { PlansDashboard, type WebsiteRow, type PendingWebsite } from '@/components/billing/plans-dashboard'

export const metadata: Metadata = {
  title: 'Plans',
}

export default async function PlansPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [websiteSubs, monitorSummary, isGrandfathered] = await Promise.all([
    getWebsiteSubscriptions(user.org_id),
    getMonitorSummaryByDomain(user.org_id),
    hasGrandfatheredBaseSubscription(user.org_id),
  ])

  const pendingSubs = websiteSubs.filter(s => s.status === 'incomplete')
  const paidSubs = websiteSubs.filter(s => s.status !== 'incomplete')

  const pendingWebsites: PendingWebsite[] = pendingSubs.map(sub => ({
    id: sub.id,
    domain: sub.domains[0] ?? '',
  }))

  const rows: WebsiteRow[] = await Promise.all(
    paidSubs.map(async (sub): Promise<WebsiteRow> => {
      const perDomain = sub.domains.map(domain => ({
        domain,
        monitorCount: monitorSummary[domain]?.count ?? 0,
        monitorTypes: monitorSummary[domain]?.types ?? [],
      }))
      return {
        subscription: sub,
        perDomain,
        invoices: await getInvoicesByWebsiteSubscription(sub.id),
      }
    })
  )

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Plans</div>
          <div className="db-page-sub">One Pro Plan, priced per website. Add websites, then choose which ones to subscribe to.</div>
        </div>
      </div>

      <PlansDashboard rows={rows} pendingWebsites={pendingWebsites} isGrandfathered={isGrandfathered} />
    </div>
  )
}
