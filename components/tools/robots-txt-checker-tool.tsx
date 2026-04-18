'use client'

import { useState } from 'react'

interface RobotsRule {
  userAgent: string
  disallowed: string[]
  allowed: string[]
  crawlDelay: number | null
}

interface RobotsTxtResult {
  url: string
  found: boolean
  statusCode: number
  responseTimeMs: number
  contentLength: number
  content: string
  rules: RobotsRule[]
  sitemaps: string[]
  issues: string[]
  blocksGooglebot: boolean
  blocksBingbot: boolean
  disallowsAll: boolean
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function RobotsTxtCheckerTool(): React.ReactElement {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RobotsTxtResult | null>(null)
  const [error, setError] = useState('')
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())

  async function handleCheck(): Promise<void> {
    const cleaned = url.trim()
    if (!cleaned) {
      setError('Please enter a URL or domain')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setExpandedAgents(new Set())

    try {
      const res = await fetch(`/api/tools/robots-txt?url=${encodeURIComponent(cleaned)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch robots.txt')
        return
      }

      setResult(data as RobotsTxtResult)
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

  function toggleAgent(agent: string): void {
    setExpandedAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agent)) {
        next.delete(agent)
      } else {
        next.add(agent)
      }
      return next
    })
  }

  const isHealthy = result && result.found && result.issues.length === 0

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="text"
          className="form-input ssl-checker-input"
          placeholder="Enter URL or domain (e.g., github.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="URL to check robots.txt"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Check robots.txt'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Summary banner */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderLeft: `4px solid ${isHealthy ? '#10b981' : result.found ? '#f59e0b' : '#ef4444'}`,
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '22px' }}>
              {isHealthy ? '✅' : result.found ? '⚠️' : '❌'}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>
                {!result.found
                  ? 'robots.txt not found'
                  : isHealthy
                    ? 'Search engine friendly'
                    : `${result.issues.length} issue${result.issues.length !== 1 ? 's' : ''} detected`}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #6b7280)', marginTop: '2px' }}>
                {result.url} · {result.responseTimeMs}ms
              </div>
            </div>
          </div>

          {/* Issues list */}
          {result.issues.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600 }}>Issues</h3>
              <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                {result.issues.map((issue, i) => (
                  <li key={i} style={{ color: '#ef4444', marginBottom: '4px', fontSize: '14px' }}>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sitemaps */}
          {result.sitemaps.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600 }}>
                Sitemaps ({result.sitemaps.length})
              </h3>
              <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                {result.sitemaps.map((sm, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    <a
                      href={sm}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--color-primary, #3b82f6)', wordBreak: 'break-all' }}
                    >
                      {sm}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Crawl rules per user agent */}
          {result.rules.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>
                Crawl Rules ({result.rules.length} user agent{result.rules.length !== 1 ? 's' : ''})
              </h3>
              {result.rules.map((rule, i) => (
                <div
                  key={i}
                  style={{
                    borderBottom: i < result.rules.length - 1 ? '1px solid var(--color-border, #e5e7eb)' : 'none',
                    paddingBottom: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <button
                    onClick={() => toggleAgent(rule.userAgent)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      textAlign: 'left',
                      padding: '4px 0',
                    }}
                    aria-expanded={expandedAgents.has(rule.userAgent)}
                  >
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {expandedAgents.has(rule.userAgent) ? '▼' : '▶'}
                    </span>
                    <code style={{ fontSize: '14px', fontWeight: 600 }}>User-agent: {rule.userAgent}</code>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                      {rule.disallowed.length} disallow · {rule.allowed.length} allow
                      {rule.crawlDelay !== null ? ` · delay: ${rule.crawlDelay}s` : ''}
                    </span>
                  </button>

                  {expandedAgents.has(rule.userAgent) && (
                    <div style={{ paddingLeft: '20px', marginTop: '8px' }}>
                      {rule.disallowed.map((path, j) => (
                        <div key={j} style={{ fontSize: '13px', fontFamily: 'monospace', color: '#ef4444', marginBottom: '2px' }}>
                          Disallow: {path}
                        </div>
                      ))}
                      {rule.allowed.map((path, j) => (
                        <div key={j} style={{ fontSize: '13px', fontFamily: 'monospace', color: '#10b981', marginBottom: '2px' }}>
                          Allow: {path}
                        </div>
                      ))}
                      {rule.crawlDelay !== null && (
                        <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#f59e0b', marginBottom: '2px' }}>
                          Crawl-delay: {rule.crawlDelay}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Raw robots.txt */}
          {result.found && result.content && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Raw robots.txt</h3>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{formatBytes(result.contentLength)}</span>
              </div>
              <pre
                style={{
                  background: 'var(--color-surface-alt, #f9fafb)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {result.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
