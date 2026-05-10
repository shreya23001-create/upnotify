import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getProfileRunById } from '@/lib/db/ai-profile'
import { getActiveEngines } from '@/lib/db/ai-engines'
import type { ProfileRun, ProfileResult } from '@/lib/db/ai-profile'
import type { AiEngine } from '@/lib/db/ai-engines'

export const metadata: Metadata = { title: 'AI Profile Run — AI Visibility' }

export default async function ProfileRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.ReactElement> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [run, engines] = await Promise.all([
    getProfileRunById(id),
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
            AI Profile — {run.domain}
          </div>
          <div className="db-page-sub">
            {run.prompt_ids.length} prompt{run.prompt_ids.length !== 1 ? 's' : ''} ·{' '}
            {run.engine_ids.length} engine{run.engine_ids.length !== 1 ? 's' : ''} ·{' '}
            {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <RunStatusBadge status={run.status} />
      </div>

      {run.status === 'pending' || run.status === 'running' ? (
        <PendingState />
      ) : run.status === 'failed' ? (
        <FailedState run={run} />
      ) : (
        <CompletedState run={run} engineMap={engineMap} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function RunStatusBadge({ status }: { status: ProfileRun['status'] }): React.ReactElement {
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

function PendingState(): React.ReactElement {
  return (
    <div className="ai-vis-panel" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Running AI Profile</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        We&apos;re asking each AI engine what it thinks of your site. This typically takes 30–90 seconds.
      </div>
      <a href="" className="btn btn-secondary btn-sm">Refresh</a>
    </div>
  )
}

function FailedState({ run }: { run: ProfileRun }): React.ReactElement {
  return (
    <div className="ai-vis-panel" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Run failed</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        {run.error_message ?? 'An unexpected error occurred. Please try again.'}
      </div>
      <a href="/dashboard/ai-visibility" className="btn btn-primary btn-sm">Back to AI Visibility</a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Completed state — main display
// ---------------------------------------------------------------------------
function CompletedState({ run, engineMap }: {
  run: ProfileRun; engineMap: Record<string, AiEngine>
}): React.ReactElement {
  const summary = run.summary

  // Group results by prompt_text (the substituted version; same prompt_id may
  // appear with different substitutions in future, but for v0.1 each prompt
  // appears once per engine)
  const byPromptId: Record<string, ProfileResult[]> = {}
  const promptOrder: string[] = []
  for (const r of run.results) {
    if (!byPromptId[r.prompt_id]) {
      byPromptId[r.prompt_id] = []
      promptOrder.push(r.prompt_id)
    }
    byPromptId[r.prompt_id].push(r)
  }

  return (
    <div>
      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <SummaryCard
            label="Engines that recognise your site"
            value={`${summary.recognised_by.length} / ${summary.recognised_by.length + summary.not_recognised_by.length}`}
            accent="#22c55e"
          />
          <SummaryCard
            label="Total responses"
            value={String(summary.total_responses)}
            accent="#3b82f6"
          />
          <SummaryCard
            label="Failed responses"
            value={String(summary.failed_responses)}
            accent={summary.failed_responses > 0 ? '#f59e0b' : '#94a3b8'}
          />
        </div>
      )}

      {/* What each engine knows about you (high-level) */}
      {summary && summary.recognised_by.length + summary.not_recognised_by.length > 0 && (
        <div className="ai-vis-panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Engine awareness</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[...summary.recognised_by.map(s => ({ slug: s, recognised: true })),
              ...summary.not_recognised_by.map(s => ({ slug: s, recognised: false }))]
              .map(({ slug, recognised }) => {
                const engine = Object.values(engineMap).find(e => e.slug === slug)
                return (
                  <div key={slug} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 20, fontSize: 13,
                    background:  recognised ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border:      `1px solid ${recognised ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color:       recognised ? '#16a34a' : '#dc2626',
                  }}>
                    <span style={{ fontWeight: 600 }}>{engine?.name ?? slug}</span>
                    <span>{recognised ? '✓ Knows you' : '✗ Doesn’t mention you'}</span>
                  </div>
                )
              })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
            &ldquo;Knows you&rdquo; means the engine mentioned <strong>{run.domain}</strong> in at least one of its
            responses. Engines that didn&apos;t mention your domain may still be talking about your topic — but
            without naming your site, you don&apos;t get the recommendation traffic.
          </p>
        </div>
      )}

      {/* Per-prompt sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {promptOrder.map(promptId => {
          const promptResults = byPromptId[promptId] ?? []
          const promptText    = promptResults[0]?.prompt_text ?? '(prompt no longer in registry)'
          const recognisedCt  = promptResults.filter(r => r.recognised).length

          return (
            <div key={promptId} className="ai-vis-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                  &ldquo;{promptText}&rdquo;
                </h3>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {recognisedCt}/{promptResults.length} engines mentioned you
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {promptResults.map((r, i) => {
                  const engine = engineMap[r.engine_id]
                  return (
                    <ResponseRow
                      key={`${r.prompt_id}-${r.engine_id}-${i}`}
                      result={r}
                      engineName={engine?.name ?? '[deactivated engine]'}
                      domain={run.domain}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* What to do with this info */}
      <div className="ai-vis-panel" style={{ borderTop: '3px solid #3b82f6' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>How to use this</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          AI Profile reveals what AI engines think you are — and where they&apos;re missing the mark.
        </p>
        <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>If an engine <strong>doesn&apos;t mention your domain</strong>, it likely doesn&apos;t recognise your site at all. Add an llms.txt file and ensure AI crawlers (GPTBot, ClaudeBot, PerplexityBot) aren&apos;t blocked.</li>
          <li>If engines describe your site <strong>incorrectly or in the wrong category</strong>, your homepage and llms.txt aren&apos;t making your purpose clear. Rewrite to be unambiguous.</li>
          <li>If only some engines know you, the gap is usually <strong>training data freshness</strong> or a <strong>crawler block</strong>. Different engines crawl on different schedules.</li>
        </ul>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Response row — one engine's answer to one prompt
// ---------------------------------------------------------------------------
function ResponseRow({ result, engineName, domain }: {
  result: ProfileResult; engineName: string; domain: string
}): React.ReactElement {
  const recognisedColor = result.recognised ? '#22c55e' : '#94a3b8'
  const recognisedLabel = result.error
    ? '— Error'
    : result.recognised ? '✓ Mentions your domain' : '— Does not mention you'

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: result.response_text || result.error ? 12 : 0 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{engineName}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: result.error ? '#dc2626' : recognisedColor }}>
          {recognisedLabel}
        </span>
      </div>
      {result.error ? (
        <div style={{
          fontSize: 12, color: '#dc2626', lineHeight: 1.5,
          background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '8px 12px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}>
          {result.error}
        </div>
      ) : result.response_text ? (
        <div style={{
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
          background: 'var(--surface-sunken)', borderRadius: 8, padding: '10px 14px',
          maxHeight: 200, overflowY: 'auto',
        }}>
          <DomainHighlightedText text={result.response_text} domain={domain} />
        </div>
      ) : null}
    </div>
  )
}

// Highlight occurrences of the domain in the response text. Case-insensitive
// match, preserves original casing in output.
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

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }): React.ReactElement {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
