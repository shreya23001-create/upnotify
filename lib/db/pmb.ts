import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// Tables added in migration 00068 — not yet in generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

// =============================================================================
// Types
// =============================================================================

export interface PmbCategory {
  id: number
  slug: string
  display_name: string
  emoji: string
  default_keywords: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  monitor_count?: number
}

export interface PmbRun {
  id: number
  run_key: string
  post_type: 'pairwise' | 'leaderboard' | 'category_report' | 'provider_report'
  category_slug: string
  monitor_id: string | null
  compare_monitor_id: string | null
  period_type: 'weekly' | 'monthly' | 'quarterly'
  period_start: string
  scheduled_for: string
  status: 'queued' | 'generating' | 'generated' | 'approved' | 'published' | 'failed' | 'discarded'
  blog_post_id: string | null
  error_message: string | null
  word_count: number | null
  generated_at: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  // Joined fields
  monitor_name?: string
  monitor_domain?: string
  compare_monitor_name?: string
  compare_monitor_domain?: string
}

export interface PmbMonitor {
  id: string
  domain: string
  display_name: string
  category: string
  is_active: boolean
  last_status: string
  last_response_time_ms: number | null
  pmb_enabled: boolean
  pmb_category: string | null
  pmb_keywords: string[]
  status_page_url: string | null
}

export interface PmbQueueStats {
  total_this_week: number
  queued: number
  generated: number
  approved: number
  failed: number
  today_queued: number
  today_generated: number
}

export interface CreatePmbRunInput {
  run_key: string
  post_type: PmbRun['post_type']
  category_slug: string
  monitor_id: string | null
  compare_monitor_id: string | null
  period_type: PmbRun['period_type']
  period_start: string
  scheduled_for: string
}

// =============================================================================
// Categories
// =============================================================================

export async function getPmbCategories(): Promise<PmbCategory[]> {
  const { data, error } = await db()
    .from('pmb_categories')
    .select('*')
    .order('display_name', { ascending: true })

  if (error) {
    logger.error('Failed to get PMB categories', { error: error.message })
    return []
  }
  return data ?? []
}

export async function updatePmbCategory(
  slug: string,
  updates: { default_keywords?: string[]; is_active?: boolean; emoji?: string }
): Promise<boolean> {
  const { error } = await db()
    .from('pmb_categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('slug', slug)

  if (error) {
    logger.error('Failed to update PMB category', { slug, error: error.message })
    return false
  }
  logger.info('PMB category updated', { slug })
  return true
}

// =============================================================================
// Monitors
// =============================================================================

export async function getPmbMonitors(): Promise<PmbMonitor[]> {
  const { data, error } = await db()
    .from('public_monitors')
    .select('id, domain, display_name, category, is_active, last_status, last_response_time_ms, pmb_enabled, pmb_category, pmb_keywords, status_page_url')
    .order('display_name', { ascending: true })

  if (error) {
    logger.error('Failed to get PMB monitors', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getPmbEnabledMonitors(): Promise<PmbMonitor[]> {
  const { data, error } = await db()
    .from('public_monitors')
    .select('id, domain, display_name, category, is_active, last_status, last_response_time_ms, pmb_enabled, pmb_category, pmb_keywords, status_page_url')
    .eq('pmb_enabled', true)
    .eq('is_active', true)
    .order('pmb_category', { ascending: true })
    .order('display_name', { ascending: true })

  if (error) {
    logger.error('Failed to get PMB-enabled monitors', { error: error.message })
    return []
  }
  return data ?? []
}

export async function updateMonitorPmbSettings(
  id: string,
  updates: { pmb_enabled?: boolean; pmb_category?: string | null; pmb_keywords?: string[]; status_page_url?: string | null }
): Promise<boolean> {
  const { error } = await db()
    .from('public_monitors')
    .update(updates)
    .eq('id', id)

  if (error) {
    logger.error('Failed to update monitor PMB settings', { id, error: error.message })
    return false
  }
  logger.info('Monitor PMB settings updated', { id })
  return true
}

// =============================================================================
// Runs / Queue
// =============================================================================

export async function getPmbQueueStats(weekStart: string): Promise<PmbQueueStats> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await db()
    .from('pmb_runs')
    .select('status, scheduled_for')
    .gte('period_start', weekStart)

  if (error) {
    logger.error('Failed to get PMB queue stats', { error: error.message })
    return { total_this_week: 0, queued: 0, generated: 0, approved: 0, failed: 0, today_queued: 0, today_generated: 0 }
  }

  const rows = (data ?? []) as Array<{ status: string; scheduled_for: string }>
  return {
    total_this_week: rows.length,
    queued:          rows.filter(r => r.status === 'queued').length,
    generated:       rows.filter(r => r.status === 'generated').length,
    approved:        rows.filter(r => r.status === 'approved').length,
    failed:          rows.filter(r => r.status === 'failed').length,
    today_queued:    rows.filter(r => r.status === 'queued' && r.scheduled_for === today).length,
    today_generated: rows.filter(r => r.status === 'generated' && r.scheduled_for === today).length,
  }
}

export async function getPmbRunsForDate(date: string, status?: string): Promise<PmbRun[]> {
  let query = db()
    .from('pmb_runs')
    .select('*')
    .eq('scheduled_for', date)

  if (status) query = query.eq('status', status)

  const { data, error } = await query.order('post_type', { ascending: true }).order('id', { ascending: true })

  if (error) {
    logger.error('Failed to get PMB runs for date', { date, error: error.message })
    return []
  }
  return data ?? []
}

export async function getPmbRunsAdmin(options: {
  status?: string
  date?: string
  period_type?: string
  limit?: number
  offset?: number
}): Promise<PmbRun[]> {
  let query = db()
    .from('pmb_runs')
    .select(`
      *,
      monitor:monitor_id (display_name, domain),
      compare_monitor:compare_monitor_id (display_name, domain)
    `)

  if (options.status)      query = query.eq('status', options.status)
  if (options.date)        query = query.eq('scheduled_for', options.date)
  if (options.period_type) query = query.eq('period_type', options.period_type)

  const limit = options.limit ?? 50
  const offset = options.offset ?? 0

  const { data, error } = await query
    .order('scheduled_for', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.error('Failed to get PMB runs for admin', { error: error.message })
    return []
  }

  // Flatten joined fields
  return ((data ?? []) as Array<PmbRun & { monitor: { display_name: string; domain: string } | null; compare_monitor: { display_name: string; domain: string } | null }>).map(r => ({
    ...r,
    monitor_name:          r.monitor?.display_name ?? undefined,
    monitor_domain:        r.monitor?.domain ?? undefined,
    compare_monitor_name:  r.compare_monitor?.display_name ?? undefined,
    compare_monitor_domain: r.compare_monitor?.domain ?? undefined,
  }))
}

/** Claim the next batch of queued runs for today — marks them 'generating' atomically */
export async function claimQueuedRunsForToday(limit: number = 5): Promise<PmbRun[]> {
  const today = new Date().toISOString().split('T')[0]

  // Reset any stuck 'generating' runs older than 10 min
  const stuckCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  await db()
    .from('pmb_runs')
    .update({ status: 'queued' })
    .eq('status', 'generating')
    .lt('created_at', stuckCutoff)

  const { data, error } = await db()
    .from('pmb_runs')
    .select('*')
    .eq('status', 'queued')
    .eq('scheduled_for', today)
    .order('id', { ascending: true })
    .limit(limit)

  if (error || !data || data.length === 0) return []

  const ids = (data as PmbRun[]).map(r => r.id)
  await db()
    .from('pmb_runs')
    .update({ status: 'generating' })
    .in('id', ids)

  return data as PmbRun[]
}

export async function updatePmbRunResult(
  id: number,
  result: {
    status: PmbRun['status']
    blog_post_id?: string | null
    error_message?: string | null
    word_count?: number | null
    generated_at?: string | null
  }
): Promise<void> {
  const { error } = await db()
    .from('pmb_runs')
    .update(result)
    .eq('id', id)

  if (error) {
    logger.error('Failed to update PMB run result', { id, error: error.message })
  }
}

export async function approvePmbRun(id: number, approvedBy: string): Promise<boolean> {
  const { error } = await db()
    .from('pmb_runs')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: approvedBy })
    .eq('id', id)
    .in('status', ['generated'])

  if (error) {
    logger.error('Failed to approve PMB run', { id, error: error.message })
    return false
  }
  return true
}

export async function approvePmbRunsForDate(date: string, approvedBy: string): Promise<number> {
  const { data, error } = await db()
    .from('pmb_runs')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: approvedBy })
    .eq('scheduled_for', date)
    .eq('status', 'generated')
    .select('id')

  if (error) {
    logger.error('Failed to bulk approve PMB runs', { date, error: error.message })
    return 0
  }
  return (data ?? []).length
}

export async function discardPmbRun(id: number): Promise<boolean> {
  const { error } = await db()
    .from('pmb_runs')
    .update({ status: 'discarded' })
    .eq('id', id)

  if (error) {
    logger.error('Failed to discard PMB run', { id, error: error.message })
    return false
  }
  return true
}

export async function retryPmbRun(id: number): Promise<boolean> {
  const { error } = await db()
    .from('pmb_runs')
    .update({ status: 'queued', error_message: null, blog_post_id: null })
    .eq('id', id)
    .eq('status', 'failed')

  if (error) {
    logger.error('Failed to retry PMB run', { id, error: error.message })
    return false
  }
  return true
}

export async function retryFailedRunsForDate(date: string): Promise<number> {
  const { data, error } = await db()
    .from('pmb_runs')
    .update({ status: 'queued', error_message: null, blog_post_id: null })
    .eq('scheduled_for', date)
    .eq('status', 'failed')
    .select('id')

  if (error) {
    logger.error('Failed to retry failed PMB runs', { date, error: error.message })
    return 0
  }
  return (data ?? []).length
}

/** Bulk-insert week plan runs. Skips existing run_keys (dedup). Returns count inserted. */
export async function createPmbRuns(runs: CreatePmbRunInput[]): Promise<number> {
  if (runs.length === 0) return 0

  const { data, error } = await db()
    .from('pmb_runs')
    .insert(runs)
    .select('id')
    .on_conflict('run_key')
    .ignore()

  // Supabase JS v2 uses onConflict
  if (error) {
    // Try with onConflict syntax
    const { data: data2, error: error2 } = await db()
      .from('pmb_runs')
      .upsert(runs, { onConflict: 'run_key', ignoreDuplicates: true })
      .select('id')

    if (error2) {
      logger.error('Failed to create PMB runs', { error: error2.message })
      return 0
    }
    return (data2 ?? []).length
  }

  return (data ?? []).length
}

/** Check if a week plan already exists to prevent double-planning */
export async function pmbWeekPlanExists(weekStart: string): Promise<boolean> {
  const { count, error } = await db()
    .from('pmb_runs')
    .select('id', { count: 'exact', head: true })
    .eq('period_start', weekStart)
    .eq('period_type', 'weekly')

  if (error) return false
  return (count ?? 0) > 0
}

/** Check if today's queue is fully processed (no queued or generating items) */
export async function isTodayQueueComplete(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]

  const { count } = await db()
    .from('pmb_runs')
    .select('id', { count: 'exact', head: true })
    .eq('scheduled_for', today)
    .in('status', ['queued', 'generating'])

  return (count ?? 0) === 0
}

// =============================================================================
// Cron history (reuses cron_run_log table)
// =============================================================================

export interface PmbCronRun {
  id: string
  cron_path: string
  status: string
  triggered_by: string
  duration_ms: number | null
  result_summary: string | null
  error_message: string | null
  started_at: string
}

export async function getPmbCronHistory(
  paths: string[],
  perPath: number = 10
): Promise<Record<string, PmbCronRun[]>> {
  const { data, error } = await db()
    .from('cron_run_log')
    .select('*')
    .in('cron_path', paths)
    .order('started_at', { ascending: false })
    .limit(paths.length * perPath)

  if (error) {
    logger.error('Failed to get PMB cron history', { error: error.message })
    return {}
  }

  const result: Record<string, PmbCronRun[]> = {}
  for (const path of paths) result[path] = []

  for (const row of (data ?? []) as PmbCronRun[]) {
    if (result[row.cron_path] && result[row.cron_path].length < perPath) {
      result[row.cron_path].push(row)
    }
  }

  return result
}
