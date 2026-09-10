import { createAdminClient } from '@/lib/supabase/admin'

interface PlanLimits {
  monitors: number | null // null = unlimited (agency plans)
  workspaces: number | null
  competitors: number
  maxTeamMembers: number
  hasEmailAlerts: boolean
  hasSlackTeams: boolean
  hasWebhooks: boolean
  hasStatusPages: boolean
  statusPageLimit: number
  hasStatusPageCustomDomain: boolean
  hasAiPredictive: boolean
  aiReportLimit: number
  hasApiAccess: boolean
  hasWhiteLabel: boolean
  hasVoiceCalls: boolean
  checkIntervalSeconds: number
  wpMonitors: number
}

const UPGRADE_NUDGE_THRESHOLD = 15

/** Free tier defaults when no subscription exists */
const FREE_DEFAULTS: PlanLimits = {
  monitors: 3,
  workspaces: 1,
  competitors: 3,
  maxTeamMembers: 0,
  hasEmailAlerts: true,
  hasSlackTeams: false,
  hasWebhooks: false,
  hasStatusPages: false,
  statusPageLimit: 0,
  hasStatusPageCustomDomain: false,
  hasAiPredictive: false,
  aiReportLimit: 0,
  hasApiAccess: false,
  hasWhiteLabel: false,
  hasVoiceCalls: false,
  checkIntervalSeconds: 600,
  wpMonitors: 0,
}

/** Extract plan limits from a raw plan record */
function extractLimits(plan: Record<string, unknown>): PlanLimits {
  return {
    monitors: (plan.monitor_limit as number | null) ?? null,
    workspaces: (plan.client_workspace_limit as number | null) ?? null,
    competitors: (plan.competitor_limit as number) ?? 3,
    maxTeamMembers: (plan.max_team_members as number) ?? 0,
    hasEmailAlerts: (plan.has_email_alerts as boolean) ?? true,
    hasSlackTeams: (plan.has_slack_teams as boolean) ?? false,
    hasWebhooks: (plan.has_webhooks as boolean) ?? false,
    hasStatusPages: (plan.has_status_pages as boolean) ?? false,
    statusPageLimit: (plan.status_page_limit as number) ?? 0,
    hasStatusPageCustomDomain: (plan.has_status_page_custom_domain as boolean) ?? false,
    hasAiPredictive: (plan.has_ai_predictive as boolean) ?? false,
    aiReportLimit: (plan.ai_report_limit as number) ?? 0,
    hasApiAccess: (plan.has_api_access as boolean) ?? false,
    hasWhiteLabel: (plan.has_white_label as boolean) ?? false,
    hasVoiceCalls: (plan.has_voice_calls as boolean) ?? false,
    checkIntervalSeconds: Math.max((plan.check_interval_seconds as number) ?? 600, 30),
    wpMonitors: (plan.wp_monitor_limit as number) ?? 0,
  }
}

/** Add one Add-On Plan's worth of numeric limits onto a base PlanLimits.
 *  Add-ons only ever grant Pre Plan (slug 'lite') limits, and only the
 *  numeric/countable fields stack — boolean feature flags and the check
 *  interval stay governed by the base plan alone. */
function addAddonLimits(base: PlanLimits, addon: Record<string, unknown>): PlanLimits {
  return {
    ...base,
    monitors: base.monitors === null ? null : base.monitors + ((addon.monitor_limit as number) ?? 0),
    competitors: base.competitors + ((addon.competitor_limit as number) ?? 0),
    statusPageLimit: base.statusPageLimit + ((addon.status_page_limit as number) ?? 0),
    aiReportLimit: base.aiReportLimit < 0 ? base.aiReportLimit : base.aiReportLimit + Math.max((addon.ai_report_limit as number) ?? 0, 0),
    wpMonitors: base.wpMonitors + ((addon.wp_monitor_limit as number) ?? 0),
  }
}

/** Fetch plan limits for an org based on its active, cancelling, or trialing subscription,
 *  plus any active Add-On Plan purchases stacked additively on top.
 *  Reads from the plans table (single source of truth).
 *  'cancelling' subs retain full plan limits — the user paid until period end.
 *  Trialing subscriptions get the trial plan's limits until trial_ends_at. */
export async function getPlanLimits(orgId: string): Promise<PlanLimits> {
  const supabase = createAdminClient()

  // Active, cancelling (paid until period end), paused, or past_due all retain plan limits.
  // past_due means payment failed but Stripe is still retrying — the user paid for this plan
  // and should not be silently downgraded to FREE while Stripe works through its retry schedule.
  const [subResult, addonsResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('org_id', orgId)
      .in('status', ['active', 'cancelling', 'paused', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('org_addon_subscriptions')
      .select('*, plans:addon_plan_id(*)')
      .eq('org_id', orgId)
      .in('status', ['active', 'cancelling', 'past_due']) as Promise<{ data: Array<{ plans: Record<string, unknown> | null }> | null }>,
  ])

  const sub = subResult.data
  const addonPlans = (addonsResult.data ?? [])
    .map(row => row.plans)
    .filter((p): p is Record<string, unknown> => Boolean(p))

  if (sub && sub.plans) {
    const base = extractLimits(sub.plans as Record<string, unknown>)
    return addonPlans.reduce(addAddonLimits, base)
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
      const base = extractLimits(trialSub.plans as Record<string, unknown>)
      return addonPlans.reduce(addAddonLimits, base)
    }
  }

  // No base subscription — add-ons cannot exist without one, but if data is
  // ever inconsistent, still fall back to plain free defaults rather than
  // granting add-on limits with no base plan.
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

  const [limits, orgResult, countResult] = await Promise.all([
    getPlanLimits(orgId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('organisations').select('monitor_limit_override').eq('id', orgId).single() as Promise<{ data: { monitor_limit_override: number | null } | null }>,
    supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
  ])

  const override = (orgResult.data?.monitor_limit_override as number | null) ?? null
  // An admin override takes precedence over the plan+add-ons limit entirely;
  // null override falls back to the plan+add-ons limit from getPlanLimits.
  const effectiveLimit = override !== null ? override : limits.monitors

  const currentCount = countResult.count ?? 0
  const allowed = effectiveLimit === null || currentCount < effectiveLimit
  const shouldNudge = effectiveLimit === null && currentCount >= UPGRADE_NUDGE_THRESHOLD

  return { allowed, shouldNudge, currentCount, limit: effectiveLimit }
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
    | 'hasEmailAlerts'
    | 'hasSlackTeams'
    | 'hasWebhooks'
    | 'hasStatusPages'
    | 'hasStatusPageCustomDomain'
    | 'hasApiAccess'
    | 'hasAiPredictive'
    | 'hasWhiteLabel'
    | 'hasVoiceCalls'
  >
): Promise<boolean> {
  const limits = await getPlanLimits(orgId)
  return limits[feature]
}

/** Check if the org can create another status page */
export async function checkStatusPageLimit(orgId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number
}> {
  const supabase = createAdminClient()
  const limits = await getPlanLimits(orgId)

  if (!limits.hasStatusPages) return { allowed: false, currentCount: 0, limit: 0 }

  const { count } = await supabase
    .from('status_pages')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const currentCount = count ?? 0
  const limit = limits.statusPageLimit
  const allowed = limit === 0 || currentCount < limit

  return { allowed, currentCount, limit }
}

/** Check if the org can generate another AI report this month */
export async function checkAiReportLimit(orgId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number
}> {
  const supabase = createAdminClient()
  const limits = await getPlanLimits(orgId)

  if (limits.aiReportLimit === 0) {
    return { allowed: false, currentCount: 0, limit: 0 }
  }
  if (limits.aiReportLimit === -1) {
    return { allowed: true, currentCount: 0, limit: -1 } // unlimited
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('generated_at', startOfMonth.toISOString())

  const currentCount = count ?? 0
  return {
    allowed: currentCount < limits.aiReportLimit,
    currentCount,
    limit: limits.aiReportLimit,
  }
}

/** Check if an alert channel type is allowed for this org's plan */
export async function checkAlertChannelAccess(orgId: string, channelType: string): Promise<boolean> {
  const limits = await getPlanLimits(orgId)
  switch (channelType) {
    case 'email': return limits.hasEmailAlerts
    case 'slack': return limits.hasSlackTeams
    case 'teams': return limits.hasSlackTeams
    case 'webhook': return limits.hasWebhooks
    case 'telegram': return true  // Free on all plans — zero cost to Uptrue
    default: return false
  }
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

/** Check if the org can add another WordPress monitor */
export async function checkWpMonitorLimit(orgId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number
}> {
  const supabase = createAdminClient()
  const [limits, orgResult, countResult] = await Promise.all([
    getPlanLimits(orgId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('organisations').select('wp_monitor_limit_override').eq('id', orgId).single() as Promise<{ data: { wp_monitor_limit_override: number | null } | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('wp_monitors').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
  ])

  const override = (orgResult.data?.wp_monitor_limit_override as number | null) ?? null
  const effectiveLimit = override !== null ? override : limits.wpMonitors
  const currentCount = countResult.count ?? 0
  const allowed = currentCount < effectiveLimit

  return { allowed, currentCount, limit: effectiveLimit }
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
  // limit of 0 means solo account — no additional members allowed beyond the owner
  // We count all users including owner, so for limit > 0 allowed = currentCount < limit + 1
  const allowed = limit === 0 ? false : currentCount < limit + 1

  return { allowed, currentCount, limit }
}
