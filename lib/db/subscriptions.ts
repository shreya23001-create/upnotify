import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Subscription, Invoice, Plan } from '@/lib/types'

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

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    logger.error('Failed to get plan', { error: error.message })
    return null
  }
  return data
}

export async function getAllVisiblePlans(): Promise<Plan[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_visible', true)
    .order('price_monthly_gbp', { ascending: true })

  if (error) {
    logger.error('Failed to get plans', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getSubscriptionWithPlan(
  orgId: string
): Promise<{ subscription: Subscription; plan: Plan } | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()

  if (error || !data) return null
  return {
    subscription: data as unknown as Subscription,
    plan: (data as Record<string, unknown>).plans as unknown as Plan,
  }
}

export async function createSubscriptionRecord(record: {
  org_id: string
  plan_id: string
  stripe_subscription_id: string
  status: string
  billing_cycle: string
  current_period_start?: string
  current_period_end?: string
}): Promise<Subscription | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(record)
    .select()
    .single()

  if (error) {
    logger.error('Failed to create subscription', {
      error: error.message,
    })
    return null
  }
  return data
}

export async function createInvoiceRecord(record: {
  org_id: string
  subscription_id?: string
  stripe_invoice_id: string
  amount_gbp: number
  status: string
  invoice_pdf_url?: string
  period_start?: string
  period_end?: string
}): Promise<Invoice | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('invoices')
    .insert(record)
    .select()
    .single()

  if (error) {
    logger.error('Failed to create invoice', { error: error.message })
    return null
  }
  return data
}
