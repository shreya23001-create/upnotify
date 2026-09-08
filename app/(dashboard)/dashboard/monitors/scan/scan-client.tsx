'use client'

import { useState, useTransition } from 'react'
import { bulkCreateMonitorsAction } from '../actions'
import type { BulkCreateItem } from '../actions'
import { WordPressIcon } from '../../help/help-sidebar'

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

type FilterTab = 'all' | 'issues' | 'warnings' | 'passing'

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
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

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

  function visibleFindings(): ScanFinding[] {
    if (activeFilter === 'issues') return issues
    if (activeFilter === 'warnings') return warnings
    if (activeFilter === 'passing') return [...passing, ...alreadyMonitored]
    return [...issues, ...warnings, ...passing, ...alreadyMonitored]
  }

  function filterLabel(f: ScanFinding): string {
    if (f.alreadyMonitored) return 'Already monitoring'
    if (f.status === 'down') return '🔴 Issue'
    if (f.status === 'degraded') return '🟡 Warning'
    return '✅ Passing'
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* INPUT SCREEN */}
      {screen === 'input' && (
        <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🔭</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Set up your monitoring suite</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
            Enter your domain and we'll run 18 health checks in parallel.<br />
            We'll pre-select what needs monitoring — you decide what to track.
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
              Check Now →
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

          {/* WordPress Monitor — special agent-based monitor */}
          <div style={{ marginTop: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Agent-Based Monitors</div>
            <a
              href="/dashboard/monitors/new/wordpress"
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                border: '1.5px solid #21759b40', background: 'linear-gradient(135deg, #21759b08, #0073aa08)',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}>
                <WordPressIcon size={32} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Upnotify WordPress Monitor</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Install a lightweight plugin on your WordPress site. Monitors file injections, outdated plugins, unknown admin users, suspicious pages, and more — from inside your site.
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#21759b', background: '#21759b15', padding: '4px 10px', borderRadius: 20, flexShrink: 0 }}>
                  Set up →
                </div>
              </div>
            </a>
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
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Checking {scanDomain}...</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Running 18 monitors in parallel — usually takes 10–15 seconds</p>
        </div>
      )}

      {/* RESULTS SCREEN */}
      {screen === 'results' && (
        <div style={{ paddingBottom: 100 }}>

          {/* Header */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: '14px 20px' }}>
            <div style={{ fontSize: 24 }}>🔭</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{scanDomain} — Health Check Complete</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {issues.length} issue{issues.length !== 1 ? 's' : ''} · {warnings.length} warning{warnings.length !== 1 ? 's' : ''} · {passing.length} passing
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setScreen('input'); setActiveFilter('all') }}>← Check another</button>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(
              [
                { key: 'all', label: `All (${findings.length})`, activeColor: 'var(--accent)', activeBg: 'var(--accent)' },
                { key: 'issues', label: `🔴 ${issues.length} Issue${issues.length !== 1 ? 's' : ''}`, activeColor: '#f87171', activeBg: '#ef444415' },
                { key: 'warnings', label: `🟡 ${warnings.length} Warning${warnings.length !== 1 ? 's' : ''}`, activeColor: '#fbbf24', activeBg: '#f59e0b15' },
                { key: 'passing', label: `✅ ${passing.length} Passing`, activeColor: '#34d399', activeBg: '#10b98115' },
              ] as { key: FilterTab; label: string; activeColor: string; activeBg: string }[]
            ).map(tab => {
              const isActive = activeFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  style={{
                    border: `1.5px solid ${isActive ? tab.activeColor : 'var(--border-primary)'}`,
                    borderRadius: 20,
                    padding: '6px 16px',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? (tab.key === 'all' ? '#fff' : tab.activeColor) : 'var(--text-secondary)',
                    background: isActive ? (tab.key === 'all' ? 'var(--accent)' : tab.activeBg) : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Plan limit bar */}
          {planLimit !== null && (
            <div className="card" style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>{planName} plan</div>
              <div style={{ flex: 1, background: 'var(--border-primary)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: totalAfter > planLimit ? '#ef4444' : totalAfter / planLimit > 0.8 ? '#f59e0b' : 'var(--accent)',
                  width: `${Math.min((totalAfter / planLimit) * 100, 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 12, color: totalAfter > planLimit ? '#f87171' : 'var(--text-secondary)', flexShrink: 0, fontWeight: totalAfter > planLimit ? 700 : 400 }}>
                {existingCount + selectedCount} / {planLimit} monitors
                {totalAfter > planLimit && ' — over limit'}
              </div>
            </div>
          )}

          {/* Alerts */}
          {showUpgradePrompt && (
            <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#fbbf24' }}>
              ⚠️ You've reached your limit ({remaining} remaining).{' '}
              <a href="/dashboard/settings?tab=billing" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'underline' }}>Upgrade →</a>
            </div>
          )}
          {createResult && (
            <div style={{ background: '#10b98110', border: '1px solid #10b98140', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#34d399' }}>
              ✅ {createResult.created} monitor{createResult.created !== 1 ? 's' : ''} created.
              {createResult.skipped > 0 && ` ${createResult.skipped} skipped (plan limit).`}
              {' '}<a href="/dashboard/monitors" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'underline' }}>View monitors →</a>
            </div>
          )}

          {/* Card grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {visibleFindings().map(f => {
              const sev = statusToSeverity(f.status)
              const isSelected = selected.has(f.type)
              const accentColor = f.alreadyMonitored ? 'var(--border-primary)' : sev === 'issue' ? '#ef4444' : sev === 'warn' ? '#f59e0b' : '#10b981'
              const labelColor = f.alreadyMonitored ? 'var(--text-muted)' : sev === 'issue' ? '#f87171' : sev === 'warn' ? '#fbbf24' : '#4ade80'

              return (
                <div
                  key={f.type}
                  onClick={() => toggleSelect(f.type, f.alreadyMonitored)}
                  style={{
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : f.alreadyMonitored ? 'var(--border-primary)' : `${accentColor}40`}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: f.alreadyMonitored ? 'default' : 'pointer',
                    background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                    opacity: f.alreadyMonitored ? 0.55 : 1,
                    transition: 'border-color 0.15s, background 0.15s',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{f.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: labelColor, lineHeight: 1.4 }}>
                      {f.alreadyMonitored ? 'Already monitoring' : findingLabel(f)}
                    </div>
                    {f.responseTimeMs != null && !f.alreadyMonitored && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{f.responseTimeMs}ms</div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{filterLabel(f)}</div>
                  </div>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {f.alreadyMonitored ? (
                      <div style={{ fontSize: 10, background: '#22543d', color: '#4ade80', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>Active</div>
                    ) : (
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-primary)'}`,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,1.5" stroke="#fff" strokeWidth="1.5" fill="none" /></svg>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {visibleFindings().length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              No results in this category.
            </div>
          )}

          {/* Manual setup notice */}
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 13, color: 'var(--text-secondary)' }}>
            ⚙️ <strong style={{ color: 'var(--text-primary)' }}>Need more?</strong> Keyword, API Endpoint, Heartbeat, Port Check require manual setup.{' '}
            <a href="/dashboard/monitors/new/manual" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Add individually →</a>
            {' · '}
            <a href="/dashboard/monitors/new/wordpress" style={{ color: '#00a83d', textDecoration: 'underline' }}>🔌 WordPress Monitor →</a>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BAR — only when results visible */}
      {screen === 'results' && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-primary)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          minWidth: 420,
          zIndex: 200,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {selectedCount > 0 ? `${selectedCount} monitor${selectedCount !== 1 ? 's' : ''} selected` : 'Select monitors above'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
              {selectedCount > 0 ? `${totalAfter} of ${planLimit ?? '∞'} monitor slots used` : 'Click any card to include it'}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSelected(new Set()); setShowUpgradePrompt(false) }}
            disabled={selectedCount === 0}
          >
            Clear
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={selectedCount === 0 || isPending}
            style={{ whiteSpace: 'nowrap', padding: '10px 20px', fontSize: 14, fontWeight: 700 }}
          >
            {isPending ? 'Creating...' : `Create ${selectedCount > 0 ? selectedCount : ''} Monitor${selectedCount !== 1 ? 's' : ''} →`}
          </button>
        </div>
      )}
    </div>
  )
}

function WpIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="#21759b" />
      <text x="12" y="16.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif">W</text>
    </svg>
  )
}

