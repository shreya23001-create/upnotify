'use client'

import { useState } from 'react'

interface DnsRecords {
  A: string[]
  AAAA: string[]
  MX: { exchange: string; priority: number }[]
  NS: string[]
  TXT: string[][]
  CNAME: string | null
  SOA: { nsname: string; hostmaster: string; serial: number } | null
}

interface DnsLookupResult {
  domain: string
  responseTimeMs: number
  records: DnsRecords
  error?: string
}

type RecordTab = 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME' | 'SOA'

const TABS: RecordTab[] = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA']

function recordCount(tab: RecordTab, records: DnsRecords): number {
  switch (tab) {
    case 'A': return records.A.length
    case 'AAAA': return records.AAAA.length
    case 'MX': return records.MX.length
    case 'NS': return records.NS.length
    case 'TXT': return records.TXT.length
    case 'CNAME': return records.CNAME ? 1 : 0
    case 'SOA': return records.SOA ? 1 : 0
  }
}

function RecordContent({ tab, records }: { tab: RecordTab; records: DnsRecords }): React.ReactElement {
  const none = (
    <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 14, margin: 0 }}>No records found</p>
  )

  switch (tab) {
    case 'A':
      return records.A.length === 0 ? none : (
        <div className="dns-record-list">
          {records.A.map((ip, i) => (
            <code key={i} className="dns-record-value">{ip}</code>
          ))}
        </div>
      )
    case 'AAAA':
      return records.AAAA.length === 0 ? none : (
        <div className="dns-record-list">
          {records.AAAA.map((ip, i) => (
            <code key={i} className="dns-record-value">{ip}</code>
          ))}
        </div>
      )
    case 'MX':
      return records.MX.length === 0 ? none : (
        <div className="dns-record-list">
          {records.MX.sort((a, b) => a.priority - b.priority).map((mx, i) => (
            <div key={i} className="dns-record-row">
              <span className="dns-record-badge">{mx.priority}</span>
              <code className="dns-record-value">{mx.exchange}</code>
            </div>
          ))}
        </div>
      )
    case 'NS':
      return records.NS.length === 0 ? none : (
        <div className="dns-record-list">
          {records.NS.map((ns, i) => (
            <code key={i} className="dns-record-value">{ns}</code>
          ))}
        </div>
      )
    case 'TXT':
      return records.TXT.length === 0 ? none : (
        <div className="dns-record-list">
          {records.TXT.map((chunks, i) => (
            <code key={i} className="dns-record-value dns-record-txt">{chunks.join('')}</code>
          ))}
        </div>
      )
    case 'CNAME':
      return !records.CNAME ? none : (
        <div className="dns-record-list">
          <code className="dns-record-value">{records.CNAME}</code>
        </div>
      )
    case 'SOA':
      return !records.SOA ? none : (
        <div className="dns-record-list">
          <div className="dns-soa-grid">
            <div className="dns-soa-row">
              <span className="ssl-detail-label">Primary NS</span>
              <code className="dns-record-value">{records.SOA.nsname}</code>
            </div>
            <div className="dns-soa-row">
              <span className="ssl-detail-label">Hostmaster</span>
              <code className="dns-record-value">{records.SOA.hostmaster}</code>
            </div>
            <div className="dns-soa-row">
              <span className="ssl-detail-label">Serial</span>
              <code className="dns-record-value">{records.SOA.serial}</code>
            </div>
          </div>
        </div>
      )
  }
}

export function DnsLookupTool(): React.ReactElement {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DnsLookupResult | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<RecordTab>('A')

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
      const res = await fetch(`/api/tools/dns-lookup?domain=${encodeURIComponent(cleaned)}`)
      const data = await res.json() as DnsLookupResult & { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to look up DNS records')
        return
      }

      setResult(data)
      setActiveTab('A')
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
          aria-label="Domain for DNS lookup"
        />
        <button
          className="btn btn-primary"
          onClick={() => void handleCheck()}
          disabled={loading}
        >
          {loading ? 'Looking up...' : 'Lookup DNS'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Response time badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              DNS records for <strong style={{ color: '#f3f4f6' }}>{result.domain}</strong>
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
          </div>

          {/* Tabs */}
          <div className="dns-tabs" role="tablist">
            {TABS.map((tab) => {
              const count = recordCount(tab, result.records)
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`dns-tab ${activeTab === tab ? 'dns-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  <span className={`dns-tab-count ${count === 0 ? 'dns-tab-count-empty' : ''}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="card" style={{ padding: '16px 20px', marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <RecordContent tab={activeTab} records={result.records} />
          </div>
        </div>
      )}

      <style>{`
        .dns-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .dns-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #9ca3af;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          margin-bottom: -1px;
        }
        .dns-tab:hover { color: #f3f4f6; }
        .dns-tab-active {
          color: #f3f4f6;
          border-bottom-color: #3b82f6;
        }
        .dns-tab-count {
          font-size: 11px;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 1px 6px;
          min-width: 18px;
          text-align: center;
        }
        .dns-tab-count-empty { opacity: 0.4; }
        .dns-record-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dns-record-value {
          display: block;
          font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
          font-size: 13px;
          color: #e2e8f0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          padding: 6px 10px;
          word-break: break-all;
        }
        .dns-record-txt {
          white-space: pre-wrap;
          word-break: break-all;
        }
        .dns-record-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dns-record-badge {
          font-size: 11px;
          font-weight: 600;
          background: rgba(59,130,246,0.15);
          color: #60a5fa;
          border-radius: 6px;
          padding: 2px 8px;
          min-width: 36px;
          text-align: center;
          flex-shrink: 0;
        }
        .dns-soa-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dns-soa-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </div>
  )
}
