'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import type { User } from '@/lib/types'
import { TAB_ACCESS_OPTIONS } from '@/lib/constants/tab-access'

interface Props {
  members: User[]
  currentUserId: string
  canManageTeam: boolean
  onRemove: (userId: string) => void
  onEdit: (member: User) => void
}

type SortKey = 'full_name' | 'role' | 'created_at'

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

function accessSummary(member: User): string {
  if (member.role === 'admin') return 'All tabs'
  const access = (member as unknown as { tab_access?: string[] | null }).tab_access
  if (!Array.isArray(access)) return 'All tabs'
  if (access.length === TAB_ACCESS_OPTIONS.length) return 'All tabs'
  return `${access.length} tab${access.length === 1 ? '' : 's'}`
}

/** Renders the actions dropdown into document.body via a portal, positioned
 *  with `position: fixed` at the trigger button's own coordinates — this is
 *  the only reliable way to escape the Team Members card's `overflow:
 *  hidden` (needed elsewhere for its rounded top accent bar), which was
 *  clipping the menu whenever a row sat near the bottom of the card. */
function MemberMenuPortal({
  anchorRect,
  onEdit,
  onRemove,
  onRequestClose,
}: {
  anchorRect: DOMRect
  onEdit: () => void
  onRemove: () => void
  onRequestClose: () => void
}): React.ReactElement {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onRequestClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onRequestClose])

  const top = anchorRect.bottom + 4
  const left = Math.max(8, anchorRect.right - 130)

  return createPortal(
    <div ref={menuRef} className="stt-member-menu stt-member-menu--portal" style={{ top, left }}>
      <button className="stt-member-menu-item" onClick={onEdit}>Edit</button>
      <button className="stt-member-menu-item stt-member-menu-item--danger" onClick={onRemove}>Remove</button>
    </div>,
    document.body
  )
}

export function TeamMembersTable({ members, currentUserId, canManageTeam, onRemove, onEdit }: Props): React.ReactElement {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('full_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const closeMenu = useCallback((): void => {
    setOpenMenuId(null)
    setAnchorRect(null)
  }, [])

  const handleToggleMenu = useCallback((id: string, e: React.MouseEvent<HTMLButtonElement>): void => {
    if (openMenuId === id) {
      closeMenu()
      return
    }
    setAnchorRect(e.currentTarget.getBoundingClientRect())
    setOpenMenuId(id)
  }, [openMenuId, closeMenu])

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
  const openMember = openMenuId ? rows.find(m => m.id === openMenuId) ?? null : null

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
              <th>Status</th>
              <th>Access</th>
              <th className="stt-member-th-sortable" onClick={() => toggleSort('created_at')}>
                Joined <span className="stt-member-sort-icon">{sortArrow('created_at')}</span>
              </th>
              {canManageTeam && <th className="stt-member-th-actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={canManageTeam ? 7 : 6} className="stt-member-empty">No members match your search.</td>
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
                  <span className={`stt-role-chip ${m.role === 'admin' ? 'stt-role-chip--admin' : 'stt-role-chip--member'}`}>
                    {m.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </td>
                <td>
                  <span className="stt-status-chip stt-status-chip--active">Active</span>
                </td>
                <td><span className="stt-member-access">{accessSummary(m)}</span></td>
                <td><span className="stt-member-joined">{formatJoined(m.created_at)}</span></td>
                {canManageTeam && (
                  <td className="stt-member-actions-cell">
                    {m.id !== currentUserId && (
                      <button
                        className="stt-member-menu-btn"
                        onClick={(e) => handleToggleMenu(m.id, e)}
                        aria-label="Member actions"
                      >
                        <MoreVertical size={15} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openMember && anchorRect && (
        <MemberMenuPortal
          anchorRect={anchorRect}
          onEdit={() => { onEdit(openMember); closeMenu() }}
          onRemove={() => { onRemove(openMember.id); closeMenu() }}
          onRequestClose={closeMenu}
        />
      )}
    </div>
  )
}
