import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { getProductById, getPriceHistory, getProductsByGroup } from '@/lib/db/ecom-products'
import { checkCompeteAccess } from '@/lib/utils/plan-limits'
import { IconArrowLeft } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Product Detail — Compete',
}

interface PageProps {
  params: Promise<{ id: string }>
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return '--'
  const symbols: Record<string, string> = { GBP: '\u00A3', USD: '$', EUR: '\u20AC', INR: '\u20B9' }
  const symbol = symbols[currency] ?? currency + ' '
  return `${symbol}${price.toFixed(2)}`
}

function getStockStatusLabel(status: string | null): string {
  if (status === 'in_stock') return 'In Stock'
  if (status === 'out_of_stock') return 'Out of Stock'
  if (status === 'low_stock') return 'Low Stock'
  return 'Unknown'
}

function getStockStatusClass(status: string | null): string {
  if (status === 'in_stock') return 'compete-stock-in'
  if (status === 'out_of_stock') return 'compete-stock-out'
  if (status === 'low_stock') return 'compete-stock-low'
  return 'compete-stock-unknown'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ProductDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const hasAccess = await checkCompeteAccess(user.org_id)
  if (!hasAccess) redirect('/dashboard/compete')

  const product = await getProductById(id, user.org_id)
  if (!product) notFound()

  const [priceHistory, groupProducts] = await Promise.all([
    getPriceHistory(product.id, 90),
    product.product_group_id
      ? getProductsByGroup(product.product_group_id, user.org_id)
      : Promise.resolve([]),
  ])

  const competitorProducts = groupProducts.filter(p => p.id !== product.id)

  // Calculate price change from history
  let priceChange: number | null = null
  let priceChangePercent: number | null = null
  if (priceHistory.length >= 2) {
    const latest = priceHistory[priceHistory.length - 1]
    const previous = priceHistory[priceHistory.length - 2]
    priceChange = latest.price - previous.price
    priceChangePercent = previous.price > 0
      ? (priceChange / previous.price) * 100
      : null
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/dashboard/compete" className="compete-back-link">
            <IconArrowLeft size={16} />
            <span>Back to Compete</span>
          </Link>
          <h1 className="page-title">{product.name}</h1>
          <p className="page-subtitle">
            <a href={product.url} target="_blank" rel="noopener noreferrer" className="compete-product-url">
              {product.domain}
            </a>
            {product.is_own_product && (
              <span className="compete-badge compete-badge-own">Your Product</span>
            )}
          </p>
        </div>
      </div>

      {/* Current price summary */}
      <div className="compete-stats-row">
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Current Price</div>
          <div className="compete-stat-value">
            {formatPrice(product.last_price, product.last_currency)}
          </div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Price Change</div>
          <div className={`compete-stat-value ${priceChange !== null && priceChange > 0 ? 'compete-price-up' : ''} ${priceChange !== null && priceChange < 0 ? 'compete-price-down' : ''}`}>
            {priceChange !== null ? (
              <>
                {priceChange > 0 ? '\u2191' : priceChange < 0 ? '\u2193' : '--'}
                {' '}{formatPrice(Math.abs(priceChange), product.last_currency)}
                {priceChangePercent !== null && (
                  <span className="compete-change-pct">
                    ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)
                  </span>
                )}
              </>
            ) : '--'}
          </div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Stock Status</div>
          <div className={`compete-stat-value ${getStockStatusClass(product.last_stock_status)}`}>
            {getStockStatusLabel(product.last_stock_status)}
          </div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Last Checked</div>
          <div className="compete-stat-value compete-stat-date">
            {formatDate(product.last_checked_at)}
          </div>
        </div>
      </div>

      {/* Extraction info */}
      <div className="card compete-detail-card">
        <h3 className="compete-detail-heading">Extraction Details</h3>
        <div className="compete-detail-grid">
          <div>
            <span className="compete-detail-label">Method</span>
            <span className="compete-detail-value">{product.extraction_method}</span>
          </div>
          <div>
            <span className="compete-detail-label">Check Interval</span>
            <span className="compete-detail-value">{product.check_interval_minutes} min</span>
          </div>
          <div>
            <span className="compete-detail-label">Currency</span>
            <span className="compete-detail-value">{product.last_currency}</span>
          </div>
          <div>
            <span className="compete-detail-label">Status</span>
            <span className="compete-detail-value">{product.is_active ? 'Active' : 'Paused'}</span>
          </div>
        </div>
      </div>

      {/* Price history table */}
      <div className="card compete-detail-card">
        <h3 className="compete-detail-heading">Price History (last 90 days)</h3>
        {priceHistory.length === 0 ? (
          <p className="compete-empty-text">No price history yet. Price will be recorded on next check.</p>
        ) : (
          <div className="compete-table-wrapper">
            <table className="compete-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Method</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.slice().reverse().map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.checked_at)}</td>
                    <td className="compete-price-cell">
                      {formatPrice(entry.price, entry.currency)}
                    </td>
                    <td>
                      <span className={getStockStatusClass(entry.stock_status)}>
                        {getStockStatusLabel(entry.stock_status)}
                      </span>
                    </td>
                    <td>{entry.extraction_method ?? '--'}</td>
                    <td>{entry.confidence !== null ? `${Math.round(entry.confidence * 100)}%` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Competitor comparison (if in a product group) */}
      {competitorProducts.length > 0 && (
        <div className="card compete-detail-card">
          <h3 className="compete-detail-heading">Competitors in Same Group</h3>
          <div className="compete-table-wrapper">
            <table className="compete-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Domain</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {competitorProducts.map((comp) => (
                  <tr key={comp.id}>
                    <td>
                      <Link href={`/dashboard/compete/${comp.id}`} className="compete-link">
                        {comp.name}
                      </Link>
                    </td>
                    <td>{comp.domain}</td>
                    <td className="compete-price-cell">
                      {formatPrice(comp.last_price, comp.last_currency)}
                      {product.last_price !== null && comp.last_price !== null && (
                        <span className={
                          comp.last_price < product.last_price
                            ? 'compete-price-lower'
                            : comp.last_price > product.last_price
                              ? 'compete-price-higher'
                              : ''
                        }>
                          {comp.last_price < product.last_price && ' (cheaper)'}
                          {comp.last_price > product.last_price && ' (more expensive)'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={getStockStatusClass(comp.last_stock_status)}>
                        {getStockStatusLabel(comp.last_stock_status)}
                      </span>
                    </td>
                    <td>{formatDate(comp.last_checked_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
