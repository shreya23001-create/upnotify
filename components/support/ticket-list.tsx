'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SupportTicket, TicketCategory, TicketPriority } from '@/lib/db/support'

interface TicketListProps {
  tickets: SupportTicket[]
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

/** Stable human-readable ticket number derived from UUID — no DB column needed */
function ticketNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  const num = parseInt(hex, 16) % 100000
  return `TKT-${num.toString().padStart(5, '0')}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function TicketList({ tickets }: TicketListProps): React.ReactElement {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [subject,  setSubject]  = useState('')
  const [category, setCategory] = useState<TicketCategory>('general')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [message,  setMessage]  = useState('')
  const [files,    setFiles]    = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<SupportTicket[]>(tickets)

  async function handleSubmit(): Promise<void> {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Upload attachments first if any
      const attachmentUrls: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/v1/support/upload', { method: 'POST', body: fd })
        if (upRes.ok) {
          const upData = await upRes.json() as { url?: string }
          if (upData.url) attachmentUrls.push(upData.url)
        }
      }

      const res = await fetch('/api/v1/support/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, priority, message, attachments: attachmentUrls }),
      })
      const data = await res.json() as { ticket?: SupportTicket; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to create ticket'); return }

      setItems(prev => [data.ticket!, ...prev])
      setSubject(''); setMessage(''); setFiles([]); setShowForm(false)
      router.push(`/dashboard/support/${data.ticket!.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="support-list-header">
        <div>
          <h2 className="support-list-title">Support Tickets</h2>
          <p className="support-list-sub">Ask a question, report a bug, or request a feature.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          + New Ticket
        </button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="card support-form-card">
          <h3 style={{ marginBottom: 16 }}>Raise a Support Ticket</h3>
          <div className="support-form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Subject</label>
              <input
                type="text" className="form-input"
                placeholder="Brief summary of your issue"
                value={subject} onChange={e => setSubject(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value as TicketCategory)}>
                <option value="general">General</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug">Bug Report</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={priority} onChange={e => setPriority(e.target.value as TicketPriority)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Message</label>
              <textarea
                className="form-input support-textarea"
                placeholder="Describe your issue in detail..."
                value={message} onChange={e => setMessage(e.target.value)}
                rows={5}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Attachments <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — max 5MB each)</span></label>
              <input
                type="file" multiple accept="image/*,.pdf,.txt,.log,.csv,.zip"
                className="form-input"
                style={{ paddingTop: 8, paddingBottom: 8, cursor: 'pointer' }}
                onChange={e => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  {files.map(f => f.name).join(', ')}
                </div>
              )}
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="support-form-actions">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setError(''); setFiles([]) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="card support-empty">
          <p className="support-empty-title">No tickets yet</p>
          <p className="support-empty-sub">
            Have a question or issue? Click &ldquo;New Ticket&rdquo; above and we&apos;ll get back to you.
          </p>
        </div>
      )}

      {/* Ticket list */}
      {items.length > 0 && (
        <div className="support-ticket-list">
          {items.map(ticket => (
            <a
              key={ticket.id}
              href={`/dashboard/support/${ticket.id}`}
              className="card support-ticket-row"
            >
              <div className="support-ticket-row-main">
                <div className="support-ticket-subject">
                  <span className="support-ticket-number">{ticketNumber(ticket.id)}</span>
                  {ticket.subject}
                </div>
                <div className="support-ticket-meta">
                  <span className={`support-badge ${STATUS_CLASS[ticket.status] ?? ''}`}>
                    {STATUS_LABEL[ticket.status] ?? ticket.status}
                  </span>
                  <span className={`support-priority-dot ${PRIORITY_CLASS[ticket.priority] ?? ''}`} title={ticket.priority} />
                  <span className="support-ticket-category">{ticket.category.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="support-ticket-row-right">
                <span className="support-ticket-msgs">{ticket.message_count} msg{ticket.message_count !== 1 ? 's' : ''}</span>
                <span className="support-ticket-time">{timeAgo(ticket.updated_at)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
