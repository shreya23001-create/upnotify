import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { writeAuditLog } from '@/lib/db/audit'
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

export interface AddonSubscription {
  id: string
  org_id: string
  addon_plan_id: string
  razorpay_subscription_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  plan: Plan | null
}

/** Every Add-On Plan subscription for this org that currently retains its
 *  limits — active, cancelling (paid until period end), or past_due. */
export async function getActiveAddonSubscriptions(orgId: string): Promise<AddonSubscription[]> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('org_addon_subscriptions')
    .select('*, plans:addon_plan_id(*)')
    .eq('org_id', orgId)
    .in('status', ['active', 'cancelling', 'past_due'])
    .order('created_at', { ascending: false }) as { data: unknown[] | null; error: { message: string } | null }

  if (error) {
    logger.error('Failed to get add-on subscriptions', { error: error.message, orgId })
    return []
  }

  return (data ?? []).map(row => {
    const r = row as unknown as Record<string, unknown>
    return {
      id: r.id as string,
      org_id: r.org_id as string,
      addon_plan_id: r.addon_plan_id as string,
      razorpay_subscription_id: r.razorpay_subscription_id as string | null,
      status: r.status as string,
      current_period_start: r.current_period_start as string | null,
      current_period_end: r.current_period_end as string | null,
      canceled_at: r.canceled_at as string | null,
      created_at: r.created_at as string,
      plan: (r.plans as Plan | null) ?? null,
    }
  })
}

export interface WebsiteSubscription {
  id: string
  org_id: string
  /** Every domain covered by this one combined subscription/invoice. */
  domains: string[]
  razorpay_subscription_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
}

/** Every per-website (₹999/website/year + 18% GST) combined subscription
 *  for this org, any status — the Plans page needs cancelled ones too so a
 *  customer can see history and re-subscribe. Also includes 'incomplete'
 *  rows: a website added on the Websites page but not yet selected+paid
 *  for on the Plans page (one domain per pending row). */
export async function getWebsiteSubscriptions(orgId: string): Promise<WebsiteSubscription[]> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('website_subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false }) as { data: unknown[] | null; error: { message: string } | null }

  if (error) {
    logger.error('Failed to get website subscriptions', { error: error.message, orgId })
    return []
  }

  return (data ?? []).map(row => row as unknown as WebsiteSubscription)
}

/** Single website_subscriptions row by id, org-scoped. Used by the invoice
 *  page to list which domains a given invoice's payment covered. */
export async function getWebsiteSubscriptionById(id: string, orgId: string): Promise<WebsiteSubscription | null> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('website_subscriptions')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .maybeSingle() as { data: unknown | null; error: { message: string } | null }

  if (error) {
    logger.error('Failed to get website subscription by id', { error: error.message, id, orgId })
    return null
  }
  return data as WebsiteSubscription | null
}

/**
 * Adds one or more new websites for an org as pending ('incomplete',
 * unpaid) rows — one domain per row, since each is not yet grouped into a
 * paid batch. Skips any domain already present (pending OR paid) for this
 * org so the same website is never duplicated. Called from the Websites
 * page; the user later selects some/all of these on the Plans page and
 * pays, which replaces the selected pending rows with one combined active
 * subscription (see website-checkout route).
 */
export async function addPendingWebsites(orgId: string, domains: string[]): Promise<{ added: number; skipped: number }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRows } = await (supabase as any)
    .from('website_subscriptions')
    .select('domains')
    .eq('org_id', orgId)
    .neq('status', 'canceled') as { data: Array<{ domains: string[] }> | null }
  const existingDomains = new Set((existingRows ?? []).flatMap(r => r.domains ?? []))

  const uniqueNew = Array.from(new Set(domains)).filter(d => !existingDomains.has(d))
  const skipped = domains.length - uniqueNew.length

  if (uniqueNew.length === 0) {
    return { added: 0, skipped }
  }

  const rows = uniqueNew.map(domain => ({
    org_id: orgId,
    domains: [domain],
    status: 'incomplete',
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('website_subscriptions').insert(rows)

  if (error) {
    logger.error('Failed to add pending websites', { error: error.message, orgId })
    return { added: 0, skipped: domains.length }
  }

  return { added: uniqueNew.length, skipped }
}

/**
 * Claims one purchased-but-unnamed website slot for `domain`, for the
 * quantity-first Pro Plan purchase flow (see
 * supabase/migrations/00132_website_subscription_quantity.sql). Called
 * from createMonitorAction the moment a non-grandfathered org creates a
 * monitor for a domain that isn't already covered by an active
 * subscription — the slot is claimed automatically, with no separate
 * "add a website" step. Race-safe via the claim_website_slot RPC
 * (SELECT ... FOR UPDATE SKIP LOCKED), so concurrent monitor-creation
 * requests can't double-claim the same slot.
 */
export async function claimWebsiteSlot(params: {
  orgId: string
  domain: string
}): Promise<
  | { ok: true; websiteSubscriptionId: string }
  | { ok: false; reason: 'already_claimed' }
  | { ok: false; reason: 'limit_exceeded' }
> {
  const { orgId, domain } = params
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRows } = await (supabase as any)
    .from('website_subscriptions')
    .select('domains')
    .eq('org_id', orgId)
    .neq('status', 'canceled') as { data: Array<{ domains: string[] }> | null }
  const alreadyClaimed = (existingRows ?? []).some(r => (r.domains ?? []).includes(domain))
  if (alreadyClaimed) {
    return { ok: false, reason: 'already_claimed' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: claimedId, error } = await (supabase as any)
    .rpc('claim_website_slot', { p_org_id: orgId, p_domain: domain }) as { data: string | null; error: { message: string } | null }

  if (error) {
    logger.error('claimWebsiteSlot: RPC failed', { error: error.message, orgId, domain })
    return { ok: false, reason: 'limit_exceeded' }
  }

  if (!claimedId) {
    return { ok: false, reason: 'limit_exceeded' }
  }

  await writeAuditLog({
    orgId,
    userId: null,
    action: 'website_subscription.slot_claimed',
    resourceType: 'website_subscription',
    metadata: { domain, website_subscription_id: claimedId },
  })

  return { ok: true, websiteSubscriptionId: claimedId }
}

/** Invoices linked to a specific website_subscription row. */
export async function getInvoicesByWebsiteSubscription(websiteSubscriptionId: string): Promise<Invoice[]> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('invoices')
    .select('*')
    .eq('website_subscription_id', websiteSubscriptionId)
    .order('created_at', { ascending: false }) as { data: Invoice[] | null; error: { message: string } | null }

  if (error) {
    logger.error('Failed to get invoices for website subscription', { error: error.message, websiteSubscriptionId })
    return []
  }
  return data ?? []
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
