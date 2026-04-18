'use client'

import { useState } from 'react'

interface BlacklistEntry {
  list: string
  displayName: string
  listed: boolean
  details: string
}

interface BlacklistResult {
  domain: string
  ip: string | null
  responseTimeMs: number
  totalLists: number
  listedCount: number
  cleanCount: number
  results: BlacklistEntry[]
  overallStatus: 'clean' | 'listed' | 'error'
  error?: string
}

export function BlacklistCheckerTool(): React.ReactElement {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BlacklistResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    const cleaned = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')

    if (!cleaned) {
      setError('Please enter a domain name')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/blacklist-checker?domain=${encodeURIComponent(cleaned)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to check blacklist status')
        return
      }

      setResult(data as BlacklistResult)
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

  const statusColor =
    result?.overallStatus === 'clean'
      ? '#10b981'
      : result?.overallStatus === 'listed'
        ? '#ef4444'
        : '#f59e0b'

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="text"
          className="form-input ssl-checker-input"
          placeholder="Enter domain (e.g., example.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Domain to check against blacklists"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Blacklists'}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
          Checking 10 blacklists — this may take a few seconds...
        </div>
      )}

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Summary badge */}
          <div
            className="card"
            style={{
              padding: '24px',
              textAlign: 'center',
              borderTop: `4px solid ${statusColor}`,
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background:
                  result.overallStatus === 'clean'
                    ? '#d1fae5'
                    : result.overallStatus === 'listed'
                      ? '#fee2e2'
                      : '#fef3c7',
                color:
                  result.overallStatus === 'clean'
                    ? '#065f46'
                    : result.overallStatus === 'listed'
                      ? '#7f1d1d'
                      : '#92400e',
                borderRadius: '999px',
                padding: '10px 24px',
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>
                {result.overallStatus === 'clean' ? '✓' : result.overallStatus === 'listed' ? '✗' : '⚠'}
              </span>
              {result.overallStatus === 'clean'
                ? 'Clean — not listed on any blacklist'
                : result.overallStatus === 'listed'
                  ? `Listed on ${result.listedCount} blacklist${result.listedCount !== 1 ? 's' : ''}`
                  : 'Could not resolve domain'}
            </div>

            {result.error && (
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                {result.error}
              </p>
            )}

            {result.ip && (
              <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>
                IP checked: <code style={{ fontFamily: 'monospace' }}>{result.ip}</code>
                {' · '}{result.responseTimeMs}ms
              </p>
            )}
          </div>

          {/* Stats row */}
          {result.results.length > 0 && (
            <div className="ssl-details-grid" style={{ marginBottom: '16px' }}>
              <div className="card ssl-detail-card">
                <span className="ssl-detail-label">Lists Checked</span>
                <span className="ssl-detail-value">{result.totalLists}</span>
              </div>
              <div className="card ssl-detail-card">
                <span className="ssl-detail-label">Clean</span>
                <span className="ssl-detail-value" style={{ color: '#10b981' }}>
                  {result.cleanCount}
                </span>
              </div>
              <div className="card ssl-detail-card">
                <span className="ssl-detail-label">Listed</span>
                <span className="ssl-detail-value" style={{ color: result.listedCount > 0 ? '#ef4444' : '#10b981' }}>
                  {result.listedCount}
                </span>
              </div>
            </div>
          )}

          {/* Per-list results */}
          {result.results.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>
                Blacklist Results
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {result.results.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom:
                        i < result.results.length - 1
                          ? '1px solid var(--color-border, #e5e7eb)'
                          : 'none',
                    }}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: entry.listed ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      {entry.listed ? '✗' : '✓'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{entry.displayName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {entry.list}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: entry.listed ? '#ef4444' : '#10b981',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.listed ? 'LISTED' : 'Clean'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
