'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { User, Organisation, Plan } from '@/lib/types'

interface AdminUsersContentProps {
  users: User[]
  organisations: Organisation[]
  plans: Plan[]
}

function ConfirmAction({ title, message, onConfirm, onCancel, variant }: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  variant: 'danger' | 'warning'
}): React.ReactElement {
  const [countdown, setCountdown] = useState(5)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <div className="popup-overlay" onClick={onCancel}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: variant === 'danger' ? '#dc2626' : '#d97706', marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={processing}>Cancel</button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            disabled={countdown > 0 || processing}
            onClick={() => { setProcessing(true); onConfirm() }}
          >
            {countdown > 0 ? `Wait ${countdown}s...` : processing ? 'Processing...' : 'Yes, proceed'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminUsersContent({ users, organisations, plans }: AdminUsersContentProps): React.ReactElement {
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'deactivate' | 'activate' | 'change_plan'
    userId: string
    userName: string
    planId?: string
    planName?: string
  } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
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

  const executeAction = useCallback(async (): Promise<void> => {
    if (!confirmAction) return
    setMessage(null)

    try {
      if (confirmAction.type === 'delete') {
        const res = await fetch(`/api/admin/users?userId=${confirmAction.userId}`, { method: 'DELETE' })
        const data = await res.json() as { success?: boolean; error?: string }
        if (data.success) {
          setMessage({ type: 'success', text: `${confirmAction.userName} deleted successfully.` })
          router.refresh()
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed to delete' })
        }
      } else if (confirmAction.type === 'deactivate' || confirmAction.type === 'activate') {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: confirmAction.userId, action: confirmAction.type }),
        })
        const data = await res.json() as { success?: boolean; error?: string }
        if (data.success) {
          setMessage({ type: 'success', text: `${confirmAction.userName} ${confirmAction.type}d.` })
          router.refresh()
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed' })
        }
      } else if (confirmAction.type === 'change_plan') {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: confirmAction.userId, action: 'change_plan', planId: confirmAction.planId }),
        })
        const data = await res.json() as { success?: boolean; error?: string }
        if (data.success) {
          setMessage({ type: 'success', text: `${confirmAction.userName} moved to ${confirmAction.planName}.` })
          router.refresh()
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed' })
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setConfirmAction(null)
  }, [confirmAction, router])

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
          {u.is_super_admin && <span className="badge badge-danger" style={{ marginLeft: 4 }}>Super</span>}
          {(u as unknown as Record<string, unknown>).is_active === false && <span className="badge badge-danger" style={{ marginLeft: 4 }}>Inactive</span>}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (u) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('en-GB')}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      searchable: false,
      sortable: false,
      render: (u) => {
        if (u.is_super_admin) return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Super Admin</span>
        const isDeactivated = (u as unknown as Record<string, unknown>).is_active === false
        const userName = u.full_name ?? u.email

        return (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleImpersonate(u.id)}
              disabled={impersonatingId === u.id}
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              {impersonatingId === u.id ? '...' : 'Mimic'}
            </button>

            <select
              className="form-select"
              style={{ fontSize: 11, padding: '4px 8px', width: 'auto', minWidth: 100, color: 'var(--text-secondary)' }}
              defaultValue=""
              onChange={(e) => {
                const action = e.target.value
                if (!action) return
                e.target.value = ''

                if (action === 'deactivate') {
                  setConfirmAction({ type: 'deactivate', userId: u.id, userName })
                } else if (action === 'activate') {
                  setConfirmAction({ type: 'activate', userId: u.id, userName })
                } else if (action === 'delete') {
                  setConfirmAction({ type: 'delete', userId: u.id, userName })
                } else if (action.startsWith('plan:')) {
                  const planId = action.slice(5)
                  const plan = plans.find(p => p.id === planId)
                  setConfirmAction({ type: 'change_plan', userId: u.id, userName, planId, planName: plan?.name ?? 'Unknown' })
                }
              }}
            >
              <option value="">More...</option>
              <optgroup label="Change Plan">
                {plans.filter(p => p.is_visible).map(p => (
                  <option key={p.id} value={`plan:${p.id}`}>{p.name}</option>
                ))}
              </optgroup>
              <optgroup label="Account">
                {isDeactivated
                  ? <option value="activate">Activate</option>
                  : <option value="deactivate">Deactivate</option>
                }
                <option value="delete" style={{ color: '#dc2626' }}>Delete permanently</option>
              </optgroup>
            </select>
          </div>
        )
      },
    },
  ]

  const filters = [
    {
      key: 'role',
      label: 'All Roles',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Member', value: 'member' },
        { label: 'Viewer', value: 'viewer' },
        { label: 'Deactivated', value: 'deactivated' },
      ],
    },
  ]

  const confirmMessages: Record<string, { title: string; message: string; variant: 'danger' | 'warning' }> = {
    delete: {
      title: 'Delete User Permanently',
      message: `Are you absolutely sure you want to delete ${confirmAction?.userName}? This will permanently remove ALL their data including monitors, incidents, check results, subscriptions, and invoices. This action CANNOT be undone.`,
      variant: 'danger',
    },
    deactivate: {
      title: 'Deactivate User',
      message: `This will deactivate ${confirmAction?.userName}. They will not be able to access the dashboard or manage monitors. Their data will be preserved. You can reactivate them later.`,
      variant: 'warning',
    },
    activate: {
      title: 'Reactivate User',
      message: `This will reactivate ${confirmAction?.userName} and restore their admin role. They will regain full access to their dashboard.`,
      variant: 'warning',
    },
    change_plan: {
      title: 'Change User Plan',
      message: `This will move ${confirmAction?.userName} to the ${confirmAction?.planName} plan. This is an admin override — no Stripe payment will be processed. The change takes effect immediately.`,
      variant: 'warning',
    },
  }

  return (
    <>
      {message && (
        <div className={message.type === 'success' ? 'form-success' : 'form-error'} style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users by email or name..."
        filters={filters}
        pageSize={50}
        emptyMessage="No users found."
      />

      {confirmAction && confirmMessages[confirmAction.type] && (
        <ConfirmAction
          title={confirmMessages[confirmAction.type].title}
          message={confirmMessages[confirmAction.type].message}
          variant={confirmMessages[confirmAction.type].variant}
          onConfirm={executeAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}
