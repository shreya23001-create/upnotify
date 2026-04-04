'use client'

import { useState, useEffect, useCallback } from 'react'

interface Submission {
  id: string
  org_id: string
  user_id: string
  credit_type: string
  submission_url: string | null
  evidence_text: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  credit_amount_pence: number
  created_at: string
  user_email?: string
  user_name?: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  totalCreditsPence: number
}

function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function AdminCreditsPage(): React.ReactElement {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalCreditsPence: 0 })
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/credits')
      if (res.ok) {
        const data = await res.json() as { success: boolean; submissions: Submission[]; stats: Stats }
        if (data.success) {
          setSubmissions(data.submissions)
          setStats(data.stats)
        }
      }
    } catch {
      // Silently ignore
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (id: string): Promise<void> => {
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, action: 'approve' }),
      })
      if (res.ok) fetchData()
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string): Promise<void> => {
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, action: 'reject', notes: rejectNotes[id] || '' }),
      })
      if (res.ok) fetchData()
    } finally {
      setProcessing(null)
    }
  }

  const filtered = tab === 'pending'
    ? submissions.filter(s => s.status === 'pending')
    : submissions

  return (
    <div className="space-y">
      <h1 className="admin-page-title">Credit Submissions</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Review and approve credit submissions from users.
      </p>

      {/* Stats */}
      <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card stat-card" style={{ padding: 16 }}>
          <div className="stat-label">Total</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div className="card stat-card stat-card-yellow" style={{ padding: 16 }}>
          <div className="stat-label">Pending</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.pending}</div>
        </div>
        <div className="card stat-card stat-card-green" style={{ padding: 16 }}>
          <div className="stat-label">Approved</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.approved}</div>
        </div>
        <div className="card stat-card stat-card-red" style={{ padding: 16 }}>
          <div className="stat-label">Rejected</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.rejected}</div>
        </div>
        <div className="card stat-card stat-card-blue" style={{ padding: 16 }}>
          <div className="stat-label">Credits Given</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{formatPence(stats.totalCreditsPence)}</div>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`btn btn-sm ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('all')}
        >
          All Submissions
        </button>
      </div>

      {/* Submissions list */}
      <div className="card">
        <div className="card-content">
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 32 }}>
              {tab === 'pending' ? 'No pending submissions.' : 'No submissions yet.'}
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Submission</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontSize: 13 }}>{s.user_email ?? s.user_id.slice(0, 8)}</div>
                      </td>
                      <td>
                        <span className="badge badge-outline">{formatType(s.credit_type)}</span>
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        {s.submission_url && (
                          <a href={s.submission_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                            {s.submission_url.slice(0, 50)}...
                          </a>
                        )}
                        {s.evidence_text && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {s.evidence_text.slice(0, 100)}{s.evidence_text.length > 100 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatPence(s.credit_amount_pence)}</td>
                      <td>
                        <span className={`badge ${s.status === 'approved' ? 'badge-success' : s.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {s.status === 'pending' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleApprove(s.id)}
                                disabled={processing === s.id}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleReject(s.id)}
                                disabled={processing === s.id}
                              >
                                Reject
                              </button>
                            </div>
                            <input
                              className="form-input"
                              placeholder="Rejection reason (optional)"
                              style={{ fontSize: 11, padding: '4px 8px' }}
                              value={rejectNotes[s.id] || ''}
                              onChange={(e) => setRejectNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                            />
                          </div>
                        )}
                        {s.status !== 'pending' && s.reviewed_by && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            By {s.reviewed_by}
                            {s.reviewed_at && ` on ${new Date(s.reviewed_at).toLocaleDateString()}`}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
