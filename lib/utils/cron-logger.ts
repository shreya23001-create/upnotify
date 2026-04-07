/**
 * Cron run logger — every cron must call startCronRun() + endCronRun().
 * Writes to cron_run_log table for system health history.
 * Uses admin client (service role) — bypasses RLS.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untyped(client: unknown): any { return client }

/**
 * Call at the very start of a cron GET handler.
 * Returns a runId to pass to endCronRun().
 */
export async function startCronRun(
  cronPath: string,
  triggeredBy: 'schedule' | 'manual' = 'schedule'
): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await untyped(supabase)
      .from('cron_run_log')
      .insert({ cron_path: cronPath, status: 'running', triggered_by: triggeredBy })
      .select('id')
      .single()

    if (error) {
      logger.warn('Failed to start cron run log', { cronPath, error: error.message })
      return null
    }
    return (data as { id: string }).id
  } catch {
    return null
  }
}

/**
 * Call at the end of a cron handler (in both success and error paths).
 * Pass the runId from startCronRun(), status, and optional summary/error.
 */
export async function endCronRun(
  runId: string | null,
  startedAt: number,
  status: 'ok' | 'error',
  options?: { summary?: string; errorMessage?: string }
): Promise<void> {
  if (!runId) return
  try {
    const supabase = createAdminClient()
    await untyped(supabase)
      .from('cron_run_log')
      .update({
        status,
        duration_ms: Date.now() - startedAt,
        result_summary: options?.summary ?? null,
        error_message: options?.errorMessage ?? null,
      })
      .eq('id', runId)
  } catch {
    // Never let logging failure affect the cron itself
  }
}

/**
 * Detect if the request is a manual admin trigger (vs Vercel/cron-job.org schedule).
 * The trigger-cron endpoint passes x-cron-trigger: manual.
 */
export function getTriggeredBy(request: Request): 'schedule' | 'manual' {
  return request.headers.get('x-cron-trigger') === 'manual' ? 'manual' : 'schedule'
}
