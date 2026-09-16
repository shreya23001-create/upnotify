import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWebsiteSubscriptions, getInvoicesByWebsiteSubscription } from '@/lib/db/subscriptions'
import { getMonitorSummaryByDomain } from '@/lib/db/monitors'
import { hasGrandfatheredBaseSubscription, getWebsiteSlotUsage } from '@/lib/utils/plan-limits'
import { PlansDashboard, type WebsiteRow } from '@/components/billing/plans-dashboard'

export const metadata: Metadata = {
  title: 'Plans',
}

export default async function PlansPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [websiteSubs, monitorSummary, isGrandfathered, slotUsage] = await Promise.all([
    getWebsiteSubscriptions(user.org_id),
    getMonitorSummaryByDomain(user.org_id),
    hasGrandfatheredBaseSubscription(user.org_id),
    getWebsiteSlotUsage(user.org_id),
  ])

  const paidSubs = websiteSubs.filter(s => s.status !== 'incomplete')

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
    <div className="db-content plans-page-root">
      <div className="db-page-header plans-page-header">
        <div>
          <div className="db-page-title">Plans</div>
        </div>
      </div>

      <PlansDashboard rows={rows} isGrandfathered={isGrandfathered} slotUsage={slotUsage} />
    </div>
  )
}
