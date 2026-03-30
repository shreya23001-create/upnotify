import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Subscription, Invoice } from '@/lib/types'

export async function getSubscription(orgId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()

  if (error) {
    logger.error('Failed to get subscription', { error: error.message })
    return null
  }
  return data
}

export async function getInvoices(orgId: string): Promise<Invoice[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get invoices', { error: error.message })
    return []
  }
  return data ?? []
}
