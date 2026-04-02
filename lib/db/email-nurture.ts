import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailSend {
  id: string
  user_id: string
  email_key: string
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
}

export interface EmailPreferences {
  user_id: string
  product_updates: boolean
  usage_digests: boolean
  upgrade_tips: boolean
  updated_at: string
}

export interface NurtureUser {
  id: string
  email: string
  full_name: string | null
  org_id: string
  created_at: string
}

export interface NurtureUserWithSubscription extends NurtureUser {
  /* full_name inherited as string | null from NurtureUser */
  trial_ends_at: string | null
  plan_slug: string | null
  subscription_status: string | null
}

// ---------------------------------------------------------------------------
// Email send tracking
// ---------------------------------------------------------------------------

export async function hasEmailBeenSent(userId: string, emailKey: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('email_sends')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('email_key', emailKey)

  if (error) {
    logger.error('Failed to check email send status', { userId, emailKey, error: error.message })
    return false
  }

  return (count ?? 0) > 0
}

export async function recordEmailSend(userId: string, emailKey: string): Promise<EmailSend | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_sends')
    .insert({ user_id: userId, email_key: emailKey })
    .select()
    .single()

  if (error) {
    logger.error('Failed to record email send', { userId, emailKey, error: error.message })
    return null
  }

  return data as EmailSend
}

// ---------------------------------------------------------------------------
// Email preferences
// ---------------------------------------------------------------------------

export async function getEmailPreferences(userId: string): Promise<EmailPreferences | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // If no row exists, create default preferences
    if (error.code === 'PGRST116') {
      const { data: created, error: createError } = await supabase
        .from('email_preferences')
        .insert({ user_id: userId })
        .select()
        .single()

      if (createError) {
        logger.error('Failed to create email preferences', { userId, error: createError.message })
        return null
      }
      return created as EmailPreferences
    }

    logger.error('Failed to get email preferences', { userId, error: error.message })
    return null
  }

  return data as EmailPreferences
}

export async function updateEmailPreferences(
  userId: string,
  updates: Partial<Pick<EmailPreferences, 'product_updates' | 'usage_digests' | 'upgrade_tips'>>
): Promise<EmailPreferences | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update email preferences', { userId, error: error.message })
    return null
  }

  return data as EmailPreferences
}

// ---------------------------------------------------------------------------
// Nurture cron queries — get users who need specific emails
// ---------------------------------------------------------------------------

/**
 * Get all users with their subscription/trial info for nurture processing.
 * Uses service role — bypasses RLS.
 */
export async function getUsersForNurture(): Promise<NurtureUserWithSubscription[]> {
  const supabase = createAdminClient()

  // Get all users with their org's subscription info
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, org_id, created_at')

  if (error) {
    logger.error('Failed to get users for nurture', { error: error.message })
    return []
  }

  if (!users || users.length === 0) return []

  // Get all active/trialing subscriptions
  const orgIds = [...new Set(users.map(u => u.org_id))]
  const { data: subs, error: subError } = await supabase
    .from('subscriptions')
    .select('org_id, status, current_period_end, plan_id')
    .in('org_id', orgIds)
    .in('status', ['active', 'trialing'])

  if (subError) {
    logger.error('Failed to get subscriptions for nurture', { error: subError.message })
  }

  // Get plan slugs
  const planIds = [...new Set((subs ?? []).map(s => s.plan_id).filter(Boolean))]
  let planMap: Record<string, string> = {}
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from('plans')
      .select('id, slug')
      .in('id', planIds)

    planMap = (plans ?? []).reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.slug
      return acc
    }, {})
  }

  const subMap = (subs ?? []).reduce<Record<string, {
    status: string
    trial_ends_at: string | null
    plan_slug: string | null
  }>>((acc, s) => {
    acc[s.org_id] = {
      status: s.status,
      trial_ends_at: s.status === 'trialing' ? s.current_period_end : null,
      plan_slug: s.plan_id ? (planMap[s.plan_id] ?? null) : null,
    }
    return acc
  }, {})

  return users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    org_id: u.org_id,
    created_at: u.created_at,
    trial_ends_at: subMap[u.org_id]?.trial_ends_at ?? null,
    plan_slug: subMap[u.org_id]?.plan_slug ?? null,
    subscription_status: subMap[u.org_id]?.status ?? null,
  }))
}

/**
 * Get monitor count and basic stats for a user's org (for monthly digest).
 */
export async function getOrgMonitorStats(orgId: string): Promise<{
  totalMonitors: number
  totalChecks: number
  uptimePercent: number
  incidentCount: number
}> {
  const supabase = createAdminClient()

  // Monitor count
  const { count: monitorCount } = await supabase
    .from('monitors')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  // Check results in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: checks } = await supabase
    .from('check_results')
    .select('status')
    .eq('org_id', orgId)
    .gte('checked_at', thirtyDaysAgo)

  const totalChecks = checks?.length ?? 0
  const upChecks = checks?.filter(c => c.status === 'up').length ?? 0
  const uptimePercent = totalChecks > 0 ? Math.round((upChecks / totalChecks) * 10000) / 100 : 100

  // Incident count in last 30 days
  const { count: incidentCount } = await supabase
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('started_at', thirtyDaysAgo)

  return {
    totalMonitors: monitorCount ?? 0,
    totalChecks,
    uptimePercent,
    incidentCount: incidentCount ?? 0,
  }
}
