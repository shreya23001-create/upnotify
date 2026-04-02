import { getAllPlans, getSubscriberCountsByPlan } from '@/lib/db/plans'
import { getAllCreditRules } from '@/lib/db/credit-rules'
import { PlansManager } from '@/components/admin/plans-manager'

export default async function AdminPlansPage(): Promise<React.ReactElement> {
  const [plans, creditRules, subscriberCounts] = await Promise.all([
    getAllPlans(),
    getAllCreditRules(),
    getSubscriberCountsByPlan(),
  ])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Plans &amp; Pricing</h1>
          <p className="admin-page-subtitle">
            Single source of truth for all pricing. Changes here affect the landing page, billing, and plan enforcement.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{plans.length}</span>
          <span className="admin-page-header-stat-label">plans</span>
        </div>
      </div>
      <PlansManager
        plans={plans}
        creditRules={creditRules}
        subscriberCounts={subscriberCounts}
      />
    </div>
  )
}
