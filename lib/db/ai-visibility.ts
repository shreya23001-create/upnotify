/**
 * DB queries for AI Visibility — llms.txt generations and citation check runs.
 * Plan limit enforcement happens here.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// New tables (migration 00055) — cast until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface LlmsTxtGeneration {
  id:         string
  org_id:     string
  user_id:    string
  domain:     string
  engine_ids: string[]
  content:    string
  created_at: string
}

export interface CitationCheckRun {
  id:            string
  org_id:        string
  user_id:       string
  domain:        string
  keywords:      string[]
  engine_ids:    string[]
  status:        'pending' | 'running' | 'complete' | 'failed'
  summary:       CitationSummary | null
  error_message: string | null
  started_at:    string | null
  completed_at:  string | null
  created_at:    string
}

export interface CitationSummary {
  cited_by:     string[]   // engine slugs
  not_cited_by: string[]   // engine slugs
  score:        number     // 0-100
  total_checks: number
}

export interface CitationCheckResult {
  id:            string
  run_id:        string
  engine_id:     string
  keyword:       string
  cited:         boolean | null
  confidence:    'high' | 'medium' | 'indicative' | null
  response_text: string | null
  source_urls:   string[]
  created_at:    string
}

// ---------------------------------------------------------------------------
// Plan limits — read from DB (single source of truth)
// ---------------------------------------------------------------------------
async function getAiVisibilityPlanLimits(planSlug: string): Promise<{ llmsTxtLimit: number; citationMonthlyLimit: number }> {
  const adminClient = createAdminClient() as AnySupabase
  const { data } = await adminClient
    .from('plans')
    .select('llms_txt_limit, citation_check_monthly_limit')
    .eq('slug', planSlug)
    .single()
  return {
    llmsTxtLimit:         data?.llms_txt_limit              ?? 1,
    citationMonthlyLimit: data?.citation_check_monthly_limit ?? 0,
  }
}

export async function getLlmsTxtGenerationCount(orgId: string): Promise<number> {
  const supabase = await createClient() as AnySupabase
  const { count, error } = await supabase
    .from('llms_txt_generations')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (error) {
    logger.error('getLlmsTxtGenerationCount failed', { error: error.message })
    return 0
  }
  return count ?? 0
}

export async function canGenerateLlmsTxt(orgId: string, planSlug: string): Promise<{ allowed: boolean; reason?: string }> {
  const { llmsTxtLimit: limit } = await getAiVisibilityPlanLimits(planSlug)
  if (limit === -1) return { allowed: true }
  if (limit === 0)  return { allowed: false, reason: 'AI Visibility is not available on your current plan. Upgrade to access this feature.' }

  const count = await getLlmsTxtGenerationCount(orgId)
  if (count >= limit) {
    return {
      allowed: false,
      reason: limit === 1
        ? 'Free plan includes one llms.txt generation lifetime. Upgrade to generate unlimited files.'
        : `You have reached your llms.txt generation limit (${limit}) for this plan.`,
    }
  }
  return { allowed: true }
}

/**
 * Post-insert overflow check for the race-condition guard. Unlike
 * canGenerateLlmsTxt() — a PRE-insert check that uses `count >= limit` — this
 * uses a STRICT `count > limit`. After a legitimate generation the row count
 * equals the limit (e.g. free plan: count 1 === limit 1); that row is valid and
 * must NOT be rolled back. Only a genuine concurrent over-insert pushes the
 * count strictly past the limit. engineering-app#154.
 */
export async function isLlmsTxtOverLimit(orgId: string, planSlug: string): Promise<boolean> {
  const { llmsTxtLimit: limit } = await getAiVisibilityPlanLimits(planSlug)
  if (limit === -1) return false  // unlimited — never over
  const count = await getLlmsTxtGenerationCount(orgId)
  return count > limit
}

export async function saveLlmsTxtGeneration(
  orgId: string,
  userId: string,
  domain: string,
  engineIds: string[],
  content: string,
): Promise<LlmsTxtGeneration | null> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('llms_txt_generations')
    .insert({ org_id: orgId, user_id: userId, domain, engine_ids: engineIds, content })
    .select()
    .single()

  if (error) {
    logger.error('saveLlmsTxtGeneration failed', { error: error.message })
    return null
  }
  return data as LlmsTxtGeneration
}

export async function getLlmsTxtGenerations(orgId: string): Promise<LlmsTxtGeneration[]> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('llms_txt_generations')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    logger.error('getLlmsTxtGenerations failed', { error: error.message })
    return []
  }
  return (data ?? []) as LlmsTxtGeneration[]
}

// ---------------------------------------------------------------------------
// Citation check runs
// ---------------------------------------------------------------------------
export async function getCitationRunsThisMonth(orgId: string): Promise<number> {
  const supabase = await createClient() as AnySupabase
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const { count, error } = await supabase
    .from('citation_check_runs')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', startOfMonth)
    .neq('status', 'failed')

  if (error) {
    logger.error('getCitationRunsThisMonth failed', { error: error.message })
    return 0
  }
  return count ?? 0
}

// Combined count — citation runs + AI Profile runs share one quota bucket
// (Boss decision 2026-05-10). Both feature canRun* checks must use this so a
// user can't exceed the plan limit by mixing feature types.
// Implemented as a sum of two count queries to avoid a UNION (the tables have
// different row shapes — only the create timestamp matters here).
export async function getAiVisibilityRunsThisMonth(orgId: string): Promise<number> {
  const supabase = await createClient() as AnySupabase
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [citationRes, profileRes] = await Promise.all([
    supabase
      .from('citation_check_runs')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', startOfMonth)
      .neq('status', 'failed'),
    supabase
      .from('ai_profile_runs')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', startOfMonth)
      .neq('status', 'failed'),
  ])

  if (citationRes.error) {
    logger.error('getAiVisibilityRunsThisMonth: citation count failed', { error: citationRes.error.message })
  }
  if (profileRes.error) {
    logger.error('getAiVisibilityRunsThisMonth: profile count failed', { error: profileRes.error.message })
  }

  return (citationRes.count ?? 0) + (profileRes.count ?? 0)
}

export async function canRunCitationCheck(
  orgId: string,
  planSlug: string,
  engineIds: string[],
  freeEngineIds: string[],
): Promise<{ allowed: boolean; reason?: string }> {
  // Free plan: only free engines allowed
  if (planSlug === 'free') {
    const hasNonFree = engineIds.some(id => !freeEngineIds.includes(id))
    if (hasNonFree) {
      return {
        allowed: false,
        reason: 'Free plan can only check free engines (Copilot, Exa). Upgrade to access all engines.',
      }
    }
    return { allowed: true }
  }

  const { citationMonthlyLimit: monthlyLimit } = await getAiVisibilityPlanLimits(planSlug)
  if (monthlyLimit === -1) return { allowed: true }
  if (monthlyLimit === 0) {
    return {
      allowed: false,
      reason: 'AI Citation Monitor is not available on your current plan. Upgrade to access this feature.',
    }
  }

  // Use combined citation + AI Profile count — quota is shared.
  const used = await getAiVisibilityRunsThisMonth(orgId)

  if (used >= monthlyLimit) {
    return {
      allowed: false,
      reason: `You have used all ${monthlyLimit} AI Visibility runs (citations + profile combined) for this month. Resets on the 1st.`,
    }
  }
  return { allowed: true }
}

export async function createCitationRun(
  orgId: string,
  userId: string,
  domain: string,
  keywords: string[],
  engineIds: string[],
  brandName?: string,
): Promise<CitationCheckRun | null> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('citation_check_runs')
    .insert({ org_id: orgId, user_id: userId, domain, keywords, engine_ids: engineIds, status: 'pending', brand_name: brandName ?? null })
    .select()
    .single()

  if (error) {
    logger.error('createCitationRun failed', { error: error.message })
    return null
  }
  return data as CitationCheckRun
}

export async function getCitationRuns(orgId: string, limit = 10): Promise<CitationCheckRun[]> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('citation_check_runs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('getCitationRuns failed', { error: error.message })
    return []
  }
  return (data ?? []) as CitationCheckRun[]
}

export async function getCitationRunById(runId: string): Promise<CitationCheckRun | null> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('citation_check_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (error) {
    logger.error('getCitationRunById failed', { error: error.message, runId })
    return null
  }
  return data as CitationCheckRun
}

export async function updateCitationRunStatus(
  runId: string,
  status: CitationCheckRun['status'],
  summary?: CitationSummary,
  errorMessage?: string,
): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const update: Record<string, unknown> = {
    status,
    ...(status === 'running'  && { started_at: new Date().toISOString() }),
    ...(status === 'complete' && { completed_at: new Date().toISOString(), summary }),
    ...(status === 'failed'   && { completed_at: new Date().toISOString(), error_message: errorMessage }),
  }

  const { error } = await supabase
    .from('citation_check_runs')
    .update(update)
    .eq('id', runId)

  if (error) {
    logger.error('updateCitationRunStatus failed', { error: error.message, runId })
    return false
  }
  return true
}

export async function saveCitationResults(
  results: Omit<CitationCheckResult, 'id' | 'created_at'>[],
): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabase
  const { error } = await supabase
    .from('citation_check_results')
    .insert(results)

  if (error) {
    logger.error('saveCitationResults failed', { error: error.message })
    return false
  }
  return true
}

export async function getCitationResults(runId: string): Promise<CitationCheckResult[]> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('citation_check_results')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('getCitationResults failed', { error: error.message, runId })
    return []
  }
  return (data ?? []) as CitationCheckResult[]
}
