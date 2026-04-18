'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { logger } from '@/lib/utils/logger'

export async function setMonitorLimitOverrideAction(
  orgId: string,
  override: number | null
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }
  if (!await canAccessAdminModule(user.email, !!user.is_super_admin, 'user360')) {
    return { error: 'Forbidden' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('organisations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ monitor_limit_override: override } as any)
    .eq('id', orgId)

  if (error) return { error: error.message }

  logger.info('Admin set monitor limit override', {
    orgId, override, adminEmail: user.email,
  })

  revalidatePath('/admin/user360')
  return {}
}
