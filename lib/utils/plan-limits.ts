import { createAdminClient } from '@/lib/supabase/admin'

interface PlanLimits {
  monitors: number | null // null = unlimited (agency plans)
  workspaces: number | null
  competitors: number
  maxTeamMembers: number
  hasApiAccess: boolean
  hasAiPredictive: boolean
  hasStatusPageCustomDomain: boolean
  hasWhiteLabel: boolean
  hasVoiceCalls: boolean
  checkIntervalSeconds: number
}

const UPGRADE_NUDGE_THRESHOLD = 15

/** Free tier defaults when no subscription exists */
const FREE_DEFAULTS: PlanLimits = {
  monitors: 3,
  workspaces: 1,
  competitors: 3,
  maxTeamMembers: 0,
  hasApiAccess: false,
  hasAiPredictive: false,
  hasStatusPageCustomDomain: false,
  hasWhiteLabel: false,
  hasVoiceCalls: false,
  checkIntervalSeconds: 600,
}

/** Extract plan limits from a raw plan record */
function extractLimits(plan: Record<string, unknown>): PlanLimits {
  return {
    monitors: (plan.monitor_limit as number | null) ?? null,
    workspaces: (plan.client_workspace_limit as number | null) ?? null,
    competitors: (plan.competitor_limit as number) ?? 3,
    maxTeamMembers: (plan.max_team_members as number) ?? 0,
    hasApiAccess: (plan.has_api_access as boolean) ?? false,
    hasAiPredictive: (plan.has_ai_predictive as boolean) ?? false,
    hasStatusPageCustomDomain:
      (plan.has_status_page_custom_domain as boolean) ?? false,
    hasWhiteLabel: (plan.has_white_label as boolean) ?? false,
    hasVoiceCalls: (plan.has_voice_calls as boolean) ?? false,
    checkIntervalSeconds: (plan.check_interval_seconds as number) ?? 600,
  }
}

/** Fetch plan limits for an org based on its active or trialing subscription.
 *  Reads from the plans table (single source of truth).
 *  Trialing subscriptions get the trial plan's limits until trial_ends_at. */
export async function getPlanLimits(orgId: string): Promise<PlanLimits> {
  const supabase = createAdminClient()

  // Check for active subscription first
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()

  if (sub && sub.plans) {
    return extractLimits(sub.plans as Record<string, unknown>)
  }

  // Fall back to trialing subscription
  const { data: trialSub } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('org_id', orgId)
    .eq('status', 'trialing')
    .single()

  if (trialSub && trialSub.plans) {
    const trialEnd = trialSub.trial_ends_at
      ? new Date(trialSub.trial_ends_at)
      : null
    if (trialEnd && trialEnd > new Date()) {
      return extractLimits(trialSub.plans as Record<string, unknown>)
    }
  }

  return FREE_DEFAULTS
}

/**
 * Check if the org can create another monitor.
 * Returns shouldNudge=true at 15 monitors on unlimited plans (agency).
 */
export async function checkMonitorLimit(orgId: string): Promise<{
  allowed: boolean
  shouldNudge: boolean
  currentCount: number
  limit: number | null
}> {
  const supabase = createAdminClient()
  const limits = await getPlanLimits(orgId)

  const { count } = await supabase
    .from('monitors')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const currentCount = count ?? 0
  const allowed =
    limits.monitors === null || currentCount < limits.monitors
  const shouldNudge =
    limits.monitors === null && currentCount >= UPGRADE_NUDGE_THRESHOLD

  return { allowed, shouldNudge, currentCount, limit: limits.monitors }
}

/** Check if the org can create another workspace */
export async function checkWorkspaceLimit(orgId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number | null
}> {
  const supabase = createAdminClient()
  const limits = await getPlanLimits(orgId)

  const { count } = await supabase
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const currentCount = count ?? 0
  const allowed =
    limits.workspaces === null || currentCount < limits.workspaces

  return { allowed, currentCount, limit: limits.workspaces }
}

/** Check if a specific feature is available for the org's plan */
export async function checkFeatureAccess(
  orgId: string,
  feature: keyof Pick<
    PlanLimits,
    | 'hasApiAccess'
    | 'hasAiPredictive'
    | 'hasStatusPageCustomDomain'
    | 'hasWhiteLabel'
    | 'hasVoiceCalls'
  >
): Promise<boolean> {
  const limits = await getPlanLimits(orgId)
  return limits[feature]
}

/** Check if the org has Compete access via a separate Compete add-on subscription */
export async function checkCompeteAccess(orgId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('compete_subscriptions')
    .select('id')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .limit(1)
    .single()

  return !!data
}

/** Check if the org can add another Compete product (based on Compete add-on subscription) */
export async function checkCompeteProductLimit(orgId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number
  nudgeToSlug: string | null
}> {
  const supabase = createAdminClient()

  const { data: sub } = await supabase
    .from('compete_subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()

  if (!sub) {
    return { allowed: false, currentCount: 0, limit: 0, nudgeToSlug: null }
  }

  const { data: plan } = await supabase
    .from('compete_plans')
    .select('*')
    .eq('id', sub.compete_plan_id)
    .single()

  if (!plan) {
    return { allowed: false, currentCount: 0, limit: 0, nudgeToSlug: null }
  }

  const baseLimit = (plan.product_limit as number) ?? 0
  const extraPurchased = (sub.extra_products_purchased as number) ?? 0
  const totalLimit = baseLimit + extraPurchased
  const nudgeToSlug = (plan.nudge_to_slug as string) ?? null

  const { count } = await supabase
    .from('ecom_products')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const currentCount = count ?? 0
  const allowed = currentCount < totalLimit

  return { allowed, currentCount, limit: totalLimit, nudgeToSlug }
}

/** Check if the org can add another competitor monitor */
export async function checkCompetitorLimit(orgId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number
}> {
  const supabase = createAdminClient()
  const limits = await getPlanLimits(orgId)

  const { count } = await supabase
    .from('competitor_monitors')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const currentCount = count ?? 0
  const limit = limits.competitors
  const allowed = currentCount < limit

  return { allowed, currentCount, limit }
}

/** Check if the org can add another team member */
export async function checkTeamMemberLimit(orgId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number
}> {
  const supabase = createAdminClient()
  const limits = await getPlanLimits(orgId)

  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const currentCount = count ?? 0
  const limit = limits.maxTeamMembers
  // limit of 0 means solo account (owner only, no additional members)
  // We count all users including owner, so allowed if currentCount < limit + 1 (owner)
  const allowed = limit === 0 ? currentCount <= 1 : currentCount < limit + 1

  return { allowed, currentCount, limit }
}
