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

function formatBytes(n: number | undefined): string {
  if (!n || n < 1) return ''
  if (n < 1024)              return `${n} B`
  if (n < 1024 * 1024)       return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function attachmentDisplayName(path: string, name?: string): string {
  if (name) return name
  const file = path.split('/').pop() ?? path
  return file
}

/** Stable human-readable ticket number derived from UUID */
function ticketNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  const num = parseInt(hex, 16) % 100000
  return `TKT-${num.toString().padStart(5, '0')}`
}

export function TicketThread({ ticket, messages, isAdmin = false }: TicketThreadProps): React.ReactElement {
  const [thread, setThread]       = useState<SupportMessage[]>(messages)
  const [reply,  setReply]        = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [sending,    setSending]  = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [error,   setError]       = useState('')
  const [currentTicket, setCurrentTicket] = useState(ticket)

  // Admin-only controls
  const [status,     setStatus]     = useState(ticket.status)
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to ?? '')
  const [saving,     setSaving]     = useState(false)

  const isClosed = currentTicket.status === 'closed'

  async function handleDraftWithAI(): Promise<void> {
    setDraftLoading(true)
    try {
      const res = await fetch(`/api/v1/support/tickets/${ticket.id}/ai-draft`, { method: 'POST' })
      const data = await res.json() as { draft?: string; error?: string }
      if (res.ok && data.draft) setReply(data.draft)
    } catch { /* silent */ } finally {
      setDraftLoading(false)
    }
  }

  async function handleReply(): Promise<void> {
    if (!reply.trim()) return
    setSending(true); setError('')

    try {
      // Upload attachments first if any
      const uploadedAttachments: Array<{ path: string; name?: string; mime?: string; size?: number }> = []
      for (const file of replyFiles) {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/v1/support/upload', { method: 'POST', body: fd })
        if (upRes.ok) {
          const upData = await upRes.json() as { path?: string; name?: string; mime?: string; size?: number }
          if (upData.path) {
            uploadedAttachments.push({
              path: upData.path,
              name: upData.name,
              mime: upData.mime,
              size: upData.size,
            })
          }
        } else {
          setError(`Failed to upload "${file.name}". Please try again.`)
          setSending(false)
          return
        }
      }

      const res = await fetch(`/api/v1/support/tickets/${ticket.id}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply, attachments: uploadedAttachments }),
      })
      const data = await res.json() as { message?: SupportMessage; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to send reply'); return }
      setThread(prev => [...prev, data.message!])
      setReply('')
      setReplyFiles([])
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
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.02em' }}>
              {ticketNumber(currentTicket.id)}
            </div>
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
            <a
              href={`/admin/user360?org_id=${currentTicket.org_id}`}
              className="btn btn-secondary support-thread-360-btn"
              title="Open Customer 360"
            >
              <span>&#128100;</span>
              {currentTicket.org_name ? currentTicket.org_name : 'Customer'}
              <span className="support-customer360-badge">360</span>
            </a>
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
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="support-attachments">
                {msg.attachments.map(att => {
                  const url   = att.signed_url
                  const label = attachmentDisplayName(att.path, att.name)
                  const isImg = (att.mime ?? '').startsWith('image/')
                  if (!url) {
                    return (
                      <div key={att.path} className="support-attachment-row support-attachment-broken">
                        📎 {label} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(link expired — refresh page)</span>
                      </div>
                    )
                  }
                  if (isImg) {
                    return (
                      <a key={att.path} href={url} target="_blank" rel="noopener noreferrer" className="support-attachment-image" title={label}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={label} loading="lazy" />
                      </a>
                    )
                  }
                  return (
                    <a key={att.path} href={url} target="_blank" rel="noopener noreferrer" className="support-attachment-row">
                      <span>📎 {label}</span>
                      {att.size != null && <span className="support-attachment-size">{formatBytes(att.size)}</span>}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply form */}
      {!isClosed && (
        <div className="card support-reply-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="form-label" style={{ margin: 0 }}>
              {isAdmin ? 'Reply to user' : 'Add a reply'}
            </label>
            {isAdmin && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={handleDraftWithAI}
                disabled={draftLoading}
                title="Generate an AI draft response based on ticket history and help docs"
              >
                {draftLoading ? '✨ Drafting...' : '✨ Draft with AI'}
              </button>
            )}
          </div>
          <textarea
            className="form-input support-textarea"
            placeholder={isAdmin ? 'Write your reply...' : 'Write your reply or provide more information...'}
            value={reply} onChange={e => setReply(e.target.value)}
            rows={4}
            disabled={sending}
          />
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Attach files <span style={{ fontWeight: 400 }}>(optional — max 5MB each)</span>
            </label>
            <input
              type="file" multiple accept="image/*,.pdf,.txt,.log,.csv,.zip"
              className="form-input"
              style={{ paddingTop: 8, paddingBottom: 8, cursor: 'pointer', fontSize: 13 }}
              onChange={e => setReplyFiles(Array.from(e.target.files ?? []))}
            />
            {replyFiles.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                {replyFiles.map(f => f.name).join(', ')}
              </div>
            )}
          </div>
          {error && <p className="form-error" style={{ marginTop: 6 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
