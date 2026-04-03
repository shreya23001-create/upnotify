'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/db/users'
import { logger } from '@/lib/utils/logger'

export async function saveTrustedLogosAction(logosText: string): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { error: 'Forbidden' }

  const logos = logosText
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://')))

  const supabase = createAdminClient()

  // Upsert the page_sections row
  const { error } = await supabase
    .from('page_sections')
    .upsert(
      {
        page: 'landing',
        section_key: 'trusted_logos',
        content: { logos },
      },
      { onConflict: 'section_key' }
    )

  if (error) {
    logger.error('Failed to save trusted logos', { error: error.message })
    return { error: 'Failed to save. Please try again.' }
  }

  logger.info('Trusted logos updated', { count: logos.length, userId: user.id })
  return { success: true }
}
