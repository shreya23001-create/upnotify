import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ============================================================
// Leaderboard — uses public_monitors + public_check_results
// 30-day uptime ranking, aggregated entirely in Postgres.
// ============================================================

export interface LeaderboardEntry {
  id: string
  domain: string
  display_name: string
  category: string
  last_status: string
  last_response_time_ms: number | null
  uptime_pct: number
}

/**
 * Get top N active public sites ranked by 30-day uptime percentage.
 *
 * Aggregation runs entirely in Postgres via the `get_leaderboard` RPC
 * (migration 00110) — a single indexed GROUP BY over public_check_results.
 * This replaced an N+1 loop that fetched 30 days of raw rows per monitor and
 * counted them in JS, which pushed the ISR build past the 60s static-generation
 * limit (engineering-app#65 / #69). Monitors with no checks in the last 30 days
 * are excluded by the inner join.
 */
export async function getLeaderboardEntries(limit: number = 50): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit })

  if (error || !data) {
    logger.error('Failed to get leaderboard entries', { error: error?.message })
    return []
  }

  return data.map((row) => ({
    id: row.id,
    domain: row.domain,
    display_name: row.display_name,
    category: row.category,
    last_status: row.last_status,
    last_response_time_ms: row.last_response_time_ms,
    uptime_pct: Number(row.uptime_pct),
  }))
}
