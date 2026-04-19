'use client'

import { useState, useMemo } from 'react'

type Monitor = {
  id: string
  name: string
  target: string
  status: string
  type: string
  check_interval_seconds: number
  is_paused: boolean
  created_at: string
}

type DomainGroup = {
  domain: string
  monitors: Monitor[]
  upCount: number
  downCount: number
  pausedCount: number
}

const DOMAINS_PER_PAGE = 10
const MONITORS_PER_PAGE = 15

function extractDomain(target: string): string {
  try {
    const url = target.startsWith('http') ? new URL(target) : new URL(`https://${target}`)
    return url.hostname
  } catch {
    return target
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${seconds / 60}m`
}

function StatusBadge({ status, isPaused }: { status: string; isPaused: boolean }) {
  if (isPaused) return <span className="badge badge-neutral" style={{ fontSize: 10 }}>paused</span>
  if (status === 'up') return <span className="badge badge-success" style={{ fontSize: 10 }}>up</span>
  if (status === 'down') return <span className="badge badge-danger" style={{ fontSize: 10 }}>down</span>
  return <span className="badge badge-neutral" style={{ fontSize: 10 }}>{status}</span>
}

function MonitorTable({ monitors }: { monitors: Monitor[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(monitors.length / MONITORS_PER_PAGE)
  const slice = monitors.slice(page * MONITORS_PER_PAGE, (page + 1) * MONITORS_PER_PAGE)

  return (
    <div style={{ marginTop: 12 }}>
      <table className="table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Interval</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {slice.map(m => (
            <tr key={m.id}>
              <td style={{ fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</td>
              <td style={{ color: 'var(--text-muted)' }}>{m.type}</td>
              <td style={{ color: 'var(--text-muted)' }}>{fmtInterval(m.check_interval_seconds)}</td>
              <td><StatusBadge status={m.status} isPaused={m.is_paused} /></td>
              <td style={{ color: 'var(--text-muted)' }}>{fmtDate(m.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ padding: '3px 10px', fontSize: 12, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-card)' }}
          >←</button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{ padding: '3px 10px', fontSize: 12, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-card)' }}
          >→</button>
        </div>
      )}
    </div>
  )
}

function DomainCard({ group }: { group: DomainGroup }) {
  const [open, setOpen] = useState(false)
  const hasDown = group.downCount > 0

  return (
    <div
      style={{
        border: `1px solid ${hasDown ? 'var(--color-danger, #ef4444)' : 'var(--border)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--bg-card)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.domain}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
            {group.monitors.length} monitor{group.monitors.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {group.upCount > 0 && (
            <span className="badge badge-success" style={{ fontSize: 11 }}>{group.upCount} up</span>
          )}
          {group.downCount > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 11 }}>{group.downCount} down</span>
          )}
          {group.pausedCount > 0 && (
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>{group.pausedCount} paused</span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <MonitorTable monitors={group.monitors} />
        </div>
      )}
    </div>
  )
}

export function MonitorDomainCards({ monitors }: { monitors: Monitor[] }) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const groups = useMemo<DomainGroup[]>(() => {
    const map = new Map<string, Monitor[]>()
    for (const m of monitors) {
      const domain = extractDomain(m.target)
      if (!map.has(domain)) map.set(domain, [])
      map.get(domain)!.push(m)
    }
    return Array.from(map.entries()).map(([domain, mons]) => ({
      domain,
      monitors: mons,
      upCount: mons.filter(m => !m.is_paused && m.status === 'up').length,
      downCount: mons.filter(m => !m.is_paused && m.status === 'down').length,
      pausedCount: mons.filter(m => m.is_paused).length,
    })).sort((a, b) => b.monitors.length - a.monitors.length)
  }, [monitors])

  const filtered = useMemo(() =>
    search.trim()
      ? groups.filter(g => g.domain.toLowerCase().includes(search.toLowerCase()))
      : groups,
    [groups, search]
  )

  const totalPages = Math.ceil(filtered.length / DOMAINS_PER_PAGE)
  const pageGroups = filtered.slice(page * DOMAINS_PER_PAGE, (page + 1) * DOMAINS_PER_PAGE)

  function handleSearch(val: string) {
    setSearch(val)
    setPage(0)
  }

  if (monitors.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No monitors set up.</p>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} domain{filtered.length !== 1 ? 's' : ''} · {monitors.length} monitors total
        </span>
        <input
          type="search"
          placeholder="Filter domains…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ padding: '5px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card)', color: 'var(--text)', width: 200 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pageGroups.map(group => (
          <DomainCard key={group.domain} group={group} />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '4px 12px', fontSize: 12, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card)' }}
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ padding: '4px 12px', fontSize: 12, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card)' }}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
