'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { AdminRole } from '@/lib/types'
import { addAdminAction, updateAdminAction } from '@/app/(admin)/admin/team/actions'

interface AdminPermissions {
  users: { read: boolean; write: boolean }
  organisations: { read: boolean; write: boolean }
  plans: { read: boolean; write: boolean }
  tracker: { read: boolean; write: boolean }
  feature_flags: { read: boolean; write: boolean }
  impersonate: boolean
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  users: { read: true, write: false },
  organisations: { read: true, write: false },
  plans: { read: true, write: false },
  tracker: { read: true, write: false },
  feature_flags: { read: true, write: false },
  impersonate: false,
}

const MODULE_LABELS: Record<string, string> = {
  users: 'Users',
  organisations: 'Organisations',
  plans: 'Plans & Pricing',
  tracker: 'Public Tracker',
  feature_flags: 'Feature Flags',
}

function parsePerms(json: unknown): AdminPermissions {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>
    const result = { ...DEFAULT_PERMISSIONS }
    for (const key of Object.keys(MODULE_LABELS)) {
      const mod = obj[key]
      if (typeof mod === 'object' && mod !== null) {
        const m = mod as Record<string, boolean>
        result[key as keyof Omit<AdminPermissions, 'impersonate'>] = {
          read: Boolean(m.read),
          write: Boolean(m.write),
        }
      }
    }
    result.impersonate = Boolean(obj.impersonate)
    return result
  }
  return DEFAULT_PERMISSIONS
}

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
  const [editPermsId, setEditPermsId] = useState<string | null>(null)
  const [editPerms, setEditPerms] = useState<AdminPermissions>(DEFAULT_PERMISSIONS)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function startEditPermissions(r: AdminRole): void {
    setEditPermsId(r.id)
    setEditPerms(parsePerms(r.permissions))
    setEditingId(null)
  }

  function handlePermToggle(module: string, field: 'read' | 'write'): void {
    setEditPerms(prev => {
      const mod = prev[module as keyof Omit<AdminPermissions, 'impersonate'>]
      if (!mod) return prev
      return { ...prev, [module]: { ...mod, [field]: !mod[field] } }
    })
  }

  function handleImpersonateToggle(): void {
    setEditPerms(prev => ({ ...prev, impersonate: !prev.impersonate }))
  }

  function savePermissions(adminId: string): void {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', adminId)
      formData.set('role', adminRoles.find(r => r.id === adminId)?.role ?? 'viewer')
      formData.set('is_active', String(adminRoles.find(r => r.id === adminId)?.is_active ?? true))
      formData.set('permissions', JSON.stringify(editPerms))
      const result = await updateAdminAction(formData)
      if (result.success) {
        setSuccess('Permissions saved.')
        setEditPermsId(null)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to save permissions.')
      }
    })
  }

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
        if (r.role === 'super_admin') return <span className="table-muted" style={{ fontSize: 12 }}>Full access</span>
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
              className="btn btn-sm btn-secondary"
              onClick={() => startEditPermissions(r)}
              disabled={isPending}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              Permissions
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

      {/* Permissions Editor Panel */}
      {editPermsId && (() => {
        const admin = adminRoles.find(r => r.id === editPermsId)
        if (!admin) return null
        return (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Permissions — {admin.display_name || admin.email}</div>
              <button className="btn btn-sm btn-ghost" onClick={() => setEditPermsId(null)}>Close</button>
            </div>
            <div className="card-content">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Module</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600 }}>Can View</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600 }}>Can Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MODULE_LABELS).map(([key, label]) => {
                    const perm = editPerms[key as keyof Omit<AdminPermissions, 'impersonate'>]
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '8px 12px' }}>{label}</td>
                        <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                          <input
                            type="checkbox"
                            checked={perm?.read ?? false}
                            onChange={() => handlePermToggle(key, 'read')}
                            disabled={isPending}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                          <input
                            type="checkbox"
                            checked={perm?.write ?? false}
                            onChange={() => handlePermToggle(key, 'write')}
                            disabled={isPending}
                          />
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>Impersonate Users</td>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={editPerms.impersonate}
                        onChange={handleImpersonateToggle}
                        disabled={isPending}
                      />
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                        {editPerms.impersonate ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => savePermissions(editPermsId)}
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : 'Save Permissions'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditPermsId(null)}
                  disabled={isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
