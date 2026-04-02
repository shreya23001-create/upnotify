'use server'

import { getCurrentUser } from '@/lib/db/users'
import {
  createAdminRole,
  updateAdminRole,
  getAdminRoleByEmail,
} from '@/lib/db/admin-roles'
import { logger } from '@/lib/utils/logger'

interface ActionResult {
  success: boolean
  error?: string
}

export async function addAdminAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user?.is_super_admin) {
      return { success: false, error: 'Only super admins can add admin users.' }
    }

    const email = (formData.get('email') as string)?.toLowerCase().trim()
    const role = (formData.get('role') as string) || 'viewer'
    const displayName = (formData.get('display_name') as string) || null

    if (!email) {
      return { success: false, error: 'Email is required.' }
    }

    // Validate email is Gmail
    if (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com')) {
      return { success: false, error: 'Admin users must use a Gmail address for OAuth login.' }
    }

    if (!['super_admin', 'admin', 'viewer'].includes(role)) {
      return { success: false, error: 'Invalid role.' }
    }

    // Check if already exists
    const existing = await getAdminRoleByEmail(email)
    if (existing) {
      return { success: false, error: 'This email already has an admin role.' }
    }

    const created = await createAdminRole(email, role, displayName, user.id)
    if (!created) {
      return { success: false, error: 'Failed to create admin role.' }
    }

    logger.info('Admin role created', { email, role, addedBy: user.id })
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

export async function updateAdminAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user?.is_super_admin) {
      return { success: false, error: 'Only super admins can update admin roles.' }
    }

    const id = formData.get('id') as string
    const role = formData.get('role') as string
    const isActive = formData.get('is_active') === 'true'

    if (!id) {
      return { success: false, error: 'Admin ID is required.' }
    }

    if (role && !['super_admin', 'admin', 'viewer'].includes(role)) {
      return { success: false, error: 'Invalid role.' }
    }

    // Parse permissions if provided
    const permissionsRaw = formData.get('permissions') as string | null
    const permissions = permissionsRaw ? JSON.parse(permissionsRaw) : undefined

    const updated = await updateAdminRole(id, {
      ...(role ? { role } : {}),
      is_active: isActive,
      ...(permissions ? { permissions } : {}),
    })

    if (!updated) {
      return { success: false, error: 'Failed to update admin role.' }
    }

    logger.info('Admin role updated', { id, role, isActive, updatedBy: user.id })
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred.' }
  }
}
