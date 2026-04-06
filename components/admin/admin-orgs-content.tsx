'use client'

import { useState } from 'react'
import type { OrgWithUsers } from '@/lib/db/admin'

interface AdminOrgsContentProps {
  organisations: OrgWithUsers[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function AdminOrgsContent({ organisations }: AdminOrgsContentProps): React.ReactElement {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = organisations.filter(o => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || o.type === typeFilter
    return matchSearch && matchType
  })

  function toggleExpand(id: string): void {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="data-table-toolbar">
        <input
          className="data-table-search"
          placeholder="Search organisations by name or slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="direct">Direct</option>
          <option value="agency">Agency</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
          {filtered.length} org{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Organisation</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Users</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No organisations found.</td></tr>
            )}
            {filtered.map(org => {
              const isOpen = expanded.has(org.id)
              return (
                <>
                  <tr
                    key={org.id}
                    style={{ cursor: org.users.length > 0 ? 'pointer' : 'default' }}
                    onClick={() => org.users.length > 0 && toggleExpand(org.id)}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      {org.users.length > 0 ? (isOpen ? '▾' : '▸') : ''}
                    </td>
                    <td style={{ fontWeight: 600 }}>{org.name}</td>
                    <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{org.slug}</code></td>
                    <td>
                      <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>
                        {org.type ?? 'direct'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{org.users.length}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(org.created_at)}</td>
                  </tr>

                  {isOpen && org.users.map(u => (
                    <tr
                      key={u.id}
                      style={{ background: 'var(--bg-muted)', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); window.location.href = `/admin/user360?email=${encodeURIComponent(u.email)}` }}
                    >
                      <td></td>
                      <td colSpan={2} style={{ paddingLeft: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>👤</span>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{u.full_name ?? '—'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td colSpan={2}>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-neutral'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--accent)' }}>
                        View 360 →
                      </td>
                    </tr>
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
