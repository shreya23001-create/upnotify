'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { User, Organisation } from '@/lib/types'

interface AdminUsersContentProps {
  users: User[]
  organisations: Organisation[]
}

export function AdminUsersContent({ users, organisations }: AdminUsersContentProps): React.ReactElement {
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const router = useRouter()

  const orgMap = useMemo(
    () => new Map(organisations.map((o) => [o.id, o.name])),
    [organisations],
  )

  const handleImpersonate = useCallback(async (userId: string): Promise<void> => {
    setImpersonatingId(userId)
    try {
      const response = await fetch('/api/v1/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        router.push('/dashboard')
      }
    } catch {
      setImpersonatingId(null)
    }
  }, [router])

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      label: 'Name',
      render: (u) => <span style={{ fontWeight: 500 }}>{u.full_name ?? '---'}</span>,
    },
    { key: 'email', label: 'Email' },
    {
      key: 'org_id',
      label: 'Organisation',
      searchable: false,
      render: (u) => <span>{orgMap.get(u.org_id) ?? '---'}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (u) => (
        <span>
          <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>{u.role}</span>
          {u.is_super_admin && <span className="badge badge-danger" style={{ marginLeft: 4 }}>Admin</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      searchable: false,
      sortable: false,
      render: (u) => (
        u.is_super_admin ? null : (
          <button
            className="btn btn-sm btn-outline"
            onClick={() => handleImpersonate(u.id)}
            disabled={impersonatingId === u.id}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {impersonatingId === u.id ? 'Loading...' : 'Impersonate'}
          </button>
        )
      ),
    },
  ]

  const filters = [
    {
      key: 'role',
      label: 'All Roles',
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Admin', value: 'admin' },
        { label: 'Member', value: 'member' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      searchPlaceholder="Search users by email or name..."
      filters={filters}
      pageSize={50}
      emptyMessage="No users found."
    />
  )
}
