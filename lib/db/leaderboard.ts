import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ============================================================
// Leaderboard — uses public_monitors + public_check_results
// Opt-in via show_on_leaderboard flag on public_monitors
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
 * Get top N sites ranked by uptime percentage.
 * Uses public_monitors that have show_on_leaderboard = true.
 * Falls back to all active public monitors for MVP.
 */
export async function getLeaderboardEntries(limit: number = 50): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient()

  // Get all active public monitors
  const { data: monitors, error } = await supabase
    .from('public_monitors')
    .select('id, domain, display_name, category, last_status, last_response_time_ms')
    .eq('is_active', true)
    .order('display_name', { ascending: true })

  if (error || !monitors) {
    logger.error('Failed to get leaderboard monitors', { error: error?.message })
    return []
  }

  // Calculate uptime for each monitor (last 30 days)
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const entries: LeaderboardEntry[] = []

  for (const monitor of monitors) {
    const { data: results } = await supabase
      .from('public_check_results')
      .select('status')
      .eq('monitor_id', monitor.id)
      .gte('checked_at', since.toISOString())

    if (!results || results.length === 0) continue

    const total = results.length
    const upCount = results.filter(r => r.status === 'up').length
    const uptimePct = Math.round((upCount / total) * 10000) / 100

    entries.push({
      id: monitor.id,
      domain: monitor.domain as string,
      display_name: monitor.display_name as string,
      category: (monitor.category as string) || 'Other',
      last_status: monitor.last_status as string,
      last_response_time_ms: monitor.last_response_time_ms as number | null,
      uptime_pct: uptimePct,
    })
  }

  // Sort by uptime descending, then by response time ascending
  entries.sort((a, b) => {
    if (b.uptime_pct !== a.uptime_pct) return b.uptime_pct - a.uptime_pct
    const aTime = a.last_response_time_ms ?? 9999
    const bTime = b.last_response_time_ms ?? 9999
    return aTime - bTime
  })

  return entries.slice(0, limit)
}
