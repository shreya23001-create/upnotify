import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Organisation, User, FeatureFlag, Plan } from '@/lib/types'

export interface OrgWithUsers extends Organisation {
  users: { id: string; email: string; full_name: string | null; is_active: boolean }[]
}

// engineering-app#73 — the admin org/user listings used to fetch every row.
// PostgREST silently caps unbounded selects at 1,000 anyway, and at scale
// the join + memory cost on every admin page load is unbearable. Bounded
// here to 1,000 — when an installation actually crosses that threshold,
// these helpers should grow `{ page, pageSize }` params and the admin UI
// should plumb pagination (out of scope for the perf fix).
const ADMIN_LIST_CAP = 1000

export async function getAllOrganisations(search?: string): Promise<OrgWithUsers[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('organisations')
    .select('*, users!users_org_id_fkey(id, email, full_name, is_active)')
    .order('created_at', { ascending: false })
    .limit(ADMIN_LIST_CAP)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) {
    logger.error('Admin: Failed to get organisations', { error: error.message })
    return []
  }
  if (data && data.length === ADMIN_LIST_CAP) {
    logger.warn('Admin: organisations listing hit the row cap — pagination needed', { cap: ADMIN_LIST_CAP })
  }
  return (data ?? []) as OrgWithUsers[]
}

export async function getAllUsers(search?: string): Promise<User[]> {
  const supabase = createAdminClient()
  let query = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(ADMIN_LIST_CAP)
  if (search) query = query.ilike('email', `%${search}%`)

  const { data, error } = await query
  if (error) {
    logger.error('Admin: Failed to get users', { error: error.message })
    return []
  }
  if (data && data.length === ADMIN_LIST_CAP) {
    logger.warn('Admin: users listing hit the row cap — pagination needed', { cap: ADMIN_LIST_CAP })
  }
  return data ?? []
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('key', { ascending: true })

  if (error) {
    logger.error('Admin: Failed to get feature flags', { error: error.message })
    return []
  }
  return data ?? []
}

export async function updateFeatureFlag(
  id: string,
  updates: { is_enabled?: boolean; rollout_percentage?: number }
): Promise<FeatureFlag | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Admin: Failed to update feature flag', { error: error.message })
    return null
  }
  return data
}

export async function getPlans(): Promise<Plan[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly_gbp', { ascending: true })

  if (error) {
    logger.error('Admin: Failed to get plans', { error: error.message })
    return []
  }
  return data ?? []
}

export interface AdminWebsitePlanRow {
  id: string
  orgId: string
  orgName: string
  status: string
  purchasedQuantity: number
  domainsClaimed: number
  totalPaidPaise: number
  createdAt: string
  currentPeriodEnd: string | null
}

/**
 * Every website_subscriptions row (the current per-website Pro Plan model),
 * joined with the org name and that row's paid-invoice total — for the
 * admin "who bought it and how many" view. One row per purchase (a top-up
 * via Add More creates its own separate row, same org).
 */
export async function getAllWebsiteSubscriptionsAdmin(): Promise<AdminWebsitePlanRow[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs, error } = await (supabase as any)
    .from('website_subscriptions')
    .select('id, org_id, status, purchased_quantity, domains, created_at, current_period_end, organisations(name)')
    .order('created_at', { ascending: false })
    .limit(ADMIN_LIST_CAP) as {
      data: Array<{
        id: string
        org_id: string
        status: string
        purchased_quantity: number | null
        domains: string[] | null
        created_at: string
        current_period_end: string | null
        organisations: { name: string } | null
      }> | null
      error: { message: string } | null
    }

  if (error) {
    logger.error('Admin: Failed to get website subscriptions', { error: error.message })
    return []
  }

  const rows = subs ?? []
  if (rows.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoices } = await (supabase as any)
    .from('invoices')
    .select('website_subscription_id, amount_gbp')
    .in('website_subscription_id', rows.map(r => r.id))
    .eq('status', 'paid') as { data: Array<{ website_subscription_id: string | null; amount_gbp: number | null }> | null }

  const paidByRow = new Map<string, number>()
  for (const inv of invoices ?? []) {
    if (!inv.website_subscription_id) continue
    paidByRow.set(inv.website_subscription_id, (paidByRow.get(inv.website_subscription_id) ?? 0) + (inv.amount_gbp ?? 0))
  }

  return rows.map(r => ({
    id: r.id,
    orgId: r.org_id,
    orgName: r.organisations?.name ?? 'Unknown org',
    status: r.status,
    purchasedQuantity: r.purchased_quantity ?? (r.domains?.length ?? 0),
    domainsClaimed: r.domains?.length ?? 0,
    totalPaidPaise: paidByRow.get(r.id) ?? 0,
    createdAt: r.created_at,
    currentPeriodEnd: r.current_period_end,
  }))
}
