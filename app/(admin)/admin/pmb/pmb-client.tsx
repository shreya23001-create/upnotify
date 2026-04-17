'use client'

import { useState, useTransition } from 'react'
import type { PmbCategory, PmbRun, PmbMonitor, PmbQueueStats, PmbCronRun } from '@/lib/db/pmb'
import {
  togglePmbMonitorAction,
  updateCategoryKeywordsAction,
  approvePmbRunAction,
  approveTodaysBatchAction,
  discardPmbRunAction,
  retryPmbRunAction,
  retryFailedTodayAction,
} from './actions'

// =============================================================================
// Helpers
// =============================================================================

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fmtMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function statusBadge(status: string): React.ReactElement {
  const map: Record<string, string> = {
    queued:     'admin-badge-gray',
    generating: 'admin-badge-yellow',
    generated:  'admin-badge-blue',
    approved:   'admin-badge-green',
    published:  'admin-badge-green',
    failed:     'admin-badge-red',
    discarded:  'admin-badge-gray',
    ok:         'admin-badge-green',
    error:      'admin-badge-red',
    running:    'admin-badge-yellow',
  }
  return <span className={`admin-badge ${map[status] ?? 'admin-badge-gray'}`}>{status}</span>
}

function postTypeBadge(type: string): React.ReactElement {
  const labels: Record<string, string> = {
    pairwise:        'Pairwise',
    leaderboard:     'Leaderboard',
    category_report: 'Category Report',
    provider_report: 'Provider Report',
  }
  return <span className="admin-badge admin-badge-blue">{labels[type] ?? type}</span>
}

// =============================================================================
// Props
// =============================================================================

interface Props {
  categories: PmbCategory[]
  monitors: PmbMonitor[]
  todayRuns: PmbRun[]
  stats: PmbQueueStats
  cronHistory: Record<string, PmbCronRun[]>
  today: string
  weekStart: string
}

// =============================================================================
// Main client component
// =============================================================================

export function PmbClient({ categories, monitors, todayRuns, stats, cronHistory, today, weekStart }: Props): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'categories' | 'queue' | 'crons'>('overview')
  const [search, setSearch] = useState('')
  const [expandedCrons, setExpandedCrons] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const tabs = [
    { id: 'overview',    label: 'Overview' },
    { id: 'providers',   label: `Providers (${monitors.length})` },
    { id: 'categories',  label: 'Categories' },
    { id: 'queue',       label: `Queue (${stats.today_generated} generated today)` },
    { id: 'crons',       label: 'Cron Health' },
  ] as const

  return (
    <div>
      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 500,
              color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && <OverviewTab stats={stats} monitors={monitors} categories={categories} cronHistory={cronHistory} today={today} />}

      {/* ── PROVIDERS ── */}
      {activeTab === 'providers' && <ProvidersTab monitors={monitors} categories={categories} search={search} setSearch={setSearch} startTransition={startTransition} />}

      {/* ── CATEGORIES ── */}
      {activeTab === 'categories' && <CategoriesTab categories={categories} monitors={monitors} startTransition={startTransition} />}

      {/* ── QUEUE ── */}
      {activeTab === 'queue' && <QueueTab runs={todayRuns} stats={stats} today={today} startTransition={startTransition} />}

      {/* ── CRONS ── */}
      {activeTab === 'crons' && <CronsTab cronHistory={cronHistory} expanded={expandedCrons} setExpanded={setExpandedCrons} />}
    </div>
  )
}

// =============================================================================
// Overview Tab
// =============================================================================

function OverviewTab({ stats, monitors, categories, cronHistory, today }: {
  stats: PmbQueueStats
  monitors: PmbMonitor[]
  categories: PmbCategory[]
  cronHistory: Record<string, PmbCronRun[]>
  today: string
}): React.ReactElement {
  const enabled = monitors.filter(m => m.pmb_enabled).length
  const byCat: Record<string, number> = {}
  for (const m of monitors.filter(m => m.pmb_enabled && m.pmb_category)) {
    byCat[m.pmb_category!] = (byCat[m.pmb_category!] ?? 0) + 1
  }

  const allCronRuns = Object.values(cronHistory).flat()
  const latestFailure = allCronRuns.find(r => r.status === 'error')

  return (
    <div>
      {latestFailure && (
        <div className="notice danger" style={{ marginBottom: 16 }}>
          <strong>⚠ Cron failure detected:</strong> {latestFailure.cron_path} — {latestFailure.error_message ?? 'Unknown error'} ({timeAgo(latestFailure.started_at)})
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">This Week Total</div>
            <div className="stat-value">{stats.total_this_week}</div>
            <div className="stat-sub">{stats.queued} queued · {stats.generated} generated</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Today Generated</div>
            <div className="stat-value" style={{ color: stats.today_generated > 0 ? 'var(--color-success)' : undefined }}>
              {stats.today_generated}
            </div>
            <div className="stat-sub">{stats.today_queued} still queued for today</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Failed This Week</div>
            <div className="stat-value" style={{ color: stats.failed > 0 ? 'var(--color-danger)' : undefined }}>
              {stats.failed}
            </div>
            <div className="stat-sub">{enabled} providers enabled</div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>
          Providers by Category
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {categories.map(cat => (
            <div key={cat.slug} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 18 }}>{cat.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{cat.display_name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{byCat[cat.slug] ?? 0} providers</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cron health cards */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Cron Health</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {Object.entries(cronHistory).map(([path, runs]) => {
          const last = runs[0]
          const isOk = !last || last.status === 'ok'
          return (
            <div key={path} style={{ background: 'var(--color-card)', border: `1px solid ${isOk ? 'var(--color-border)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOk ? 'var(--color-success)' : 'var(--color-danger)', marginTop: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isOk ? 'var(--color-text)' : 'var(--color-danger)' }}>{path.split('/').pop()}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {last ? `Last: ${timeAgo(last.started_at)} · ${fmtMs(last.duration_ms)}` : 'Never run'}
                </div>
                {last?.result_summary && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{last.result_summary}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Providers Tab
// =============================================================================

function ProvidersTab({ monitors, categories, search, setSearch, startTransition }: {
  monitors: PmbMonitor[]
  categories: PmbCategory[]
  search: string
  setSearch: (s: string) => void
  startTransition: ReturnType<typeof useTransition>[1]
}): React.ReactElement {
  const filtered = monitors.filter(m =>
    !search || m.display_name.toLowerCase().includes(search.toLowerCase()) || m.domain.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="table-toolbar" style={{ marginBottom: 12 }}>
        <input
          placeholder="Search providers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-muted)' }}>{filtered.length} of {monitors.length} providers</span>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>PMB Category</th>
              <th>Status</th>
              <th>PMB</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{m.display_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.domain}</div>
                </td>
                <td>
                  {m.pmb_category
                    ? <span className="admin-badge admin-badge-blue">{categories.find(c => c.slug === m.pmb_category)?.display_name ?? m.pmb_category}</span>
                    : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>
                  }
                </td>
                <td>
                  <span className={`admin-badge ${m.last_status === 'up' ? 'admin-badge-green' : m.last_status === 'down' ? 'admin-badge-red' : 'admin-badge-gray'}`}>
                    {m.last_status}
                  </span>
                </td>
                <td>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={m.pmb_enabled}
                      onChange={e => {
                        const enabled = e.target.checked
                        startTransition(() => { togglePmbMonitorAction(m.id, enabled) })
                      }}
                    />
                    <span style={{ fontSize: 12 }}>{m.pmb_enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </td>
                <td>
                  <span className="admin-action-link">Edit</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =============================================================================
// Categories Tab
// =============================================================================

function CategoriesTab({ categories, monitors, startTransition }: {
  categories: PmbCategory[]
  monitors: PmbMonitor[]
  startTransition: ReturnType<typeof useTransition>[1]
}): React.ReactElement {
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [keywordsInput, setKeywordsInput] = useState('')

  const monitorCount = (slug: string) => monitors.filter(m => m.pmb_enabled && m.pmb_category === slug).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
      {categories.map(cat => (
        <div key={cat.slug} className="admin-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>{cat.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{cat.display_name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{monitorCount(cat.slug)} providers · {cat.slug}</div>
            </div>
            <span className={`admin-badge ${cat.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`} style={{ marginLeft: 'auto' }}>
              {cat.is_active ? 'Active' : 'Paused'}
            </span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Default Keywords
          </div>

          {editingSlug === cat.slug ? (
            <div>
              <textarea
                value={keywordsInput}
                onChange={e => setKeywordsInput(e.target.value)}
                rows={4}
                style={{ width: '100%', fontSize: 12, marginBottom: 8 }}
                placeholder="One keyword per line"
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  const kws = keywordsInput.split('\n').map(k => k.trim()).filter(Boolean)
                  startTransition(() => void updateCategoryKeywordsAction(cat.slug, kws))
                  setEditingSlug(null)
                }}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingSlug(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {cat.default_keywords.map(kw => (
                  <span key={kw} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{kw}</span>
                ))}
              </div>
              <button className="admin-action-link" onClick={() => {
                setEditingSlug(cat.slug)
                setKeywordsInput(cat.default_keywords.join('\n'))
              }}>Edit keywords</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Queue Tab
// =============================================================================

function QueueTab({ runs, stats, today, startTransition }: {
  runs: PmbRun[]
  stats: PmbQueueStats
  today: string
  startTransition: ReturnType<typeof useTransition>[1]
}): React.ReactElement {
  const generated = runs.filter(r => r.status === 'generated')
  const queued    = runs.filter(r => r.status === 'queued')
  const failed    = runs.filter(r => r.status === 'failed')

  return (
    <div>
      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Generated Today</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.today_generated}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Still Queued Today</div>
            <div className="stat-value">{stats.today_queued}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content-compact">
            <div className="stat-label">Failed Today</div>
            <div className="stat-value" style={{ color: failed.length > 0 ? 'var(--color-danger)' : undefined }}>{failed.length}</div>
          </div>
        </div>
      </div>

      {/* Bulk approve */}
      {generated.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 16px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Today's batch — {generated.length} posts ready for approval</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {today} · Review individually below or approve all at once
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => startTransition(() => void approveTodaysBatchAction(today))}
          >
            ✅ Approve All {generated.length}
          </button>
        </div>
      )}

      {/* Failed retry */}
      {failed.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-danger)' }}>{failed.length} posts failed today</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Will not retry automatically</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => startTransition(() => void retryFailedTodayAction(today))}
          >
            ↺ Retry All Failed
          </button>
        </div>
      )}

      {queued.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, marginBottom: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
          ⏳ {queued.length} posts still generating — check back in a few minutes
        </div>
      )}

      {/* Run list */}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Type</th>
              <th>Category</th>
              <th>Words</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">No posts for today yet — the daily publisher runs at 6am UTC.</td></tr>
            )}
            {runs.map(r => {
              const label = r.post_type === 'pairwise'
                ? `${r.monitor_name ?? r.monitor_id} vs ${r.compare_monitor_name ?? r.compare_monitor_id}`
                : r.post_type === 'leaderboard'
                ? `${r.category_slug} Leaderboard`
                : r.monitor_name ?? r.run_key
              return (
                <tr key={r.id}>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    {r.error_message && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{r.error_message}</div>}
                  </td>
                  <td>{postTypeBadge(r.post_type)}</td>
                  <td><span style={{ fontSize: 12 }}>{r.category_slug}</span></td>
                  <td><span style={{ fontSize: 12 }}>{r.word_count ?? '—'}</span></td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status === 'generated' && (
                        <button className="admin-action-link" onClick={() => startTransition(() => void approvePmbRunAction(r.id))}>
                          Approve
                        </button>
                      )}
                      {r.status === 'failed' && (
                        <button className="admin-action-link" onClick={() => startTransition(() => void retryPmbRunAction(r.id))}>
                          Retry
                        </button>
                      )}
                      {['generated', 'queued', 'failed'].includes(r.status) && (
                        <button className="admin-action-link" style={{ color: 'var(--color-danger)' }} onClick={() => startTransition(() => void discardPmbRunAction(r.id))}>
                          Discard
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =============================================================================
// Crons Tab
// =============================================================================

function CronsTab({ cronHistory, expanded, setExpanded }: {
  cronHistory: Record<string, PmbCronRun[]>
  expanded: Set<string>
  setExpanded: (s: Set<string>) => void
}): React.ReactElement {
  const cronMeta: Record<string, { schedule: string; description: string }> = {
    '/api/cron/pmb/week-planner':      { schedule: 'Mon 5:00 UTC', description: 'Calculates weekly posts, spreads Mon–Sun, dedup check' },
    '/api/cron/pmb/daily-publisher':   { schedule: 'Every 5 min',  description: 'Picks up today\'s scheduled posts and generates them' },
    '/api/cron/pmb/monthly-generator': { schedule: '1st 7:00 UTC', description: 'Creates monthly category + provider reports' },
    '/api/cron/public-checks':         { schedule: 'Every 5 min',  description: 'HTTP checks on all PMB providers' },
  }

  return (
    <div>
      {/* Failed crons banner */}
      {Object.entries(cronHistory).map(([path, runs]) => {
        const last = runs[0]
        if (!last || last.status !== 'error') return null
        return (
          <div key={path} className="notice danger" style={{ marginBottom: 12 }}>
            <strong>⚠ {path}</strong> failed {timeAgo(last.started_at)} — {last.error_message ?? 'Unknown error'}
          </div>
        )
      })}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Cron</th>
              <th>Schedule</th>
              <th>Last Run</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Last Output</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(cronHistory).map(([path, runs]) => {
              const last = runs[0]
              const meta = cronMeta[path] ?? { schedule: '—', description: path }
              const isExpanded = expanded.has(path)
              const toggle = () => {
                const next = new Set(expanded)
                isExpanded ? next.delete(path) : next.add(path)
                setExpanded(next)
              }

              return (
                <>
                  <tr key={path} style={{ cursor: 'pointer' }} onClick={toggle}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{isExpanded ? '▼' : '▶'}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{path}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{meta.description}</div>
                    </td>
                    <td><span className="admin-badge admin-badge-gray">{meta.schedule}</span></td>
                    <td style={{ fontSize: 12 }}>{last ? timeAgo(last.started_at) : '—'}</td>
                    <td style={{ fontSize: 12 }}>{last ? fmtMs(last.duration_ms) : '—'}</td>
                    <td>{last ? statusBadge(last.status) : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Never run</span>}</td>
                    <td style={{ fontSize: 11, color: 'var(--color-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {last?.result_summary ?? last?.error_message ?? '—'}
                    </td>
                    <td>
                      <a
                        href={path}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-action-link"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11 }}
                      >
                        Run Now ↗
                      </a>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${path}-expand`}>
                      <td colSpan={8} style={{ padding: 0, background: 'var(--color-bg)' }}>
                        <div style={{ padding: '14px 18px' }}>
                          {/* History dots */}
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                            Last {runs.length} runs
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 14 }}>
                            {runs.map(r => (
                              <div
                                key={r.id}
                                title={`${r.status} · ${fmtMs(r.duration_ms)} · ${timeAgo(r.started_at)}`}
                                style={{
                                  width: 10, height: 10, borderRadius: '50%',
                                  background: r.status === 'ok' ? 'var(--color-success)' : r.status === 'error' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                  flexShrink: 0,
                                }}
                              />
                            ))}
                            {runs.length === 0 && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No runs recorded</span>}
                          </div>

                          {/* Last output */}
                          {last && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                Output — {last.started_at}
                                {last.status === 'error' && <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>FAILED</span>}
                              </div>
                              <div style={{ background: '#0a0d14', border: '1px solid var(--color-border)', borderRadius: 6, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', lineHeight: 1.7, maxHeight: 160, overflowY: 'auto' }}>
                                {last.result_summary && <div style={{ color: '#60a5fa' }}>[INFO] {last.result_summary}</div>}
                                {last.error_message  && <div style={{ color: '#f87171' }}>[ERROR] {last.error_message}</div>}
                                {!last.result_summary && !last.error_message && <span style={{ color: '#475569' }}>No output recorded</span>}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
