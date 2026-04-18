'use client'

import { useState } from 'react'

interface SpeedTestResult {
  url: string
  finalUrl: string
  statusCode: number
  ttfbMs: number
  totalMs: number
  contentLengthBytes: number
  contentType: string
  server: string | null
  isCompressed: boolean
  cacheStatus: string | null
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  tips: string[]
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#10b981'
    case 'B': return '#22c55e'
    case 'C': return '#f59e0b'
    case 'D': return '#f97316'
    case 'F': return '#ef4444'
    default: return '#6b7280'
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function ttfbLabel(ms: number): string {
  if (ms < 200) return 'Excellent'
  if (ms < 500) return 'Good'
  if (ms < 800) return 'Needs Improvement'
  if (ms < 1500) return 'Slow'
  return 'Very Slow'
}

export function WebsiteSpeedTestTool(): React.ReactElement {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SpeedTestResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    const cleaned = url.trim()
    if (!cleaned) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/speed-test?url=${encodeURIComponent(cleaned)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to run speed test')
        return
      }

      setResult(data as SpeedTestResult)
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

  // Bar widths as percentages — cap total bar at 100%
  const ttfbBarPct = result ? Math.min(100, (result.ttfbMs / 3000) * 100) : 0
  const totalBarPct = result ? Math.min(100, (result.totalMs / 3000) * 100) : 0

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="text"
          className="form-input ssl-checker-input"
          placeholder="Enter URL (e.g., https://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="URL to test"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Speed'}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
          Running speed test — measuring TTFB and total load time...
        </div>
      )}

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Grade + key metrics */}
          <div
            className="card"
            style={{
              padding: '24px',
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              flexWrap: 'wrap',
              borderTop: `4px solid ${gradeColor(result.grade)}`,
              marginBottom: '16px',
            }}
          >
            {/* Grade badge */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: gradeColor(result.grade),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '40px',
                fontWeight: 800,
                flexShrink: 0,
              }}
              aria-label={`Performance grade ${result.grade}`}
            >
              {result.grade}
            </div>

            {/* TTFB + total */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    TTFB (Time to First Byte)
                  </span>
                  <span style={{ fontWeight: 700, color: gradeColor(result.grade) }}>
                    {result.ttfbMs}ms
                  </span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: 'var(--color-surface-alt, #f3f4f6)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${ttfbBarPct}%`,
                      background: gradeColor(result.grade),
                      borderRadius: '999px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  {ttfbLabel(result.ttfbMs)}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Total Response Time</span>
                  <span style={{ fontWeight: 700 }}>{result.totalMs}ms</span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: 'var(--color-surface-alt, #f3f4f6)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${totalBarPct}%`,
                      background: '#94a3b8',
                      borderRadius: '999px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="ssl-details-grid" style={{ marginBottom: '16px' }}>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">HTTP Status</span>
              <span
                className="ssl-detail-value"
                style={{ color: result.statusCode < 400 ? '#10b981' : '#ef4444' }}
              >
                {result.statusCode}
              </span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Content Type</span>
              <span className="ssl-detail-value">{result.contentType}</span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Response Size</span>
              <span className="ssl-detail-value">{formatBytes(result.contentLengthBytes)}</span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Compression</span>
              <span
                className="ssl-detail-value"
                style={{ color: result.isCompressed ? '#10b981' : '#f59e0b' }}
              >
                {result.isCompressed ? 'Enabled' : 'Not enabled'}
              </span>
            </div>
            <div className="card ssl-detail-card">
              <span className="ssl-detail-label">Cache Status</span>
              <span className="ssl-detail-value">
                {result.cacheStatus ?? 'No cache headers'}
              </span>
            </div>
            {result.server && (
              <div className="card ssl-detail-card">
                <span className="ssl-detail-label">Server</span>
                <span className="ssl-detail-value">{result.server}</span>
              </div>
            )}
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>
                Performance Tips
              </h3>
              <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none' }}>
                {result.tips.map((tip, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      marginBottom: i < result.tips.length - 1 ? '10px' : 0,
                      fontSize: '14px',
                    }}
                  >
                    <span style={{ flexShrink: 0, fontSize: '16px' }}>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
