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
  if (code >= 200 && code < 300) return '#10b981'
  if (code >= 300 && code < 400) return '#f59e0b'
  if (code >= 400) return '#ef4444'
  return '#9ca3af'
}

export function RedirectChainTool(): React.ReactElement {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedirectChainResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    let cleaned = url.trim()
    if (!cleaned) { setError('Please enter a URL'); return }
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/redirect-chain?url=${encodeURIComponent(cleaned)}`)
      const data = await res.json() as RedirectChainResult & { error?: string }
      if (!res.ok) { setError(data.error ?? 'Check failed'); return }
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="text"
          className="form-input ssl-checker-input"
          placeholder="Enter URL (e.g., http://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleCheck() }}
          aria-label="URL to check redirect chain"
        />
        <button className="btn btn-primary" onClick={() => void handleCheck()} disabled={loading}>
          {loading ? 'Tracing...' : 'Trace Redirects'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Hops', value: String(result.totalHops), color: result.totalHops > 4 ? '#f59e0b' : '#10b981' },
              { label: 'Total Time', value: `${result.totalTimeMs}ms`, color: '#60a5fa' },
              { label: 'Issues', value: String(result.issues.length), color: result.issues.length > 0 ? '#ef4444' : '#10b981' },
            ].map((stat) => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {result.issues.map((issue, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: '#fca5a5' }}>
                  <span style={{ flexShrink: 0 }}>⚠</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chain visualization */}
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Redirect Chain</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {result.chain.map((step, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: statusColor(step.status) + '20',
                      border: `2px solid ${statusColor(step.status)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: statusColor(step.status),
                    }}>
                      {step.step}
                    </div>
                    {i < result.chain.length - 1 && (
                      <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(step.status), background: statusColor(step.status) + '15', padding: '2px 7px', borderRadius: 5 }}>
                        {step.status} {step.statusText}
                      </span>
                      {step.isHttpToHttps && <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 7px', borderRadius: 5 }}>HTTP→HTTPS</span>}
                      {step.isWwwChange && <span style={{ fontSize: 11, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 7px', borderRadius: 5 }}>www change</span>}
                      <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 'auto' }}>{step.responseTimeMs}ms</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', wordBreak: 'break-all' }}>{step.url}</div>
                  </div>
                </div>
              </div>
            ))}
            {/* Final destination */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14 }}>✓</span>
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>Final destination</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', wordBreak: 'break-all' }}>{result.finalUrl}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
