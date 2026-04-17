'use client'

import { useState, useTransition } from 'react'
import type { PmbCategory, PmbRun, PmbMonitor, PmbQueueStats, PmbCronRun } from '@/lib/db/pmb'
import {
  togglePmbMonitorAction,
  updateMonitorPmbAction,
  updateCategoryKeywordsAction,
  approvePmbRunAction,
  approveTodaysBatchAction,
  discardPmbRunAction,
  retryPmbRunAction,
  retryFailedTodayAction,
  autoCategorizeMonitorsAction,
} from './actions'

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZE = 25

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
  const cfg: Record<string, { label: string; cls: string }> = {
    pairwise:        { label: 'Pairwise',   cls: 'admin-badge-blue' },
    leaderboard:     { label: 'Leaderboard', cls: 'admin-badge-purple' },
    category_report: { label: 'Category',   cls: 'admin-badge-yellow' },
    provider_report: { label: 'Provider',   cls: 'admin-badge-gray' },
  }
  const c = cfg[type] ?? { label: type, cls: 'admin-badge-gray' }
  return <span className={`admin-badge ${c.cls}`}>{c.label}</span>
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): React.ReactElement {
  return (
    <label className="switch" style={{ verticalAlign: 'middle' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="switch-slider" />
    </label>
  )
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }): React.ReactElement {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  const pages: number[] = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i)

  return (
    <div className="data-table-pagination">
      <span>{from}–{to} of {total}</span>
      <div className="data-table-pagination-buttons">
        <button className="data-table-pagination-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>← Prev</button>
        {pages[0] > 1 && <><button className="data-table-pagination-btn" onClick={() => onChange(1)}>1</button><span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 12 }}>…</span></>}
        {pages.map(p => (
          <button key={p} className={`data-table-pagination-btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)}>{p}</button>
        ))}
        {pages[pages.length - 1] < totalPages && <><span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 12 }}>…</span><button className="data-table-pagination-btn" onClick={() => onChange(totalPages)}>{totalPages}</button></>}
        <button className="data-table-pagination-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next →</button>
      </div>
    </div>
  )
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
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage]           = useState(1)
  const [expandedCrons, setExpandedCrons] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const tabs: { id: typeof activeTab; label: string; count?: number }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'providers',  label: 'Providers',   count: monitors.length },
    { id: 'categories', label: 'Categories',  count: categories.length },
    { id: 'queue',      label: 'Queue',       count: stats.today_generated + stats.today_queued },
    { id: 'crons',      label: 'Cron Health' },
  ]

  function switchTab(id: typeof activeTab): void {
    setActiveTab(id)
    setPage(1)
    setSearch('')
  }

  return (
    <div>
      {/* ── Tab nav (pill style) ── */}
      <div className="support-admin-tabs" style={{ marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`support-admin-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="support-admin-tab-count">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview'   && <OverviewTab stats={stats} monitors={monitors} categories={categories} cronHistory={cronHistory} today={today} weekStart={weekStart} />}
      {activeTab === 'providers'  && <ProvidersTab monitors={monitors} categories={categories} search={search} setSearch={s => { setSearch(s); setPage(1) }} catFilter={catFilter} setCatFilter={s => { setCatFilter(s); setPage(1) }} page={page} setPage={setPage} startTransition={startTransition} />}
      {activeTab === 'categories' && <CategoriesTab categories={categories} monitors={monitors} startTransition={startTransition} />}
      {activeTab === 'queue'      && <QueueTab runs={todayRuns} stats={stats} today={today} startTransition={startTransition} />}
      {activeTab === 'crons'      && <CronsTab cronHistory={cronHistory} expanded={expandedCrons} setExpanded={setExpandedCrons} />}
    </div>
  )
}

// =============================================================================
// Overview Tab
// =============================================================================

function OverviewTab({ stats, monitors, categories, cronHistory, today, weekStart }: {
  stats: PmbQueueStats
  monitors: PmbMonitor[]
  categories: PmbCategory[]
  cronHistory: Record<string, PmbCronRun[]>
  today: string
  weekStart: string
}): React.ReactElement {
  const enabled = monitors.filter(m => m.pmb_enabled).length
  const byCat: Record<string, number> = {}
  for (const m of monitors.filter(m => m.pmb_enabled && m.pmb_category)) {
    byCat[m.pmb_category!] = (byCat[m.pmb_category!] ?? 0) + 1
  }
  const allCronRuns  = Object.values(cronHistory).flat()
  const latestError  = allCronRuns.find(r => r.status === 'error')
  const approvedPct  = stats.total_this_week > 0 ? Math.round((stats.approved / stats.total_this_week) * 100) : 0

  return (
    <div>
      {latestError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <strong style={{ color: 'var(--color-danger)' }}>Cron failure detected</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{latestError.cron_path} — {latestError.error_message ?? 'Unknown error'} · {timeAgo(latestError.started_at)}</span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="admin-stats-grid" style={{ marginBottom: 28 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">📊</div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">{stats.total_this_week}</div>
            <div className="admin-stat-label">Posts this week</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">✅</div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">{stats.today_generated}</div>
            <div className="admin-stat-label">Generated today</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-amber">⏳</div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">{stats.queued + stats.today_queued}</div>
            <div className="admin-stat-label">In queue</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: stats.failed > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)', color: stats.failed > 0 ? '#dc2626' : '#64748b' }}>❌</div>
          <div className="admin-stat-info">
            <div className="admin-stat-number" style={{ color: stats.failed > 0 ? '#dc2626' : undefined }}>{stats.failed}</div>
            <div className="admin-stat-label">Failed this week</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Category breakdown */}
        <div className="admin-card">
          <div style={{ padding: '14px 18px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Providers by Category</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{enabled} enabled total</span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categories.map(cat => {
              const count = byCat[cat.slug] ?? 0
              const maxCount = Math.max(...categories.map(c => byCat[c.slug] ?? 0), 1)
              return (
                <div key={cat.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{cat.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.display_name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
                      <div style={{ height: 4, background: 'var(--color-primary)', borderRadius: 2, width: `${count === 0 ? 0 : Math.max(4, Math.round((count / maxCount) * 100))}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Week progress */}
        <div className="admin-card">
          <div style={{ padding: '14px 18px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>
            Week Progress
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Week of {weekStart}</div>
            {[
              { label: 'Queued',    count: stats.queued,    color: '#94a3b8' },
              { label: 'Generated', count: stats.generated, color: '#3b82f6' },
              { label: 'Approved',  count: stats.approved,  color: '#22c55e' },
              { label: 'Failed',    count: stats.failed,    color: '#ef4444' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 80 }}>{row.label}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: 6, background: row.color, borderRadius: 3, width: stats.total_this_week > 0 ? `${Math.round((row.count / stats.total_this_week) * 100)}%` : '0%', opacity: 0.85 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 28, textAlign: 'right' }}>{row.count}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Approval rate</span>
              <span style={{ fontWeight: 700, color: approvedPct >= 80 ? '#22c55e' : 'var(--text-primary)' }}>{approvedPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cron health */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text-primary)' }}>Cron Health</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {Object.entries(cronHistory).map(([path, runs]) => {
          const last = runs[0]
          const ok   = !last || last.status === 'ok'
          return (
            <div key={path} style={{ background: 'var(--color-card)', border: `1px solid ${ok ? 'var(--color-border)' : 'rgba(239,68,68,0.35)'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ok ? '#22c55e' : '#ef4444', marginTop: 3, flexShrink: 0, boxShadow: ok ? '0 0 0 3px rgba(34,197,94,0.15)' : '0 0 0 3px rgba(239,68,68,0.15)' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ok ? 'var(--text-primary)' : '#dc2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path.split('/').slice(-2).join('/')}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {last ? `${timeAgo(last.started_at)} · ${fmtMs(last.duration_ms)}` : 'Never run'}
                </div>
                {last?.result_summary && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.result_summary}</div>}
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

function ProvidersTab({ monitors, categories, search, setSearch, catFilter, setCatFilter, page, setPage, startTransition }: {
  monitors: PmbMonitor[]
  categories: PmbCategory[]
  search: string
  setSearch: (s: string) => void
  catFilter: string
  setCatFilter: (s: string) => void
  page: number
  setPage: (p: number) => void
  startTransition: ReturnType<typeof useTransition>[1]
}): React.ReactElement {
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editCat,     setEditCat]     = useState('')
  const [editEnabled, setEditEnabled] = useState(false)
  const [editKeywords, setEditKeywords] = useState('')
  const [editStatusUrl, setEditStatusUrl] = useState('')
  const [autoMsg,     setAutoMsg]     = useState<string | null>(null)
  const [autoRunning, setAutoRunning] = useState(false)

  const filtered = monitors.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !search || m.display_name.toLowerCase().includes(q) || m.domain.toLowerCase().includes(q)
    const matchCat    = !catFilter
      || (catFilter === '__enabled'      ? m.pmb_enabled
        : catFilter === '__uncategorised' ? !m.pmb_category
        : m.pmb_category === catFilter)
    return matchSearch && matchCat
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const slice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const enabledCount      = monitors.filter(m => m.pmb_enabled).length
  const uncategorisedCount = monitors.filter(m => !m.pmb_category).length

  function openEdit(m: PmbMonitor): void {
    setEditingId(m.id)
    setEditCat(m.pmb_category ?? '')
    setEditEnabled(m.pmb_enabled)
    setEditKeywords(m.pmb_keywords.join(', '))
    setEditStatusUrl(m.status_page_url ?? '')
  }

  function saveEdit(id: string): void {
    const keywords = editKeywords.split(',').map(k => k.trim()).filter(Boolean)
    startTransition(() => void updateMonitorPmbAction(id, {
      pmb_category: editCat || null,
      pmb_keywords: keywords,
      status_page_url: editStatusUrl || null,
    }))
    // Also sync the enable toggle
    startTransition(() => void togglePmbMonitorAction(id, editEnabled))
    setEditingId(null)
  }

  async function runAutoCategory(): Promise<void> {
    setAutoRunning(true)
    setAutoMsg(null)
    const result = await autoCategorizeMonitorsAction()
    setAutoRunning(false)
    if (result.success) {
      setAutoMsg(`Done — ${result.assigned} providers categorised, ${result.skipped} couldn't be matched.`)
    } else {
      setAutoMsg(`Failed: ${result.error}`)
    }
  }

  return (
    <div>
      {/* Auto-categorize banner */}
      {uncategorisedCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{uncategorisedCount} providers have no PMB category</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {autoMsg ?? 'Auto-assign assigns based on domain + name keyword matching. You can override individually.'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" disabled={autoRunning} onClick={() => void runAutoCategory()} style={{ whiteSpace: 'nowrap' }}>
            {autoRunning ? 'Running…' : '✨ Auto-assign categories'}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="data-table-toolbar">
        <input
          placeholder="Search by name or domain…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ height: 38, padding: '0 12px', border: '1.5px solid var(--border-input)', borderRadius: 8, fontSize: 13, background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value="">All providers</option>
          <option value="__enabled">PMB enabled only</option>
          <option value="__uncategorised">Uncategorised</option>
          {categories.map(c => (
            <option key={c.slug} value={c.slug}>{c.emoji} {c.display_name}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span><strong style={{ color: 'var(--color-success)' }}>{enabledCount}</strong> enabled</span>
          <span>{filtered.length} of {monitors.length}</span>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>PMB Category</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 120 }}>PMB</th>
              <th style={{ width: 70 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr><td colSpan={5} className="admin-empty">No providers match this filter.</td></tr>
            )}
            {slice.map(m => (
              <>
                <tr key={m.id} style={{ background: editingId === m.id ? 'var(--color-bg)' : undefined }}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.domain}</div>
                  </td>
                  <td>
                    {m.pmb_category
                      ? <span className="admin-badge admin-badge-blue" style={{ fontSize: 11 }}>
                          {categories.find(c => c.slug === m.pmb_category)?.emoji} {categories.find(c => c.slug === m.pmb_category)?.display_name ?? m.pmb_category}
                        </span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Not set</span>
                    }
                  </td>
                  <td>
                    <span className={`admin-badge ${m.last_status === 'up' ? 'admin-badge-green' : m.last_status === 'down' ? 'admin-badge-red' : 'admin-badge-gray'}`}>
                      {m.last_status ?? '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ToggleSwitch
                        checked={m.pmb_enabled}
                        onChange={enabled => startTransition(() => void togglePmbMonitorAction(m.id, enabled))}
                      />
                      <span style={{ fontSize: 12, color: m.pmb_enabled ? 'var(--color-success)' : 'var(--text-muted)' }}>
                        {m.pmb_enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="admin-action-link"
                      style={{ fontSize: 12 }}
                      onClick={() => editingId === m.id ? setEditingId(null) : openEdit(m)}
                    >
                      {editingId === m.id ? 'Cancel' : 'Edit'}
                    </button>
                  </td>
                </tr>

                {editingId === m.id && (
                  <tr key={`${m.id}-edit`}>
                    <td colSpan={5} style={{ padding: 0, background: 'var(--color-bg)', borderBottom: '2px solid var(--color-primary)' }}>
                      <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                          {/* Category */}
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>PMB Category</label>
                            <select
                              value={editCat}
                              onChange={e => setEditCat(e.target.value)}
                              style={{ width: '100%', height: 36, padding: '0 10px', border: '1.5px solid var(--border-input)', borderRadius: 8, fontSize: 13, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            >
                              <option value="">— None —</option>
                              {categories.map(c => (
                                <option key={c.slug} value={c.slug}>{c.emoji} {c.display_name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Status page URL */}
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Status Page URL</label>
                            <input
                              value={editStatusUrl}
                              onChange={e => setEditStatusUrl(e.target.value)}
                              placeholder="https://status.example.com"
                              style={{ width: '100%', height: 36, padding: '0 10px', border: '1.5px solid var(--border-input)', borderRadius: 8, fontSize: 13, background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                            />
                          </div>

                          {/* PMB enabled */}
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>PMB Enabled</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36 }}>
                              <ToggleSwitch checked={editEnabled} onChange={setEditEnabled} />
                              <span style={{ fontSize: 13, color: editEnabled ? 'var(--color-success)' : 'var(--text-muted)' }}>
                                {editEnabled ? 'Enabled — will appear in weekly posts' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Keywords */}
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                            Custom Keywords <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(comma-separated, used in blog post SEO)</span>
                          </label>
                          <input
                            value={editKeywords}
                            onChange={e => setEditKeywords(e.target.value)}
                            placeholder="e.g. uptime monitoring, reliability, SLA"
                            style={{ width: '100%', height: 36, padding: '0 10px', border: '1.5px solid var(--border-input)', borderRadius: 8, fontSize: 13, background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(m.id)}>Save changes</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <Pagination page={safePage} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      )}
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
  const [editingSlug, setEditingSlug]   = useState<string | null>(null)
  const [keywordsInput, setKeywordsInput] = useState('')

  const monitorCount = (slug: string) => monitors.filter(m => m.pmb_enabled && m.pmb_category === slug).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
      {categories.map(cat => (
        <div key={cat.slug} className="admin-card" style={{ padding: 18 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {cat.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{cat.display_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{monitorCount(cat.slug)} providers · <code style={{ fontSize: 10 }}>{cat.slug}</code></div>
            </div>
            <span className={`admin-badge ${cat.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
              {cat.is_active ? 'Active' : 'Paused'}
            </span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Default Keywords
          </div>

          {editingSlug === cat.slug ? (
            <div>
              <textarea
                value={keywordsInput}
                onChange={e => setKeywordsInput(e.target.value)}
                rows={5}
                style={{ width: '100%', fontSize: 12, marginBottom: 10, boxSizing: 'border-box', padding: '8px 10px', border: '1.5px solid var(--border-input)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', resize: 'vertical' }}
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12, minHeight: 28 }}>
                {cat.default_keywords.length === 0
                  ? <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No keywords set</span>
                  : cat.default_keywords.map(kw => (
                    <span key={kw} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#2563eb', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{kw}</span>
                  ))
                }
              </div>
              <button className="admin-action-link" style={{ fontSize: 12 }} onClick={() => {
                setEditingSlug(cat.slug)
                setKeywordsInput(cat.default_keywords.join('\n'))
              }}>
                Edit keywords
              </button>
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [queuePage, setQueuePage]       = useState(1)

  const generated = runs.filter(r => r.status === 'generated')
  const failed    = runs.filter(r => r.status === 'failed')

  const visible = statusFilter === 'all' ? runs : runs.filter(r => r.status === statusFilter)
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage   = Math.min(queuePage, totalPages)
  const slice      = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div>
      {/* Summary row */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Generated today', value: stats.today_generated, color: 'admin-stat-icon-green', icon: '✅' },
          { label: 'Still queued',    value: stats.today_queued,    color: 'admin-stat-icon-amber', icon: '⏳' },
          { label: 'Approved total',  value: stats.approved,        color: 'admin-stat-icon-blue',  icon: '👍' },
          { label: 'Failed today',    value: failed.length,         color: '',                      icon: '❌',
            style: { background: failed.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)', color: failed.length > 0 ? '#dc2626' : '#64748b' } },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div className={`admin-stat-icon ${s.color}`} style={s.style as React.CSSProperties}>{s.icon}</div>
            <div className="admin-stat-info">
              <div className="admin-stat-number" style={failed.length > 0 && s.label === 'Failed today' ? { color: '#dc2626' } : undefined}>{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Approve all banner */}
      {generated.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '14px 18px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{generated.length} posts ready for approval</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{today} · Review individually below or approve all at once</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => startTransition(() => void approveTodaysBatchAction(today))}>
            Approve all {generated.length}
          </button>
        </div>
      )}

      {/* Retry failed banner */}
      {failed.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '14px 18px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626' }}>{failed.length} posts failed</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Will not retry automatically — click to re-queue</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => startTransition(() => void retryFailedTodayAction(today))}>
            Retry all failed
          </button>
        </div>
      )}

      {/* Status filter */}
      <div className="data-table-toolbar" style={{ marginBottom: 12 }}>
        <div className="support-admin-tabs" style={{ marginBottom: 0 }}>
          {(['all', 'generated', 'queued', 'approved', 'failed', 'discarded'] as const).map(s => {
            const count = s === 'all' ? runs.length : runs.filter(r => r.status === s).length
            return (
              <button key={s} className={`support-admin-tab${statusFilter === s ? ' active' : ''}`} onClick={() => { setStatusFilter(s); setQueuePage(1) }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="support-admin-tab-count">{count}</span>
              </button>
            )
          })}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{visible.length} posts</span>
      </div>

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
            {slice.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">No posts for today yet — week-planner runs Monday 5am UTC.</td></tr>
            )}
            {slice.map(r => {
              const label = r.post_type === 'pairwise'
                ? `${r.monitor_name ?? r.monitor_id} vs ${r.compare_monitor_name ?? r.compare_monitor_id}`
                : r.post_type === 'leaderboard'
                ? `${r.category_slug} Leaderboard`
                : r.monitor_name ?? r.run_key
              return (
                <tr key={r.id}>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    {r.error_message && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{r.error_message}</div>}
                  </td>
                  <td>{postTypeBadge(r.post_type)}</td>
                  <td><span style={{ fontSize: 12 }}>{r.category_slug}</span></td>
                  <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.word_count ?? '—'}</span></td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {r.status === 'generated' && (
                        <button className="admin-action-link" style={{ fontSize: 12 }} onClick={() => startTransition(() => void approvePmbRunAction(r.id))}>Approve</button>
                      )}
                      {r.status === 'failed' && (
                        <button className="admin-action-link" style={{ fontSize: 12 }} onClick={() => startTransition(() => void retryPmbRunAction(r.id))}>Retry</button>
                      )}
                      {['generated', 'queued', 'failed'].includes(r.status) && (
                        <button className="admin-action-link" style={{ fontSize: 12, color: '#dc2626' }} onClick={() => startTransition(() => void discardPmbRunAction(r.id))}>Discard</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {visible.length > PAGE_SIZE && (
        <Pagination page={safePage} total={visible.length} pageSize={PAGE_SIZE} onChange={p => setQueuePage(p)} />
      )}
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
    '/api/cron/pmb/week-planner':      { schedule: 'Mon 5:00 UTC', description: 'Plans the week — spreads posts Mon–Sun, dedup by run_key' },
    '/api/cron/pmb/daily-publisher':   { schedule: 'Every 5 min',  description: 'Picks today\'s queued posts and generates via Claude' },
    '/api/cron/pmb/monthly-generator': { schedule: '1st 7:00 UTC', description: 'Queues monthly leaderboard for each active category' },
    '/api/cron/public-checks':         { schedule: 'Every 5 min',  description: 'HTTP checks on all public monitors' },
  }

  const anyError = Object.values(cronHistory).some(runs => runs[0]?.status === 'error')

  return (
    <div>
      {anyError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13 }}>
          <span>⚠️</span>
          <div>
            <strong style={{ color: '#dc2626' }}>One or more crons have failures</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>Expand the row for details and error output.</span>
          </div>
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Cron</th>
              <th style={{ width: 130 }}>Schedule</th>
              <th style={{ width: 100 }}>Last run</th>
              <th style={{ width: 90 }}>Duration</th>
              <th style={{ width: 110 }}>Status</th>
              <th>Last output</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(cronMeta).map(path => {
              const runs       = cronHistory[path] ?? []
              const last       = runs[0]
              const meta       = cronMeta[path]
              const isExpanded = expanded.has(path)
              const ok         = !last || last.status === 'ok'

              const toggle = (): void => {
                const next = new Set(expanded)
                isExpanded ? next.delete(path) : next.add(path)
                setExpanded(next)
              }

              return (
                <>
                  <tr key={path} style={{ cursor: 'pointer' }} onClick={toggle}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'inline-block', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{path.split('/').slice(-2).join('/')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{meta.description}</div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 5, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {meta.schedule}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{last ? timeAgo(last.started_at) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{last ? fmtMs(last.duration_ms) : '—'}</td>
                    <td>
                      {last
                        ? statusBadge(last.status)
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
                            Never run
                          </span>
                      }
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {last?.result_summary ?? last?.error_message ?? '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <a href={path} target="_blank" rel="noreferrer" className="admin-action-link" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                        Run now ↗
                      </a>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${path}-expand`}>
                      <td colSpan={8} style={{ padding: 0, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ padding: '16px 20px' }}>
                          {/* History dots */}
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                            Last {runs.length} runs
                          </div>
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 16 }}>
                            {runs.map(r => (
                              <div
                                key={r.id}
                                title={`${r.status} · ${fmtMs(r.duration_ms)} · ${timeAgo(r.started_at)}`}
                                style={{ width: 12, height: 12, borderRadius: '50%', background: r.status === 'ok' ? '#22c55e' : r.status === 'error' ? '#ef4444' : '#94a3b8', flexShrink: 0, cursor: 'default' }}
                              />
                            ))}
                            {runs.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No runs recorded</span>}
                          </div>

                          {/* Log output */}
                          {last && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                                Output — {last.started_at}
                                {!ok && <span style={{ color: '#ef4444', fontWeight: 700 }}>● FAILED</span>}
                              </div>
                              <div style={{ background: '#0d1117', border: `1px solid ${ok ? 'var(--color-border)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#8b949e', lineHeight: 1.8, maxHeight: 180, overflowY: 'auto' }}>
                                {last.result_summary && <div style={{ color: '#79c0ff' }}>[INFO] {last.result_summary}</div>}
                                {last.error_message  && <div style={{ color: '#ff7b72' }}>[ERROR] {last.error_message}</div>}
                                {!last.result_summary && !last.error_message && <span style={{ color: '#484f58' }}>No output recorded for this run.</span>}
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
