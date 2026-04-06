'use client'

import { useState, useEffect, useMemo } from 'react'
import type { User360Profile } from '@/app/api/admin/user360/route'

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

type SortKey = 'score' | 'totalSpendGbp' | 'monitorCount' | 'joinedAt' | 'email'

export default function AdminUser360Page(): React.ReactElement {
  const [profiles, setProfiles] = useState<User360Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/user360')
      .then(r => r.json())
      .then((d: { success: boolean; profiles: User360Profile[] }) => {
        if (d.success) setProfiles(d.profiles)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const uniquePlans = useMemo(() => {
    const plans = new Set(profiles.map(p => p.planName))
    return ['all', ...Array.from(plans).sort()]
  }, [profiles])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
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

    list = list.sort((a, b) => {
      let va: string | number = a[sortKey] as string | number
      let vb: string | number = b[sortKey] as string | number
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'desc' ? 1 : -1
      if (va > vb) return sortDir === 'desc' ? -1 : 1
      return 0
    })

    return list
  }, [profiles, search, planFilter, statusFilter, sortKey, sortDir])

  // Summary stats
  const totalSpend = profiles.reduce((s, p) => s + p.totalSpendGbp, 0)
  const avgScore = profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.score, 0) / profiles.length) : 0
  const highValue = profiles.filter(p => p.score >= 70).length
  const paying = profiles.filter(p => p.totalSpendGbp > 0).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User 360</h1>
          <p className="admin-page-subtitle">
            Every user scored by spend, monitors, plan tier, and tenure. Identify high-value users, churn risks, and growth opportunities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>£{totalSpend.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>total revenue</div>
          </div>
          <div className="card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{avgScore}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>avg score</div>
          </div>
          <div className="card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{highValue}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>high value</div>
          </div>
          <div className="card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{paying}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>paying</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ fontSize: 13, padding: '6px 10px', width: 220 }}
          placeholder="Search email or org…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input" style={{ fontSize: 13, padding: '6px 10px', width: 150 }} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          {uniquePlans.map(p => <option key={p} value={p}>{p === 'all' ? 'All plans' : p}</option>)}
        </select>
        <select className="form-input" style={{ fontSize: 13, padding: '6px 10px', width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All users</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>{filtered.length} users</span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading profiles…</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', paddingLeft: 16 }} onClick={() => toggleSort('score')}>Score <SortIcon col="score" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('email')}>User / Org <SortIcon col="email" /></th>
                  <th>Plan</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('totalSpendGbp')}>Total Spend <SortIcon col="totalSpendGbp" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('monitorCount')}>Monitors <SortIcon col="monitorCount" /></th>
                  <th>Channels</th>
                  <th>Pages</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('joinedAt')}>Joined <SortIcon col="joinedAt" /></th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <>
                    <tr key={p.userId} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === p.userId ? null : p.userId)}>
                      <td style={{ paddingLeft: 16 }}><ScoreBadge score={p.score} /></td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.orgName || p.orgId}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.planName}</div>
                        {p.billingCycle && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.billingCycle}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 14, color: p.totalSpendGbp > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          £{p.totalSpendGbp.toFixed(2)}
                        </div>
                        {p.invoiceCount > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.invoiceCount} invoice{p.invoiceCount !== 1 ? 's' : ''}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.monitorCount}</div>
                        {p.activeMonitorCount !== p.monitorCount && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.activeMonitorCount} active</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.alertChannelCount}</td>
                      <td style={{ fontWeight: 600 }}>{p.statusPageCount}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(p.joinedAt)}</td>
                      <td>
                        <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{expanded === p.userId ? '▲' : '▼'}</td>
                    </tr>

                    {expanded === p.userId && (
                      <tr key={`${p.userId}-detail`}>
                        <td colSpan={10} style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                            {/* Score breakdown */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Score Breakdown</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                    <span>Spend</span><span style={{ color: 'var(--text-muted)' }}>{p.scoreBreakdown.spend}/35</span>
                                  </div>
                                  <ScoreBar value={p.scoreBreakdown.spend} max={35} color="#16a34a" />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                    <span>Monitors</span><span style={{ color: 'var(--text-muted)' }}>{p.scoreBreakdown.monitors}/25</span>
                                  </div>
                                  <ScoreBar value={p.scoreBreakdown.monitors} max={25} color="#3b82f6" />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                    <span>Plan Tier</span><span style={{ color: 'var(--text-muted)' }}>{p.scoreBreakdown.plan}/20</span>
                                  </div>
                                  <ScoreBar value={p.scoreBreakdown.plan} max={20} color="#8b5cf6" />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                    <span>Tenure</span><span style={{ color: 'var(--text-muted)' }}>{p.scoreBreakdown.tenure}/20</span>
                                  </div>
                                  <ScoreBar value={p.scoreBreakdown.tenure} max={20} color="#f59e0b" />
                                </div>
                              </div>
                            </div>

                            {/* Billing details */}
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
                                  ['Account status', p.isActive ? 'Active' : 'Inactive'],
                                ].map(([label, val]) => (
                                  <div key={label} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{label}</span>
                                    <span style={{ fontWeight: 600 }}>{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Actions</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <a href={`/admin/users`} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', textAlign: 'center' }}>
                                  Manage User
                                </a>
                              </div>
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
        </div>
      )}
    </div>
  )
}
