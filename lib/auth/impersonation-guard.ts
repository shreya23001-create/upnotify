import { getImpersonatedUserId } from '@/lib/utils/impersonation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface ImpersonationGuardResult {
  isBlocked: boolean
  error?: string
}

/**
 * Checks if the current request is an impersonation session.
 * If so, blocks mutation actions and returns an error.
 * Call this at the top of every server action that modifies data.
 */
export async function impersonationGuard(): Promise<ImpersonationGuardResult> {
  const impersonatedUserId = await getImpersonatedUserId()

  if (!impersonatedUserId) {
    return { isBlocked: false }
  }

  // Double-check: verify the real user is actually a super admin
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return { isBlocked: true, error: 'Authentication required' }
  }

  const { data: realUser } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('id', authUser.id)
    .single()

  if (!realUser?.is_super_admin) {
    // Cookie exists but user is not admin — suspicious, block anyway
    logger.warn('Impersonation cookie found for non-admin user', { userId: authUser.id })
    return { isBlocked: true, error: 'Forbidden' }
  }

  logger.info('Mutation blocked during impersonation', {
    adminId: authUser.id,
    impersonatedUserId,
  })

  return {
    isBlocked: true,
    error: 'Actions are disabled while impersonating a user. Exit impersonation to make changes.',
  }
}
