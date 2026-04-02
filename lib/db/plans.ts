import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Plan } from '@/lib/types'

/** Fetch all plans ordered by monthly GBP price ascending */
export async function getAllPlans(): Promise<Plan[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly_gbp', { ascending: true })

  if (error) {
    logger.error('Plans: Failed to get all plans', { error: error.message })
    return []
  }
  return data ?? []
}

/** Fetch a single plan by slug */
export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    logger.error('Plans: Failed to get plan by slug', { error: error.message, slug })
    return null
  }
  return data
}

/** Fetch a single plan by ID */
export async function getPlanById(id: string): Promise<Plan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Plans: Failed to get plan by ID', { error: error.message })
    return null
  }
  return data
}

/** Update plan fields — partial update */
export async function updatePlan(
  id: string,
  updates: Partial<Omit<Plan, 'id' | 'created_at' | 'updated_at'>>
): Promise<Plan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Plans: Failed to update plan', { error: error.message, planId: id })
    return null
  }
  return data
}

/** Create a new plan */
export async function createPlan(
  planData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>
): Promise<Plan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .insert(planData)
    .select()
    .single()

  if (error) {
    logger.error('Plans: Failed to create plan', { error: error.message })
    return null
  }
  return data
}

/** Toggle plan visibility (active/inactive) */
export async function togglePlanActive(id: string, isVisible: boolean): Promise<Plan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .update({ is_visible: isVisible })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Plans: Failed to toggle plan visibility', { error: error.message, planId: id })
    return null
  }
  return data
}

/** Get subscriber count per plan (count of active subscriptions) */
export async function getSubscriberCountsByPlan(): Promise<Record<string, number>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('status', 'active')

  if (error) {
    logger.error('Plans: Failed to get subscriber counts', { error: error.message })
    return {}
  }

  const counts: Record<string, number> = {}
  for (const sub of data ?? []) {
    counts[sub.plan_id] = (counts[sub.plan_id] ?? 0) + 1
  }
  return counts
}
