'use client'

import { useState } from 'react'
import type { EcomProductGroup } from '@/lib/types'

interface AddProductFormProps {
  orgId: string
  groups: EcomProductGroup[]
  limitAllowed: boolean
}

interface ExtractionPreview {
  success: boolean
  price: number | null
  currency: string
  stockStatus: string | null
  productName: string | null
  extractionMethod: string
  confidence: number
  error?: string
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return '--'
  const symbols: Record<string, string> = { GBP: '\u00A3', USD: '$', EUR: '\u20AC', INR: '\u20B9' }
  const symbol = symbols[currency] ?? currency + ' '
  return `${symbol}${price.toFixed(2)}`
}

export function AddProductForm({
  orgId,
  groups,
  limitAllowed,
}: AddProductFormProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false)
  const [url, setUrl] = useState('')
  const [isOwnProduct, setIsOwnProduct] = useState(false)
  const [groupId, setGroupId] = useState('')
  const [cssSelector, setCssSelector] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<ExtractionPreview | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleExtract(): Promise<void> {
    if (!url.trim()) {
      setError('URL is required')
      return
    }

    // Basic URL validation
    try {
      new URL(url.trim())
    } catch {
      setError('Please enter a valid URL (e.g. https://example.com/product)')
      return
    }

    setExtracting(true)
    setError('')
    setPreview(null)
    setSuccess('')

    try {
      const res = await fetch('/api/v1/compete/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          css_selector: cssSelector.trim() || undefined,
        }),
      })

      const data = await res.json() as ExtractionPreview & { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Extraction failed')
        return
      }

      setPreview(data)
      if (!data.success) {
        setError(data.error ?? 'Could not extract price from this page')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setExtracting(false)
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!preview || !preview.success) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/v1/compete/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          name: preview.productName ?? url.trim(),
          is_own_product: isOwnProduct,
          product_group_id: groupId || undefined,
          css_selector: cssSelector.trim() || undefined,
          extraction_method: preview.extractionMethod,
          price: preview.price,
          currency: preview.currency,
          stock_status: preview.stockStatus,
          confidence: preview.confidence,
        }),
      })

      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to save product')
        return
      }

      setSuccess('Product added successfully! Reload page to see it in the table.')
      setUrl('')
      setCssSelector('')
      setPreview(null)
      setGroupId('')
      setIsOwnProduct(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset(): void {
    setUrl('')
    setCssSelector('')
    setPreview(null)
    setError('')
    setSuccess('')
    setGroupId('')
    setIsOwnProduct(false)
    setExpanded(false)
  }

  if (!limitAllowed) {
    return (
      <div className="card compete-limit-card">
        <p className="compete-limit-msg">
          Product limit reached. Upgrade your plan to track more products.
        </p>
      </div>
    )
  }

  if (!expanded) {
    return (
      <div className="compete-add-trigger">
        <button className="btn btn-primary" onClick={() => setExpanded(true)}>
          + Add Product
        </button>
      </div>
    )
  }

  return (
    <div className="card compete-add-form-card">
      <div className="compete-add-form-header">
        <h3>Add Product to Track</h3>
        <button className="btn btn-ghost" onClick={handleReset}>Cancel</button>
      </div>

      <div className="compete-add-form">
        {/* URL input + extract */}
        <div className="compete-add-url-row">
          <div className="form-group compete-add-url-group">
            <label className="form-label">Product URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://competitor.com/products/blue-widget"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={extracting || saving}
            />
          </div>
          <button
            className="btn btn-primary compete-extract-btn"
            onClick={handleExtract}
            disabled={extracting || saving || !url.trim()}
          >
            {extracting ? 'Extracting...' : 'Extract Price'}
          </button>
        </div>

        {/* Options row */}
        <div className="compete-add-options-row">
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={isOwnProduct}
                onChange={(e) => setIsOwnProduct(e.target.checked)}
                className="compete-checkbox"
              />
              {' '}This is my own product
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Product Group</label>
            <select
              className="form-input compete-filter-select"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">No group</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">CSS Selector (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder=".product-price"
              value={cssSelector}
              onChange={(e) => setCssSelector(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="form-error">{error}</p>}

        {/* Success */}
        {success && <p className="compete-success-msg">{success}</p>}

        {/* Extraction preview */}
        {preview && preview.success && (
          <div className="compete-preview">
            <h4 className="compete-preview-title">Extraction Preview</h4>
            <div className="compete-preview-grid">
              <div className="compete-preview-item">
                <span className="compete-preview-label">Product Name</span>
                <span className="compete-preview-value">
                  {preview.productName ?? 'Not detected'}
                </span>
              </div>
              <div className="compete-preview-item">
                <span className="compete-preview-label">Price</span>
                <span className="compete-preview-value compete-preview-price">
                  {formatPrice(preview.price, preview.currency)}
                </span>
              </div>
              <div className="compete-preview-item">
                <span className="compete-preview-label">Currency</span>
                <span className="compete-preview-value">{preview.currency}</span>
              </div>
              <div className="compete-preview-item">
                <span className="compete-preview-label">Stock Status</span>
                <span className="compete-preview-value">
                  {preview.stockStatus ?? 'Not detected'}
                </span>
              </div>
              <div className="compete-preview-item">
                <span className="compete-preview-label">Method</span>
                <span className="compete-preview-value">{preview.extractionMethod}</span>
              </div>
              <div className="compete-preview-item">
                <span className="compete-preview-label">Confidence</span>
                <span className="compete-preview-value">
                  {Math.round(preview.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="compete-preview-actions">
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Confirm & Track'}
              </button>
              <button className="btn btn-ghost" onClick={() => setPreview(null)}>
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
