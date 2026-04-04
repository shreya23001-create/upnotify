'use client'

import { useState, useEffect, useCallback } from 'react'

interface AgencyAiReport {
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  riskLevel: 'low' | 'medium' | 'high'
  businessSizeEstimate: string
  potentialRevenue: string
  legitimacyAssessment: string
}

interface WaitlistEntry {
  id: string
  name: string
  email: string
  phone: string | null
  country: string | null
  city: string | null
  business_name: string | null
  website: string | null
  num_clients: number | null
  status: 'pending' | 'approved' | 'rejected' | 'contacted'
  ai_report: AgencyAiReport | null
  ai_score: number | null
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  contacted: number
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'contacted'

function getScoreBadgeStyle(score: number): { backgroundColor: string; color: string } {
  if (score > 70) return { backgroundColor: 'var(--color-success-bg, #dcfce7)', color: 'var(--color-success, #16a34a)' }
  if (score >= 40) return { backgroundColor: 'var(--color-warning-bg, #fef9c3)', color: 'var(--color-warning, #ca8a04)' }
  return { backgroundColor: 'var(--color-danger-bg, #fecaca)', color: 'var(--color-danger, #dc2626)' }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'approved': return 'badge badge-success'
    case 'rejected': return 'badge badge-danger'
    case 'contacted': return 'badge badge-info'
    default: return 'badge badge-warning'
  }
}

export default function AdminAgencyWaitlistPage(): React.ReactElement {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, contacted: 0 })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/admin/agency-waitlist?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json() as { success: boolean; entries: WaitlistEntry[]; stats: Stats }
        if (data.success) {
          setEntries(data.entries)
          setStats(data.stats)
        }
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  const handleAction = async (entryId: string, action: 'approve' | 'reject' | 'contact'): Promise<void> => {
    setProcessing(entryId)
    try {
      const res = await fetch('/api/admin/agency-waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, action }),
      })
      if (res.ok) fetchData()
    } finally {
      setProcessing(null)
    }
  }

  const handleGenerateReport = async (entryId: string): Promise<void> => {
    setGeneratingReport(entryId)
    try {
      const res = await fetch('/api/admin/agency-waitlist/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      })
      if (res.ok) {
        await fetchData()
        setExpandedReport(entryId)
      }
    } finally {
      setGeneratingReport(null)
    }
  }

  const TABS: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
    { key: 'contacted', label: 'Contacted', count: stats.contacted },
  ]

  return (
    <div className="space-y">
      <h1 className="admin-page-title">Agency Waitlist</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Review agency plan applications. Generate AI reports to assess applicant quality.
      </p>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card stat-card" style={{ padding: 16 }}>
          <div className="stat-label">Total Applications</div>
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
          <div className="stat-label">Contacted</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.contacted}</div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-content">
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 32 }}>
              Loading...
            </p>
          ) : entries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 32 }}>
              No applications found.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Business</th>
                    <th>Website</th>
                    <th>Clients</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <>
                      <tr key={entry.id}>
                        <td style={{ fontWeight: 500 }}>{entry.name}</td>
                        <td style={{ fontSize: 13 }}>{entry.email}</td>
                        <td style={{ fontSize: 13 }}>{entry.business_name || '—'}</td>
                        <td style={{ fontSize: 12 }}>
                          {entry.website ? (
                            <a
                              href={entry.website.startsWith('http') ? entry.website : `https://${entry.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--color-primary)', wordBreak: 'break-all' }}
                            >
                              {entry.website.replace(/^https?:\/\//, '').slice(0, 30)}
                            </a>
                          ) : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>{entry.num_clients ?? '—'}</td>
                        <td style={{ fontSize: 13 }}>
                          {entry.country || '—'}
                          {entry.city ? `, ${entry.city}` : ''}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(entry.status)}>
                            {entry.status}
                          </span>
                        </td>
                        <td>
                          {entry.ai_score !== null ? (
                            <span
                              style={{
                                ...getScoreBadgeStyle(entry.ai_score),
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 13,
                                fontWeight: 600,
                                display: 'inline-block',
                                cursor: 'pointer',
                              }}
                              onClick={() => setExpandedReport(expandedReport === entry.id ? null : entry.id)}
                              title="Click to view report"
                            >
                              {entry.ai_score}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {entry.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleAction(entry.id, 'approve')}
                                  disabled={processing === entry.id}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleAction(entry.id, 'reject')}
                                  disabled={processing === entry.id}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {(entry.status === 'pending' || entry.status === 'contacted') && (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleAction(entry.id, 'contact')}
                                disabled={processing === entry.id}
                              >
                                Contact
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleGenerateReport(entry.id)}
                              disabled={generatingReport === entry.id}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {generatingReport === entry.id ? 'Generating...' : entry.ai_report ? 'Regenerate' : 'AI Report'}
                            </button>
                          </div>
                          {entry.reviewed_by && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              By {entry.reviewed_by}
                              {entry.reviewed_at && ` on ${new Date(entry.reviewed_at).toLocaleDateString()}`}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expanded AI Report row */}
                      {expandedReport === entry.id && entry.ai_report && (
                        <tr key={`${entry.id}-report`}>
                          <td colSpan={10} style={{ padding: 0 }}>
                            <div style={{
                              padding: '16px 24px',
                              backgroundColor: 'var(--bg-secondary, #f8fafc)',
                              borderTop: '1px solid var(--border-color, #e2e8f0)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>AI Company Report</h4>
                                {entry.ai_score !== null && (
                                  <span style={{
                                    ...getScoreBadgeStyle(entry.ai_score),
                                    padding: '2px 10px',
                                    borderRadius: 12,
                                    fontSize: 13,
                                    fontWeight: 700,
                                  }}>
                                    Score: {entry.ai_score}/100
                                  </span>
                                )}
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  backgroundColor: entry.ai_report.riskLevel === 'low'
                                    ? 'var(--color-success-bg, #dcfce7)'
                                    : entry.ai_report.riskLevel === 'medium'
                                      ? 'var(--color-warning-bg, #fef9c3)'
                                      : 'var(--color-danger-bg, #fecaca)',
                                  color: entry.ai_report.riskLevel === 'low'
                                    ? 'var(--color-success, #16a34a)'
                                    : entry.ai_report.riskLevel === 'medium'
                                      ? 'var(--color-warning, #ca8a04)'
                                      : 'var(--color-danger, #dc2626)',
                                }}>
                                  Risk: {entry.ai_report.riskLevel}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                                {/* Strengths */}
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-success, #16a34a)', marginBottom: 6 }}>
                                    Strengths
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                                    {entry.ai_report.strengths.map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Weaknesses */}
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-danger, #dc2626)', marginBottom: 6 }}>
                                    Weaknesses
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                                    {entry.ai_report.weaknesses.map((w, i) => (
                                      <li key={i}>{w}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Business Size Estimate</div>
                                  <div style={{ fontSize: 13 }}>{entry.ai_report.businessSizeEstimate}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Potential Revenue</div>
                                  <div style={{ fontSize: 13 }}>{entry.ai_report.potentialRevenue}</div>
                                </div>
                              </div>

                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Legitimacy Assessment</div>
                                <div style={{ fontSize: 13 }}>{entry.ai_report.legitimacyAssessment}</div>
                              </div>

                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Recommendation</div>
                                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{entry.ai_report.recommendation}</div>
                              </div>

                              <div style={{ marginTop: 12, textAlign: 'right' }}>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setExpandedReport(null)}
                                >
                                  Close Report
                                </button>
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
          )}
        </div>
      </div>
    </div>
  )
}
