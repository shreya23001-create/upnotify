'use client'

import { useState } from 'react'
import { MonitorNudge } from './monitor-nudge'

type SpfGrade = 'pass' | 'warn' | 'fail'
type DmarcGrade = 'pass' | 'warn' | 'fail'
type OverallGrade = 'A' | 'B' | 'C' | 'D' | 'F'

interface SpfData {
  found: boolean
  record: string | null
  mechanisms: string[]
  hasAll: boolean
  allMechanism: string | null
  issues: string[]
  grade: SpfGrade
}

interface DmarcData {
  found: boolean
  record: string | null
  policy: string | null
  pct: number | null
  rua: string | null
  issues: string[]
  grade: DmarcGrade
}

interface SpfDmarcResult {
  domain: string
  responseTimeMs: number
  spf: SpfData
  dmarc: DmarcData
  overallGrade: OverallGrade
}

const GRADE_COLORS: Record<OverallGrade, string> = {
  A: '#10b981',
  B: '#34d399',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
}

const RECORD_GRADE_COLORS: Record<SpfGrade | DmarcGrade, string> = {
  pass: '#10b981',
  warn: '#f59e0b',
  fail: '#ef4444',
}

function GradeBadge({ grade, small }: { grade: SpfGrade | DmarcGrade | OverallGrade; small?: boolean }): React.ReactElement {
  const isOverall = ['A', 'B', 'C', 'D', 'F'].includes(grade as string)
  const color = isOverall
    ? GRADE_COLORS[grade as OverallGrade]
    : RECORD_GRADE_COLORS[grade as SpfGrade]

  const label = isOverall ? grade : grade.charAt(0).toUpperCase() + grade.slice(1)

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: small ? 12 : 14,
      fontWeight: 700,
      color,
      background: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: small ? 6 : 8,
      padding: small ? '2px 8px' : '4px 12px',
      letterSpacing: '0.05em',
    }}>
      {label}
    </span>
  )
}

function RecordPanel({
  title,
  data,
  type,
}: {
  title: string
  data: SpfData | DmarcData
  type: 'spf' | 'dmarc'
}): React.ReactElement {
  const dmarcData = type === 'dmarc' ? (data as DmarcData) : null

  return (
    <div className="card spf-panel">
      <div className="spf-panel-header">
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
            {data.found ? 'Record found' : 'No record found'}
          </span>
        </div>
        <GradeBadge grade={data.grade} small />
      </div>

      {data.found && data.record && (
        <div style={{ margin: '12px 0' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Raw Record
          </span>
          <code style={{
            display: 'block',
            fontFamily: 'Fira Code, Cascadia Code, Consolas, monospace',
            fontSize: 12,
            color: 'var(--text-primary)',
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-primary)',
            borderRadius: 6,
            padding: '8px 12px',
            marginTop: 6,
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
          }}>
            {data.record}
          </code>
        </div>
      )}

      {type === 'dmarc' && dmarcData?.found && (
        <div className="spf-detail-grid" style={{ margin: '8px 0 12px' }}>
          {dmarcData.policy && (
            <div className="spf-detail-item">
              <span className="ssl-detail-label">Policy</span>
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: dmarcData.policy === 'reject'
                  ? '#10b981'
                  : dmarcData.policy === 'quarantine'
                  ? '#f59e0b'
                  : 'var(--text-muted)',
              }}>
                {dmarcData.policy}
              </span>
            </div>
          )}
          {dmarcData.pct !== null && (
            <div className="spf-detail-item">
              <span className="ssl-detail-label">Coverage</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{dmarcData.pct}%</span>
            </div>
          )}
          {dmarcData.rua && (
            <div className="spf-detail-item">
              <span className="ssl-detail-label">Reports To</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{dmarcData.rua}</span>
            </div>
          )}
        </div>
      )}

      {data.issues.length > 0 && (
        <div className="spf-issues">
          {data.issues.map((issue, i) => (
            <div key={i} className="spf-issue-item">
              <span className="spf-issue-dot" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}

      {data.found && data.issues.length === 0 && (
        <div className="spf-ok-message">
          <span style={{ color: '#10b981', marginRight: 6 }}>&#10003;</span>
          {type === 'spf' ? 'SPF record is correctly configured.' : 'DMARC record is correctly configured.'}
        </div>
      )}
    </div>
  )
}

export function SpfDmarcCheckerTool(): React.ReactElement {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SpfDmarcResult | null>(null)
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
      const res = await fetch(`/api/tools/spf-dmarc?domain=${encodeURIComponent(cleaned)}`)
      const data = await res.json() as SpfDmarcResult & { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to check SPF/DMARC records')
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
          aria-label="Domain for SPF and DMARC check"
        />
        <button
          className="btn btn-primary"
          onClick={() => void handleCheck()}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check SPF & DMARC'}
        </button>
      </div>

      {error && <div className="ssl-checker-error">{error}</div>}

      {result && (
        <div className="ssl-checker-results">
          {/* Overall grade */}
          <div className="card spf-overall-grade">
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Overall Email Security Grade</span>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {result.domain} &middot; {result.responseTimeMs}ms
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 12,
              background: `${GRADE_COLORS[result.overallGrade]}18`,
              border: `2px solid ${GRADE_COLORS[result.overallGrade]}44`,
              fontSize: 28,
              fontWeight: 800,
              color: GRADE_COLORS[result.overallGrade],
              flexShrink: 0,
            }}>
              {result.overallGrade}
            </div>
          </div>

          {/* Side-by-side panels */}
          <div className="spf-panels-grid">
            <RecordPanel title="SPF Record" data={result.spf} type="spf" />
            <RecordPanel title="DMARC Record" data={result.dmarc} type="dmarc" />
          </div>
        </div>
      )}

      {result && <MonitorNudge toolType="spf-dmarc" domain={result.domain} />}

      <style>{`
        .spf-overall-grade {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          margin-bottom: 12px;
          gap: 12px;
        }
        .spf-panels-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 640px) {
          .spf-panels-grid { grid-template-columns: 1fr; }
        }
        .spf-panel {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .spf-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .spf-issues {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
          padding-top: 10px;
          border-top: 1px solid rgba(239,68,68,0.15);
        }
        .spf-issue-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #fca5a5;
          line-height: 1.5;
        }
        .spf-issue-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          flex-shrink: 0;
          margin-top: 5px;
        }
        .spf-ok-message {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(16,185,129,0.15);
          font-size: 13px;
          color: #6ee7b7;
          display: flex;
          align-items: center;
        }
        .spf-detail-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .spf-detail-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .spf-detail-item .ssl-detail-label {
          min-width: 80px;
          flex-shrink: 0;
          font-size: 11px;
        }
      `}</style>
    </div>
  )
}
