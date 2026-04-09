'use client'

import { useState } from 'react'
import type { AiEngine } from '@/lib/db/ai-engines'
import type { LlmsTxtGeneration, CitationCheckRun } from '@/lib/db/ai-visibility'

interface Props {
  engines:                AiEngine[]
  freeEngineIds:          string[]
  llmsGenerations:        LlmsTxtGeneration[]
  citationRuns:           CitationCheckRun[]
  planSlug:               string
  canGenerateLlms:        boolean
  llmsBlockReason?:       string
  citationRunsThisMonth:  number
  citationLimit:          number
}

type Tab = 'llms' | 'citation'

export function AiVisibilityClient({
  engines, freeEngineIds, llmsGenerations, citationRuns,
  planSlug, canGenerateLlms, llmsBlockReason,
  citationRunsThisMonth, citationLimit,
}: Props): React.ReactElement {
  const [tab, setTab] = useState<Tab>('llms')

  return (
    <div>
      {/* Tab switcher */}
      <div className="db-tabs" style={{ marginBottom: 24 }}>
        <button className={`db-tab${tab === 'llms' ? ' db-tab-active' : ''}`} onClick={() => setTab('llms')}>
          llms.txt Generator
        </button>
        <button className={`db-tab${tab === 'citation' ? ' db-tab-active' : ''}`} onClick={() => setTab('citation')}>
          AI Citation Monitor
          {citationLimit > 0 && (
            <span className="db-tab-badge">{citationRunsThisMonth}/{citationLimit} used</span>
          )}
        </button>
      </div>

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
    setLoading(true)
    setError('')
    setGenerated(null)
    try {
      const res = await fetch('/api/ai-visibility/generate-llms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), engineIds: selectedEngines }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed.'); return }
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
    <div>
      <div className="ai-vis-grid">
        {/* Generator panel */}
        <div className="ai-vis-panel">
          <h2 className="ai-vis-panel-title">Generate llms.txt</h2>
          <p className="ai-vis-panel-desc">
            A llms.txt file tells AI engines what your site is about. Place it at <code>yourdomain.com/llms.txt</code>.
          </p>

          {!canGenerate && blockReason && (
            <div className="ai-vis-limit-notice">
              <div className="ai-vis-limit-text">{blockReason}</div>
              <a href="/dashboard/settings?tab=billing" className="ai-vis-upgrade-link">Upgrade plan →</a>
            </div>
          )}

          <form onSubmit={handleGenerate} style={{ opacity: canGenerate ? 1 : 0.5, pointerEvents: canGenerate ? 'auto' : 'none' }}>
            <div className="ai-vis-form-group">
              <label className="ai-vis-label">Your domain</label>
              <input className="ai-vis-input" type="text" value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="e.g. mywebsite.com" required />
            </div>

            <div className="ai-vis-form-group">
              <label className="ai-vis-label">Optimise for these AI engines</label>
              <div className="ai-vis-engine-grid">
                {llmsEngines.map(engine => (
                  <label key={engine.id} className={`ai-vis-engine-chip ${selectedEngines.includes(engine.id) ? 'ai-vis-engine-chip-on' : ''}`}>
                    <input type="checkbox" checked={selectedEngines.includes(engine.id)}
                      onChange={() => toggleEngine(engine.id)} style={{ display: 'none' }} />
                    <span className="ai-vis-engine-name">{engine.name}</span>
                    <span className={`ai-vis-signal ai-vis-signal-${engine.signal_quality}`}>{engine.signal_quality}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="ai-vis-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading || selectedEngines.length === 0}>
              {loading ? 'Generating...' : 'Generate llms.txt'}
            </button>

            {planSlug === 'free' && (
              <p className="ai-vis-plan-note">Free plan: 1 generation. <a href="/dashboard/settings?tab=billing">Upgrade</a> for unlimited.</p>
            )}
          </form>
        </div>

        {/* Generated output */}
        <div className="ai-vis-panel">
          <h2 className="ai-vis-panel-title">Your llms.txt</h2>
          {generated ? (
            <>
              <div className="ai-vis-output-header">
                <button className="btn btn-secondary btn-sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
                <button className="btn btn-primary btn-sm" onClick={download}>Download</button>
              </div>
              <pre className="ai-vis-output">{generated}</pre>
              <p className="ai-vis-output-hint">
                Upload this file to your web root as <code>llms.txt</code>, then re-run the{' '}
                <a href="/tools/ai-seo-checker" target="_blank">AI SEO Checker</a> to confirm it&apos;s detected.
              </p>
              {generated && (
                <details className="ai-vis-next-steps" style={{ marginTop: 20 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: '10px 0', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📋</span> What to do next with your llms.txt
                  </summary>
                  <div style={{ paddingTop: 12 }}>
                    <ol style={{ paddingLeft: '1.4rem', lineHeight: 2.2, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <li><strong>Save the file</strong> — click Download above to get <code>llms.txt</code></li>
                      <li><strong>Upload to your web root</strong> — place it at <code>https://yourdomain.com/llms.txt</code> (same level as robots.txt). For WordPress: upload via FTP or File Manager to the root folder. For Webflow/Squarespace: upload as a static file in Settings → Custom Code. For Vercel/Netlify: place the file in your <code>public/</code> folder.</li>
                      <li><strong>Check your robots.txt</strong> — make sure it allows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended. If it&apos;s missing or blocking them, use the <a href="/tools/ai-seo-checker" target="_blank">free AI SEO Checker</a> to see exactly what to fix.</li>
                      <li><strong>Verify it&apos;s live</strong> — visit <code>https://yourdomain.com/llms.txt</code> in your browser to confirm it&apos;s accessible. Then run the <a href="/tools/ai-seo-checker" target="_blank">AI SEO Checker</a> on your domain — the llms.txt check should now pass.</li>
                      <li><strong>Monitor your citations</strong> — switch to the <strong>AI Citation Monitor</strong> tab above to track which AI engines are actually citing your domain for your target keywords. Runs complete asynchronously and you&apos;ll receive an email when done.</li>
                      <li><strong>Keep it updated</strong> — regenerate your llms.txt whenever you add major new sections or pages to your site. AI engines re-crawl llms.txt regularly.</li>
                    </ol>
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                      💡 <strong>Tip:</strong> Customise the generated file before uploading — fill in the <code>[placeholder]</code> sections with your real site description, key pages, and author details. The more specific, the better your AI citations will be.
                    </div>
                  </div>
                </details>
              )}
            </>
          ) : (
            <div className="ai-vis-empty">
              <div className="ai-vis-empty-icon">📄</div>
              <p>Your generated llms.txt will appear here. Fill in the form and click Generate.</p>
            </div>
          )}

          {/* Previous generations */}
          {generations.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 className="ai-vis-history-title">Previous generations</h3>
              <div className="ai-vis-history-list">
                {generations.slice(0, 5).map(g => (
                  <div key={g.id} className="ai-vis-history-item"
                    onClick={() => setGenerated(g.content)} style={{ cursor: 'pointer' }}>
                    <span className="ai-vis-history-domain">{g.domain}</span>
                    <span className="ai-vis-history-date">
                      {new Date(g.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
  const [keywords, setKeywords]        = useState('')
  const [selectedEngines, setSelected] = useState<string[]>(
    planSlug === 'free' ? freeEngineIds : engines.filter(e => e.type === 'citation' || e.type === 'both').map(e => e.id)
  )
  const [loading, setLoading]          = useState(false)
  const [error, setError]              = useState('')
  const [runId, setRunId]              = useState<string | null>(null)

  const citationEngines = engines.filter(e => e.type === 'citation' || e.type === 'both')
  const canRun = planSlug === 'free' || runsThisMonth < monthlyLimit

  function toggleEngine(id: string) {
    if (planSlug === 'free' && !freeEngineIds.includes(id)) return // block paid engines for free users
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!canRun) return
    setLoading(true)
    setError('')
    setRunId(null)
    try {
      const res = await fetch('/api/ai-visibility/citation-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain:    domain.trim(),
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

  const remainingRuns = Math.max(0, monthlyLimit - runsThisMonth)

  return (
    <div>
      {planSlug === 'free' && (
        <div className="ai-vis-free-notice">
          <strong>Free plan:</strong> You can check free-tier engines only (Copilot, Exa).{' '}
          <a href="/dashboard/settings?tab=billing">Upgrade to Lite</a> to access all engines and get 2 checks/month.
        </div>
      )}

      {planSlug !== 'free' && (
        <div className="ai-vis-usage-bar">
          <span className="ai-vis-usage-text">
            {runsThisMonth} / {monthlyLimit} checks used this month
            {remainingRuns > 0 ? ` · ${remainingRuns} remaining` : ' · Resets on the 1st'}
          </span>
          <div className="ai-vis-usage-track">
            <div className="ai-vis-usage-fill"
              style={{ width: `${Math.min((runsThisMonth / monthlyLimit) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      <div className="ai-vis-grid">
        {/* Run panel */}
        <div className="ai-vis-panel">
          <h2 className="ai-vis-panel-title">Run AI Citation Check</h2>
          <p className="ai-vis-panel-desc">
            We query each AI engine with your keywords and check whether your domain appears as a cited source.
          </p>

          {!canRun && (
            <div className="ai-vis-limit-notice">
              <div className="ai-vis-limit-text">You&apos;ve used all {monthlyLimit} checks for this month. Resets on the 1st.</div>
              <a href="/dashboard/settings?tab=billing" className="ai-vis-upgrade-link">Upgrade for more →</a>
            </div>
          )}

          <form onSubmit={handleRun} style={{ opacity: canRun ? 1 : 0.5, pointerEvents: canRun ? 'auto' : 'none' }}>
            <div className="ai-vis-form-group">
              <label className="ai-vis-label">Domain to check</label>
              <input className="ai-vis-input" type="text" value={domain}
                onChange={e => setDomain(e.target.value)} placeholder="e.g. mywebsite.com" required />
            </div>

            <div className="ai-vis-form-group">
              <label className="ai-vis-label">Target keywords (one per line, max 5)</label>
              <textarea className="ai-vis-input" rows={4} value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder={"best project management tools\nhow to improve website speed\nwhat is uptime monitoring"} required />
              <span className="ai-vis-hint">These are the queries we send to each AI engine to see if your site is cited.</span>
            </div>

            <div className="ai-vis-form-group">
              <label className="ai-vis-label">AI engines to check</label>
              <div className="ai-vis-engine-grid">
                {citationEngines.map(engine => {
                  const isFreeEngine = freeEngineIds.includes(engine.id)
                  const locked = planSlug === 'free' && !isFreeEngine
                  return (
                    <label key={engine.id}
                      className={`ai-vis-engine-chip ${selectedEngines.includes(engine.id) ? 'ai-vis-engine-chip-on' : ''} ${locked ? 'ai-vis-engine-chip-locked' : ''}`}
                      title={locked ? 'Upgrade to access this engine' : undefined}>
                      <input type="checkbox" checked={selectedEngines.includes(engine.id)}
                        onChange={() => toggleEngine(engine.id)} disabled={locked} style={{ display: 'none' }} />
                      <span className="ai-vis-engine-name">{engine.name}</span>
                      {locked
                        ? <span className="ai-vis-signal ai-vis-signal-locked">Upgrade</span>
                        : <span className={`ai-vis-signal ai-vis-signal-${engine.signal_quality}`}>{engine.signal_quality}</span>
                      }
                    </label>
                  )
                })}
              </div>
            </div>

            {error && <div className="ai-vis-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading || selectedEngines.length === 0}>
              {loading ? 'Starting check...' : 'Run Citation Check'}
            </button>
          </form>

          {runId && (
            <div className="ai-vis-run-started">
              <div className="ai-vis-run-icon">✓</div>
              <div>
                <div className="ai-vis-run-title">Check started</div>
                <div className="ai-vis-run-desc">
                  We&apos;ll email you when results are ready — usually within 2–5 minutes.
                  You can also refresh this page to check status.
                </div>
                <a href={`/dashboard/ai-visibility/runs/${runId}`} className="ai-vis-run-link">View run →</a>
              </div>
            </div>
          )}
        </div>

        {/* Recent runs */}
        <div className="ai-vis-panel">
          <h2 className="ai-vis-panel-title">Recent checks</h2>
          {runs.length === 0 ? (
            <div className="ai-vis-empty">
              <div className="ai-vis-empty-icon">🔍</div>
              <p>No citation checks yet. Run your first check to see how visible your site is in AI search.</p>
            </div>
          ) : (
            <div className="ai-vis-runs-list">
              {runs.map(run => {
                const statusColor = run.status === 'complete' ? '#22c55e' : run.status === 'failed' ? '#ef4444' : '#f59e0b'
                return (
                  <a key={run.id} href={`/dashboard/ai-visibility/runs/${run.id}`} className="ai-vis-run-item">
                    <div className="ai-vis-run-item-left">
                      <div className="ai-vis-run-domain">{run.domain}</div>
                      <div className="ai-vis-run-meta">
                        {run.engine_ids.length} engine{run.engine_ids.length !== 1 ? 's' : ''} ·{' '}
                        {run.keywords.length} keyword{run.keywords.length !== 1 ? 's' : ''} ·{' '}
                        {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="ai-vis-run-right">
                      {run.summary && (
                        <div className="ai-vis-run-score">{run.summary.score}/100</div>
                      )}
                      <span className="ai-vis-run-status" style={{ color: statusColor }}>{run.status}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
