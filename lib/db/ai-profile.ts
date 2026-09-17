/**
 * DB queries for the AI Profile feature.
 *
 * Profile runs send a set of admin-managed introspection prompts (with
 * the {domain} placeholder substituted) to the user's active AI engines
 * and capture the responses. Useful for "what does AI think my site is?"
 * — the inverse direction of the citation tracker.
 *
 * Quota is shared with citation runs (`plans.citation_check_monthly_limit`):
 * one profile run consumes one slot of the monthly AI Visibility budget.
 * See lib/db/ai-visibility.ts → `getAiVisibilityRunsThisMonth`.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getAiVisibilityRunsThisMonth } from '@/lib/db/ai-visibility'

// Tables added in migration 00105 — types not yet regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ProfilePrompt {
  id:           string
  prompt_text:  string
  sort_order:   number
  is_active:    boolean
  admin_notes:  string | null
  created_at:   string
  updated_at:   string
}

// One row per (prompt × engine) combination within a run.
export interface ProfileResult {
  prompt_id:     string
  engine_id:     string
  prompt_text:   string             // snapshot AFTER {domain} substitution
  response_text: string             // truncated (~500 chars) for storage
  recognised:    boolean            // engine response mentioned the domain literally
  error:         string | null      // populated on failure; response_text becomes ''
}

export interface ProfileSummary {
  recognised_by:     string[]       // engine slugs that recognised the domain in any prompt
  not_recognised_by: string[]
  total_responses:   number         // prompts × engines actually executed
  failed_responses:  number
}

export interface ProfileRun {
  id:            string
  org_id:        string
  user_id:       string
  domain:        string
  engine_ids:    string[]
  prompt_ids:    string[]
  status:        'pending' | 'running' | 'complete' | 'failed'
  results:       ProfileResult[]
  summary:       ProfileSummary | null
  error_message: string | null
  started_at:    string | null
  completed_at:  string | null
  created_at:    string
}

// ---------------------------------------------------------------------------
// Active prompt lookup — used by the introspector at run time
// ---------------------------------------------------------------------------
export async function getActiveProfilePrompts(): Promise<ProfilePrompt[]> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_profile_prompts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('getActiveProfilePrompts failed', { error: error.message })
    return []
  }
  return (data ?? []) as ProfilePrompt[]
}

// ---------------------------------------------------------------------------
// Plan limit check — shared bucket with citation runs (Boss decision 2026-05-10)
// ---------------------------------------------------------------------------
export async function canRunProfileCheck(
  orgId: string,
  planSlug: string,
  engineIds: string[],
  freeEngineIds: string[],
): Promise<{ allowed: boolean; reason?: string }> {
  // Free plan: only free engines allowed (mirror citation policy)
  if (planSlug === 'free') {
    const hasNonFree = engineIds.some(id => !freeEngineIds.includes(id))
    if (hasNonFree) {
      return {
        allowed: false,
        reason: 'Free plan can only use free engines for AI Profile. Upgrade to access all engines.',
      }
    }
    return { allowed: true }
  }

  // The current Pro Plan (per-website) has no row in the legacy plans table
  // — mirrors lib/db/ai-visibility.ts's PRO_PLAN_WEBSITE_SLUG special case.
  let monthlyLimit: number
  if (planSlug === 'pro-plan-website') {
    monthlyLimit = 4
  } else {
    const adminClient = createAdminClient() as AnySupabase
    const { data } = await adminClient
      .from('plans')
      .select('citation_check_monthly_limit')
      .eq('slug', planSlug)
      .single()
    monthlyLimit = (data?.citation_check_monthly_limit as number | undefined) ?? 0
  }

  if (monthlyLimit === -1) return { allowed: true }
  if (monthlyLimit === 0) {
    return {
      allowed: false,
      reason: 'AI Profile is not available on your current plan. Upgrade to access this feature.',
    }
  }

  const used = await getAiVisibilityRunsThisMonth(orgId)
  if (used >= monthlyLimit) {
    return {
      allowed: false,
      reason: `You have used all ${monthlyLimit} AI Visibility runs (citations + profile combined) for this month. Resets on the 1st.`,
    }
  }
  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Profile run CRUD
// ---------------------------------------------------------------------------
export async function createProfileRun(
  orgId: string,
  userId: string,
  domain: string,
  engineIds: string[],
  promptIds: string[],
): Promise<ProfileRun | null> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_profile_runs')
    .insert({
      org_id:     orgId,
      user_id:    userId,
      domain,
      engine_ids: engineIds,
      prompt_ids: promptIds,
      status:     'pending',
    })
    .select()
    .single()

  if (error) {
    logger.error('createProfileRun failed', { error: error.message })
    return null
  }
  return data as ProfileRun
}

export async function getProfileRunById(runId: string): Promise<ProfileRun | null> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_profile_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (error) {
    logger.error('getProfileRunById failed', { error: error.message, runId })
    return null
  }
  return data as ProfileRun
}

export async function getProfileRuns(orgId: string, limit = 10): Promise<ProfileRun[]> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('ai_profile_runs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('getProfileRuns failed', { error: error.message })
    return []
  }
  return (data ?? []) as ProfileRun[]
}

export async function getProfileRunsThisMonth(orgId: string): Promise<number> {
  const supabase = await createClient() as AnySupabase
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const { count, error } = await supabase
    .from('ai_profile_runs')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', startOfMonth)
    .neq('status', 'failed')

  if (error) {
    logger.error('getProfileRunsThisMonth failed', { error: error.message })
    return 0
  }
  return count ?? 0
}

export async function updateProfileRunStatus(
  runId: string,
  status: ProfileRun['status'],
  patch: Partial<{ results: ProfileResult[]; summary: ProfileSummary; error_message: string }> = {},
): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const update: Record<string, unknown> = {
    status,
    ...(status === 'running'  && { started_at: new Date().toISOString() }),
    ...(status === 'complete' && { completed_at: new Date().toISOString() }),
    ...(status === 'failed'   && { completed_at: new Date().toISOString() }),
    ...(patch.results       !== undefined && { results:       patch.results }),
    ...(patch.summary       !== undefined && { summary:       patch.summary }),
    ...(patch.error_message !== undefined && { error_message: patch.error_message }),
  }

  const { error } = await supabase
    .from('ai_profile_runs')
    .update(update)
    .eq('id', runId)

  if (error) {
    logger.error('updateProfileRunStatus failed', { error: error.message, runId })
    return false
  }
  return true
}
