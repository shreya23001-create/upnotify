'use client'

import { useState } from 'react'

interface ChainStep {
  step: number
  url: string
  status: number
  statusText: string
  redirectsTo: string | null
  responseTimeMs: number
  isHttpToHttps: boolean
  isWwwChange: boolean
}

interface RedirectChainResult {
  originalUrl: string
  finalUrl: string
  totalHops: number
  totalTimeMs: number
  hasLoop: boolean
  chain: ChainStep[]
  issues: string[]
}

function statusColor(code: number): string {
  if (code === 301 || code === 308) return '#10b981'
  if (code === 302 || code === 303 || code === 307) return '#f59e0b'
  if (code >= 200 && code < 300) return '#10b981'
  if (code >= 400) return '#ef4444'
  return '#3b82f6'
}

function statusLabel(code: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    301: 'Permanent',
    302: 'Temporary',
    303: 'See Other',
    307: 'Temp (method-safe)',
    308: 'Permanent (method-safe)',
    404: 'Not Found',
    500: 'Server Error',
  }
  return map[code] || String(code)
}

export function RedirectChainCheckerTool(): React.ReactElement {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedirectChainResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a URL')
      return
    }
    const withScheme =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/redirect-chain?url=${encodeURIComponent(withScheme)}`)
      const data: unknown = await res.json()

      if (!res.ok) {
        const errData = data as { error?: string }
        setError(errData.error || 'Failed to trace redirect chain')
        return
      }

      setResult(data as RedirectChainResult)
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

  const hasIssues = result && result.issues.length > 0
  const isClean = result && !hasIssues && result.totalHops <= 2

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="url"
          className="form-input ssl-checker-input"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="URL to trace redirect chain"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Tracing...' : 'Trace Redirects'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Summary card */}
          <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: result.hasLoop ? '#ef4444' : (result.totalHops <= 2 ? '#10b981' : result.totalHops <= 4 ? '#f59e0b' : '#ef4444'),
                }}
              >
                {result.hasLoop ? '∞' : result.totalHops}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                {result.hasLoop ? 'Loop' : result.totalHops === 1 ? 'hop' : 'hops'}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              {isClean ? (
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#10b981' }}>
                  Clean redirect chain — no issues detected.
                </p>
              ) : result.hasLoop ? (
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#ef4444' }}>
                  Redirect loop detected — this URL will never resolve.
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {result.totalHops} request{result.totalHops !== 1 ? 's' : ''} made in {result.totalTimeMs}ms.
                  {result.totalHops > 1 && ` ${result.totalHops - 1} redirect${result.totalHops - 1 !== 1 ? 's' : ''} followed.`}
                </p>
              )}
              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {result.totalTimeMs}ms total
              </div>
            </div>
          </div>

          {/* Issues */}
          {hasIssues && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.issues.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    background: '#ef444410',
                    border: '1px solid #ef444430',
                    fontSize: '0.875rem',
                    color: '#ef4444',
                  }}
                  role="alert"
                >
                  <span style={{ flexShrink: 0, marginTop: '0.1rem' }} aria-hidden="true">⚠</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chain visualisation */}
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.875rem' }}>
              Redirect Chain
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {result.chain.map((step, idx) => {
                const isLast = idx === result.chain.length - 1
                const isFinal = step.redirectsTo === null
                return (
                  <div key={idx}>
                    <div
                      className="card"
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderLeft: `3px solid ${statusColor(step.status)}`,
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: '0.75rem',
                        alignItems: 'start',
                      }}
                    >
                      {/* Step number + status */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '3rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Step {step.step}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: statusColor(step.status),
                            lineHeight: 1,
                          }}
                        >
                          {step.status}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.4rem',
                            borderRadius: 3,
                            background: `${statusColor(step.status)}20`,
                            color: statusColor(step.status),
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusLabel(step.status)}
                        </span>
                      </div>

                      {/* URL and badges */}
                      <div>
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.8125rem',
                            wordBreak: 'break-all',
                            color: isFinal ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            fontWeight: isFinal ? 600 : 400,
                          }}
                        >
                          {step.url}
                        </a>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
                          {step.isHttpToHttps && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: '#10b98115', color: '#10b981', fontWeight: 600 }}>
                              HTTP → HTTPS
                            </span>
                          )}
                          {step.isWwwChange && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: '#6366f115', color: '#6366f1', fontWeight: 600 }}>
                              www change
                            </span>
                          )}
                          {isFinal && !step.redirectsTo && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: '#10b98115', color: '#10b981', fontWeight: 600 }}>
                              Final destination
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Response time */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {step.responseTimeMs}ms
                      </div>
                    </div>

                    {/* Arrow between steps */}
                    {!isLast && (
                      <div
                        style={{
                          paddingLeft: '1.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: '1.4',
                          marginTop: '0.125rem',
                          marginBottom: '0.125rem',
                        }}
                        aria-hidden="true"
                      >
                        ↓
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Final destination callout */}
          {result.totalHops > 1 && (
            <div className="card" style={{ padding: '0.875rem 1.25rem', marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', borderLeft: '3px solid #10b981' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', paddingTop: '0.1rem' }}>
                Final URL:
              </span>
              <a
                href={result.finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.8125rem', wordBreak: 'break-all', color: 'var(--color-primary)', fontWeight: 600 }}
              >
                {result.finalUrl}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
