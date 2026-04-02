import { getAllPlans, getSubscriberCountsByPlan } from '@/lib/db/plans'
import { getAllCreditRules } from '@/lib/db/credit-rules'
import { PlansManager } from '@/components/admin/plans-manager'
import Link from 'next/link'

export default async function AdminPlansPage(): Promise<React.ReactElement> {
  const [plans, creditRules, subscriberCounts] = await Promise.all([
    getAllPlans(),
    getAllCreditRules(),
    getSubscriberCountsByPlan(),
  ])

  return (
    <div>
      <div className="card-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Plans &amp; Pricing</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Single source of truth for all pricing. Changes here affect the landing page, billing, and plan enforcement.
          </p>
        </div>
        <Link href="/admin" className="btn btn-secondary btn-sm">Back to Admin</Link>
      </div>
      <PlansManager
        plans={plans}
        creditRules={creditRules}
        subscriberCounts={subscriberCounts}
      />
    </div>
  )
}
