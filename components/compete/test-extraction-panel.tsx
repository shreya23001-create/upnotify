'use client'

import { useState } from 'react'

interface TestExtractionPanelProps {
  productUrl: string
  cssSelector: string | null
}

interface ExtractionResult {
  success: boolean
  price: number | null
  currency: string
  stockStatus: string | null
  productName: string | null
  extractionMethod: string
  confidence: number
  error?: string
}

function confidenceLevel(c: number): { label: string; color: string; bg: string } {
  if (c >= 0.8) return { label: 'High confidence', color: '#166534', bg: '#dcfce7' }
  if (c >= 0.5) return { label: 'Medium confidence', color: '#92400e', bg: '#fef3c7' }
  return { label: 'Low confidence', color: '#991b1b', bg: '#fee2e2' }
}

export function friendlyMethod(method: string): string {
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

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return '--'
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', INR: '₹' }
  const symbol = symbols[currency] ?? currency + ' '
  return `${symbol}${price.toFixed(2)}`
}

export function TestExtractionPanel({
  productUrl,
  cssSelector,
}: TestExtractionPanelProps): React.ReactElement {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [customSelector, setCustomSelector] = useState(cssSelector ?? '')
  const [showSelectorEdit, setShowSelectorEdit] = useState(false)
  const [error, setError] = useState('')

  async function handleTest(): Promise<void> {
    setTesting(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/v1/compete/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: productUrl,
          css_selector: customSelector.trim() || undefined,
        }),
      })

      const data = await res.json() as ExtractionResult & { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Extraction failed')
        return
      }
      setResult(data)
      if (!data.success) {
        setError(data.error ?? 'Could not extract price from this page')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="card compete-detail-card compete-test-panel" style={{ marginBottom: 24 }}>
      <div className="compete-test-header">
        <h3 className="compete-detail-heading" style={{ margin: 0 }}>Test Extraction</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 13, padding: '4px 10px' }}
            onClick={() => setShowSelectorEdit(!showSelectorEdit)}
          >
            {showSelectorEdit ? 'Hide selector' : 'Edit CSS selector'}
          </button>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '4px 12px' }}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : '▶ Test now'}
          </button>
        </div>
      </div>

      {showSelectorEdit && (
        <div className="form-group compete-test-selector-row">
          <label className="form-label">CSS Selector (optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder=".product-price, [data-price], #price"
            value={customSelector}
            onChange={e => setCustomSelector(e.target.value)}
          />
          <p className="compete-test-selector-hint">
            Right-click the price on the product page → Inspect → copy the element's class or ID.
            Examples: <code>.price</code> · <code>#product-price</code> · <code>[data-price]</code>
          </p>
        </div>
      )}

      {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}

      {result && result.success && (
        <div className="compete-test-result">
          <div className="compete-test-result-grid">
            <div>
              <span className="compete-detail-label">Price found</span>
              <span className="compete-detail-value compete-preview-price">
                {formatPrice(result.price, result.currency)}
              </span>
            </div>
            <div>
              <span className="compete-detail-label">Stock</span>
              <span className="compete-detail-value">{result.stockStatus ?? 'Not detected'}</span>
            </div>
            <div>
              <span className="compete-detail-label">Method</span>
              <span className="compete-detail-value">{friendlyMethod(result.extractionMethod)}</span>
            </div>
            <div>
              <span className="compete-detail-label">Confidence</span>
              <span
                className="compete-confidence-badge"
                style={{
                  color: confidenceLevel(result.confidence).color,
                  background: confidenceLevel(result.confidence).bg,
                }}
              >
                {Math.round(result.confidence * 100)}% — {confidenceLevel(result.confidence).label}
              </span>
            </div>
          </div>

          {result.confidence < 0.65 && (
            <div className="compete-low-confidence-warning">
              <strong>Low/medium confidence.</strong> The extractor found a price but the result
              may be unreliable. Add a CSS selector above targeting the price element for
              more accurate tracking.
            </div>
          )}
        </div>
      )}

      {result && !result.success && (
        <div className="compete-test-result compete-test-result-fail">
          Extraction failed — the page may block automated requests or use JavaScript rendering.
          Try adding a CSS selector. If the problem persists, check the URL is a direct product page.
        </div>
      )}
    </div>
  )
}
