// @ts-nocheck — dead route, redirects to /dashboard until Compete launches in v1.5
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { getProductById, getPriceHistory, getProductsByGroup } from '@/lib/db/ecom-products'
import { checkCompeteAccess } from '@/lib/utils/plan-limits'
import { IconArrowLeft } from '@/components/icons'
import { TestExtractionPanel } from '@/components/compete/test-extraction-panel'

export const metadata: Metadata = {
  title: 'Product Detail — Compete',
}

function friendlyMethod(method: string | null): string {
  if (!method) return '—'
  const map: Record<string, string> = {
    json_ld: 'Structured data (JSON-LD)',
    css_selector: 'Custom CSS selector',
    microdata: 'Product markup (Microdata)',
    open_graph: 'Open Graph tags',
    shopify_api: 'Shopify API',
    nextjs_hydration: 'JS hydration data',
    data_attr: 'Data attribute',
    text_pattern: 'Price text pattern',
    auto: 'Auto-detected',
  }
  return map[method] ?? method
}

function confidenceBadge(c: number | null): { label: string; color: string; bg: string } {
  if (c === null) return { label: 'Unknown', color: '#64748b', bg: '#f1f5f9' }
  if (c >= 0.8) return { label: 'High', color: '#166534', bg: '#dcfce7' }
  if (c >= 0.5) return { label: 'Medium', color: '#92400e', bg: '#fef3c7' }
  return { label: 'Low', color: '#991b1b', bg: '#fee2e2' }
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return '--'
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', INR: '₹' }
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

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Strip any script tags or event handlers from SVG before rendering
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bjavascript\s*:/gi, '')
}

function buildPriceChart(history: Array<{ price: number; checked_at: string; currency: string }>, currency: string): string {
  if (history.length < 2) return ''

  const W = 580, H = 180
  const padL = 52, padR = 16, padT = 16, padB = 32
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const prices = history.map(h => h.price)
  const times = history.map(h => new Date(h.checked_at).getTime())
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const priceRange = maxPrice - minPrice || maxPrice * 0.1 || 1
  const timeRange = maxTime - minTime || 1

  const cx = (t: number) => padL + ((t - minTime) / timeRange) * innerW
  const cy = (p: number) => padT + innerH - ((p - minPrice) / priceRange) * innerH

  // Line path
  const pts = history.map(h => `${cx(new Date(h.checked_at).getTime()).toFixed(1)},${cy(h.price).toFixed(1)}`)
  const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p).join(' ')
  const lastPt = pts[pts.length - 1]
  const firstPt = pts[0]
  const areaPath = `${linePath} L${lastPt.split(',')[0]},${(padT + innerH).toFixed(1)} L${firstPt.split(',')[0]},${(padT + innerH).toFixed(1)} Z`

  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', INR: '₹' }
  const sym = symbols[currency] ?? ''

  // Y-axis labels (4 levels)
  const yLevels = 4
  let yLabels = ''
  let gridLines = ''
  for (let i = 0; i <= yLevels; i++) {
    const pct = i / yLevels
    const price = minPrice + priceRange * pct
    const y = cy(price)
    yLabels += `<text x="${padL - 6}" y="${y.toFixed(1)}" text-anchor="end" alignment-baseline="middle" fill="#94a3b8" font-size="10" font-family="system-ui">${sym}${price.toFixed(2)}</text>`
    gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${(W - padR).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>`
  }

  // X-axis labels (up to 5, spaced evenly)
  const xCount = Math.min(5, history.length)
  let xLabels = ''
  for (let i = 0; i < xCount; i++) {
    const idx = Math.round((i / (xCount - 1)) * (history.length - 1))
    const h = history[idx]
    const x = cx(new Date(h.checked_at).getTime())
    xLabels += `<text x="${x.toFixed(1)}" y="${(H - padB + 14).toFixed(1)}" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="system-ui">${formatDateShort(h.checked_at)}</text>`
  }

  // Min/Max dot highlights
  const minIdx = prices.indexOf(Math.min(...prices))
  const maxIdx = prices.indexOf(Math.max(...prices))
  const minX = cx(new Date(history[minIdx].checked_at).getTime())
  const minY = cy(history[minIdx].price)
  const maxX = cx(new Date(history[maxIdx].checked_at).getTime())
  const maxY = cy(history[maxIdx].price)

  const dots = history.map((h, i) => {
    const x = cx(new Date(h.checked_at).getTime())
    const y = cy(h.price)
    const isLast = i === history.length - 1
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isLast ? '5' : '3'}" fill="${isLast ? '#3b82f6' : 'white'}" stroke="#3b82f6" stroke-width="2"/>`
  }).join('')

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.01"/>
    </linearGradient>
  </defs>
  ${gridLines}
  ${yLabels}
  ${xLabels}
  <path d="${areaPath}" fill="url(#area-grad)"/>
  <path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  ${dots}
  <circle cx="${minX.toFixed(1)}" cy="${minY.toFixed(1)}" r="4" fill="#22c55e" stroke="white" stroke-width="2"/>
  <circle cx="${maxX.toFixed(1)}" cy="${maxY.toFixed(1)}" r="4" fill="#ef4444" stroke="white" stroke-width="2"/>
</svg>`
}

export default async function ProductDetailPage({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  return redirect('/dashboard') // Hidden until v1.5 launch
  const { id } = await params
  const { period: periodParam } = await searchParams
  const period = periodParam === '60' ? 60 : periodParam === '90' ? 90 : 30

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const hasAccess = await checkCompeteAccess(user.org_id)
  if (!hasAccess) redirect('/dashboard/compete')

  const product = await getProductById(id, user.org_id)
  if (!product) notFound()

  const [priceHistory, groupProducts] = await Promise.all([
    getPriceHistory(product.id, period),
    product.product_group_id
      ? getProductsByGroup(product.product_group_id, user.org_id)
      : Promise.resolve([]),
  ])

  const competitorProducts = groupProducts.filter(p => p.id !== product.id)
  const currency = product.last_currency ?? 'GBP'

  // Price stats from history
  const historyPrices = priceHistory.map(h => h.price)
  const minPrice = historyPrices.length ? Math.min(...historyPrices) : null
  const maxPrice = historyPrices.length ? Math.max(...historyPrices) : null
  const avgPrice = historyPrices.length ? historyPrices.reduce((a, b) => a + b, 0) / historyPrices.length : null

  // Price change vs previous recorded price (prev_price column)
  const prevPrice = (product as unknown as Record<string, unknown>).prev_price as number | null
  const priceChange = product.last_price !== null && prevPrice !== null ? product.last_price - prevPrice : null
  const priceChangePct = priceChange !== null && prevPrice !== null && prevPrice > 0
    ? (priceChange / prevPrice) * 100 : null

  const chartSvg = buildPriceChart(priceHistory, currency)

  // Latest check confidence (last entry in ascending history)
  const latestHistory = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : null
  const latestConfidence = latestHistory ? (latestHistory.confidence as number | null) ?? null : null
  const confBadge = confidenceBadge(latestConfidence)

  const pageUrl = (path: string) => `/dashboard/compete/${id}?period=${path}`

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <Link href="/dashboard/compete" className="db-breadcrumb">← Back to Compete</Link>
          <div className="db-page-title">{product.name}</div>
          <div className="db-page-sub">
            <a href={product.url} target="_blank" rel="noopener noreferrer" className="compete-product-url">
              {product.domain}
            </a>
            {product.is_own_product && (
              <span className="compete-badge compete-badge-own" style={{ marginLeft: 8 }}>Your Product</span>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="compete-stats-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Current Price</div>
          <div className="compete-stat-value">{formatPrice(product.last_price, currency)}</div>
          {priceChange !== null && (
            <div style={{ marginTop: 4, fontSize: 13 }} className={priceChange > 0 ? 'compete-price-up' : priceChange < 0 ? 'compete-price-down' : ''}>
              {priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '–'}
              {' '}{formatPrice(Math.abs(priceChange), currency)}
              {priceChangePct !== null && <span className="compete-change-pct">({priceChangePct > 0 ? '+' : ''}{priceChangePct.toFixed(1)}%)</span>}
            </div>
          )}
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">{period}d Low</div>
          <div className="compete-stat-value" style={{ color: '#22c55e' }}>{formatPrice(minPrice, currency)}</div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">{period}d High</div>
          <div className="compete-stat-value" style={{ color: '#ef4444' }}>{formatPrice(maxPrice, currency)}</div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">{period}d Avg</div>
          <div className="compete-stat-value">{formatPrice(avgPrice, currency)}</div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Stock</div>
          <div className={`compete-stat-value compete-stat-date ${getStockStatusClass(product.last_stock_status)}`}>
            {getStockStatusLabel(product.last_stock_status)}
          </div>
        </div>
        <div className="card compete-stat-card">
          <div className="compete-stat-label">Last Checked</div>
          <div className="compete-stat-value compete-stat-date">{formatDate(product.last_checked_at)}</div>
        </div>
      </div>

      {/* Price chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header card-header-row">
          <div className="card-title">Price History</div>
          <div className="compete-period-filter">
            <Link href={pageUrl('30')} className={`compete-period-btn${period === 30 ? ' active' : ''}`}>30d</Link>
            <Link href={pageUrl('60')} className={`compete-period-btn${period === 60 ? ' active' : ''}`}>60d</Link>
            <Link href={pageUrl('90')} className={`compete-period-btn${period === 90 ? ' active' : ''}`}>90d</Link>
          </div>
        </div>
        <div className="card-content">
          {priceHistory.length < 2 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              {priceHistory.length === 0
                ? 'No price data yet. Price will be recorded on the next check.'
                : 'Only one price point recorded. Chart will appear once more data is available.'}
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: sanitizeSvg(chartSvg) }} />
          )}
        </div>
      </div>

      {/* Extraction info */}
      <div className="card compete-detail-card" style={{ marginBottom: 24 }}>
        <h3 className="compete-detail-heading">Extraction Details</h3>
        <div className="compete-detail-grid">
          <div>
            <span className="compete-detail-label">Method</span>
            <span className="compete-detail-value">{friendlyMethod(product.extraction_method)}</span>
          </div>
          <div>
            <span className="compete-detail-label">Last confidence</span>
            {latestConfidence !== null ? (
              <span
                className="compete-confidence-badge"
                style={{ color: confBadge.color, background: confBadge.bg }}
              >
                {Math.round(latestConfidence * 100)}% — {confBadge.label}
              </span>
            ) : (
              <span className="compete-detail-value" style={{ color: 'var(--text-muted)' }}>No checks yet</span>
            )}
          </div>
          <div>
            <span className="compete-detail-label">Check Interval</span>
            <span className="compete-detail-value">{product.check_interval_minutes} min</span>
          </div>
          <div>
            <span className="compete-detail-label">Currency</span>
            <span className="compete-detail-value">{currency}</span>
          </div>
          <div>
            <span className="compete-detail-label">Status</span>
            <span className="compete-detail-value">{product.is_active ? 'Active' : 'Paused'}</span>
          </div>
          {product.css_selector && (
            <div>
              <span className="compete-detail-label">CSS Selector</span>
              <span className="compete-detail-value"><code>{product.css_selector}</code></span>
            </div>
          )}
        </div>
      </div>

      {/* Test extraction on demand */}
      <TestExtractionPanel
        productUrl={product.url}
        cssSelector={(product as unknown as Record<string, unknown>).css_selector as string | null}
      />

      {/* Price history table */}
      <div className="card compete-detail-card" style={{ marginBottom: 24 }}>
        <h3 className="compete-detail-heading">Price Log (last {period} days)</h3>
        {priceHistory.length === 0 ? (
          <p className="compete-empty-text">No price history yet.</p>
        ) : (
          <div className="compete-table-wrapper">
            <table className="compete-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Stock</th>
                  <th>Method</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.slice().reverse().map((entry, idx, arr) => {
                  const prev = arr[idx + 1]
                  const entryChange = prev ? entry.price - prev.price : null
                  return (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.checked_at)}</td>
                      <td className="compete-price-cell">{formatPrice(entry.price, entry.currency)}</td>
                      <td>
                        {entryChange !== null && Math.abs(entryChange) > 0.001 ? (
                          <span className={entryChange > 0 ? 'compete-price-up' : 'compete-price-down'}>
                            {entryChange > 0 ? '▲' : '▼'} {formatPrice(Math.abs(entryChange), entry.currency)}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td><span className={getStockStatusClass(entry.stock_status)}>{getStockStatusLabel(entry.stock_status)}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{friendlyMethod(entry.extraction_method ?? null)}</td>
                      <td>
                        {entry.confidence !== null ? (() => {
                          const c = entry.confidence as number
                          const badge = confidenceBadge(c)
                          return (
                            <span
                              className="compete-confidence-badge"
                              style={{ color: badge.color, background: badge.bg, fontSize: 11 }}
                            >
                              {Math.round(c * 100)}%
                            </span>
                          )
                        })() : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Competitor comparison */}
      {competitorProducts.length > 0 && (
        <div className="card compete-detail-card">
          <h3 className="compete-detail-heading">Price Comparison — {product.product_group_id ? 'Same Group' : 'Competitors'}</h3>
          <div className="compete-table-wrapper">
            <table className="compete-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Domain</th>
                  <th>Price</th>
                  <th>vs Yours</th>
                  <th>Stock</th>
                  <th>Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {competitorProducts
                  .sort((a, b) => (a.last_price ?? 0) - (b.last_price ?? 0))
                  .map((comp) => {
                    const diff = product.last_price !== null && comp.last_price !== null
                      ? comp.last_price - product.last_price : null
                    const diffPct = diff !== null && product.last_price !== null && product.last_price > 0
                      ? (diff / product.last_price) * 100 : null
                    return (
                      <tr key={comp.id}>
                        <td>
                          <Link href={`/dashboard/compete/${comp.id}`} className="compete-link">
                            {comp.name}
                          </Link>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{comp.domain}</td>
                        <td className="compete-price-cell">{formatPrice(comp.last_price, comp.last_currency ?? 'GBP')}</td>
                        <td>
                          {diff !== null ? (
                            <span className={diff < 0 ? 'compete-price-down' : diff > 0 ? 'compete-price-up' : ''}>
                              {diff > 0 ? '▲' : diff < 0 ? '▼' : '='}{' '}
                              {formatPrice(Math.abs(diff), currency)}
                              {diffPct !== null && <span className="compete-change-pct">({diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%)</span>}
                            </span>
                          ) : '—'}
                        </td>
                        <td><span className={getStockStatusClass(comp.last_stock_status)}>{getStockStatusLabel(comp.last_stock_status)}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(comp.last_checked_at)}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
