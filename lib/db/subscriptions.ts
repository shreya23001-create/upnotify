import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Subscription, Invoice, Plan } from '@/lib/types'

export async function getSubscription(orgId: string): Promise<Subscription | null> {
  const supabase = await createClient()

  // Active, cancelling, paused, or past_due — all need to surface in the billing UI
  // past_due: Stripe payment failed; user needs to see their sub to access the portal
  const { data: active, error: activeErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['active', 'cancelling', 'paused', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (active) return active

  // Fall back to trialing
  const { data: trialing, error: trialErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'trialing')
    .maybeSingle()

  if (trialing) return trialing

  if (activeErr) {
    logger.error('Failed to get subscription', { error: activeErr.message })
  }
  if (trialErr) {
    logger.error('Failed to get trial subscription', { error: trialErr.message })
  }
  return null
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

export async function getInvoiceById(id: string, orgId: string): Promise<Invoice | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId) // RLS: org scoping
    .single()

  if (error) {
    logger.error('Failed to get invoice', { error: error.message })
    return null
  }
  return data
}

export async function getPlanByStripePriceId(stripePriceId: string): Promise<Plan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .or(`stripe_price_id_monthly.eq.${stripePriceId},stripe_price_id_annual.eq.${stripePriceId}`)
    .maybeSingle()

  if (error) {
    logger.error('Failed to get plan by Stripe price ID', { error: error.message, stripePriceId })
    return null
  }
  return data
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

  // Active, cancelling, or paused — all have an associated paid plan
  const { data: active } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('org_id', orgId)
    .in('status', ['active', 'cancelling', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (active && (active as Record<string, unknown>).plans) {
    return {
      subscription: active as unknown as Subscription,
      plan: (active as Record<string, unknown>).plans as unknown as Plan,
    }
  }

  // Fall back to trialing
  const { data: trialing } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('org_id', orgId)
    .eq('status', 'trialing')
    .maybeSingle()

  if (trialing && (trialing as Record<string, unknown>).plans) {
    return {
      subscription: trialing as unknown as Subscription,
      plan: (trialing as Record<string, unknown>).plans as unknown as Plan,
    }
  }

  return null
}

/**
 * Create a 14-day reverse trial subscription for a new user.
 * Assigns the Builder plan with 'trialing' status and trial_ends_at set to 14 days from now.
 */
/**
 * Returns the payment provider used by the most recent subscription for this org,
 * regardless of status. Used to keep currency consistent after cancellation.
 */
export async function getLastSubscriptionProvider(
  orgId: string
): Promise<'razorpay' | 'stripe' | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('razorpay_subscription_id, stripe_subscription_id')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null
  const row = data as Record<string, unknown>
  if (row.razorpay_subscription_id) return 'razorpay'
  if (row.stripe_subscription_id) return 'stripe'
  return null
}

export async function createTrialSubscription(orgId: string): Promise<Subscription | null> {
  const supabase = createAdminClient()

  // Check if org already has any subscription
  const { count } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if ((count ?? 0) > 0) {
    return null // Already has a subscription — skip
  }

  // Get the builder plan
  const { data: builderPlan, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('slug', 'builder')
    .single()

  if (planError || !builderPlan) {
    logger.error('Failed to find builder plan for trial', { error: planError?.message })
    return null
  }

  const now = new Date()
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      org_id: orgId,
      plan_id: builderPlan.id,
      status: 'trialing',
      billing_cycle: 'monthly',
      trial_ends_at: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create trial subscription', { orgId, error: error.message })
    return null
  }
  return data
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
