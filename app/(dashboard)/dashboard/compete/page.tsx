import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { getProductsByOrg, getProductGroups } from '@/lib/db/ecom-products'
import { checkCompeteAccess, checkCompeteProductLimit } from '@/lib/utils/plan-limits'
import { CompeteProductTable } from '@/components/compete/product-table'
import { AddProductForm } from '@/components/compete/add-product-form'

export const metadata: Metadata = {
  title: 'Compete — Price Monitoring',
}

export default async function CompetePage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const hasAccess = await checkCompeteAccess(user.org_id)

  if (!hasAccess) {
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
        <div className="compete-upgrade-cta">
          <div className="compete-upgrade-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <h2 className="compete-upgrade-title">Price Intelligence for Your Products</h2>
          <p className="compete-upgrade-description">
            Compete is available on Builder and Scale plans. Track competitor prices, monitor stock
            availability, and get real-time alerts when competitors change their pricing.
          </p>
          <ul className="compete-upgrade-features">
            <li>Track up to 1,000 products across competitors</li>
            <li>Automatic price extraction from any ecommerce site</li>
            <li>Real-time stock availability monitoring</li>
            <li>Webhook integration with WooCommerce, Shopify, BigCommerce</li>
            <li>Price change alerts via email, Slack, or webhook</li>
          </ul>
          <Link href="/dashboard/settings" className="btn btn-primary compete-upgrade-btn">
            Upgrade Your Plan
          </Link>
        </div>
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
          <Link href="/dashboard/compete/connect" className="btn btn-ghost">
            Connect Store
          </Link>
        </div>
      </div>

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
