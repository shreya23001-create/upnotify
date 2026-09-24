'use client'

import { useMemo, useState } from 'react'
import type { User } from '@/lib/types'

interface Props {
  members: User[]
  currentUserId: string
  canManageTeam: boolean
  onRemove: (userId: string) => void
}

type SortKey = 'full_name' | 'role' | 'created_at'

const ROLE_CHIP_CLASS: Record<string, string> = {
  owner: 'stt-role-chip--owner',
  admin: 'stt-role-chip--admin',
  editor: 'stt-role-chip--editor',
  member: 'stt-role-chip--member',
  viewer: 'stt-role-chip--viewer',
}

function getInitials(name: string | null, email: string): string {
  const source = (name ?? '').trim()
  if (source) {
    const parts = source.split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function formatJoined(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function TeamMembersTable({ members, currentUserId, canManageTeam, onRemove }: Props): React.ReactElement {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('full_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = members
    if (q) {
      result = result.filter(m =>
        (m.full_name ?? '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      )
    }
    return [...result].sort((a, b) => {
      const aVal = String(a[sortKey] ?? '')
      const bVal = String(b[sortKey] ?? '')
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [members, search, sortKey, sortDir])

  const sortArrow = (key: SortKey): string => sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'

  return (
    <div>
      <input
        className="stt-member-search"
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="stt-member-table-wrap">
        <table className="stt-member-table">
          <thead>
            <tr>
              <th className="stt-member-th-sortable" onClick={() => toggleSort('full_name')}>
                Name <span className="stt-member-sort-icon">{sortArrow('full_name')}</span>
              </th>
              <th>Email</th>
              <th className="stt-member-th-sortable" onClick={() => toggleSort('role')}>
                Role <span className="stt-member-sort-icon">{sortArrow('role')}</span>
              </th>
              <th className="stt-member-th-sortable" onClick={() => toggleSort('created_at')}>
                Joined <span className="stt-member-sort-icon">{sortArrow('created_at')}</span>
              </th>
              {canManageTeam && <th className="stt-member-th-actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={canManageTeam ? 5 : 4} className="stt-member-empty">No members match your search.</td>
              </tr>
            )}
            {rows.map(m => (
              <tr key={m.id}>
                <td>
                  <div className="stt-member-identity">
                    <span className="stt-member-avatar">{getInitials(m.full_name, m.email)}</span>
                    <span className="stt-member-name">
                      {m.full_name ?? '—'}
                      {m.id === currentUserId && <span className="stt-member-you">(you)</span>}
                    </span>
                  </div>
                </td>
                <td><span className="stt-member-email">{m.email}</span></td>
                <td>
                  <span className={`stt-role-chip ${ROLE_CHIP_CLASS[m.role] ?? 'stt-role-chip--member'}`}>
                    {m.role}
                  </span>
                </td>
                <td><span className="stt-member-joined">{formatJoined(m.created_at)}</span></td>
                {canManageTeam && (
                  <td className="stt-member-actions-cell">
                    {m.id !== currentUserId && m.role !== 'owner' && (
                      <button className="stt-member-remove-btn" onClick={() => onRemove(m.id)}>Remove</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
