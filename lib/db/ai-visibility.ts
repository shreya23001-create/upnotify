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
// Plan limits
// ---------------------------------------------------------------------------
const LLMS_TXT_LIMITS: Record<string, number> = {
  free:    1,      // lifetime
  lite:    999999, // unlimited
  builder: 999999,
  scale:   999999,
}

const CITATION_MONTHLY_LIMITS: Record<string, number> = {
  free:    0,  // free engines only — handled separately
  lite:    2,
  builder: 4,
  scale:   4,
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
  const limit = LLMS_TXT_LIMITS[planSlug] ?? 1
  if (limit >= 999999) return { allowed: true }

  const count = await getLlmsTxtGenerationCount(orgId)
  if (count >= limit) {
    return {
      allowed: false,
      reason: planSlug === 'free'
        ? 'Free plan includes one llms.txt generation. Upgrade to generate unlimited files.'
        : `You have reached your generation limit for this plan.`,
    }
  }
  return { allowed: true }
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

  const monthlyLimit = CITATION_MONTHLY_LIMITS[planSlug] ?? 0
  const used = await getCitationRunsThisMonth(orgId)

  if (used >= monthlyLimit) {
    return {
      allowed: false,
      reason: `You have used all ${monthlyLimit} citation checks for this month. Resets on the 1st.`,
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
): Promise<CitationCheckRun | null> {
  const supabase = await createClient() as AnySupabase
  const { data, error } = await supabase
    .from('citation_check_runs')
    .insert({ org_id: orgId, user_id: userId, domain, keywords, engine_ids: engineIds, status: 'pending' })
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
