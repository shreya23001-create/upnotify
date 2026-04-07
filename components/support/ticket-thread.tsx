'use client'

import { useState } from 'react'
import type { SupportTicket, SupportMessage } from '@/lib/db/support'

interface TicketThreadProps {
  ticket:   SupportTicket
  messages: SupportMessage[]
  isAdmin?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  open:             'Open',
  in_progress:      'In Progress',
  waiting_on_user:  'Waiting on you',
  resolved:         'Resolved',
  closed:           'Closed',
}

const STATUS_CLASS: Record<string, string> = {
  open:             'support-badge-open',
  in_progress:      'support-badge-progress',
  waiting_on_user:  'support-badge-waiting',
  resolved:         'support-badge-resolved',
  closed:           'support-badge-closed',
}

const PRIORITY_CLASS: Record<string, string> = {
  urgent: 'support-priority-urgent',
  high:   'support-priority-high',
  normal: 'support-priority-normal',
  low:    'support-priority-low',
}

function formatDate(str: string): string {
  return new Date(str).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function TicketThread({ ticket, messages, isAdmin = false }: TicketThreadProps): React.ReactElement {
  const [thread, setThread]   = useState<SupportMessage[]>(messages)
  const [reply,  setReply]    = useState('')
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')
  const [currentTicket, setCurrentTicket] = useState(ticket)

  // Admin-only controls
  const [status,     setStatus]     = useState(ticket.status)
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to ?? '')
  const [saving,     setSaving]     = useState(false)

  const isClosed = currentTicket.status === 'closed'

  async function handleReply(): Promise<void> {
    if (!reply.trim()) return
    setSending(true); setError('')

    try {
      const res = await fetch(`/api/v1/support/tickets/${ticket.id}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      })
      const data = await res.json() as { message?: SupportMessage; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to send reply'); return }
      setThread(prev => [...prev, data.message!])
      setReply('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleAdminSave(): Promise<void> {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/support/tickets/${ticket.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assigned_to: assignedTo.trim() || null,
        }),
      })
      const data = await res.json() as { ticket?: SupportTicket; error?: string }
      if (res.ok && data.ticket) setCurrentTicket(data.ticket)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="support-thread-wrap">
      {/* Ticket header */}
      <div className="card support-thread-header">
        <div className="support-thread-header-top">
          <div>
            <h2 className="support-thread-subject">{currentTicket.subject}</h2>
            <div className="support-thread-meta">
              <span className={`support-badge ${STATUS_CLASS[currentTicket.status] ?? ''}`}>
                {STATUS_LABEL[currentTicket.status] ?? currentTicket.status}
              </span>
              <span className={`support-priority-dot ${PRIORITY_CLASS[currentTicket.priority] ?? ''}`} title={`${currentTicket.priority} priority`} />
              <span className="support-meta-chip">{currentTicket.category.replace(/_/g, ' ')}</span>
              {currentTicket.assigned_to && (
                <span className="support-meta-chip">Assigned: {currentTicket.assigned_to}</span>
              )}
            </div>
          </div>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="support-admin-controls">
            <div className="form-group" style={{ minWidth: 160 }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value as typeof status)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_on_user">Waiting on User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="form-group" style={{ minWidth: 180 }}>
              <label className="form-label">Assigned to</label>
              <input
                type="text" className="form-input"
                placeholder="Agent name or email"
                value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-end' }}
              onClick={handleAdminSave} disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Message thread */}
      <div className="support-thread-messages">
        {thread.map(msg => (
          <div
            key={msg.id}
            className={`support-message ${msg.author_type === 'admin' ? 'support-message-admin' : 'support-message-user'}`}
          >
            <div className="support-message-header">
              <span className="support-message-author">
                {msg.author_type === 'admin' ? '🛡 Support Team' : `👤 ${msg.author_name ?? 'You'}`}
              </span>
              <span className="support-message-time">{formatDate(msg.created_at)}</span>
            </div>
            <div className="support-message-body">{msg.body}</div>
          </div>
        ))}
      </div>

      {/* Reply form */}
      {!isClosed && (
        <div className="card support-reply-card">
          <label className="form-label" style={{ marginBottom: 8 }}>
            {isAdmin ? 'Reply to user' : 'Add a reply'}
          </label>
          <textarea
            className="form-input support-textarea"
            placeholder={isAdmin ? 'Write your reply...' : 'Write your reply or provide more information...'}
            value={reply} onChange={e => setReply(e.target.value)}
            rows={4}
            disabled={sending}
          />
          {error && <p className="form-error" style={{ marginTop: 6 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-primary" onClick={handleReply} disabled={sending || !reply.trim()}>
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="card support-closed-notice">
          This ticket is closed. <a href="/dashboard/support" className="support-link">Open a new ticket</a> if you need further help.
        </div>
      )}
    </div>
  )
}
