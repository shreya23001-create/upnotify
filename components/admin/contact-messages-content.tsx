'use client'

import { useState, useEffect, useCallback } from 'react'

type Tab = 'inbox' | 'spam' | 'all'
type Sort = 'newest' | 'oldest'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'pending_verification' | 'verified' | 'read'
  verified_at: string | null
  is_read: boolean
  ip_address: string | null
  created_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ msg }: { msg: ContactMessage }) {
  if (msg.status === 'pending_verification') return <span className="badge badge-neutral" style={{ fontSize: 10 }}>unverified</span>
  if (msg.status === 'verified') return <span className="badge badge-success" style={{ fontSize: 10 }}>new</span>
  return <span className="badge badge-neutral" style={{ fontSize: 10 }}>read</span>
}

export function ContactMessagesContent() {
  const [tab, setTab]         = useState<Tab>('inbox')
  const [sort, setSort]       = useState<Sort>('newest')
  const [page, setPage]       = useState(0)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [total, setTotal]     = useState(0)
  const [unread, setUnread]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [acting, setActing]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const PER_PAGE = 25

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/contact?tab=${tab}&sort=${sort}&page=${page}`)
    if (res.ok) {
      const d = await res.json() as { messages: ContactMessage[]; total: number; unread: number }
      setMessages(d.messages)
      setTotal(d.total)
      setUnread(d.unread)
    }
    setLoading(false)
  }, [tab, sort, page])

  useEffect(() => { void load() }, [load])

  function switchTab(t: Tab) { setTab(t); setPage(0); setSelected(new Set()); setExpanded(null) }

  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleAll() {
    if (selected.size === messages.length) setSelected(new Set())
    else setSelected(new Set(messages.map(m => m.id)))
  }

  async function bulkAction(action: 'mark_read' | 'mark_unread' | 'delete') {
    if (!selected.size) return
    if (action === 'delete' && !deleteConfirm) { setDeleteConfirm(true); return }
    setActing(true)
    setDeleteConfirm(false)
    if (action === 'delete') {
      await fetch('/api/admin/contact', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...selected] }) })
    } else {
      await fetch('/api/admin/contact', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...selected], action }) })
    }
    setSelected(new Set())
    setActing(false)
    void load()
  }

  async function markOneRead(msg: ContactMessage) {
    if (msg.status !== 'verified') return
    await fetch('/api/admin/contact', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [msg.id], action: 'mark_read' }) })
    void load()
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  const TAB_LABELS: Record<Tab, string> = { inbox: 'Inbox', spam: 'Spam', all: 'All' }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['inbox', 'spam', 'all'] as Tab[]).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              style={{ padding: '6px 14px', fontSize: 13, fontWeight: tab === t ? 700 : 400, borderRadius: 6, border: '1px solid var(--border)', background: tab === t ? '#111827' : 'none', color: tab === t ? '#fff' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {TAB_LABELS[t]}
              {t === 'inbox' && unread > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{unread}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={sort} onChange={e => { setSort(e.target.value as Sort); setPage(0) }}
            style={{ padding: '5px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer' }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selected</span>
          <button onClick={() => bulkAction('mark_read')} disabled={acting}
            style={{ padding: '4px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>Mark Read</button>
          <button onClick={() => bulkAction('mark_unread')} disabled={acting}
            style={{ padding: '4px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>Mark Unread</button>
          {deleteConfirm ? (
            <>
              <button onClick={() => bulkAction('delete')} disabled={acting}
                style={{ padding: '4px 10px', fontSize: 12, borderRadius: 5, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Confirm Delete
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                style={{ padding: '4px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => bulkAction('delete')} disabled={acting}
              style={{ padding: '4px 10px', fontSize: 12, borderRadius: 5, border: '1px solid #dc2626', background: 'none', cursor: 'pointer', color: '#dc2626' }}>Delete</button>
          )}
          <button onClick={() => setSelected(new Set())}
            style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0' }}>Loading…</p>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          {tab === 'inbox' ? 'No verified messages yet.' : tab === 'spam' ? 'No unverified messages.' : 'No messages yet.'}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 180px 140px 100px 80px', gap: 0, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div><input type="checkbox" checked={selected.size === messages.length && messages.length > 0} onChange={toggleAll} /></div>
            <div>From</div>
            <div>Subject</div>
            <div>Date</div>
            <div>Status</div>
            <div></div>
          </div>

          {messages.map(msg => {
            const isExpanded = expanded === msg.id
            const isUnread = msg.status === 'verified'
            return (
              <div key={msg.id} style={{ borderBottom: '1px solid var(--border)', background: isUnread ? 'var(--bg)' : 'var(--bg-card)' }}>
                {/* Row */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: '36px 1fr 180px 140px 100px 80px', gap: 0, padding: '10px 12px', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => { setExpanded(isExpanded ? null : msg.id); if (isUnread) markOneRead(msg) }}
                >
                  <div onClick={e => { e.stopPropagation(); toggleSelect(msg.id) }}>
                    <input type="checkbox" checked={selected.has(msg.id)} onChange={() => toggleSelect(msg.id)} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: isUnread ? 700 : 400, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.email}</div>
                  </div>
                  <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{msg.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(msg.created_at)}</div>
                  <div><StatusBadge msg={msg} /></div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</div>
                </div>

                {/* Expanded message */}
                {isExpanded && (
                  <div style={{ padding: '0 12px 16px 48px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ marginTop: 12, padding: 14, background: 'var(--bg)', borderRadius: 6, fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                      {msg.verified_at && <span>Verified: {fmtDate(msg.verified_at)}</span>}
                      {msg.ip_address && <span>IP: {msg.ip_address}</span>}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        style={{ padding: '5px 12px', fontSize: 12, borderRadius: 5, border: 'none', background: '#111827', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                        Reply
                      </a>
                      <button onClick={() => { setSelected(new Set([msg.id])); setDeleteConfirm(false) }}
                        style={{ padding: '5px 12px', fontSize: 12, borderRadius: 5, border: '1px solid #dc2626', background: 'none', color: '#dc2626', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages} · {total} total</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1 }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
