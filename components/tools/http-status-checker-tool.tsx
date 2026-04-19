'use client'

import { useState } from 'react'
import { MonitorNudge, toolDomain } from './monitor-nudge'

interface Hop {
  url: string
  status: number
  statusText: string
  location: string | null
  responseTimeMs: number
}

interface HttpStatusResult {
  originalUrl: string
  finalUrl: string
  finalStatus: number
  finalStatusText: string
  totalResponseTimeMs: number
  hops: Hop[]
  finalHeaders: Record<string, string>
  isRedirect: boolean
  redirectCount: number
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return '#10b981'
  if (code >= 300 && code < 400) return '#3b82f6'
  if (code >= 400 && code < 500) return '#f59e0b'
  if (code >= 500) return '#ef4444'
  return 'var(--text-muted)'
}

function statusExplanation(code: number): string {
  const map: Record<number, string> = {
    200: 'The request was successful. The server returned the requested page.',
    201: 'The request was fulfilled and a new resource was created.',
    204: 'The request was successful but the server has no content to return.',
    301: 'The page has permanently moved to a new URL. Browsers and search engines will update their records.',
    302: 'Temporary redirect. The page is temporarily at a different URL. Search engines keep the original URL indexed.',
    303: 'Redirect after a POST request — the browser should GET the new URL.',
    304: 'The page has not been modified since the last visit. The browser uses its cached version.',
    307: 'Temporary redirect that preserves the HTTP method (POST stays POST).',
    308: 'Permanent redirect that preserves the HTTP method (POST stays POST).',
    400: 'Bad request — the server could not understand the request due to invalid syntax.',
    401: 'Authentication required — you need to log in to access this page.',
    403: 'Forbidden — the server understood the request but refuses to authorise it.',
    404: 'Not found — the page does not exist on this server.',
    405: 'Method not allowed — the HTTP method used is not supported for this URL.',
    410: 'Gone — the page has been permanently removed and will not return.',
    429: 'Too many requests — you\'ve been rate limited. Try again later.',
    500: 'Internal server error — the server encountered an unexpected condition.',
    502: 'Bad gateway — the server received an invalid response from an upstream server.',
    503: 'Service unavailable — the server is temporarily overloaded or down for maintenance.',
    504: 'Gateway timeout — the server did not receive a timely response from an upstream server.',
  }
  return map[code] || `HTTP ${code} response received from the server.`
}

function formatHeaderName(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-')
}

export function HttpStatusCheckerTool(): React.ReactElement {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HttpStatusResult | null>(null)
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
      const res = await fetch(`/api/tools/http-status?url=${encodeURIComponent(withScheme)}`)
      const data: unknown = await res.json()

      if (!res.ok) {
        const errData = data as { error?: string }
        setError(errData.error || 'Failed to check HTTP status')
        return
      }

      setResult(data as HttpStatusResult)
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

  const finalHeaderEntries = result
    ? Object.entries(result.finalHeaders).filter(([, v]) => v !== null && v !== '')
    : []

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
          aria-label="URL to check HTTP status"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Final status card */}
          <div className="card" style={{ padding: '1.5rem 2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: statusColor(result.finalStatus),
                }}
                aria-label={`HTTP status: ${result.finalStatus}`}
              >
                {result.finalStatus}
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: statusColor(result.finalStatus), marginTop: '0.2rem' }}>
                {result.finalStatusText}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {statusExplanation(result.finalStatus)}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {result.isRedirect && (
                  <span style={{ marginRight: '0.75rem' }}>
                    {result.redirectCount} redirect{result.redirectCount !== 1 ? 's' : ''}
                  </span>
                )}
                <span>{result.totalResponseTimeMs}ms total</span>
              </div>
            </div>
          </div>

          {/* Redirect chain / hops */}
          {result.hops.length > 1 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Request Path ({result.hops.length} step{result.hops.length !== 1 ? 's' : ''})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {result.hops.map((hop, idx) => (
                  <div key={idx}>
                    <div
                      className="card"
                      style={{
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: statusColor(hop.status),
                          minWidth: '2.5rem',
                        }}
                      >
                        {hop.status}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.8125rem',
                          wordBreak: 'break-all',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {hop.url}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {hop.responseTimeMs}ms
                      </span>
                    </div>
                    {idx < result.hops.length - 1 && (
                      <div style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', lineHeight: '1.2' }}>
                        ↓ redirects to
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final URL if different */}
          {result.isRedirect && (
            <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', paddingTop: '0.1rem' }}>
                Final URL:
              </span>
              <a
                href={result.finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.8125rem', wordBreak: 'break-all', color: 'var(--color-primary)' }}
              >
                {result.finalUrl}
              </a>
            </div>
          )}

          {/* Response headers */}
          {finalHeaderEntries.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Response Headers
              </h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '40%' }}>
                        Header
                      </th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalHeaderEntries.map(([name, value], idx) => (
                      <tr
                        key={name}
                        style={{
                          borderBottom: idx < finalHeaderEntries.length - 1 ? '1px solid var(--color-border)' : 'none',
                        }}
                      >
                        <td style={{ padding: '0.5rem 1rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                          {formatHeaderName(name)}
                        </td>
                        <td style={{ padding: '0.5rem 1rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {result && <MonitorNudge toolType="http-status" domain={toolDomain(result.originalUrl)} detail={String(result.finalStatus)} />}
    </div>
  )
}
