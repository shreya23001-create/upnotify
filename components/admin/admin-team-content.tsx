'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { AdminRole } from '@/lib/types'
import { addAdminAction, updateAdminAction } from '@/app/(admin)/admin/team/actions'

interface AdminTeamContentProps {
  adminRoles: AdminRole[]
  currentUserEmail: string
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  viewer: 'Viewer',
}

const ROLE_BADGE_CLASSES: Record<string, string> = {
  super_admin: 'badge badge-danger',
  admin: 'badge badge-default',
  viewer: 'badge badge-outline',
}

export function AdminTeamContent({ adminRoles, currentUserEmail }: AdminTeamContentProps): React.ReactElement {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleAdd = useCallback((formData: FormData): void => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await addAdminAction(formData)
      if (result.success) {
        setSuccess('Admin user added successfully.')
        setShowAddForm(false)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to add admin.')
      }
    })
  }, [router])

  const handleToggleActive = useCallback((adminRole: AdminRole): void => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', adminRole.id)
      formData.set('is_active', String(!adminRole.is_active))
      formData.set('role', adminRole.role)

      const result = await updateAdminAction(formData)
      if (result.success) {
        setSuccess(`Admin ${adminRole.is_active ? 'deactivated' : 'activated'} successfully.`)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to update admin.')
      }
    })
  }, [router])

  const handleRoleChange = useCallback((adminRole: AdminRole, newRole: string): void => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', adminRole.id)
      formData.set('role', newRole)
      formData.set('is_active', String(adminRole.is_active))

      const result = await updateAdminAction(formData)
      if (result.success) {
        setSuccess('Role updated successfully.')
        setEditingId(null)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to update role.')
      }
    })
  }, [router])

  const columns: Column<AdminRole>[] = [
    {
      key: 'email',
      label: 'Email',
      render: (r: AdminRole) => (
        <div>
          <span style={{ fontWeight: 600 }}>{r.email}</span>
          {r.email.toLowerCase() === currentUserEmail.toLowerCase() && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#a1a1aa' }}>(you)</span>
          )}
          {r.display_name && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.display_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (r: AdminRole) => {
        if (editingId === r.id && r.role !== 'super_admin') {
          return (
            <select
              className="form-select"
              defaultValue={r.role}
              onChange={(e) => handleRoleChange(r, e.target.value)}
              disabled={isPending}
              style={{ fontSize: 13, padding: '4px 8px', width: 'auto', minWidth: 120 }}
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          )
        }
        return (
          <span className={ROLE_BADGE_CLASSES[r.role] ?? 'badge badge-outline'}>
            {ROLE_LABELS[r.role] ?? r.role}
          </span>
        )
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (r: AdminRole) => (
        <span className={`badge ${r.is_active ? 'badge-success' : 'badge-outline'}`}>
          {r.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Added',
      render: (r: AdminRole) => (
        <span className="table-muted">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      searchable: false,
      sortable: false,
      render: (r: AdminRole) => {
        // Cannot modify super admin
        if (r.role === 'super_admin') return null
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setEditingId(editingId === r.id ? null : r.id)}
              disabled={isPending}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              {editingId === r.id ? 'Cancel' : 'Edit Role'}
            </button>
            <button
              className={`btn btn-sm ${r.is_active ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => handleToggleActive(r)}
              disabled={isPending}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              {r.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )
      },
    },
  ]

  const roleFilters = [
    {
      key: 'role',
      label: 'All Roles',
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    {
      key: 'is_active',
      label: 'All Status',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ]

  return (
    <div>
      {error && (
        <div className="logo-upload-error" style={{ marginBottom: 16 }}>{error}</div>
      )}
      {success && (
        <div className="logo-upload-success" style={{ marginBottom: 16 }}>{success}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowAddForm(!showAddForm)
            setError(null)
            setSuccess(null)
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Admin'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Add New Admin</div>
          </div>
          <div className="card-content">
            <form action={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-email">Gmail Address</label>
                  <input
                    className="form-input"
                    id="admin-email"
                    name="email"
                    type="email"
                    placeholder="name@gmail.com"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-name">Display Name</label>
                  <input
                    className="form-input"
                    id="admin-name"
                    name="display_name"
                    placeholder="John Doe"
                    disabled={isPending}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-role">Role</label>
                  <select
                    className="form-select"
                    id="admin-role"
                    name="role"
                    defaultValue="viewer"
                    disabled={isPending}
                  >
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 12px' }}>
                The admin must log in with Google OAuth using this Gmail address. Only super admins can manage other admins.
              </p>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
                {isPending ? 'Adding...' : 'Add Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={adminRoles}
        searchPlaceholder="Search admin users..."
        filters={roleFilters}
        emptyMessage="No admin users configured."
      />
    </div>
  )
}
