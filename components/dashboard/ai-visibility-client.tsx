'use client'

import { useState } from 'react'
import { ClipboardList, Lightbulb, FileText, Search, Eye, Zap, Bot, Globe } from 'lucide-react'
import type { AiEngine } from '@/lib/db/ai-engines'
import type { LlmsTxtGeneration, CitationCheckRun } from '@/lib/db/ai-visibility'
import type { ProfileRun } from '@/lib/db/ai-profile'

interface Props {
  engines:                AiEngine[]
  freeEngineIds:          string[]
  llmsGenerations:        LlmsTxtGeneration[]
  citationRuns:           CitationCheckRun[]
  profileRuns:            ProfileRun[]
  planSlug:               string
  canGenerateLlms:        boolean
  llmsBlockReason?:       string
  citationRunsThisMonth:  number
  citationLimit:          number
}

type Tab = 'llms' | 'citation' | 'profile'

export function AiVisibilityClient({
  engines, freeEngineIds, llmsGenerations, citationRuns, profileRuns,
  planSlug, canGenerateLlms, llmsBlockReason,
  citationRunsThisMonth, citationLimit,
}: Props): React.ReactElement {
  const [tab, setTab] = useState<Tab>('citation')

  const usedPct = citationLimit > 0 ? Math.min((citationRunsThisMonth / citationLimit) * 100, 100) : 0

  return (
    <div className="aiv-root">

      {/* ── Hero banner ── */}
      <div className="aiv-hero">
        <div className="aiv-hero-accent" />
        <div className="aiv-hero-body">
          <div className="aiv-hero-left">
            <div className="aiv-hero-icon">
              <Bot size={22} />
            </div>
            <div>
              <div className="aiv-hero-title">AI Visibility Suite</div>
              <div className="aiv-hero-sub">Generate your llms.txt, monitor citations, and discover what AI engines say about your site.</div>
            </div>
          </div>
          <a href="/tools/ai-seo-checker" target="_blank" className="btn btn-secondary btn-sm aiv-hero-cta">
            <Globe size={13} />
            Free AI SEO Checker ↗
          </a>
        </div>

        {/* Usage strip */}
        {citationLimit > 0 && (
          <div className="aiv-usage-strip">
            <span className="aiv-usage-label">
              <Zap size={12} />
              {citationRunsThisMonth} / {citationLimit} runs used this month
            </span>
            <div className="aiv-usage-track">
              <div className="aiv-usage-fill" style={{ width: `${usedPct}%` }} />
            </div>
            <span className="aiv-usage-pct">{Math.round(usedPct)}%</span>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="aiv-tabs">
        <button
          className={`aiv-tab${tab === 'citation' ? ' aiv-tab-active' : ''}`}
          onClick={() => setTab('citation')}
        >
          <Search size={14} />
          AI Citation Monitor
          {citationLimit > 0 && (
            <span className="aiv-tab-pill">{citationRunsThisMonth}/{citationLimit}</span>
          )}
        </button>
        <button
          className={`aiv-tab${tab === 'profile' ? ' aiv-tab-active' : ''}`}
          onClick={() => setTab('profile')}
        >
          <Eye size={14} />
          AI Profile
        </button>
        <button
          className={`aiv-tab${tab === 'llms' ? ' aiv-tab-active' : ''}`}
          onClick={() => setTab('llms')}
        >
          <FileText size={14} />
          llms.txt Generator
        </button>
      </div>

      {/* ── Tab content ── */}
      {tab === 'llms' && (
        <LlmsTxtTab
          engines={engines}
          generations={llmsGenerations}
          planSlug={planSlug}
          canGenerate={canGenerateLlms}
          blockReason={llmsBlockReason}
        />
      )}
      {tab === 'citation' && (
        <CitationTab
          engines={engines}
          freeEngineIds={freeEngineIds}
          runs={citationRuns}
          planSlug={planSlug}
          runsThisMonth={citationRunsThisMonth}
          monthlyLimit={citationLimit}
        />
      )}
      {tab === 'profile' && (
        <ProfileTab
          engines={engines}
          freeEngineIds={freeEngineIds}
          runs={profileRuns}
          planSlug={planSlug}
          runsThisMonth={citationRunsThisMonth}
          monthlyLimit={citationLimit}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function EngineGrid({ engines, selected, onToggle, freeEngineIds, planSlug }: {
  engines: AiEngine[]
  selected: string[]
  onToggle: (id: string) => void
  freeEngineIds?: string[]
  planSlug?: string
}) {
  return (
    <div className="aiv-engine-grid">
      {engines.map(engine => {
        const isFree = freeEngineIds?.includes(engine.id) ?? true
        const locked = planSlug === 'free' && !isFree
        const on = selected.includes(engine.id)
        return (
          <label
            key={engine.id}
            className={`aiv-engine-chip${on ? ' on' : ''}${locked ? ' locked' : ''}`}
            title={locked ? 'Upgrade to access this engine' : undefined}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => onToggle(engine.id)}
              disabled={locked}
              style={{ display: 'none' }}
            />
            <span className="aiv-engine-name">{engine.name}</span>
            {locked
              ? <span className="aiv-signal aiv-signal-locked">Upgrade</span>
              : <span className={`aiv-signal aiv-signal-${engine.signal_quality}`}>{engine.signal_quality}</span>
            }
          </label>
        )
      })}
    </div>
  )
}

function RunStartedBanner({ runId, profileMode }: { runId: string; profileMode?: boolean }) {
  return (
    <div className="aiv-run-started">
      <div className="aiv-run-started-icon">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div className="aiv-run-started-body">
        <div className="aiv-run-started-title">{profileMode ? 'AI Profile complete' : 'Check started'}</div>
        <div className="aiv-run-started-desc">
          {profileMode
            ? "We've gathered responses from each engine."
            : "We'll email you when results are ready — usually within 2–5 minutes."}
        </div>
        <a
          href={profileMode ? `/dashboard/ai-visibility/profile/${runId}` : `/dashboard/ai-visibility/runs/${runId}`}
          className="aiv-run-started-link"
        >
          View {profileMode ? 'profile' : 'run'} →
        </a>
      </div>
    </div>
  )
}

function RunsList({ runs, type }: {
  runs: (CitationCheckRun | ProfileRun)[]
  type: 'citation' | 'profile'
}) {
  if (runs.length === 0) {
    return (
      <div className="aiv-empty">
        <div className="aiv-empty-icon">
          {type === 'citation' ? <Search size={32} strokeWidth={1.5} /> : <Eye size={32} strokeWidth={1.5} />}
        </div>
        <div className="aiv-empty-title">No {type === 'citation' ? 'citation checks' : 'profiles'} yet</div>
        <div className="aiv-empty-desc">
          {type === 'citation'
            ? 'Run your first check to see how visible your site is in AI search.'
            : 'Run your first AI Profile to see how AI engines describe your site.'}
        </div>
      </div>
    )
  }

  return (
    <div className="aiv-runs-list">
      {runs.map(run => {
        const isComplete = run.status === 'complete'
        const isFailed = run.status === 'failed'
        const statusClass = isComplete ? 'complete' : isFailed ? 'failed' : 'pending'
        const href = type === 'citation'
          ? `/dashboard/ai-visibility/runs/${run.id}`
          : `/dashboard/ai-visibility/profile/${run.id}`

        const score = type === 'citation'
          ? (run as CitationCheckRun).summary?.score
          : null
        const recognisedCt = type === 'profile'
          ? ((run as ProfileRun).summary?.recognised_by.length ?? null)
          : null
        const totalEngines = run.engine_ids.length

        return (
          <a key={run.id} href={href} className="aiv-run-card">
            <div className={`aiv-run-card-bar ${statusClass}`} />
            <div className="aiv-run-card-body">
              <div className="aiv-run-card-top">
                <span className="aiv-run-card-domain">{run.domain}</span>
                <span className={`aiv-run-card-status ${statusClass}`}>{run.status}</span>
              </div>
              <div className="aiv-run-card-meta">
                {totalEngines} engine{totalEngines !== 1 ? 's' : ''} ·{' '}
                {type === 'citation'
                  ? `${(run as CitationCheckRun).keywords.length} keyword${(run as CitationCheckRun).keywords.length !== 1 ? 's' : ''}`
                  : `${(run as ProfileRun).prompt_ids.length} prompt${(run as ProfileRun).prompt_ids.length !== 1 ? 's' : ''}`
                } ·{' '}
                {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            {isComplete && (
              <div className="aiv-run-card-score">
                {score != null && <span className="aiv-run-card-score-val">{score}<span className="aiv-run-card-score-unit">/100</span></span>}
                {recognisedCt != null && <span className="aiv-run-card-score-val">{recognisedCt}<span className="aiv-run-card-score-unit">/{totalEngines}</span></span>}
              </div>
            )}
          </a>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// llms.txt Generator Tab
// ---------------------------------------------------------------------------
function LlmsTxtTab({ engines, generations, planSlug, canGenerate, blockReason }: {
  engines: AiEngine[]
  generations: LlmsTxtGeneration[]
  planSlug: string
  canGenerate: boolean
  blockReason?: string
}) {
  const [domain, setDomain]           = useState('')
  const [selectedEngines, setSelected] = useState<string[]>(engines.map(e => e.id))
  const [loading, setLoading]          = useState(false)
  const [error, setError]              = useState('')
  const [generated, setGenerated]      = useState<string | null>(null)
  const [copied, setCopied]            = useState(false)

  const llmsEngines = engines.filter(e => e.type === 'llms_txt' || e.type === 'both')

  function toggleEngine(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!canGenerate) return
    const trimmedDomain = domain.trim()
    if (!trimmedDomain) { setError('Please enter a valid domain (e.g. mywebsite.com).'); return }
    if (selectedEngines.length === 0) { setError('Select at least one AI engine.'); return }

    setLoading(true); setError(''); setGenerated(null)
    try {
      const res = await fetch('/api/ai-visibility/generate-llms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmedDomain, engineIds: selectedEngines }),
      })
      let data: { error?: string; content?: string } = {}
      try { data = await res.json() } catch { /* keep data empty */ }
      if (!res.ok) { setError(data.error ?? 'Generation failed. Please try again.'); return }
      if (!data.content) { setError('No content returned. Please try again.'); return }
      setGenerated(data.content)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    if (!generated) return
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    if (!generated) return
    const blob = new Blob([generated], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'llms.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="aiv-layout">
      {/* Form panel */}
      <div className="aiv-form-panel">
        <div className="aiv-panel-header">
          <div className="aiv-panel-icon"><FileText size={16} /></div>
          <div>
            <div className="aiv-panel-title">Generate llms.txt</div>
            <div className="aiv-panel-desc">
              A llms.txt file tells AI engines what your site is about. Place it at <code>yourdomain.com/llms.txt</code>.
            </div>
          </div>
        </div>

        {!canGenerate && blockReason && (
          <div className="aiv-notice aiv-notice-warn">
            <span>{blockReason}</span>
            <a href="/dashboard/settings?tab=billing" className="aiv-notice-link">Upgrade →</a>
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ opacity: canGenerate ? 1 : 0.5, pointerEvents: canGenerate ? 'auto' : 'none' }}>
          <div className="aiv-field">
            <label className="aiv-label">Your domain</label>
            <input className="form-input" type="text" value={domain}
              onChange={e => setDomain(e.target.value)} placeholder="e.g. mywebsite.com" required />
          </div>

          <div className="aiv-field">
            <label className="aiv-label">Optimise for these AI engines</label>
            <EngineGrid engines={llmsEngines} selected={selectedEngines} onToggle={toggleEngine} />
          </div>

          {error && <div className="aiv-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || selectedEngines.length === 0}>
            {loading ? 'Generating…' : 'Generate llms.txt'}
          </button>

          {planSlug === 'free' && (
            <p className="aiv-plan-note">Free plan: 1 generation. <a href="/dashboard/settings?tab=billing">Upgrade</a> for unlimited.</p>
          )}
        </form>
      </div>

      {/* Output panel */}
      <div className="aiv-result-panel">
        <div className="aiv-panel-header">
          <div className="aiv-panel-icon"><ClipboardList size={16} /></div>
          <div className="aiv-panel-title">Your llms.txt</div>
        </div>

        {generated ? (
          <>
            <div className="aiv-output-actions">
              <button className="btn btn-secondary btn-sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
              <button className="btn btn-primary btn-sm" onClick={download}>Download</button>
            </div>
            <pre className="aiv-output">{generated}</pre>
            <p className="aiv-output-hint">
              Upload this file to your web root as <code>llms.txt</code>, then re-run the{' '}
              <a href="/tools/ai-seo-checker" target="_blank">AI SEO Checker</a> to confirm it&apos;s detected.
            </p>
            <details className="aiv-next-steps">
              <summary>
                <Lightbulb size={14} />
                What to do next with your llms.txt
              </summary>
              <ol>
                <li><strong>Save the file</strong> — click Download above to get <code>llms.txt</code></li>
                <li><strong>Upload to your web root</strong> — place it at <code>https://yourdomain.com/llms.txt</code> (same level as robots.txt).</li>
                <li><strong>Check your robots.txt</strong> — make sure it allows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended.</li>
                <li><strong>Verify it&apos;s live</strong> — visit <code>https://yourdomain.com/llms.txt</code> in your browser, then run the <a href="/tools/ai-seo-checker" target="_blank">AI SEO Checker</a>.</li>
                <li><strong>Monitor your citations</strong> — switch to the AI Citation Monitor tab to track which engines cite your domain.</li>
                <li><strong>Keep it updated</strong> — regenerate whenever you add major new sections or pages.</li>
              </ol>
            </details>
          </>
        ) : (
          <div className="aiv-empty">
            <div className="aiv-empty-icon"><FileText size={36} strokeWidth={1.2} /></div>
            <div className="aiv-empty-title">Your llms.txt will appear here</div>
            <div className="aiv-empty-desc">Fill in the form and click Generate to create your file.</div>
          </div>
        )}

        {generations.length > 0 && (
          <div className="aiv-history">
            <div className="aiv-history-title">Previous generations</div>
            {generations.slice(0, 5).map(g => (
              <div key={g.id} className="aiv-history-row" onClick={() => setGenerated(g.content)}>
                <span className="aiv-history-domain">{g.domain}</span>
                <span className="aiv-history-date">
                  {new Date(g.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Citation Monitor Tab
// ---------------------------------------------------------------------------
function CitationTab({ engines, freeEngineIds, runs, planSlug, runsThisMonth, monthlyLimit }: {
  engines:        AiEngine[]
  freeEngineIds:  string[]
  runs:           CitationCheckRun[]
  planSlug:       string
  runsThisMonth:  number
  monthlyLimit:   number
}) {
  const [domain, setDomain]            = useState('')
  const [brand, setBrand]              = useState('')
  const [keywords, setKeywords]        = useState('')
  const [selectedEngines, setSelected] = useState<string[]>(
    planSlug === 'free' ? freeEngineIds : engines.filter(e => e.type === 'citation' || e.type === 'both').map(e => e.id)
  )
  const [loading, setLoading]          = useState(false)
  const [error, setError]              = useState('')
  const [runId, setRunId]              = useState<string | null>(null)

  const citationEngines = engines.filter(e => e.type === 'citation' || e.type === 'both')
  const canRun = runsThisMonth < monthlyLimit
  const remainingRuns = Math.max(0, monthlyLimit - runsThisMonth)

  function toggleEngine(id: string) {
    if (planSlug === 'free' && !freeEngineIds.includes(id)) return
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!canRun) return
    setLoading(true); setError(''); setRunId(null)
    try {
      const res = await fetch('/api/ai-visibility/citation-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain:    domain.trim(),
          brand:     brand.trim() || undefined,
          keywords:  keywords.split('\n').map(k => k.trim()).filter(Boolean).slice(0, 5),
          engineIds: selectedEngines,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to start check.'); return }
      setRunId(data.runId)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="aiv-layout">
      <div className="aiv-form-panel">
        <div className="aiv-panel-header">
          <div className="aiv-panel-icon"><Search size={16} /></div>
          <div>
            <div className="aiv-panel-title">Run AI Citation Check</div>
            <div className="aiv-panel-desc">
              We query each AI engine with your keywords and check whether your domain appears as a cited source.
            </div>
          </div>
        </div>

        {planSlug === 'free' && (
          <div className="aiv-notice aiv-notice-info">
            <span><strong>Free plan:</strong> Free-tier engines only (Copilot, Exa).</span>
            <a href="/dashboard/settings?tab=billing" className="aiv-notice-link">Upgrade →</a>
          </div>
        )}

        {!canRun && planSlug !== 'free' && (
          <div className="aiv-notice aiv-notice-warn">
            <span>You&apos;ve used all {monthlyLimit} checks this month. Resets on the 1st.</span>
            <a href="/dashboard/settings?tab=billing" className="aiv-notice-link">Upgrade →</a>
          </div>
        )}

        {canRun && planSlug !== 'free' && (
          <div className="aiv-quota-row">
            <span>{remainingRuns} run{remainingRuns !== 1 ? 's' : ''} remaining this month</span>
          </div>
        )}

        <form onSubmit={handleRun} style={{ opacity: canRun ? 1 : 0.5, pointerEvents: canRun ? 'auto' : 'none' }}>
          <div className="aiv-field">
            <label className="aiv-label">Domain to check</label>
            <input className="form-input" type="text" value={domain}
              onChange={e => setDomain(e.target.value)} placeholder="e.g. mywebsite.com" required />
          </div>

          <div className="aiv-field">
            <label className="aiv-label">Brand / product name <span className="aiv-label-hint">(optional)</span></label>
            <input className="form-input" type="text" value={brand}
              onChange={e => setBrand(e.target.value)} placeholder="e.g. Upnotify" maxLength={100} />
          </div>

          <div className="aiv-field">
            <label className="aiv-label">Target keywords <span className="aiv-label-hint">(one per line, max 5)</span></label>
            <textarea className="form-input" rows={4} value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder={"best project management tools\nhow to improve website speed\nwhat is uptime monitoring"} required />
            <span className="aiv-hint">These queries are sent to each AI engine to see if your site is cited.</span>
          </div>

          <div className="aiv-field">
            <label className="aiv-label">AI engines to check</label>
            <EngineGrid engines={citationEngines} selected={selectedEngines} onToggle={toggleEngine} freeEngineIds={freeEngineIds} planSlug={planSlug} />
          </div>

          {error && <div className="aiv-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || selectedEngines.length === 0}>
            {loading ? 'Starting check…' : 'Run Citation Check'}
          </button>
        </form>

        {runId && <RunStartedBanner runId={runId} />}
      </div>

      <div className="aiv-result-panel">
        <div className="aiv-panel-header">
          <div className="aiv-panel-icon"><ClipboardList size={16} /></div>
          <div className="aiv-panel-title">Recent checks</div>
        </div>
        <RunsList runs={runs} type="citation" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Profile Tab
// ---------------------------------------------------------------------------
function ProfileTab({ engines, freeEngineIds, runs, planSlug, runsThisMonth, monthlyLimit }: {
  engines:        AiEngine[]
  freeEngineIds:  string[]
  runs:           ProfileRun[]
  planSlug:       string
  runsThisMonth:  number
  monthlyLimit:   number
}) {
  const [domain, setDomain]            = useState('')
  const [selectedEngines, setSelected] = useState<string[]>(
    planSlug === 'free' ? freeEngineIds : engines.filter(e => e.type === 'citation' || e.type === 'both').map(e => e.id),
  )
  const [loading, setLoading]          = useState(false)
  const [error, setError]              = useState('')
  const [runId, setRunId]              = useState<string | null>(null)

  const profileEngines = engines.filter(e => e.type === 'citation' || e.type === 'both')
  const canRun = runsThisMonth < monthlyLimit
  const remainingRuns = Math.max(0, monthlyLimit - runsThisMonth)

  function toggleEngine(id: string) {
    if (planSlug === 'free' && !freeEngineIds.includes(id)) return
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!canRun) return
    setLoading(true); setError(''); setRunId(null)
    try {
      const res = await fetch('/api/ai-visibility/profile-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), engineIds: selectedEngines }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to start AI Profile.'); return }
      setRunId(data.runId)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="aiv-layout">
      <div className="aiv-form-panel">
        <div className="aiv-panel-header">
          <div className="aiv-panel-icon"><Eye size={16} /></div>
          <div>
            <div className="aiv-panel-title">Run AI Profile</div>
            <div className="aiv-panel-desc">
              Discover what AI engines actually think about your site. We ask each engine introspection questions
              about your domain and capture their responses.
            </div>
          </div>
        </div>

        {planSlug === 'free' && (
          <div className="aiv-notice aiv-notice-info">
            <span><strong>Free plan:</strong> Free-tier engines only (Copilot, Exa).</span>
            <a href="/dashboard/settings?tab=billing" className="aiv-notice-link">Upgrade →</a>
          </div>
        )}

        {!canRun && planSlug !== 'free' && (
          <div className="aiv-notice aiv-notice-warn">
            <span>You&apos;ve used all {monthlyLimit} AI Visibility runs this month. Resets on the 1st.</span>
            <a href="/dashboard/settings?tab=billing" className="aiv-notice-link">Upgrade →</a>
          </div>
        )}

        {canRun && planSlug !== 'free' && (
          <div className="aiv-quota-row">
            <span>{remainingRuns} run{remainingRuns !== 1 ? 's' : ''} remaining (shared with citation checks)</span>
          </div>
        )}

        <form onSubmit={handleRun} style={{ opacity: canRun ? 1 : 0.5, pointerEvents: canRun ? 'auto' : 'none' }}>
          <div className="aiv-field">
            <label className="aiv-label">Your domain</label>
            <input className="form-input" type="text" value={domain}
              onChange={e => setDomain(e.target.value)} placeholder="e.g. mywebsite.com" required />
            <span className="aiv-hint">We&apos;ll ask each AI engine a set of questions about this domain.</span>
          </div>

          <div className="aiv-field">
            <label className="aiv-label">AI engines to ask</label>
            <EngineGrid engines={profileEngines} selected={selectedEngines} onToggle={toggleEngine} freeEngineIds={freeEngineIds} planSlug={planSlug} />
          </div>

          {error && <div className="aiv-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || selectedEngines.length === 0}>
            {loading ? 'Running AI Profile…' : 'Run AI Profile'}
          </button>
          <p className="aiv-plan-note">Each run uses one AI Visibility credit (shared with citation checks).</p>
        </form>

        {runId && <RunStartedBanner runId={runId} profileMode />}
      </div>

      <div className="aiv-result-panel">
        <div className="aiv-panel-header">
          <div className="aiv-panel-icon"><Eye size={16} /></div>
          <div className="aiv-panel-title">Recent profiles</div>
        </div>
        <RunsList runs={runs} type="profile" />
      </div>
    </div>
  )
}
