'use client'

import { useState, useEffect, useCallback } from 'react'

interface Broadcast {
  id: string
  title: string
  body: string
  type: string
  audience: string
  sent_by: string
  sent_at: string
  recipient_count: number
}

const AUDIENCES = [
  { value: 'all', label: 'All Users' },
  { value: 'free', label: 'Free Plan Users' },
  { value: 'lite', label: 'Lite Plan Users' },
  { value: 'builder', label: 'Builder Plan Users' },
  { value: 'scale', label: 'Scale Plan Users' },
  { value: 'trial', label: 'Trial Users (no subscription)' },
]

const MESSAGE_TYPES = [
  { value: 'info', label: 'Info', color: '#3b82f6' },
  { value: 'warning', label: 'Warning', color: '#f59e0b' },
  { value: 'error', label: 'Urgent', color: '#ef4444' },
  { value: 'success', label: 'Good News', color: '#22c55e' },
  { value: 'system', label: 'System', color: '#8b5cf6' },
]

export default function AdminMessagesPage(): React.ReactElement {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('info')
  const [audience, setAudience] = useState('all')
  const [actionUrl, setActionUrl] = useState('')
  const [actionLabel, setActionLabel] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [history, setHistory] = useState<Broadcast[]>([])

  const fetchHistory = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/messages')
      if (res.ok) {
        const data = await res.json() as { success: boolean; broadcasts: Broadcast[] }
        if (data.success) setHistory(data.broadcasts)
      }
    } catch {
      // Silently ignore
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSend = async (): Promise<void> => {
    if (!title.trim() || !body.trim()) {
      setResult({ type: 'error', text: 'Title and body are required.' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          audience,
          actionUrl: actionUrl.trim() || undefined,
          actionLabel: actionLabel.trim() || undefined,
        }),
      })

      const data = await res.json() as { success: boolean; recipientCount?: number; error?: string }

      if (data.success) {
        setResult({ type: 'success', text: `Message sent to ${data.recipientCount} users.` })
        setTitle('')
        setBody('')
        setActionUrl('')
        setActionLabel('')
        fetchHistory()
      } else {
        setResult({ type: 'error', text: data.error ?? 'Failed to send.' })
      }
    } catch {
      setResult({ type: 'error', text: 'Network error.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y">
      <h1 className="admin-page-title">Messages &amp; Broadcasts</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Send messages to users. Messages appear in the bell icon dropdown in their dashboard.
      </p>

      {/* Compose */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Send New Message</div>
        </div>
        <div className="card-content">
          <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Title</label>
              <input
                className="form-input"
                placeholder="e.g. Scheduled Maintenance — April 10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={sending}
              />
            </div>

            <div>
              <label className="form-label">Message Body</label>
              <textarea
                className="form-input"
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                disabled={sending}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label className="form-label">Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)} disabled={sending}>
                  {MESSAGE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
                <label className="form-label">Audience</label>
                <select className="form-select" value={audience} onChange={(e) => setAudience(e.target.value)} disabled={sending}>
                  {AUDIENCES.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label className="form-label">Action URL (optional)</label>
                <input
                  className="form-input"
                  placeholder="/dashboard/settings?tab=billing"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label className="form-label">Action Button Label (optional)</label>
                <input
                  className="form-input"
                  placeholder="Upgrade Now"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  disabled={sending}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              {result && (
                <span style={{ fontSize: 13, color: result.type === 'success' ? '#22c55e' : '#ef4444' }}>
                  {result.text}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Broadcast History</div>
        </div>
        <div className="card-content">
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No broadcasts sent yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Audience</th>
                    <th>Recipients</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 500 }}>{b.title}</td>
                      <td>
                        <span className={`badge badge-${b.type === 'error' ? 'danger' : b.type === 'warning' ? 'warning' : b.type === 'success' ? 'success' : 'outline'}`}>
                          {b.type}
                        </span>
                      </td>
                      <td>{b.audience}</td>
                      <td>{b.recipient_count}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(b.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(b.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
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
