import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export async function getPaywalledDomains(): Promise<Set<string>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('paywalled_domains')
    .select('domain')

  if (error) {
    logger.warn('Failed to load paywalled domains', { error: error.message })
    return new Set()
  }

  return new Set((data ?? []).map(r => r.domain))
}

export async function addPaywalledDomain(domain: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('paywalled_domains')
    .insert({ domain, auto_detected: true })
    .select()
    .single()

  if (error && !error.message.includes('duplicate')) {
    logger.warn('Failed to save paywalled domain', { domain, error: error.message })
    return
  }

  logger.info('Paywalled domain recorded', { domain })
}
