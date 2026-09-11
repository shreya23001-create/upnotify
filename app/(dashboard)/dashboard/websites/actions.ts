'use server'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { addPendingWebsites } from '@/lib/db/subscriptions'
import { targetToWebsiteDomain } from '@/lib/utils/validate-domain'
import { devAuditLog } from '@/lib/db/audit'
import { impersonationGuard } from '@/lib/auth/impersonation-guard'

/**
 * Adds one or more websites as pending (unpaid) entries, then sends the
 * user to the Plans page to select which ones to subscribe to and pay.
 */
export async function addWebsitesAction(formData: FormData): Promise<{ error?: string }> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) return { error: guard.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const rawTargets = formData.getAll('target') as string[]
  const domains = Array.from(new Set(
    rawTargets.map(t => targetToWebsiteDomain(t.trim())).filter(Boolean)
  ))

  if (domains.length === 0) {
    return { error: 'Enter at least one valid website (e.g. example.com)' }
  }

  const result = await addPendingWebsites(user.org_id, domains)

  if (result.added === 0) {
    return { error: 'All of those websites have already been added.' }
  }

  await devAuditLog({
    orgId: user.org_id,
    userId: user.id,
    action: 'website.added_pending',
    metadata: { added: result.added, skipped: result.skipped },
  })

  redirect('/dashboard/plans')
}
