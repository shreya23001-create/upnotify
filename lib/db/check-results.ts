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
  status: 'up' | 'down' | 'degraded' | 'none'
}

export async function getUptimeBarData(monitorId: string): Promise<UptimeSlot[]> {
  const supabase = createAdminClient()
  const now = new Date()
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('check_results')
    .select('status, checked_at')
    .eq('monitor_id', monitorId)
    .gte('checked_at', twelveHoursAgo.toISOString())
    .order('checked_at', { ascending: true })

  if (error) {
    logger.error('Failed to get uptime bar data', { error: error.message })
    return Array.from({ length: 48 }, (_, i) => ({
      slot: formatSlotTime(twelveHoursAgo, i),
      status: 'none' as const,
    }))
  }

  const results = data ?? []
  const slots: UptimeSlot[] = []

  for (let i = 0; i < 48; i++) {
    const slotStart = new Date(twelveHoursAgo.getTime() + i * 15 * 60 * 1000)
    const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000)

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

    slots.push({ slot: formatSlotTime(twelveHoursAgo, i), status })
  }

  return slots
}

/**
 * Get recent check results for all monitors in an organisation.
 * Used by the dashboard charts to show uptime and response time trends.
 */
export async function getRecentCheckResultsByMonitorIds(monitorIds: string[], days: number = 30): Promise<CheckResult[]> {
  if (monitorIds.length === 0) return []
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('check_results')
    .select('*')
    .in('monitor_id', monitorIds)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: true })
    .limit(5000)

  if (error) {
    logger.error('Failed to get check results by monitor IDs', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getRecentCheckResultsByOrg(orgId: string, days: number = 30): Promise<CheckResult[]> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('check_results')
    .select('*')
    .eq('org_id', orgId)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: true })
    .limit(5000)

  if (error) {
    logger.error('Failed to get recent check results by org', { error: error.message, orgId })
    return []
  }
  return data ?? []
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

  const { data, error } = await supabase
    .from('check_results')
    .select('status, checked_at')
    .eq('monitor_id', monitorId)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: true })

  if (error) {
    logger.error('Failed to get uptime bar data for range', { error: error.message })
    return Array.from({ length: config.slots }, (_, i) => ({
      slot: formatSlotTime(since, i, config.slotMinutes),
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

    slots.push({ slot: formatSlotTime(since, i, config.slotMinutes), status })
  }

  return slots
}
