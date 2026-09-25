import { redirect } from 'next/navigation'
import type { User } from '@/lib/types'

/**
 * Call at the top of every dashboard page.tsx right after the existing
 * `getCurrentUser()` / `redirect('/login')` check, passing the just-fetched
 * user and that page's own sidebar href. Redirects to /dashboard if a
 * restricted member tries to reach a tab they weren't granted — enforced
 * server-side so it can't be bypassed by typing the URL directly, unlike
 * hiding the sidebar link alone (see components/dashboard/sidebar.tsx for
 * the matching client-side hide).
 *
 * Note: users.role's actual CHECK constraint only permits
 * 'admin' | 'manager' | 'viewer' | 'client' (migration 00002_core_tenancy.sql)
 * — there is no 'member' or 'owner' value in the live schema, despite that
 * vocabulary appearing in team-invite/UI code. 'viewer' is the role a
 * non-admin team member actually has; that's what's restrictable here.
 * Admins/managers/clients, and viewers whose tab_access is left null
 * (unrestricted), always pass.
 */
export function requireTabAccess(user: User, href: string): void {
  const tabAccess = (user as unknown as { tab_access?: string[] | null }).tab_access ?? null
  if (user.role !== 'viewer' || !Array.isArray(tabAccess)) return
  if (!tabAccess.includes(href)) {
    redirect('/dashboard')
  }
}
