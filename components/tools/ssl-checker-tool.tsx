'use client'

import { useState } from 'react'

interface SslResult {
  valid: boolean
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  protocol: string
  responseTimeMs: number
  errorMessage?: string
}

function getExpiryStatus(days: number): { label: string; color: string; className: string } {
  if (days < 0) return { label: 'Expired', color: 'var(--color-danger, #ef4444)', className: 'ssl-status-expired' }
  if (days < 30) return { label: 'Critical', color: 'var(--color-danger, #ef4444)', className: 'ssl-status-critical' }
  if (days <= 90) return { label: 'Warning', color: 'var(--color-warning, #f59e0b)', className: 'ssl-status-warning' }
  return { label: 'Healthy', color: 'var(--color-success, #22c55e)', className: 'ssl-status-healthy' }
}

export function SslCheckerTool(): React.ReactElement {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SslResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!cleaned) {
      setError('Please enter a domain')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/ssl-check?domain=${encodeURIComponent(cleaned)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to check SSL certificate')
        return
      }

      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="text"
          className="form-input ssl-checker-input"
          placeholder="Enter domain (e.g., github.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Domain to check"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check SSL'}
        </button>
      </div>

      {error && (
        <div className="ssl-checker-error">{error}</div>
      )}

      {result && (
        <div className="ssl-checker-results">
          {result.errorMessage ? (
            <div className="card ssl-result-card ssl-result-error">
              <h3>SSL Check Failed</h3>
              <p>{result.errorMessage}</p>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`ssl-status-banner ${getExpiryStatus(result.daysUntilExpiry).className}`}>
                <div className="ssl-status-banner-left">
                  <span className="ssl-status-indicator" style={{ background: getExpiryStatus(result.daysUntilExpiry).color }} />
                  <span className="ssl-status-label">
                    {getExpiryStatus(result.daysUntilExpiry).label}
                  </span>
                </div>
                <div className="ssl-status-banner-right">
                  {result.daysUntilExpiry < 0
                    ? `Expired ${Math.abs(result.daysUntilExpiry)} days ago`
                    : `${result.daysUntilExpiry} days remaining`
                  }
                </div>
              </div>

              {/* Details grid */}
              <div className="ssl-details-grid">
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Issuer</span>
                  <span className="ssl-detail-value">{result.issuer}</span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Subject</span>
                  <span className="ssl-detail-value">{result.subject}</span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Valid From</span>
                  <span className="ssl-detail-value">
                    {new Date(result.validFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Expires</span>
                  <span className="ssl-detail-value" style={{ color: getExpiryStatus(result.daysUntilExpiry).color }}>
                    {new Date(result.validTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">TLS Protocol</span>
                  <span className="ssl-detail-value">{result.protocol || 'TLS 1.2+'}</span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Check Time</span>
                  <span className="ssl-detail-value">{result.responseTimeMs}ms</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
