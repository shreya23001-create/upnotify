'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { EcomProduct, EcomProductGroup } from '@/lib/types'

interface CompeteProductTableProps {
  products: EcomProduct[]
  groups: EcomProductGroup[]
  orgId: string
}

type FilterType = 'all' | 'own' | 'competitor'

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

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function CompeteProductTable({
  products,
  groups,
  orgId,
}: CompeteProductTableProps): React.ReactElement {
  const [items, setItems] = useState<EcomProduct[]>(products)
  const [filter, setFilter] = useState<FilterType>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = items.filter(p => {
    if (filter === 'own' && !p.is_own_product) return false
    if (filter === 'competitor' && p.is_own_product) return false
    if (groupFilter !== 'all' && p.product_group_id !== groupFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return p.name.toLowerCase().includes(term) || p.domain.toLowerCase().includes(term)
    }
    return true
  })

  async function handleDelete(id: string): Promise<void> {
    if (deleting) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/v1/compete/products?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems(prev => prev.filter(p => p.id !== id))
      }
    } catch {
      // Will show stale data until refresh
    } finally {
      setDeleting(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="card compete-empty-card">
        <div className="compete-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <p className="compete-empty-title">No products tracked yet</p>
        <p className="compete-empty-subtitle">
          Add a product URL above to start tracking prices across your competitors.
        </p>
      </div>
    )
  }

  return (
    <div className="compete-products-section">
      {/* Filters */}
      <div className="compete-filters">
        <input
          type="text"
          className="form-input compete-search-input"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-input compete-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
        >
          <option value="all">All Products</option>
          <option value="own">Your Products</option>
          <option value="competitor">Competitors</option>
        </select>
        {groups.length > 0 && (
          <select
            className="form-input compete-filter-select"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card compete-table-card">
        <div className="compete-table-wrapper">
          <table className="compete-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Domain</th>
                <th>Type</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Last Checked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link
                      href={`/dashboard/compete/${product.id}`}
                      className="compete-product-name-link"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="compete-domain-cell">{product.domain}</td>
                  <td>
                    <span className={`compete-badge ${product.is_own_product ? 'compete-badge-own' : 'compete-badge-competitor'}`}>
                      {product.is_own_product ? 'Yours' : 'Competitor'}
                    </span>
                  </td>
                  <td className="compete-price-cell">
                    {(() => {
                      const p = product as unknown as Record<string, unknown>
                      const prev = p.prev_price as number | null
                      const curr = product.last_price
                      const dir = curr !== null && prev !== null && Math.abs(curr - prev) > 0.001
                        ? curr > prev ? 'up' : 'down' : null
                      const pct = dir && prev && prev > 0 ? ((curr! - prev) / prev * 100) : null
                      return (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{formatPrice(product.last_price, product.last_currency)}</span>
                          {dir && (
                            <span className={`compete-dir-badge compete-dir-${dir}`} title={pct !== null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs previous` : ''}>
                              {dir === 'up' ? '▲' : '▼'}
                              {pct !== null && <span style={{ fontSize: 10, marginLeft: 2 }}>{Math.abs(pct).toFixed(1)}%</span>}
                            </span>
                          )}
                        </span>
                      )
                    })()}
                  </td>
                  <td>
                    <span className={getStockStatusClass(product.last_stock_status)}>
                      {getStockStatusLabel(product.last_stock_status)}
                    </span>
                  </td>
                  <td className="compete-date-cell">{timeAgo(product.last_checked_at)}</td>
                  <td>
                    <button
                      className="btn-icon-sm compete-delete-btn"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      title="Remove product"
                      aria-label={`Remove ${product.name}`}
                    >
                      {deleting === product.id ? '...' : '\u00D7'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="compete-table-empty-msg">No products match your filters.</p>
        )}
      </div>
    </div>
  )
}
