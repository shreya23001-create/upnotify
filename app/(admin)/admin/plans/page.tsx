import { getAllCreditRules } from '@/lib/db/credit-rules'
import { getAllCompetePlansAdmin } from '@/lib/db/compete-plans'
import { getAllWebsiteSubscriptionsAdmin } from '@/lib/db/admin'
import { PlansManager } from '@/components/admin/plans-manager'

export default async function AdminPlansPage(): Promise<React.ReactElement> {
  const [websitePlanRows, creditRules, competePlans] = await Promise.all([
    getAllWebsiteSubscriptionsAdmin(),
    getAllCreditRules(),
    getAllCompetePlansAdmin(),
  ])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Plans &amp; Pricing</h1>
          <p className="admin-page-subtitle">
            The current Pro Plan (per-website, quantity-first), the Compete add-on, and credit rules.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{websitePlanRows.length}</span>
          <span className="admin-page-header-stat-label">purchases</span>
        </div>
      </div>
      <PlansManager
        websitePlanRows={websitePlanRows}
        creditRules={creditRules}
        competePlans={competePlans}
      />
    </div>
  )
}
