import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { AdminRole } from '@/lib/types'
import type { Json } from '@/lib/types/database.types'

/** Permission structure for admin roles */
export interface AdminPermissions {
  users: { read: boolean; write: boolean }
  organisations: { read: boolean; write: boolean }
  plans: { read: boolean; write: boolean }
  tracker: { read: boolean; write: boolean }
  feature_flags: { read: boolean; write: boolean }
  blog: { read: boolean; write: boolean }
  aoe: { read: boolean; write: boolean }
  audit_log: { read: boolean; write: boolean }
  support: { read: boolean; write: boolean }
  system: { read: boolean; write: boolean }
  user360: { read: boolean; write: boolean }
  impersonate: boolean
}

/** Default permissions per role */
const ROLE_DEFAULTS: Record<string, AdminPermissions> = {
  super_admin: {
    users:        { read: true, write: true },
    organisations:{ read: true, write: true },
    plans:        { read: true, write: true },
    tracker:      { read: true, write: true },
    feature_flags:{ read: true, write: true },
    blog:         { read: true, write: true },
    aoe:          { read: true, write: true },
    audit_log:    { read: true, write: true },
    support:      { read: true, write: true },
    system:       { read: true, write: true },
    user360:      { read: true, write: true },
    impersonate: true,
  },
  admin: {
    users:        { read: true, write: true },
    organisations:{ read: true, write: true },
    plans:        { read: true, write: true },
    tracker:      { read: true, write: true },
    feature_flags:{ read: true, write: false },
    blog:         { read: true, write: true },
    aoe:          { read: true, write: false },
    audit_log:    { read: true, write: false },
    support:      { read: true, write: true },
    system:       { read: true, write: false },
    user360:      { read: true, write: false },
    impersonate: true,
  },
  viewer: {
    users:        { read: true, write: false },
    organisations:{ read: true, write: false },
    plans:        { read: true, write: false },
    tracker:      { read: true, write: false },
    feature_flags:{ read: true, write: false },
    blog:         { read: true, write: false },
    aoe:          { read: true, write: false },
    audit_log:    { read: true, write: false },
    support:      { read: true, write: false },
    system:       { read: true, write: false },
    user360:      { read: true, write: false },
    impersonate: false,
  },
}

export function getDefaultPermissions(role: string): AdminPermissions {
  return ROLE_DEFAULTS[role] ?? ROLE_DEFAULTS.viewer
}

export function parsePermissions(json: Json): AdminPermissions {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>
    return {
      users:         parseModulePermission(obj.users),
      organisations: parseModulePermission(obj.organisations),
      plans:         parseModulePermission(obj.plans),
      tracker:       parseModulePermission(obj.tracker),
      feature_flags: parseModulePermission(obj.feature_flags),
      blog:          parseModulePermission(obj.blog),
      aoe:           parseModulePermission(obj.aoe),
      audit_log:     parseModulePermission(obj.audit_log),
      support:       parseModulePermission(obj.support),
      system:        parseModulePermission(obj.system),
      user360:       parseModulePermission(obj.user360),
      impersonate:   Boolean(obj.impersonate),
    }
  }
  return getDefaultPermissions('viewer')
}

/** Check if an admin role has read access to a module. Super admins always pass. */
export function hasPermission(
  permissions: AdminPermissions,
  module: keyof Omit<AdminPermissions, 'impersonate'>,
  access: 'read' | 'write' = 'read'
): boolean {
  const mod = permissions[module]
  if (typeof mod === 'object') return mod[access]
  return false
}

function parseModulePermission(val: unknown): { read: boolean; write: boolean } {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>
    return { read: Boolean(obj.read), write: Boolean(obj.write) }
  }
  return { read: false, write: false }
}

export async function getAllAdminRoles(): Promise<AdminRole[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('admin_roles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to get admin roles', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getAdminRoleByEmail(email: string): Promise<AdminRole | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('admin_roles')
    .select('*')
    .ilike('email', email)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.error('Failed to get admin role by email', { error: error.message })
    }
    return null
  }
  return data
}

export async function createAdminRole(
  email: string,
  role: string,
  displayName: string | null,
  addedBy: string | null
): Promise<AdminRole | null> {
  const supabase = createAdminClient()
  const permissions = getDefaultPermissions(role)

  const { data, error } = await supabase
    .from('admin_roles')
    .insert({
      email: email.toLowerCase().trim(),
      role,
      display_name: displayName,
      permissions: permissions as unknown as Json,
      is_active: true,
      added_by: addedBy,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create admin role', { error: error.message })
    return null
  }
  return data
}

export async function updateAdminRole(
  id: string,
  updates: {
    role?: string
    display_name?: string | null
    permissions?: AdminPermissions
    is_active?: boolean
  }
): Promise<AdminRole | null> {
  const supabase = createAdminClient()

  const updatePayload: Record<string, unknown> = {}
  if (updates.role !== undefined) updatePayload.role = updates.role
  if (updates.display_name !== undefined) updatePayload.display_name = updates.display_name
  if (updates.permissions !== undefined) updatePayload.permissions = updates.permissions
  if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active

  // If role changed, also update default permissions
  if (updates.role && !updates.permissions) {
    updatePayload.permissions = getDefaultPermissions(updates.role)
  }

  const { data, error } = await supabase
    .from('admin_roles')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update admin role', { error: error.message })
    return null
  }
  return data
}

export async function deleteAdminRole(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('admin_roles')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete admin role', { error: error.message })
    return false
  }
  return true
}

/**
 * Server-side guard for admin pages.
 * Super admins always pass. Sub-admins must have read access to the module.
 * Returns true if access is granted, false otherwise.
 */
export async function canAccessAdminModule(
  email: string,
  isSuperAdmin: boolean,
  module: keyof Omit<AdminPermissions, 'impersonate'>
): Promise<boolean> {
  if (isSuperAdmin) return true
  const role = await getAdminRoleByEmail(email)
  if (!role || !role.is_active) return false
  const perms = parsePermissions(role.permissions as Json)
  return hasPermission(perms, module, 'read')
}

/** Check if an email has any admin access (active role in admin_roles table) */
export async function isAdminEmail(email: string): Promise<boolean> {
  const role = await getAdminRoleByEmail(email)
  if (!role) return false
  return role.is_active
}
