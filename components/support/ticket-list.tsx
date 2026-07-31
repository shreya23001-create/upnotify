'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SupportTicket, TicketCategory, TicketPriority } from '@/lib/db/support'
import { CustomSelect } from '@/components/ui/custom-select'

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

const CATEGORY_OPTIONS = [
  { value: 'general',         label: 'General',         icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { value: 'billing',         label: 'Billing',         icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { value: 'technical',       label: 'Technical',       icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { value: 'feature_request', label: 'Feature Request', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { value: 'bug',             label: 'Bug Report',      icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 2l1.5 1.5"/><path d="M14.5 3.5L16 2"/><path d="M9 7a4 4 0 0 1 6 0v1a6 6 0 0 1-6 0V7z"/><path d="M3 13h2m14 0h2"/><path d="M5 9l1.5 1.5M17.5 10.5 19 9"/><path d="M5 19l1.5-1.5M17.5 17.5 19 19"/><path d="M9 21a6 6 0 0 1 0-12h6a6 6 0 0 1 0 12H9z"/></svg> },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="#94a3b8"><circle cx="12" cy="12" r="6"/></svg> },
  { value: 'normal', label: 'Normal', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="#3b82f6"><circle cx="12" cy="12" r="6"/></svg> },
  { value: 'high',   label: 'High',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="#f97316"><circle cx="12" cy="12" r="6"/></svg> },
  { value: 'urgent', label: 'Urgent', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444"><circle cx="12" cy="12" r="6"/></svg> },
]

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
  const [showForm,  setShowForm]  = useState(false)
  const [subject,   setSubject]   = useState('')
  const [category,  setCategory]  = useState<TicketCategory>('general')
  const [priority,  setPriority]  = useState<TicketPriority>('normal')
  const [message,   setMessage]   = useState('')
  const [files,     setFiles]     = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [subjectError, setSubjectError] = useState('')
  const [items, setItems] = useState<SupportTicket[]>(tickets)

  async function handleSubmit(): Promise<void> {
    setSubjectError('')
    setError('')

    if (!subject.trim()) { setSubjectError('Subject is required'); return }
    if (!message.trim())  { setError('Message is required'); return }

    setSubmitting(true)
    try {
      const uploadedAttachments: Array<{ path: string; name?: string; mime?: string; size?: number }> = []
      for (const file of files) {
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
          setSubmitting(false)
          return
        }
      }

      const res = await fetch('/api/v1/support/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, priority, message, attachments: uploadedAttachments }),
      })
      const data = await res.json() as { ticket?: SupportTicket; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to create ticket'); return }

      setItems(prev => [data.ticket!, ...prev])
      setSubject(''); setMessage(''); setFiles([]); setSubjectError(''); setShowForm(false)
      router.push(`/dashboard/support/${data.ticket!.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="support-list-header">
        <div>
          <h2 className="support-list-title">Support Tickets</h2>
          <p className="support-list-sub">Ask a question, report a bug, or request a feature.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          + New Ticket
        </button>
      </div>

      {showForm && (
        <div className="stf-wrap">
          <div className="stf-accent" />
          <div className="stf-body">

            <div className="stf-header">
              <div className="stf-header-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <div className="stf-header-title">New Support Ticket</div>
                <div className="stf-header-sub">We typically reply within a few hours.</div>
              </div>
              <button className="stf-close" aria-label="Close" onClick={() => { setShowForm(false); setError(''); setSubjectError(''); setFiles([]) }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="stf-section">
              <div className="stf-field stf-field-full">
                <label className="stf-label">Subject <span className="stf-required">*</span></label>
                <input
                  type="text"
                  className={`form-input${subjectError ? ' form-input-error' : ''}`}
                  placeholder="Brief summary of your issue"
                  value={subject}
                  onChange={e => { setSubject(e.target.value); if (subjectError) setSubjectError('') }}
                />
                {subjectError && <p className="stf-field-error">{subjectError}</p>}
              </div>

              <div className="stf-row">
                <div className="stf-field">
                  <label className="stf-label">Category</label>
                  <CustomSelect options={CATEGORY_OPTIONS} value={category} onChange={v => setCategory(v as TicketCategory)} disabled={submitting} />
                </div>
                <div className="stf-field">
                  <label className="stf-label">Priority</label>
                  <CustomSelect options={PRIORITY_OPTIONS} value={priority} onChange={v => setPriority(v as TicketPriority)} disabled={submitting} />
                </div>
              </div>

              <div className="stf-field stf-field-full">
                <label className="stf-label">Message <span className="stf-required">*</span></label>
                <textarea
                  className="form-input stf-textarea"
                  placeholder="Describe your issue in detail. Include steps to reproduce if it's a bug."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="stf-field stf-field-full">
                <label className="stf-label">
                  Attachments
                  <span className="stf-label-hint">optional · max 5 MB each · images, PDF, logs, CSV, ZIP</span>
                </label>
                <label className="stf-dropzone">
                  <input
                    type="file" multiple accept="image/*,.pdf,.txt,.log,.csv,.zip"
                    className="stf-file-hidden"
                    onChange={e => setFiles(Array.from(e.target.files ?? []))}
                  />
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {files.length === 0
                    ? <span>Click to upload or drag files here</span>
                    : <span className="stf-file-list">{files.map(f => f.name).join(' · ')}</span>
                  }
                </label>
              </div>
            </div>

            {error && <p className="stf-error">{error}</p>}

            <div className="stf-actions">
              <button className="btn btn-primary stf-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <><span className="stf-spinner" /> Submitting…</>
                  : <>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      Submit Ticket
                    </>
                }
              </button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setError(''); setSubjectError(''); setFiles([]) }}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="card support-empty">
          <p className="support-empty-title">No tickets yet</p>
          <p className="support-empty-sub">
            Have a question or issue? Click &ldquo;New Ticket&rdquo; above and we&apos;ll get back to you.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="support-ticket-list">
          {items.map(ticket => (
            <a key={ticket.id} href={`/dashboard/support/${ticket.id}`} className="card support-ticket-row">
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
