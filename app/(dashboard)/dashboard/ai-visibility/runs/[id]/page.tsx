import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getCitationRunById, getCitationResults } from '@/lib/db/ai-visibility'
import { getActiveEngines } from '@/lib/db/ai-engines'
import type { CitationCheckResult, CitationCheckRun } from '@/lib/db/ai-visibility'
import type { AiEngine } from '@/lib/db/ai-engines'

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

  // Not found or belongs to a different org
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
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: colors[status],
        animation: status === 'running' ? 'pulse 1.5s infinite' : undefined,
      }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Pending / running state
// ---------------------------------------------------------------------------
function PendingState({ run }: { run: CitationCheckRun }): React.ReactElement {
  return (
    <div className="ai-vis-panel" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        {run.status === 'pending' ? 'Check queued' : 'Check in progress'}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        We&apos;re querying each AI engine with your keywords. This usually takes 2–5 minutes.
        Refresh this page to check for updates, or wait for your email notification.
      </div>
      <a href={`/dashboard/ai-visibility/runs/${run.id}`} className="btn btn-secondary btn-sm">
        Refresh
      </a>
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
        {run.error_message ?? 'An unexpected error occurred while running this check. Please try again.'}
      </div>
      <a href="/dashboard/ai-visibility" className="btn btn-primary btn-sm">Run a new check</a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Completed state — full results
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

      {/* Engine summary row */}
      {summary && (summary.cited_by.length > 0 || summary.not_cited_by.length > 0) && (
        <div className="ai-vis-panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Engine breakdown</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {run.engine_ids.map(engId => {
              const engine = engineMap[engId]
              const cited = summary.cited_by.includes(engine?.slug ?? engId)
              return (
                <div key={engId} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 20, fontSize: 13,
                  background: cited ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${cited ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: cited ? '#16a34a' : '#dc2626',
                }}>
                  <span style={{ fontWeight: 600 }}>{engine?.name ?? engId}</span>
                  <span>{cited ? '✓ Cited' : '✗ Not cited'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Results per keyword */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                      <ResultRow key={result.id} result={result} engineName={engine?.name ?? result.engine_id} />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual result row
// ---------------------------------------------------------------------------
function ResultRow({ result, engineName }: { result: CitationCheckResult; engineName: string }): React.ReactElement {
  const citedColor   = result.cited === true ? '#22c55e' : result.cited === false ? '#ef4444' : '#94a3b8'
  const citedLabel   = result.cited === true ? '✓ Cited' : result.cited === false ? '✗ Not cited' : '— Unknown'
  const confidenceLabels: Record<string, string> = {
    high:        'High confidence',
    medium:      'Medium confidence',
    indicative:  'Indicative',
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 16,
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: result.response_text ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{engineName}</span>
          {result.confidence && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-raised)', padding: '2px 8px', borderRadius: 10 }}>
              {confidenceLabels[result.confidence] ?? result.confidence}
            </span>
          )}
        </div>
        <span style={{ fontWeight: 600, fontSize: 13, color: citedColor }}>{citedLabel}</span>
      </div>

      {result.response_text && (
        <div style={{
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
          background: 'var(--surface-sunken)', borderRadius: 8, padding: '10px 14px',
          maxHeight: 120, overflow: 'hidden', position: 'relative',
        }}>
          {result.response_text.slice(0, 400)}{result.response_text.length > 400 ? '…' : ''}
        </div>
      )}

      {result.source_urls.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {result.source_urls.slice(0, 4).map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none',
              background: 'rgba(59,130,246,0.08)', padding: '2px 8px', borderRadius: 8,
              border: '1px solid rgba(59,130,246,0.2)',
              maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {url}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary metric card
// ---------------------------------------------------------------------------
function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }): React.ReactElement {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '18px 20px',
      borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
