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
      <div className="db-page-header">
        <div>
          <a href="/dashboard/ai-visibility" className="db-breadcrumb-back">← AI Visibility</a>
          <div className="db-page-title" style={{ marginTop: 6 }}>
            Citation Check — {run.domain}
          </div>
          <div className="db-page-sub">
            {run.keywords.length} keyword{run.keywords.length !== 1 ? 's' : ''} ·{' '}
            {run.engine_ids.length} engine{run.engine_ids.length !== 1 ? 's' : ''} ·{' '}
            {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <RunStatusBadge status={run.status} />
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
  const colors: Record<string, string> = {
    pending:  '#f59e0b',
    running:  '#3b82f6',
    complete: '#22c55e',
    failed:   '#ef4444',
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
      background: `${colors[status]}20`, color: colors[status],
      border: `1px solid ${colors[status]}40`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors[status] }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Pending state
// ---------------------------------------------------------------------------
function PendingState({ run }: { run: CitationCheckRun }): React.ReactElement {
  return (
    <div className="ai-vis-panel" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        {run.status === 'pending' ? 'Check queued' : 'Check in progress'}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        We&apos;re querying each AI engine with your keywords. This usually takes a few seconds.
      </div>
      <a href={`/dashboard/ai-visibility/runs/${run.id}`} className="btn btn-secondary btn-sm">Refresh</a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Failed state
// ---------------------------------------------------------------------------
function FailedState({ run }: { run: CitationCheckRun }): React.ReactElement {
  return (
    <div className="ai-vis-panel" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Check failed</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        {run.error_message ?? 'An unexpected error occurred. Please try again.'}
      </div>
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

  // Group results by keyword
  const byKeyword: Record<string, CitationCheckResult[]> = {}
  for (const r of results) {
    if (!byKeyword[r.keyword]) byKeyword[r.keyword] = []
    byKeyword[r.keyword].push(r)
  }

  // Per-keyword visibility table at the top — Q1 surfaced as keyword-level, not just one global score
  const perKeyword = perKeywordVisibility(results, engineMap)

  // Per-keyword competitor leaderboard — Q2 deep view, replaces the one-line CTA
  const competitorLeaderboard = aggregateCompetitorsByKeyword(results, run.domain)

  // Build remediation tips based on results (Q3/Q4 deferred to Phase 1.75)
  const remediations = buildRemediations(run, results, engineMap)

  return (
    <div>
      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          <SummaryCard label="Visibility score" value={`${summary.score}/100`} accent="#3b82f6" />
          <SummaryCard label="Cited by" value={`${summary.cited_by.length} engine${summary.cited_by.length !== 1 ? 's' : ''}`} accent="#22c55e" />
          <SummaryCard label="Not cited by" value={`${summary.not_cited_by.length} engine${summary.not_cited_by.length !== 1 ? 's' : ''}`} accent="#ef4444" />
          <SummaryCard label="Total checks" value={String(summary.total_checks)} accent="#6366f1" />
        </div>
      )}

      {/* Per-keyword visibility table — surfaces Q1 at keyword granularity */}
      {perKeyword.length > 0 && (
        <div className="ai-vis-panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Visibility by keyword</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left',  padding: '8px 6px', fontWeight: 600, color: 'var(--text-muted)' }}>Keyword</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 600, color: 'var(--text-muted)', width: 110 }}>Visibility</th>
                <th style={{ textAlign: 'left',  padding: '8px 6px', fontWeight: 600, color: 'var(--text-muted)' }}>Cited by</th>
              </tr>
            </thead>
            <tbody>
              {perKeyword.map(row => (
                <tr key={row.keyword} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 600 }}>&ldquo;{row.keyword}&rdquo;</td>
                  <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 700,
                      color: row.scorePct >= 50 ? '#16a34a' : row.scorePct > 0 ? '#f59e0b' : '#dc2626',
                    }}>
                      {row.scorePct}% ({row.citedEngines.length}/{row.totalEngines})
                    </span>
                  </td>
                  <td style={{ padding: '10px 6px', color: 'var(--text-secondary)' }}>
                    {row.citedEngines.length > 0 ? row.citedEngines.join(', ') : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Engine breakdown — overall pills */}
      {summary && (summary.cited_by.length > 0 || summary.not_cited_by.length > 0) && (
        <div className="ai-vis-panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Engine breakdown (any keyword)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {run.engine_ids.map(engId => {
              const engine = engineMap[engId]
              const cited  = summary.cited_by.includes(engine?.slug ?? engId)
              return (
                <div key={engId} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 20, fontSize: 13,
                  background: cited ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${cited ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: cited ? '#16a34a' : '#dc2626',
                }}>
                  <span style={{ fontWeight: 600 }}>{engine?.name ?? '[deactivated engine]'}</span>
                  <span>{cited ? '✓ Cited' : '✗ Not cited'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-keyword competitor leaderboard — answers Q2 properly */}
      {Object.keys(competitorLeaderboard).length > 0 && (
        <div className="ai-vis-panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Who&apos;s winning instead of you</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
            For each keyword, the domains AI engines surfaced as sources, ranked by how many engines cited each.
            <strong style={{ color: 'var(--text-primary)' }}> Bold</strong> rows are you.
          </p>
          {Object.entries(competitorLeaderboard).map(([keyword, entries]) => {
            const maxCount = Math.max(...entries.map(e => e.engineCount), 1)
            return (
              <div key={keyword} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  &ldquo;{keyword}&rdquo;
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {entries.slice(0, 8).map(entry => {
                    const widthPct = (entry.engineCount / maxCount) * 100
                    const barColor = entry.isUser
                      ? (entry.engineCount > 0 ? '#22c55e' : '#94a3b8')
                      : '#6366f1'
                    return (
                      <div key={entry.domain} style={{
                        display: 'grid',
                        gridTemplateColumns: '240px 1fr 60px',
                        gap: 12, alignItems: 'center', fontSize: 13,
                      }}>
                        <span style={{
                          fontWeight: entry.isUser ? 700 : 500,
                          color: entry.isUser ? 'var(--text-primary)' : 'var(--text-secondary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {entry.domain}{entry.isUser ? '  ← you' : ''}
                        </span>
                        <div style={{
                          height: 12, background: 'var(--surface-sunken)',
                          borderRadius: 4, overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${widthPct}%`,
                            background: barColor, transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                          {entry.engineCount} engine{entry.engineCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <a href="/dashboard/watchdog" style={{
            fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none',
          }}>
            Track these competitors in Watchdog →
          </a>
        </div>
      )}

      {/* Per-keyword results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {run.keywords.map(keyword => {
          const keyResults = byKeyword[keyword] ?? []
          return (
            <div key={keyword} className="ai-vis-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>&ldquo;{keyword}&rdquo;</h3>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {keyResults.filter(r => r.cited).length}/{keyResults.length} engines cited you
                </span>
              </div>
              {keyResults.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No results recorded for this keyword.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
      </div>

      {/* Remediation section */}
      {remediations.length > 0 && (
        <div className="ai-vis-panel" style={{ borderTop: '3px solid #3b82f6' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>How to improve your AI visibility</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Based on your results, here are the highest-impact actions you can take.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
// Result row — shows all source URLs (no slice) and highlights the user's
// domain in any matching response text or URL so it's obvious WHY a result
// was marked Cited.
// ---------------------------------------------------------------------------
function ResultRow({ result, engineName, userDomain }: {
  result: CitationCheckResult; engineName: string; userDomain: string
}): React.ReactElement {
  const citedColor  = result.cited === true ? '#22c55e' : result.cited === false ? '#ef4444' : '#94a3b8'
  const citedLabel  = result.cited === true ? '✓ Cited' : result.cited === false ? '✗ Not cited' : '— Unknown'
  const confLabels: Record<string, string> = { high: 'High confidence', medium: 'Medium confidence', indicative: 'Indicative' }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: result.response_text ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{engineName}</span>
          {result.confidence && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-raised)', padding: '2px 8px', borderRadius: 10 }}>
              {confLabels[result.confidence] ?? result.confidence}
            </span>
          )}
        </div>
        <span style={{ fontWeight: 600, fontSize: 13, color: citedColor }}>{citedLabel}</span>
      </div>

      {result.response_text && (
        <div style={{
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
          background: 'var(--surface-sunken)', borderRadius: 8, padding: '10px 14px',
          maxHeight: 240, overflowY: 'auto',
        }}>
          <DomainHighlightedText text={result.response_text} domain={userDomain} />
        </div>
      )}

      {result.source_urls.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {result.source_urls.map((url, i) => {
            const containsDomain = url.toLowerCase().includes(userDomain.toLowerCase())
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 11,
                color: containsDomain ? '#15803d' : 'var(--color-primary)',
                textDecoration: 'none',
                background: containsDomain ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.08)',
                padding: '2px 8px', borderRadius: 8,
                border: `1px solid ${containsDomain ? 'rgba(34,197,94,0.35)' : 'rgba(59,130,246,0.2)'}`,
                fontWeight: containsDomain ? 700 : 400,
                maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {url}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Highlight occurrences of the user's domain in response text. Server-rendered
// (no JS needed) — splits the text on the domain substring (case-insensitive)
// and wraps matches in a <mark>.
function DomainHighlightedText({ text, domain }: { text: string; domain: string }): React.ReactElement {
  if (!domain) return <>{text}</>
  const lower = text.toLowerCase()
  const needle = domain.toLowerCase()
  const parts: React.ReactNode[] = []
  let cursor = 0
  while (cursor < text.length) {
    const idx = lower.indexOf(needle, cursor)
    if (idx === -1) {
      parts.push(text.slice(cursor))
      break
    }
    if (idx > cursor) parts.push(text.slice(cursor, idx))
    parts.push(
      <mark
        key={idx}
        style={{
          background: 'rgba(34,197,94,0.25)', color: '#15803d',
          padding: '1px 4px', borderRadius: 4, fontWeight: 600,
        }}
      >
        {text.slice(idx, idx + needle.length)}
      </mark>,
    )
    cursor = idx + needle.length
  }
  return <>{parts}</>
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------
function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }): React.ReactElement {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Remediation tip
// ---------------------------------------------------------------------------
function RemediationTip({ priority, title, body, link, linkLabel }: {
  priority:  'high' | 'medium' | 'low'
  title:     string
  body:      string
  link?:     string
  linkLabel?: string
}): React.ReactElement {
  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' }
  const labels = { high: 'High impact', medium: 'Medium impact', low: 'Quick win' }
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'var(--surface-raised)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
          background: `${colors[priority]}15`, color: colors[priority], border: `1px solid ${colors[priority]}30`,
        }}>
          {labels[priority]}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</div>
        {link && (
          <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
            {linkLabel ?? 'Learn more'} →
          </a>
        )}
      </div>
    </div>
  )
}

// detectCompetitors / extractDomain helpers removed — replaced by
// aggregateCompetitorsByKeyword in lib/utils/citation-aggregations.ts which
// powers the per-keyword leaderboard above.

interface RemediationItem {
  priority:  'high' | 'medium' | 'low'
  title:     string
  body:      string
  link?:     string
  linkLabel?: string
}

function buildRemediations(
  run: CitationCheckRun,
  results: CitationCheckResult[],
  engineMap: Record<string, AiEngine>,
): RemediationItem[] {
  const tips: RemediationItem[] = []
  const summary = run.summary
  if (!summary) return tips

  const score = summary.score

  // Not cited by anything
  if (score === 0) {
    tips.push({
      priority: 'high',
      title: 'Add an llms.txt file to your site',
      body: 'You have no AI citations yet. The single most impactful first step is adding an llms.txt file — it tells AI engines exactly what your site is about and who it helps. Generate one now.',
      link: '/dashboard/ai-visibility',
      linkLabel: 'Generate llms.txt',
    })
    tips.push({
      priority: 'high',
      title: 'Publish authoritative, long-form content for these keywords',
      body: `AI engines like Exa and Perplexity cite content that directly and clearly answers the query. Create a dedicated page or article that thoroughly covers "${run.keywords[0]}" and similar terms. Include your domain name, company name, and key differentiators prominently.`,
    })
    tips.push({
      priority: 'medium',
      title: 'Add structured data (JSON-LD) to your site',
      body: 'JSON-LD schema markup (Organization, WebSite, FAQPage) makes your content significantly easier for AI engines to parse and attribute. Add it to your homepage and key landing pages.',
      link: 'https://schema.org/docs/gs.html',
      linkLabel: 'Schema.org guide',
    })
  }

  // Partially cited
  if (score > 0 && score < 100) {
    const notCitedEngineNames = (summary.not_cited_by ?? [])
      .map(slug => Object.values(engineMap).find(e => e.slug === slug)?.name ?? slug)

    if (notCitedEngineNames.length > 0) {
      tips.push({
        priority: 'high',
        title: `Improve visibility on ${notCitedEngineNames.slice(0, 2).join(' and ')}`,
        body: `You're already cited by some engines but not by ${notCitedEngineNames.join(', ')}. Each engine has different signals: Perplexity and Exa prioritise pages with clear structured URLs and direct answers. ChatGPT and Claude weight training data and web grounding — publishing regular, well-structured content helps. Check your robots.txt allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot).`,
      })
    }

    tips.push({
      priority: 'medium',
      title: 'Expand your content around these exact keywords',
      body: `Create FAQ sections, comparison pages, and how-to guides specifically targeting: ${run.keywords.map(k => `"${k}"`).join(', ')}. AI engines prefer pages that directly answer a question in full rather than pages that mention the keyword in passing.`,
    })
  }

  // Has some citations — improvement tips
  if (score > 0) {
    tips.push({
      priority: 'medium',
      title: 'Check your robots.txt allows AI crawlers',
      body: 'Make sure your robots.txt does not block GPTBot (ChatGPT), ClaudeBot (Claude), PerplexityBot, or Google-Extended (Gemini). Blocking these means the engine cannot index your latest content and will stop citing you over time.',
      link: '/tools/ai-seo-checker',
      linkLabel: 'Run free AI SEO check',
    })

    tips.push({
      priority: 'low',
      title: 'Keep your llms.txt up to date',
      body: 'AI engines re-crawl llms.txt regularly. Regenerate yours whenever you add major new sections, products, or pages. The more specific and accurate it is, the more precisely you will be cited.',
      link: '/dashboard/ai-visibility',
      linkLabel: 'Regenerate llms.txt',
    })
  }

  // Check if any result has errors suggesting a crawl block
  const hasErrors = results.some(r => r.response_text?.startsWith('Error:'))
  if (hasErrors) {
    tips.push({
      priority: 'low',
      title: 'Some engine queries returned errors',
      body: 'One or more engines returned errors during this check. This may be temporary API rate limiting. Re-run the check to get fresh results.',
      link: '/dashboard/ai-visibility',
      linkLabel: 'Run again',
    })
  }

  return tips
}
