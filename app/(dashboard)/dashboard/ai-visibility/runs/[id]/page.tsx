import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getCitationRunById, getCitationResults } from '@/lib/db/ai-visibility'
import { getActiveEngines } from '@/lib/db/ai-engines'
import type { CitationCheckResult, CitationCheckRun } from '@/lib/db/ai-visibility'
import type { AiEngine } from '@/lib/db/ai-engines'
import { aggregateCompetitorsByKeyword, perKeywordVisibility } from '@/lib/utils/citation-aggregations'

export const metadata: Metadata = { title: 'Citation Run — AI Visibility' }

export default async function CitationRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.ReactElement> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [run, results, engines] = await Promise.all([
    getCitationRunById(id),
    getCitationResults(id),
    getActiveEngines(),
  ])

  if (!run || run.org_id !== user.org_id) notFound()

  const engineMap = Object.fromEntries(engines.map(e => [e.id, e]))

  return (
    <div className="db-content">
      {/* ── Hero header ── */}
      <div className="crd-hero">
        <div className="crd-hero-accent" />
        <div className="crd-hero-body">
          <div className="crd-hero-left">
            <a href="/dashboard/ai-visibility" className="crd-back">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              AI Visibility
            </a>
            <h1 className="crd-title">Citation Check — <span className="crd-domain">{run.domain}</span></h1>
            <div className="crd-meta">
              {run.keywords.length} keyword{run.keywords.length !== 1 ? 's' : ''}
              <span className="crd-meta-sep">·</span>
              {run.engine_ids.length} engine{run.engine_ids.length !== 1 ? 's' : ''}
              <span className="crd-meta-sep">·</span>
              {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <RunStatusBadge status={run.status} />
        </div>
      </div>

      {run.status === 'pending' || run.status === 'running' ? (
        <PendingState run={run} />
      ) : run.status === 'failed' ? (
        <FailedState run={run} />
      ) : (
        <CompletedState run={run} results={results} engineMap={engineMap} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function RunStatusBadge({ status }: { status: CitationCheckRun['status'] }): React.ReactElement {
  const map: Record<string, { color: string; label: string }> = {
    pending:  { color: '#f59e0b', label: 'Pending' },
    running:  { color: '#3b82f6', label: 'Running' },
    complete: { color: '#22c55e', label: 'Complete' },
    failed:   { color: '#ef4444', label: 'Failed'  },
  }
  const { color, label } = map[status] ?? { color: '#94a3b8', label: status }
  return (
    <span className="crd-status-badge" style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}35`,
    }}>
      <span className="crd-status-dot" style={{ background: color }} />
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Pending / Failed states
// ---------------------------------------------------------------------------
function PendingState({ run }: { run: CitationCheckRun }): React.ReactElement {
  return (
    <div className="crd-state-card">
      <div className="crd-state-icon crd-state-icon-pending">
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div className="crd-state-title">{run.status === 'pending' ? 'Check queued' : 'Check in progress'}</div>
      <div className="crd-state-desc">We&apos;re querying each AI engine with your keywords. This usually takes a few seconds.</div>
      <a href={`/dashboard/ai-visibility/runs/${run.id}`} className="btn btn-secondary btn-sm">Refresh page</a>
    </div>
  )
}

function FailedState({ run }: { run: CitationCheckRun }): React.ReactElement {
  return (
    <div className="crd-state-card">
      <div className="crd-state-icon crd-state-icon-failed">
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div className="crd-state-title">Check failed</div>
      <div className="crd-state-desc">{run.error_message ?? 'An unexpected error occurred. Please try again.'}</div>
      <a href="/dashboard/ai-visibility" className="btn btn-primary btn-sm">Run a new check</a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Completed state
// ---------------------------------------------------------------------------
function CompletedState({ run, results, engineMap }: {
  run:       CitationCheckRun
  results:   CitationCheckResult[]
  engineMap: Record<string, AiEngine>
}): React.ReactElement {
  const summary = run.summary

  const byKeyword: Record<string, CitationCheckResult[]> = {}
  for (const r of results) {
    if (!byKeyword[r.keyword]) byKeyword[r.keyword] = []
    byKeyword[r.keyword].push(r)
  }

  const perKeyword         = perKeywordVisibility(results, engineMap)
  const competitorLeaderboard = aggregateCompetitorsByKeyword(results, run.domain)
  const remediations       = buildRemediations(run, results, engineMap)

  const score = summary?.score ?? 0
  const scoreColor = score >= 60 ? '#22c55e' : score >= 30 ? '#f59e0b' : '#ef4444'

  return (
    <div className="crd-content">

      {/* ── Summary stat strip ── */}
      {summary && (
        <div className="crd-stat-strip">
          <div className="crd-stat">
            <span className="crd-stat-val" style={{ color: scoreColor }}>{summary.score}<span className="crd-stat-unit">/100</span></span>
            <span className="crd-stat-label">Visibility score</span>
          </div>
          <div className="crd-stat-divider" />
          <div className="crd-stat">
            <span className="crd-stat-val" style={{ color: '#22c55e' }}>{summary.cited_by.length}</span>
            <span className="crd-stat-label">Cited by</span>
          </div>
          <div className="crd-stat-divider" />
          <div className="crd-stat">
            <span className="crd-stat-val" style={{ color: '#ef4444' }}>{summary.not_cited_by.length}</span>
            <span className="crd-stat-label">Not cited by</span>
          </div>
          <div className="crd-stat-divider" />
          <div className="crd-stat">
            <span className="crd-stat-val">{summary.total_checks}</span>
            <span className="crd-stat-label">Total checks</span>
          </div>
        </div>
      )}

      {/* ── Visibility by keyword ── */}
      {perKeyword.length > 0 && (
        <div className="crd-card">
          <div className="crd-card-header">
            <div className="crd-card-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div className="crd-card-title">Visibility by keyword</div>
          </div>
          <div className="crd-kw-table">
            <div className="crd-kw-row crd-kw-head">
              <span>Keyword</span>
              <span>Visibility</span>
              <span>Cited by</span>
            </div>
            {perKeyword.map(row => (
              <div key={row.keyword} className="crd-kw-row">
                <span className="crd-kw-term">&ldquo;{row.keyword}&rdquo;</span>
                <span className="crd-kw-score" style={{
                  color: row.scorePct >= 50 ? '#16a34a' : row.scorePct > 0 ? '#d97706' : '#dc2626',
                }}>
                  {row.scorePct}% ({row.citedEngines.length}/{row.totalEngines})
                </span>
                <span className="crd-kw-engines">
                  {row.citedEngines.length > 0 ? row.citedEngines.join(', ') : <span className="crd-kw-none">None</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Engine breakdown ── */}
      {summary && (summary.cited_by.length > 0 || summary.not_cited_by.length > 0) && (
        <div className="crd-card">
          <div className="crd-card-header">
            <div className="crd-card-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div className="crd-card-title">Engine breakdown <span className="crd-card-subtitle">any keyword</span></div>
          </div>
          <div className="crd-engine-chips">
            {run.engine_ids.map(engId => {
              const engine = engineMap[engId]
              const cited  = summary.cited_by.includes(engine?.slug ?? engId)
              return (
                <div key={engId} className={`crd-engine-chip ${cited ? 'cited' : 'not-cited'}`}>
                  <span className="crd-engine-name">{engine?.name ?? '[deactivated]'}</span>
                  <span className="crd-engine-result">
                    {cited
                      ? <><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Cited</>
                      : <><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Not cited</>
                    }
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Competitor leaderboard ── */}
      {Object.keys(competitorLeaderboard).length > 0 && (
        <div className="crd-card">
          <div className="crd-card-header">
            <div className="crd-card-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div>
              <div className="crd-card-title">Who&apos;s winning instead of you</div>
              <div className="crd-card-desc">Domains AI engines surfaced as sources for each keyword, ranked by citation count.</div>
            </div>
          </div>
          <div className="crd-leaderboard">
            {Object.entries(competitorLeaderboard).map(([keyword, entries]) => (
              <div key={keyword} className="crd-lb-section">
                <div className="crd-lb-keyword-label">&ldquo;{keyword}&rdquo;</div>
                <div className="crd-lb-list">
                  {entries.slice(0, 8).map((entry, idx) => (
                    <div key={entry.domain} className={`crd-lb-item${entry.isUser ? ' is-you' : ''}`}>
                      <span className="crd-lb-rank">#{idx + 1}</span>
                      <span className="crd-lb-favicon">
                        {entry.domain.charAt(0).toUpperCase()}
                      </span>
                      <span className="crd-lb-domain">{entry.domain}</span>
                      {entry.isUser && <span className="crd-lb-you-tag">you</span>}
                      <span className="crd-lb-engines-badge">
                        {entry.engineCount} {entry.engineCount === 1 ? 'engine' : 'engines'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Per-keyword results ── */}
      {run.keywords.map(keyword => {
        const keyResults = byKeyword[keyword] ?? []
        const citedCount = keyResults.filter(r => r.cited).length
        return (
          <div key={keyword} className="crd-card">
            <div className="crd-card-header">
              <div className="crd-card-icon">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <div className="crd-card-title">&ldquo;{keyword}&rdquo;</div>
              <span className="crd-kw-count-badge">{citedCount}/{keyResults.length} cited</span>
            </div>
            {keyResults.length === 0 ? (
              <div className="crd-no-results">No results recorded for this keyword.</div>
            ) : (
              <div className="crd-results-list">
                {keyResults.map(result => {
                  const engine = engineMap[result.engine_id]
                  return (
                    <ResultRow
                      key={result.id}
                      result={result}
                      engineName={engine?.name ?? '[deactivated engine]'}
                      userDomain={run.domain}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Remediation tips ── */}
      {remediations.length > 0 && (
        <div className="crd-card crd-card-remediation">
          <div className="crd-card-header">
            <div className="crd-card-icon crd-card-icon-accent">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div className="crd-card-title">How to improve your AI visibility</div>
              <div className="crd-card-desc">Based on your results, here are the highest-impact actions you can take.</div>
            </div>
          </div>
          <div className="crd-tips">
            {remediations.map((tip, i) => (
              <RemediationTip key={i} priority={tip.priority} title={tip.title} body={tip.body} link={tip.link} linkLabel={tip.linkLabel} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------
function ResultRow({ result, engineName, userDomain }: {
  result: CitationCheckResult; engineName: string; userDomain: string
}): React.ReactElement {
  const cited       = result.cited === true
  const notCited    = result.cited === false
  const confLabels: Record<string, string> = { high: 'High confidence', medium: 'Medium confidence', indicative: 'Indicative' }

  return (
    <div className={`crd-result-row ${cited ? 'cited' : notCited ? 'not-cited' : 'unknown'}`}>
      <div className="crd-result-bar" />
      <div className="crd-result-body">
        <div className="crd-result-top">
          <div className="crd-result-engine-row">
            <span className="crd-result-engine">{engineName}</span>
            {result.confidence && (
              <span className="crd-result-conf">{confLabels[result.confidence] ?? result.confidence}</span>
            )}
          </div>
          <span className={`crd-result-verdict ${cited ? 'cited' : notCited ? 'not-cited' : 'unknown'}`}>
            {cited
              ? <><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Cited</>
              : notCited
              ? <><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Not cited</>
              : '— Unknown'
            }
          </span>
        </div>

        {result.response_text && (
          <div className="crd-result-text">
            <DomainHighlightedText text={result.response_text} domain={userDomain} />
          </div>
        )}

        {result.source_urls.length > 0 && (
          <div className="crd-result-urls">
            {result.source_urls.map((url, i) => {
              const isUser = url.toLowerCase().includes(userDomain.toLowerCase())
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className={`crd-url-chip${isUser ? ' is-user' : ''}`}>
                  {url}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DomainHighlightedText({ text, domain }: { text: string; domain: string }): React.ReactElement {
  if (!domain) return <>{text}</>
  const lower  = text.toLowerCase()
  const needle = domain.toLowerCase()
  const parts: React.ReactNode[] = []
  let cursor = 0
  while (cursor < text.length) {
    const idx = lower.indexOf(needle, cursor)
    if (idx === -1) { parts.push(text.slice(cursor)); break }
    if (idx > cursor) parts.push(text.slice(cursor, idx))
    parts.push(
      <mark key={idx} className="crd-highlight">
        {text.slice(idx, idx + needle.length)}
      </mark>
    )
    cursor = idx + needle.length
  }
  return <>{parts}</>
}

// ---------------------------------------------------------------------------
// Remediation tip
// ---------------------------------------------------------------------------
function RemediationTip({ priority, title, body, link, linkLabel }: {
  priority:   'high' | 'medium' | 'low'
  title:      string
  body:       string
  link?:      string
  linkLabel?: string
}): React.ReactElement {
  const cfg = {
    high:   { color: '#ef4444', label: 'High impact' },
    medium: { color: '#f59e0b', label: 'Medium impact' },
    low:    { color: '#3b82f6', label: 'Quick win' },
  }
  const { color, label } = cfg[priority]
  return (
    <div className="crd-tip">
      <span className="crd-tip-badge" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        {label}
      </span>
      <div className="crd-tip-title">{title}</div>
      <div className="crd-tip-body">{body}</div>
      {link && (
        <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="crd-tip-link">
          {linkLabel ?? 'Learn more'} →
        </a>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// buildRemediations (unchanged logic)
// ---------------------------------------------------------------------------
interface RemediationItem {
  priority:   'high' | 'medium' | 'low'
  title:      string
  body:       string
  link?:      string
  linkLabel?: string
}

function buildRemediations(
  run:       CitationCheckRun,
  results:   CitationCheckResult[],
  engineMap: Record<string, AiEngine>,
): RemediationItem[] {
  const tips: RemediationItem[] = []
  const summary = run.summary
  if (!summary) return tips
  const score = summary.score

  if (score === 0) {
    tips.push({ priority: 'high', title: 'Add an llms.txt file to your site', body: 'You have no AI citations yet. The single most impactful first step is adding an llms.txt file — it tells AI engines exactly what your site is about and who it helps. Generate one now.', link: '/dashboard/ai-visibility', linkLabel: 'Generate llms.txt' })
    tips.push({ priority: 'high', title: 'Publish authoritative, long-form content for these keywords', body: `AI engines like Exa and Perplexity cite content that directly and clearly answers the query. Create a dedicated page or article that thoroughly covers "${run.keywords[0]}" and similar terms. Include your domain name, company name, and key differentiators prominently.` })
    tips.push({ priority: 'medium', title: 'Add structured data (JSON-LD) to your site', body: 'JSON-LD schema markup (Organization, WebSite, FAQPage) makes your content significantly easier for AI engines to parse and attribute. Add it to your homepage and key landing pages.', link: 'https://schema.org/docs/gs.html', linkLabel: 'Schema.org guide' })
  }

  if (score > 0 && score < 100) {
    const notCitedEngineNames = (summary.not_cited_by ?? [])
      .map(slug => Object.values(engineMap).find(e => e.slug === slug)?.name ?? slug)
    if (notCitedEngineNames.length > 0) {
      tips.push({ priority: 'high', title: `Improve visibility on ${notCitedEngineNames.slice(0, 2).join(' and ')}`, body: `You're already cited by some engines but not by ${notCitedEngineNames.join(', ')}. Each engine has different signals: Perplexity and Exa prioritise pages with clear structured URLs and direct answers. ChatGPT and Claude weight training data and web grounding — publishing regular, well-structured content helps. Check your robots.txt allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot).` })
    }
    tips.push({ priority: 'medium', title: 'Expand your content around these exact keywords', body: `Create FAQ sections, comparison pages, and how-to guides specifically targeting: ${run.keywords.map(k => `"${k}"`).join(', ')}. AI engines prefer pages that directly answer a question in full rather than pages that mention the keyword in passing.` })
  }

  if (score > 0) {
    tips.push({ priority: 'medium', title: 'Check your robots.txt allows AI crawlers', body: 'Make sure your robots.txt does not block GPTBot (ChatGPT), ClaudeBot (Claude), PerplexityBot, or Google-Extended (Gemini). Blocking these means the engine cannot index your latest content and will stop citing you over time.', link: '/tools/ai-seo-checker', linkLabel: 'Run free AI SEO check' })
    tips.push({ priority: 'low', title: 'Keep your llms.txt up to date', body: 'AI engines re-crawl llms.txt regularly. Regenerate yours whenever you add major new sections, products, or pages. The more specific and accurate it is, the more precisely you will be cited.', link: '/dashboard/ai-visibility', linkLabel: 'Regenerate llms.txt' })
  }

  const hasErrors = results.some(r => r.response_text?.startsWith('Error:'))
  if (hasErrors) {
    tips.push({ priority: 'low', title: 'Some engine queries returned errors', body: 'One or more engines returned errors during this check. This may be temporary API rate limiting. Re-run the check to get fresh results.', link: '/dashboard/ai-visibility', linkLabel: 'Run again' })
  }

  return tips
}
