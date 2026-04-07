'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User360Profile } from '@/app/api/admin/user360/route'

interface Plan {
  id: string
  name: string
  slug: string
}

interface CompetePlan {
  id: string
  name: string
  slug: string
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  const bg = score >= 70 ? '#dcfce7' : score >= 40 ? '#fef3c7' : '#fee2e2'
  const label = score >= 70 ? 'High Value' : score >= 40 ? 'Growing' : 'Low Activity'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, flexShrink: 0,
      }}>{score}</div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

function HealthBadge({ score, label }: { score: number; label: string }) {
  const isHealthy = score >= 75
  const isWatch = score >= 50 && score < 75
  const isAtRisk = score >= 25 && score < 50
  const color = isHealthy ? '#16a34a' : isWatch ? '#d97706' : isAtRisk ? '#ea580c' : '#dc2626'
  const bg = isHealthy ? '#dcfce7' : isWatch ? '#fef3c7' : isAtRisk ? '#ffedd5' : '#fee2e2'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, flexShrink: 0,
      }}>{score}</div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border-primary)', borderRadius: 3 }}>
        <div style={{ width: `${Math.round((value / max) * 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 22, textAlign: 'right' }}>{value}/{max}</span>
    </div>
  )
}

function ConfirmDialog({ title, message, variant, onConfirm, onCancel }: {
  title: string
  message: string
  variant: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}) {
  const [countdown, setCountdown] = useState(5)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <div className="popup-overlay" onClick={onCancel}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: variant === 'danger' ? '#dc2626' : '#d97706', marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={processing}>Cancel</button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            disabled={countdown > 0 || processing}
            onClick={() => { setProcessing(true); onConfirm() }}
          >
            {countdown > 0 ? `Wait ${countdown}s…` : processing ? 'Processing…' : 'Yes, proceed'}
          </button>
        </div>
      </div>
    </div>
  )
}

type SortKey = 'score' | 'totalSpendGbp' | 'monitorCount' | 'joinedAt' | 'email'

type ConfirmAction = {
  type: 'delete' | 'deactivate' | 'activate' | 'change_plan' | 'change_compete_plan'
  userId: string
  userName: string
  orgId?: string
  planId?: string
  planName?: string
}

export function AdminUsersContent(): React.ReactElement {
  const [profiles, setProfiles] = useState<User360Profile[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [competePlans, setCompetePlans] = useState<CompetePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [refreshingScores, setRefreshingScores] = useState(false)
  const [scoresRefreshedAt, setScoresRefreshedAt] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/user360')
      .then(r => r.json())
      .then((d: { success: boolean; profiles: User360Profile[]; plans: Plan[]; competePlans?: CompetePlan[] }) => {
        if (d.success) {
          setProfiles(d.profiles)
          setPlans(d.plans ?? [])
          setCompetePlans(d.competePlans ?? [])
          // Seed last-refreshed from any profile that has health score data
          const sample = d.profiles.find(p => p.healthScoreAt)
          if (sample?.healthScoreAt) setScoresRefreshedAt(sample.healthScoreAt)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const uniquePlans = useMemo(() => {
    const p = new Set(profiles.map(p => p.planName))
    return ['all', ...Array.from(p).sort()]
  }, [profiles])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>
    return <span style={{ marginLeft: 3 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  const filtered = useMemo(() => {
    let list = profiles.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.email.toLowerCase().includes(q) && !p.orgName.toLowerCase().includes(q)) return false
      }
      if (planFilter !== 'all' && p.planName !== planFilter) return false
      if (statusFilter === 'active' && !p.isActive) return false
      if (statusFilter === 'inactive' && p.isActive) return false
      return true
    })
    return list.sort((a, b) => {
      let va: string | number = a[sortKey] as string | number
      let vb: string | number = b[sortKey] as string | number
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'desc' ? 1 : -1
      if (va > vb) return sortDir === 'desc' ? -1 : 1
      return 0
    })
  }, [profiles, search, planFilter, statusFilter, sortKey, sortDir])

  const totalSpend = profiles.reduce((s, p) => s + p.totalSpendGbp, 0)
  const avgScore = profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.score, 0) / profiles.length) : 0
  const highValue = profiles.filter(p => p.score >= 70).length
  const paying = profiles.filter(p => p.totalSpendGbp > 0).length

  const handleImpersonate = useCallback(async (userId: string) => {
    setImpersonatingId(userId)
    try {
      const res = await fetch('/api/v1/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) router.push('/dashboard')
      else setImpersonatingId(null)
    } catch {
      setImpersonatingId(null)
    }
  }, [router])

  const executeAction = useCallback(async () => {
    if (!confirmAction) return
    setMessage(null)
    try {
      if (confirmAction.type === 'delete') {
        const res = await fetch(`/api/admin/users?userId=${confirmAction.userId}`, { method: 'DELETE' })
        const data = await res.json() as { success?: boolean; error?: string }
        if (data.success) {
          setMessage({ type: 'success', text: `${confirmAction.userName} deleted.` })
          setProfiles(prev => prev.filter(p => p.userId !== confirmAction.userId))
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed to delete' })
        }
      } else if (confirmAction.type === 'deactivate' || confirmAction.type === 'activate') {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: confirmAction.userId, action: confirmAction.type }),
        })
        const data = await res.json() as { success?: boolean; error?: string }
        if (data.success) {
          setMessage({ type: 'success', text: `${confirmAction.userName} ${confirmAction.type}d.` })
          setProfiles(prev => prev.map(p =>
            p.userId === confirmAction.userId ? { ...p, isActive: confirmAction.type === 'activate' } : p
          ))
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed' })
        }
      } else if (confirmAction.type === 'change_plan') {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: confirmAction.userId, action: 'change_plan', planId: confirmAction.planId }),
        })
        const data = await res.json() as { success?: boolean; error?: string }
        if (data.success) {
          setMessage({ type: 'success', text: `${confirmAction.userName} moved to ${confirmAction.planName}.` })
          router.refresh()
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed' })
        }
      } else if (confirmAction.type === 'change_compete_plan') {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: confirmAction.userId, orgId: confirmAction.orgId, action: 'change_compete_plan', planId: confirmAction.planId }),
        })
        const data = await res.json() as { success?: boolean; error?: string }
        if (data.success) {
          setMessage({ type: 'success', text: `${confirmAction.userName} Compete plan set to ${confirmAction.planName}.` })
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed' })
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setConfirmAction(null)
  }, [confirmAction, router])

  const handleRefreshScores = useCallback(async () => {
    setRefreshingScores(true)
    setMessage(null)
    try {
      const res = await fetch('/api/cron/health-scores')
      const data = await res.json() as { success?: boolean; processed?: number; at?: string; error?: string }
      if (data.success) {
        setScoresRefreshedAt(data.at ?? new Date().toISOString())
        setMessage({ type: 'success', text: `Health scores refreshed for ${data.processed ?? 0} organisations.` })
        // Reload profiles to show updated scores
        const r2 = await fetch('/api/admin/user360')
        const d2 = await r2.json() as { success: boolean; profiles: User360Profile[] }
        if (d2.success) setProfiles(d2.profiles)
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Failed to refresh scores' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error refreshing scores' })
    }
    setRefreshingScores(false)
  }, [])

  const confirmMessages: Record<string, { title: string; message: string; variant: 'danger' | 'warning' }> = {
    delete: {
      title: 'Delete User Permanently',
      message: `Delete ${confirmAction?.userName}? This removes ALL their data — monitors, incidents, invoices, subscriptions. Cannot be undone.`,
      variant: 'danger',
    },
    deactivate: {
      title: 'Deactivate User',
      message: `Deactivate ${confirmAction?.userName}? They lose dashboard access. Their data is preserved and they can be reactivated later.`,
      variant: 'warning',
    },
    activate: {
      title: 'Reactivate User',
      message: `Reactivate ${confirmAction?.userName}? They will regain full access to their dashboard immediately.`,
      variant: 'warning',
    },
    change_plan: {
      title: 'Change Plan',
      message: `Move ${confirmAction?.userName} to ${confirmAction?.planName}? This is an admin override — no Stripe payment processed. Takes effect immediately.`,
      variant: 'warning',
    },
    change_compete_plan: {
      title: 'Assign Compete Plan',
      message: `Assign ${confirmAction?.userName} to Compete plan "${confirmAction?.planName}"? Admin override — no Stripe payment processed. Takes effect immediately.`,
      variant: 'warning',
    },
  }

  return (
    <>
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Users', value: profiles.length, color: undefined },
          { label: 'Total Revenue', value: `£${totalSpend.toFixed(2)}`, color: 'var(--success)' },
          { label: 'Avg Score', value: avgScore, color: undefined },
          { label: 'High Value', value: highValue, color: '#16a34a' },
          { label: 'Paying', value: paying, color: undefined },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ fontSize: 13, padding: '6px 10px', width: 240 }}
          placeholder="Search email or org…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select className="form-input" style={{ fontSize: 13, padding: '6px 10px', width: 160 }} value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }}>
          {uniquePlans.map(p => <option key={p} value={p}>{p === 'all' ? 'All plans' : p}</option>)}
        </select>
        <select className="form-input" style={{ fontSize: 13, padding: '6px 10px', width: 150 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="all">All users</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>{filtered.length} users</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {scoresRefreshedAt && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Scores: {new Date(scoresRefreshedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={() => void handleRefreshScores()}
            disabled={refreshingScores}
          >
            {refreshingScores ? 'Refreshing…' : '↻ Refresh Scores'}
          </button>
        </div>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'form-success' : 'form-error'} style={{ marginBottom: 12 }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading users…</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', paddingLeft: 16 }} onClick={() => toggleSort('score')}>Eng. Score <SortIcon col="score" /></th>
                  <th>Health</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('email')}>User / Org <SortIcon col="email" /></th>
                  <th>Plan</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('totalSpendGbp')}>Spend <SortIcon col="totalSpendGbp" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('monitorCount')}>Monitors <SortIcon col="monitorCount" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('joinedAt')}>Joined <SortIcon col="joinedAt" /></th>
                  <th>Status</th>
                  <th>Actions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => (
                  <>
                    <tr key={p.userId}>
                      <td style={{ paddingLeft: 16 }}><ScoreBadge score={p.score} /></td>
                      <td>
                        {p.healthScore !== null && p.healthScoreLabel ? (
                          <HealthBadge score={p.healthScore} label={p.healthScoreLabel} />
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          <Link
                            href={`/admin/user360?email=${encodeURIComponent(p.email)}`}
                            style={{ color: 'var(--accent)', textDecoration: 'none' }}
                          >
                            {p.fullName ?? p.email}
                          </Link>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.orgName}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.planName}</div>
                        {p.billingCycle && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.billingCycle}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 14, color: p.totalSpendGbp > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          £{p.totalSpendGbp.toFixed(2)}
                        </div>
                        {p.invoiceCount > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.invoiceCount} inv</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.monitorCount}</div>
                        {p.activeMonitorCount !== p.monitorCount && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.activeMonitorCount} active</div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(p.joinedAt)}</td>
                      <td>
                        <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => void handleImpersonate(p.userId)}
                          disabled={impersonatingId === p.userId}
                        >
                          {impersonatingId === p.userId ? '…' : 'Mimic'}
                        </button>
                      </td>
                      <td>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: '4px 8px' }}
                          onClick={() => setExpanded(expanded === p.userId ? null : p.userId)}
                          aria-label="Expand user details"
                        >
                          {expanded === p.userId ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>

                    {expanded === p.userId && (
                      <tr key={`${p.userId}-detail`}>
                        <td colSpan={10} style={{ padding: '20px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 24 }}>

                            {/* Score breakdown */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Score Breakdown</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                  { label: 'Spend', val: p.scoreBreakdown.spend, max: 35, color: '#16a34a' },
                                  { label: 'Monitors', val: p.scoreBreakdown.monitors, max: 25, color: '#3b82f6' },
                                  { label: 'Plan Tier', val: p.scoreBreakdown.plan, max: 20, color: '#8b5cf6' },
                                  { label: 'Tenure', val: p.scoreBreakdown.tenure, max: 20, color: '#f59e0b' },
                                ].map(s => (
                                  <div key={s.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                      <span>{s.label}</span><span style={{ color: 'var(--text-muted)' }}>{s.val}/{s.max}</span>
                                    </div>
                                    <ScoreBar value={s.val} max={s.max} color={s.color} />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Billing */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Billing</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                  ['Plan', p.planName],
                                  ['Billing', p.billingCycle ?? '—'],
                                  ['Sub status', p.subStatus ?? '—'],
                                  ['Period ends', fmtDate(p.currentPeriodEnd)],
                                  ['Total spend', `£${p.totalSpendGbp.toFixed(2)}`],
                                  ['Invoices', String(p.invoiceCount)],
                                  ['Last invoice', fmtDate(p.lastInvoiceAt)],
                                ].map(([label, val]) => (
                                  <div key={label} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{label}</span>
                                    <span style={{ fontWeight: 600 }}>{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Usage */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Usage</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                  ['Monitors', `${p.monitorCount} (${p.activeMonitorCount} active)`],
                                  ['Alert channels', String(p.alertChannelCount)],
                                  ['Status pages', String(p.statusPageCount)],
                                  ['Joined', fmtDate(p.joinedAt)],
                                  ['Org ID', p.orgId.slice(0, 8) + '…'],
                                ].map(([label, val]) => (
                                  <div key={label} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{label}</span>
                                    <span style={{ fontWeight: 600 }}>{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Admin Actions */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Admin Actions</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <button
                                  className="btn btn-sm btn-primary"
                                  style={{ fontSize: 12, padding: '6px 12px' }}
                                  onClick={() => void handleImpersonate(p.userId)}
                                  disabled={impersonatingId === p.userId}
                                >
                                  {impersonatingId === p.userId ? 'Switching…' : '👁 Mimic User'}
                                </button>

                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>Change Uptime Plan</div>
                                <select
                                  className="form-input"
                                  style={{ fontSize: 12, padding: '5px 8px' }}
                                  defaultValue=""
                                  onChange={e => {
                                    const planId = e.target.value
                                    if (!planId) return
                                    const plan = plans.find(pl => pl.id === planId)
                                    setConfirmAction({ type: 'change_plan', userId: p.userId, userName: p.fullName ?? p.email, planId, planName: plan?.name ?? 'Unknown' })
                                    e.target.value = ''
                                  }}
                                >
                                  <option value="">Select plan…</option>
                                  {plans.map(pl => (
                                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                                  ))}
                                </select>

                                {competePlans.length > 0 && (
                                  <>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 8 }}>Assign Compete Plan</div>
                                    <select
                                      className="form-input"
                                      style={{ fontSize: 12, padding: '5px 8px' }}
                                      defaultValue=""
                                      onChange={e => {
                                        const planId = e.target.value
                                        if (!planId) return
                                        const plan = competePlans.find(pl => pl.id === planId)
                                        setConfirmAction({ type: 'change_compete_plan', userId: p.userId, orgId: p.orgId, userName: p.fullName ?? p.email, planId, planName: plan?.name ?? 'Unknown' })
                                        e.target.value = ''
                                      }}
                                    >
                                      <option value="">Select Compete plan…</option>
                                      {competePlans.map(pl => (
                                        <option key={pl.id} value={pl.id}>{pl.name}</option>
                                      ))}
                                    </select>
                                  </>
                                )}

                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                  {p.isActive ? (
                                    <button
                                      className="btn btn-sm btn-secondary"
                                      style={{ fontSize: 12, flex: 1 }}
                                      onClick={() => setConfirmAction({ type: 'deactivate', userId: p.userId, userName: p.fullName ?? p.email })}
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-sm btn-primary"
                                      style={{ fontSize: 12, flex: 1 }}
                                      onClick={() => setConfirmAction({ type: 'activate', userId: p.userId, userName: p.fullName ?? p.email })}
                                    >
                                      Reactivate
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-danger"
                                    style={{ fontSize: 12 }}
                                    onClick={() => setConfirmAction({ type: 'delete', userId: p.userId, userName: p.fullName ?? p.email })}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}

                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>Page {page} of {Math.ceil(filtered.length / PAGE_SIZE)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {confirmAction && confirmMessages[confirmAction.type] && (
        <ConfirmDialog
          title={confirmMessages[confirmAction.type].title}
          message={confirmMessages[confirmAction.type].message}
          variant={confirmMessages[confirmAction.type].variant}
          onConfirm={() => void executeAction()}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}
