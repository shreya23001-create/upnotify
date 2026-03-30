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

function formatSlotTime(base: Date, slotIndex: number): string {
  const time = new Date(base.getTime() + slotIndex * 15 * 60 * 1000)
  return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
