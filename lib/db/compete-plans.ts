import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CompetePlan {
  id: string
  name: string
  slug: string
  description: string | null
  product_limit: number
  price_monthly_pence: number
  price_yearly_pence: number | null
  has_yearly_discount: boolean
  extra_product_price_pence: number
  extra_product_bundle_sizes: number[]
  max_extra_products: number
  nudge_to_slug: string | null
  stripe_product_id: string | null
  stripe_monthly_price_id: string | null
  stripe_yearly_price_id: string | null
  is_active: boolean
  sort_order: number
}

export interface CompeteSubscription {
  id: string
  org_id: string
  compete_plan_id: string
  stripe_subscription_id: string | null
  status: string
  billing_cycle: string
  extra_products_purchased: number
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  compete_plans?: CompetePlan
}

// ---------- Plans ----------

export async function getActiveCompetePlans(): Promise<CompetePlan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('compete_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []) as CompetePlan[]
}

export async function getCompetePlanBySlug(slug: string): Promise<CompetePlan | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('compete_plans')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as CompetePlan
}

// ---------- Subscriptions ----------

export async function getCompeteSubscription(orgId: string): Promise<CompeteSubscription | null> {
  const supabase = await createClient()

  const { data: sub, error } = await supabase
    .from('compete_subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()

  if (error || !sub) return null

  // Fetch the plan separately
  const { data: plan } = await supabase
    .from('compete_plans')
    .select('*')
    .eq('id', sub.compete_plan_id)
    .single()

  return { ...(sub as unknown as CompeteSubscription), compete_plans: plan as CompetePlan | undefined }
}

export async function getCompeteProductLimit(orgId: string): Promise<{ hasCompete: boolean; limit: number; extra: number }> {
  const sub = await getCompeteSubscription(orgId)

  if (!sub || !sub.compete_plans) {
    return { hasCompete: false, limit: 0, extra: 0 }
  }

  const plan = sub.compete_plans as CompetePlan
  return {
    hasCompete: true,
    limit: plan.product_limit + sub.extra_products_purchased,
    extra: sub.extra_products_purchased,
  }
}

export async function createCompeteSubscription(params: {
  orgId: string
  competePlanId: string
  stripeSubscriptionId: string
  billingCycle: 'monthly' | 'annual'
  periodStart: string
  periodEnd: string
}): Promise<boolean> {
  const supabase = createAdminClient()

  // Cancel any existing compete subscription for this org
  await supabase
    .from('compete_subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('org_id', params.orgId)
    .eq('status', 'active')

  const { error } = await supabase.from('compete_subscriptions').insert({
    org_id: params.orgId,
    compete_plan_id: params.competePlanId,
    stripe_subscription_id: params.stripeSubscriptionId,
    status: 'active',
    billing_cycle: params.billingCycle,
    current_period_start: params.periodStart,
    current_period_end: params.periodEnd,
  })

  return !error
}

export async function addExtraProducts(orgId: string, bundleSize: number): Promise<boolean> {
  const supabase = createAdminClient()

  const sub = await getCompeteSubscription(orgId)
  if (!sub) return false

  const plan = sub.compete_plans as CompetePlan
  const newTotal = sub.extra_products_purchased + bundleSize

  if (newTotal > plan.max_extra_products) return false

  const { error } = await supabase
    .from('compete_subscriptions')
    .update({ extra_products_purchased: newTotal })
    .eq('id', sub.id)

  return !error
}

// ---------- Admin ----------

export async function getAllCompetePlansAdmin(): Promise<CompetePlan[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('compete_plans')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []) as CompetePlan[]
}

export async function updateCompetePlan(
  planId: string,
  updates: Partial<Pick<CompetePlan,
    'name' | 'description' | 'product_limit' | 'price_monthly_pence' | 'price_yearly_pence' |
    'has_yearly_discount' | 'extra_product_price_pence' | 'max_extra_products' | 'is_active' |
    'stripe_product_id' | 'stripe_monthly_price_id' | 'stripe_yearly_price_id'
  >>
): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('compete_plans')
    .update(updates)
    .eq('id', planId)

  return !error
}

export async function getCompeteSubscriptionStats(): Promise<{
  totalActive: number
  byPlan: Record<string, number>
  totalRevenuePence: number
}> {
  const supabase = createAdminClient()

  const { data: subs, error } = await supabase
    .from('compete_subscriptions')
    .select('*')
    .eq('status', 'active')

  if (error || !subs) {
    return { totalActive: 0, byPlan: {}, totalRevenuePence: 0 }
  }

  // Fetch all plans for mapping
  const { data: plans } = await supabase.from('compete_plans').select('*')
  const planMap = new Map((plans ?? []).map(p => [p.id, p]))

  const byPlan: Record<string, number> = {}
  let totalRevenuePence = 0

  for (const sub of subs) {
    const plan = planMap.get(sub.compete_plan_id)
    if (plan) {
      byPlan[plan.name] = (byPlan[plan.name] ?? 0) + 1
      totalRevenuePence += plan.price_monthly_pence
    }
  }

  return { totalActive: subs.length, byPlan, totalRevenuePence }
}
