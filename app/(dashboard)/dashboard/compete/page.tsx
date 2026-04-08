// @ts-nocheck — dead route, redirects to /dashboard until Compete launches in v1.5
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { getProductsByOrg, getProductGroups } from '@/lib/db/ecom-products'
import { checkCompeteAccess, checkCompeteProductLimit } from '@/lib/utils/plan-limits'
import { getActiveCompetePlans } from '@/lib/db/compete-plans'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { CompeteProductTable } from '@/components/compete/product-table'
import { AddProductForm } from '@/components/compete/add-product-form'
import { CompetePlanSelector } from '@/components/compete/compete-plan-selector'

export const metadata: Metadata = {
  title: 'Compete — Price Monitoring',
}

export default async function CompetePage(): Promise<React.ReactElement> {
  return redirect('/dashboard') // Hidden until v1.5 launch
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const hasAccess = await checkCompeteAccess(user.org_id)

  if (!hasAccess) {
    const [competePlans, baseSub] = await Promise.all([
      getActiveCompetePlans(),
      getSubscriptionWithPlan(user.org_id),
    ])
    const hasPaidBasePlan = baseSub?.subscription?.status === 'active'

    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Uptrue Compete</h1>
            <p className="page-subtitle">
              Track competitor prices, stock levels and get alerted when things change.
            </p>
          </div>
        </div>
        <CompetePlanSelector plans={competePlans} hasPaidBasePlan={hasPaidBasePlan ?? false} />
      </div>
    )
  }

  const [products, groups, limitInfo] = await Promise.all([
    getProductsByOrg(user.org_id),
    getProductGroups(user.org_id),
    checkCompeteProductLimit(user.org_id),
  ])

  const ownProducts = products.filter(p => p.is_own_product)
  const competitorProducts = products.filter(p => !p.is_own_product)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compete</h1>
          <p className="page-subtitle">
            Track and compare product prices across your competitors.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/dashboard/compete/connect" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Connect Store
          </Link>
        </div>
      </div>

      {products.length === 0 && (
        <div className="compete-connect-banner">
          <div className="compete-connect-banner-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div className="compete-connect-banner-body">
            <div className="compete-connect-banner-title">Connect your store to auto-sync prices</div>
            <div className="compete-connect-banner-sub">Send price updates automatically from WooCommerce, Shopify, BigCommerce or any platform via webhook.</div>
          </div>
          <Link href="/dashboard/compete/connect" className="btn btn-primary btn-sm">
            Connect Store →
          </Link>
        </div>
      )}

      {/* Quick stats */}
      <div className="compete-stats-row">
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Your Products</div>
          <div className="compete-stat-value">{ownProducts.length}</div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Competitor Products</div>
          <div className="compete-stat-value">{competitorProducts.length}</div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Product Groups</div>
          <div className="compete-stat-value">{groups.length}</div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Tracked / Limit</div>
          <div className="compete-stat-value">
            {limitInfo.currentCount} / {limitInfo.limit}
          </div>
        </div>
      </div>

      {/* Add product form */}
      <AddProductForm
        orgId={user.org_id}
        groups={groups}
        limitAllowed={limitInfo.allowed}
      />

      {/* Products table */}
      <CompeteProductTable
        products={products}
        groups={groups}
        orgId={user.org_id}
      />
    </div>
  )
}
