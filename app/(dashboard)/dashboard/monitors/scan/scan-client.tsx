'use client'

import { useState, useTransition } from 'react'
import { bulkCreateMonitorsAction } from '../actions'
import type { BulkCreateItem } from '../actions'

interface ScanFinding {
  type: string
  label: string
  emoji: string
  description: string
  status: 'up' | 'down' | 'degraded'
  responseTimeMs: number | null
  errorMessage: string | null
  metadata: Record<string, unknown> | null
  alreadyMonitored: boolean
}

interface ScanResponse {
  domain: string
  findings: ScanFinding[]
}

type Screen = 'input' | 'loading' | 'results'

function statusToSeverity(status: 'up' | 'down' | 'degraded'): 'issue' | 'warn' | 'ok' {
  if (status === 'down') return 'issue'
  if (status === 'degraded') return 'warn'
  return 'ok'
}

function findingLabel(finding: ScanFinding): string {
  if (finding.status === 'down') return finding.errorMessage ?? 'Failed'
  if (finding.status === 'degraded') return finding.errorMessage ?? 'Warning detected'
  if (finding.type === 'response-time' && finding.responseTimeMs) return `${finding.responseTimeMs}ms`
  if (finding.type === 'ssl' && finding.metadata?.daysUntilExpiry != null) {
    const days = finding.metadata.daysUntilExpiry as number
    return days < 30 ? `Valid — expires in ${days} days` : `Valid — ${days} days remaining`
  }
  if (finding.type === 'page-size' && finding.metadata?.sizeKb != null) return `${Math.round(finding.metadata.sizeKb as number)} KB`
  if (finding.type === 'blacklist' && finding.metadata?.listedOn != null) {
    const listed = finding.metadata.listedOn as string[]
    return listed.length === 0 ? 'Clean — not listed' : `Listed on ${listed.length} zone(s)`
  }
  if (finding.type === 'redirect-chain' && finding.metadata?.hops != null) return `${finding.metadata.hops} redirect(s)`
  if (finding.type === 'sitemap' && finding.metadata?.urlCount != null) return `Valid — ${finding.metadata.urlCount} URLs`
  if (finding.type === 'cookie-consent') return finding.status === 'up' ? 'Banner detected' : 'No banner found'
  return 'Passing'
}

export function ScanClient({
  remaining,
  planLimit,
  existingCount,
  planName,
}: {
  remaining: number
  planLimit: number | null
  existingCount: number
  planName: string
}): React.ReactElement {
  const [screen, setScreen] = useState<Screen>('input')
  const [domain, setDomain] = useState('')
  const [scanDomain, setScanDomain] = useState('')
  const [findings, setFindings] = useState<ScanFinding[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scanError, setScanError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<{ created: number; skipped: number } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  async function handleScan(): Promise<void> {
    const d = domain.trim().replace(/^https?:\/\//, '').split('/')[0]
    if (!d) return
    setScanDomain(d)
    setScanError(null)
    setSelected(new Set())
    setCreateResult(null)
    setScreen('loading')

    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      })
      const data = await res.json() as { error?: string; findings?: ScanFinding[] }
      if (!res.ok || data.error) {
        setScanError(data.error ?? 'Scan failed')
        setScreen('input')
        return
      }
      const allFindings = data.findings ?? []
      setFindings(allFindings)

      // Pre-select issues + warnings that are not already monitored
      const preSelected = new Set(
        allFindings
          .filter(f => !f.alreadyMonitored && (f.status === 'down' || f.status === 'degraded'))
          .map(f => f.type)
      )
      setSelected(preSelected)
      setScreen('results')
    } catch {
      setScanError('Could not connect. Please try again.')
      setScreen('input')
    }
  }

  function toggleSelect(type: string, alreadyMonitored: boolean): void {
    if (alreadyMonitored) return
    if (selected.has(type)) {
      const next = new Set(selected)
      next.delete(type)
      setSelected(next)
      return
    }
    if (selected.size >= remaining) {
      setShowUpgradePrompt(true)
      return
    }
    setShowUpgradePrompt(false)
    const next = new Set(selected)
    next.add(type)
    setSelected(next)
  }

  function handleCreate(): void {
    const items: BulkCreateItem[] = findings
      .filter(f => selected.has(f.type))
      .map(f => {
        const httpTypes = ['http', 'ssl', 'security-headers', 'redirect-chain', 'response-time', 'page-size', 'robots-txt', 'sitemap', 'cookie-consent']
        const target = httpTypes.includes(f.type) ? `https://${scanDomain}` : scanDomain
        return { type: f.type, name: `${scanDomain} — ${f.label}`, target }
      })

    startTransition(async () => {
      const result = await bulkCreateMonitorsAction(items)
      setCreateResult({ created: result.created, skipped: result.skipped })
      if (result.created > 0) {
        setSelected(new Set())
      }
    })
  }

  const issues = findings.filter(f => f.status === 'down' && !f.alreadyMonitored)
  const warnings = findings.filter(f => f.status === 'degraded' && !f.alreadyMonitored)
  const passing = findings.filter(f => f.status === 'up' && !f.alreadyMonitored)
  const alreadyMonitored = findings.filter(f => f.alreadyMonitored)
  const selectedCount = selected.size
  const totalAfter = existingCount + selectedCount

  return (
    <div style={{ maxWidth: 800 }}>

      {/* INPUT SCREEN */}
      {screen === 'input' && (
        <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🔭</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>What does your website look like right now?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
            Enter your domain and we'll run 18 health checks in parallel.<br />
            Issues are pre-selected — you pick what to monitor.
          </p>
          {scanError && <div className="form-error" style={{ maxWidth: 500, margin: '0 auto 16px' }}>{scanError}</div>}
          <div style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto 12px' }}>
            <input
              className="form-input"
              style={{ flex: 1, fontSize: 15 }}
              placeholder="example.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              autoFocus
            />
            <button className="btn btn-primary" onClick={handleScan} disabled={!domain.trim()} style={{ whiteSpace: 'nowrap', padding: '0 24px' }}>
              Scan Now →
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Checks SSL, security headers, DNS, blacklists, email auth, performance and more</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 40, textAlign: 'left' }}>
            {[
              { icon: '🔒', title: 'Security', desc: 'Headers, SPF/DMARC, blacklist status' },
              { icon: '⚡', title: 'Performance', desc: 'Response time, redirects, page size' },
              { icon: '📄', title: 'Content', desc: 'Sitemap, robots.txt, cookie consent' },
            ].map(c => (
              <div key={c.title} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOADING SCREEN */}
      {screen === 'loading' && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid var(--border-primary)',
            borderTopColor: 'var(--accent)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Scanning {scanDomain}...</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Running 18 checks in parallel — usually takes 10–15 seconds</p>
        </div>
      )}

      {/* RESULTS SCREEN */}
      {screen === 'results' && (
        <div>
          {/* Header */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '16px 20px' }}>
            <div style={{ fontSize: 28 }}>🔭</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{scanDomain} — Scan Complete</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {issues.length} issue{issues.length !== 1 ? 's' : ''} · {warnings.length} warning{warnings.length !== 1 ? 's' : ''} · {passing.length} passing
              </div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setScreen('input')}>← Scan another</button>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {issues.length > 0 && <span style={{ background: '#ef444410', border: '1px solid #ef444440', color: '#f87171', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>🔴 {issues.length} Issue{issues.length !== 1 ? 's' : ''}</span>}
            {warnings.length > 0 && <span style={{ background: '#f59e0b10', border: '1px solid #f59e0b40', color: '#fbbf24', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>🟡 {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}</span>}
            {passing.length > 0 && <span style={{ background: '#10b98110', border: '1px solid #10b98130', color: '#34d399', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>✅ {passing.length} Passing</span>}
          </div>

          {/* Plan limit bar */}
          {planLimit !== null && (
            <div className="card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>{planName} plan</div>
              <div style={{ flex: 1, background: 'var(--border-primary)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: totalAfter > planLimit ? '#ef4444' : totalAfter / planLimit > 0.8 ? '#f59e0b' : 'var(--accent)',
                  width: `${Math.min((totalAfter / planLimit) * 100, 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {existingCount + selectedCount} / {planLimit} monitors
              </div>
            </div>
          )}

          {/* Upgrade prompt */}
          {showUpgradePrompt && (
            <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#fbbf24' }}>
              ⚠️ You've reached your selection limit ({remaining} monitor{remaining !== 1 ? 's' : ''} remaining on your plan).{' '}
              <a href="/dashboard/settings?tab=billing" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'underline' }}>Upgrade your plan →</a>
              {' '}to add more.
            </div>
          )}

          {/* Success message */}
          {createResult && (
            <div style={{ background: '#10b98110', border: '1px solid #10b98140', borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#34d399' }}>
              ✅ {createResult.created} monitor{createResult.created !== 1 ? 's' : ''} created successfully.
              {createResult.skipped > 0 && ` ${createResult.skipped} skipped (plan limit).`}
              {' '}<a href="/dashboard/monitors" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'underline' }}>View all monitors →</a>
            </div>
          )}

          {/* Issues */}
          {issues.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔴 Issues — pre-selected</div>
              <FindingList findings={issues} selected={selected} onToggle={toggleSelect} />
            </>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 10px' }}>🟡 Warnings — recommended</div>
              <FindingList findings={warnings} selected={selected} onToggle={toggleSelect} />
            </>
          )}

          {/* Passing */}
          {passing.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 10px' }}>✅ Passing — monitor anyway?</div>
              <FindingList findings={passing} selected={selected} onToggle={toggleSelect} />
            </>
          )}

          {/* Already monitored */}
          {alreadyMonitored.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 10px' }}>Already Monitoring</div>
              <FindingList findings={alreadyMonitored} selected={selected} onToggle={toggleSelect} />
            </>
          )}

          {/* Manual setup notice */}
          <div className="card" style={{ padding: '14px 18px', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            ⚙️ <strong style={{ color: 'var(--text-primary)' }}>Need more?</strong> Keyword Detection, API Endpoint, Heartbeat, Port Check, and Page Change Detection require individual configuration.{' '}
            <a href="/dashboard/monitors/new" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Set up individually →</a>
          </div>

          {/* Sticky create bar */}
          <div style={{
            position: 'sticky', bottom: 0, background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-primary)', padding: '16px 0',
            display: 'flex', alignItems: 'center', gap: 14, marginTop: 24,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {selectedCount > 0 ? `${selectedCount} monitor${selectedCount !== 1 ? 's' : ''} selected` : 'Select monitors above'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {selectedCount > 0 ? `Will use ${totalAfter} of ${planLimit ?? '∞'} monitor slots` : 'Click a result to select it for monitoring'}
              </div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => { setSelected(new Set()); setShowUpgradePrompt(false) }}
              disabled={selectedCount === 0}
            >
              Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={selectedCount === 0 || isPending}
            >
              {isPending ? 'Creating...' : `Create ${selectedCount} Monitor${selectedCount !== 1 ? 's' : ''} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FindingList({
  findings,
  selected,
  onToggle,
}: {
  findings: ScanFinding[]
  selected: Set<string>
  onToggle: (type: string, alreadyMonitored: boolean) => void
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
      {findings.map(f => {
        const sev = statusToSeverity(f.status)
        const isSelected = selected.has(f.type)
        const borderColor = f.alreadyMonitored ? 'var(--border-primary)' : sev === 'issue' ? '#ef444440' : sev === 'warn' ? '#f59e0b40' : '#10b98130'
        const labelColor = f.alreadyMonitored ? 'var(--text-muted)' : sev === 'issue' ? '#f87171' : sev === 'warn' ? '#fbbf24' : '#4ade80'

        return (
          <div
            key={f.type}
            onClick={() => onToggle(f.type, f.alreadyMonitored)}
            style={{
              border: `1.5px solid ${isSelected ? 'var(--accent)' : borderColor}`,
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: f.alreadyMonitored ? 'default' : 'pointer',
              background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
              opacity: f.alreadyMonitored ? 0.55 : 1,
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ fontSize: 22, flexShrink: 0 }}>{f.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: labelColor }}>{f.alreadyMonitored ? 'Already monitoring' : findingLabel(f)}</div>
            </div>
            {f.responseTimeMs != null && !f.alreadyMonitored && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{f.responseTimeMs}ms</div>
            )}
            {!f.alreadyMonitored && (
              <div style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-primary)'}`,
                background: isSelected ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && <svg width="11" height="11" viewBox="0 0 11 11"><polyline points="1.5,5.5 4,8 9.5,1.5" stroke="#fff" strokeWidth="1.5" fill="none" /></svg>}
              </div>
            )}
            {f.alreadyMonitored && (
              <div style={{ fontSize: 10, background: '#22543d', color: '#4ade80', padding: '2px 8px', borderRadius: 5, fontWeight: 700, flexShrink: 0 }}>Active</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
