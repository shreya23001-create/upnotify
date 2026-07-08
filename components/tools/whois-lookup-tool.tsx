'use client'

import { useState } from 'react'
import { MonitorNudge } from './monitor-nudge'

interface RdapData {
  registrar: string | null
  createdAt: string | null
  expiresAt: string | null
  updatedAt: string | null
  status: string[]
  nameservers: string[]
}

interface DnsData {
  nsname: string
  hostmaster: string
  nameservers: string[]
}

interface WhoisResult {
  domain: string
  responseTimeMs: number
  rdap: RdapData | null
  dns: DnsData | null
  rdapAvailable: boolean
  error?: string
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  try {
    const expiry = new Date(expiresAt).getTime()
    return Math.floor((expiry - Date.now()) / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }): React.ReactElement | null {
  const days = getDaysUntilExpiry(expiresAt)
  if (days === null) return null

  let color = '#10b981'
  let label = `${days} days remaining`

  if (days < 0) {
    color = '#ef4444'
    label = `Expired ${Math.abs(days)} days ago`
  } else if (days < 30) {
    color = '#ef4444'
    label = `Expires in ${days} days — renew now`
  } else if (days < 90) {
    color = '#f59e0b'
    label = `Expires in ${days} days`
  }

  return (
    <span style={{
      fontSize: 12,
      color,
      background: `${color}18`,
      border: `1px solid ${color}33`,
      borderRadius: 6,
      padding: '2px 8px',
      marginLeft: 8,
      fontWeight: 500,
    }}>
      {label}
    </span>
  )
}

function WhoisRow({ label, value, children }: {
  label: string
  value?: string
  children?: React.ReactNode
}): React.ReactElement {
  return (
    <div className="whois-row">
      <span className="ssl-detail-label">{label}</span>
      <span className="whois-value">
        {children ?? value ?? '—'}
      </span>
    </div>
  )
}

export function WhoisLookupTool(): React.ReactElement {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WhoisResult | null>(null)
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
      const res = await fetch(`/api/tools/whois-lookup?domain=${encodeURIComponent(cleaned)}`)
      const data = await res.json() as WhoisResult & { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to look up WHOIS data')
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
      void handleCheck()
    }
  }

  const nameservers = result
    ? (result.rdap?.nameservers.length
        ? result.rdap.nameservers
        : result.dns?.nameservers ?? [])
    : []

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
          aria-label="Domain for WHOIS lookup"
        />
        <button
          className="btn btn-primary"
          onClick={() => void handleCheck()}
          disabled={loading}
        >
          {loading ? 'Looking up...' : 'WHOIS Lookup'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Results for <strong style={{ color: 'var(--text-primary)' }}>{result.domain}</strong>
            </span>
            <span style={{
              fontSize: 12,
              background: 'rgba(16,185,129,0.1)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 6,
              padding: '2px 8px',
            }}>
              {result.responseTimeMs}ms
            </span>
            {!result.rdapAvailable && (
              <span style={{
                fontSize: 12,
                background: 'rgba(245,158,11,0.1)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 6,
                padding: '2px 8px',
              }}>
                RDAP not available for this TLD
              </span>
            )}
          </div>

          {!result.rdapAvailable && !result.dns && (
            <div className="card" style={{ padding: 16 }}>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
                Full WHOIS data not available via RDAP for this TLD — showing DNS data only.
              </p>
            </div>
          )}

          {/* Registration details */}
          {result.rdap && (
            <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Registration Details
              </h3>
              <div className="whois-table">
                <WhoisRow label="Registrar" value={result.rdap.registrar ?? 'Not available'} />
                <WhoisRow label="Registered">
                  <span>{formatDate(result.rdap.createdAt)}</span>
                </WhoisRow>
                <WhoisRow label="Expires">
                  <span>{formatDate(result.rdap.expiresAt)}</span>
                  <ExpiryBadge expiresAt={result.rdap.expiresAt} />
                </WhoisRow>
                <WhoisRow label="Last Updated">
                  <span>{formatDate(result.rdap.updatedAt)}</span>
                </WhoisRow>
                {result.rdap.status.length > 0 && (
                  <WhoisRow label="Status">
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {result.rdap.status.map((s, i) => (
                        <span key={i} style={{
                          fontSize: 12,
                          background: 'rgba(59,130,246,0.1)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.2)',
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}>
                          {s}
                        </span>
                      ))}
                    </span>
                  </WhoisRow>
                )}
              </div>
            </div>
          )}

          {/* DNS fallback (no RDAP) */}
          {!result.rdapAvailable && result.dns && (
            <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                DNS Data
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                Full WHOIS data not available via RDAP for this TLD — showing DNS data only.
              </p>
              <div className="whois-table">
                {result.dns.nsname && <WhoisRow label="Primary NS" value={result.dns.nsname} />}
                {result.dns.hostmaster && <WhoisRow label="Hostmaster" value={result.dns.hostmaster} />}
              </div>
            </div>
          )}

          {/* Nameservers */}
          {nameservers.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Nameservers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {nameservers.map((ns, i) => (
                  <code key={i} style={{
                    display: 'block',
                    fontFamily: 'Fira Code, Cascadia Code, Consolas, monospace',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 6,
                    padding: '6px 10px',
                  }}>
                    {ns}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result && <MonitorNudge toolType="dns" domain={result.domain} />}

      <style>{`
        .whois-table {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .whois-row {
          display: flex;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 4px 12px;
          padding: 6px 0;
          border-bottom: 1px solid var(--bg-muted);
        }
        .whois-row:last-child { border-bottom: none; }
        .whois-row .ssl-detail-label {
          min-width: 120px;
          flex-shrink: 0;
          font-size: 12px;
        }
        .whois-value {
          font-size: 14px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }
      `}</style>
    </div>
  )
}
