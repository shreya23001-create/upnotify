import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { CheckResult } from '@/lib/types'
import type { Json } from '@/lib/types/database.types'

export async function writeCheckResult(data: {
  org_id: string
  monitor_id: string
  status: string
  response_time_ms?: number
  status_code?: number
  region?: string
  error_message?: string
  metadata?: Record<string, unknown>
}): Promise<CheckResult | null> {
  const supabase = createAdminClient()
  const { data: result, error } = await supabase
    .from('check_results')
    .insert({ ...data, metadata: (data.metadata ?? {}) as Json })
    .select()
    .single()

  if (error) {
    logger.error('Failed to write check result', { error: error.message })
    return null
  }
  return result
}

export async function getCheckResultsByMonitor(monitorId: string, limit: number = 50): Promise<CheckResult[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('check_results')
    .select('*')
    .eq('monitor_id', monitorId)
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get check results', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getLatestCheckResult(monitorId: string): Promise<CheckResult | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('check_results')
    .select('*')
    .eq('monitor_id', monitorId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    logger.error('Failed to get latest check result', { error: error.message })
    return null
  }
  return data
}

interface UptimeSlot {
  slot: string
  timestamp: string   // ISO 8601 — slot start time, used by TimelineBarGraph
  status: 'up' | 'down' | 'degraded' | 'none'
}

// Max bars shown in the 24h table column — floors at 5-min granularity (288 slots)
const UPTIME_BAR_MAX = 288

export async function getUptimeBarData(monitorId: string, checkIntervalSeconds: number = 300): Promise<UptimeSlot[]> {
  const supabase = createAdminClient()

  // Fixed 24-hour window — always the same period regardless of check interval
  const now = new Date()
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Slot duration: use the monitor's own interval, but never smaller than 300s
  // so we never exceed 288 bars (86400 / 300 = 288)
  const slotSeconds = Math.max(checkIntervalSeconds, Math.ceil(86400 / UPTIME_BAR_MAX))
  const numSlots = Math.floor(86400 / slotSeconds)

  // PostgREST silently caps unbounded selects at 1,000 rows. A 1-minute
  // monitor over 24 hours produces 1,440 rows, so the bar chart was missing
  // the last ~8 hours of data. Cap at 1,440 explicitly — covers 24h at 1-min
  // intervals, far more than we need for the slot bucketing below.
  // engineering-app#57.
  const { data, error } = await supabase
    .from('check_results')
    .select('status, checked_at')
    .eq('monitor_id', monitorId)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: true })
    .limit(1440)

  if (error) {
    logger.error('Failed to get uptime bar data', { error: error.message })
    return Array.from({ length: numSlots }, (_, i) => ({
      slot: new Date(since.getTime() + i * slotSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(since.getTime() + i * slotSeconds * 1000).toISOString(),
      status: 'none' as const,
    }))
  }

  const results = data ?? []
  const slots: UptimeSlot[] = []

  for (let i = 0; i < numSlots; i++) {
    const slotStart = new Date(since.getTime() + i * slotSeconds * 1000)
    const slotEnd   = new Date(slotStart.getTime() + slotSeconds * 1000)

    const checksInSlot = results.filter(r => {
      const t = new Date(r.checked_at).getTime()
      return t >= slotStart.getTime() && t < slotEnd.getTime()
    })

    let status: UptimeSlot['status'] = 'none'
    if (checksInSlot.length > 0) {
      if (checksInSlot.some(c => c.status === 'down'))     status = 'down'
      else if (checksInSlot.some(c => c.status === 'degraded')) status = 'degraded'
      else status = 'up'
    }

    slots.push({
      slot: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: slotStart.toISOString(),
      status,
    })
  }

  return slots
}

/**
 * Get recent check results for all monitors in an organisation.
 * Used by the dashboard charts to show uptime and response time trends.
 * IDs are chunked into batches of 50 to avoid PostgREST URL-length limits.
 */
/**
 * Lightweight projection of CheckResult — only the fields the dashboard
 * stats API actually renders. Excluding metadata (2–5 KB per row of JSONB)
 * cuts the wire payload by ~30× on a 5,000-row response.
 * engineering-app#59.
 */
export type DashboardCheckResult = Pick<CheckResult, 'status' | 'response_time_ms' | 'checked_at' | 'monitor_id'>

export async function getRecentCheckResultsByMonitorIds(monitorIds: string[], days: number = 30): Promise<DashboardCheckResult[]> {
  if (monitorIds.length === 0) return []
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const CHUNK = 50
  const chunks: string[][] = []
  for (let i = 0; i < monitorIds.length; i += CHUNK) {
    chunks.push(monitorIds.slice(i, i + CHUNK))
  }

  const results = await Promise.all(chunks.map(async (chunk) => {
    const { data, error } = await supabase
      .from('check_results')
      .select('status, response_time_ms, checked_at, monitor_id')
      .in('monitor_id', chunk)
      .gte('checked_at', since.toISOString())
      .order('checked_at', { ascending: true })
      .limit(5000)

    if (error) {
      logger.error('Failed to get check results by monitor IDs', { error: error.message })
      return []
    }
    return (data ?? []) as DashboardCheckResult[]
  }))

  return results.flat()
}

export async function getRecentCheckResultsByOrg(orgId: string, days: number = 30): Promise<DashboardCheckResult[]> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('check_results')
    .select('status, response_time_ms, checked_at, monitor_id')
    .eq('org_id', orgId)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: true })
    .limit(5000)

  if (error) {
    logger.error('Failed to get recent check results by org', { error: error.message, orgId })
    return []
  }
  return (data ?? []) as DashboardCheckResult[]
}

function formatSlotTime(base: Date, slotIndex: number, slotMinutes: number = 15): string {
  const time = new Date(base.getTime() + slotIndex * slotMinutes * 60 * 1000)
  return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Calculate the uptime percentage for a monitor over a given number of days.
 * Returns a value between 0 and 100 (e.g. 99.97).
 * If no check results exist, returns 100.
 */
export async function getMonitorUptimePercentage(monitorId: string, days: number = 30): Promise<number> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('check_results')
    .select('status')
    .eq('monitor_id', monitorId)
    .gte('checked_at', since.toISOString())

  if (error) {
    logger.error('Failed to calculate uptime percentage', { error: error.message, monitorId })
    return 100
  }

  if (!data || data.length === 0) return 100

  const total = data.length
  const upCount = data.filter(r => r.status === 'up').length
  return Math.round((upCount / total) * 10000) / 100
}

const rangeConfig: Record<string, { hours: number; slots: number; slotMinutes: number }> = {
  '24h': { hours: 24, slots: 48, slotMinutes: 30 },
  '7d': { hours: 168, slots: 56, slotMinutes: 180 },
  '30d': { hours: 720, slots: 60, slotMinutes: 720 },
  '90d': { hours: 2160, slots: 90, slotMinutes: 1440 },
}

export async function getUptimeBarDataForRange(monitorId: string, range: string): Promise<UptimeSlot[]> {
  const config = rangeConfig[range] || rangeConfig['24h']
  const supabase = createAdminClient()
  const now = new Date()
  const since = new Date(now.getTime() - config.hours * 60 * 60 * 1000)

  // PostgREST silently caps unlimited SELECTs at 1,000 rows; a 1-minute
  // monitor over 90 days has 129,600 rows. Bumping to 50,000 covers the
  // common cases (7d/30d at any interval, 90d at 5-min+). Very high-frequency
  // monitors over the full 90-day range still risk truncation — addressed
  // later by a pre-aggregation table.
  const { data, error } = await supabase
    .from('check_results')
    .select('status, checked_at')
    .eq('monitor_id', monitorId)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: true })
    .limit(50000)

  if (error) {
    logger.error('Failed to get uptime bar data for range', { error: error.message })
    return Array.from({ length: config.slots }, (_, i) => ({
      slot: formatSlotTime(since, i, config.slotMinutes),
      timestamp: new Date(since.getTime() + i * config.slotMinutes * 60 * 1000).toISOString(),
      status: 'none' as const,
    }))
  }

  const results = data ?? []
  const slots: UptimeSlot[] = []

  for (let i = 0; i < config.slots; i++) {
    const slotStart = new Date(since.getTime() + i * config.slotMinutes * 60 * 1000)
    const slotEnd = new Date(slotStart.getTime() + config.slotMinutes * 60 * 1000)

    const checksInSlot = results.filter(r => {
      const t = new Date(r.checked_at).getTime()
      return t >= slotStart.getTime() && t < slotEnd.getTime()
    })

    let status: UptimeSlot['status'] = 'none'
    if (checksInSlot.length > 0) {
      if (checksInSlot.some(c => c.status === 'down')) status = 'down'
      else if (checksInSlot.some(c => c.status === 'degraded')) status = 'degraded'
      else status = 'up'
    }

    slots.push({ slot: formatSlotTime(since, i, config.slotMinutes), timestamp: slotStart.toISOString(), status })
  }

  return slots
}
