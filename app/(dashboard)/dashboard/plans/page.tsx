import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWebsiteSubscriptions, getInvoicesByWebsiteSubscription } from '@/lib/db/subscriptions'
import { getMonitorSummaryByDomain } from '@/lib/db/monitors'
import { hasGrandfatheredBaseSubscription } from '@/lib/utils/plan-limits'
import { PlansDashboard, type WebsiteRow } from '@/components/billing/plans-dashboard'

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

  const rows: WebsiteRow[] = await Promise.all(
    websiteSubs.map(async (sub): Promise<WebsiteRow> => {
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
          <div className="db-page-sub">₹149/month per website. Add several at once and they&apos;re billed together on one invoice.</div>
        </div>
      </div>

      <PlansDashboard rows={rows} isGrandfathered={isGrandfathered} />
    </div>
  )
}
