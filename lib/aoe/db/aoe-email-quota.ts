// =============================================================================
// AOE — Automated Outreach Engine
// DB: aoe_email_quota — monthly quota tracking
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { AOE_CONFIG } from '../config'
import type { AoeEmailQuota, AoeQuotaState, AoeQuotaStatus } from '../types'

// ---------------------------------------------------------------------------
// Get current month string YYYY-MM
// ---------------------------------------------------------------------------

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Get or create quota record for current month
// ---------------------------------------------------------------------------

export async function getOrCreateQuota(): Promise<AoeEmailQuota | null> {
  const supabase = createAdminClient()
  const month = getCurrentMonth()

  const { data: existing } = await supabase
    .from('aoe_email_quota')
    .select('*')
    .eq('month', month)
    .single()

  if (existing) return existing as AoeEmailQuota

  // Create fresh quota record for this month
  const { quota } = AOE_CONFIG
  const hardReserve = Math.ceil(quota.monthlyLimit * quota.hardReservePercent)

  const { data, error } = await supabase
    .from('aoe_email_quota')
    .insert({
      month,
      total_quota: quota.monthlyLimit,
      reserved_alerts: 0,
      safety_buffer: 0,
      hard_reserve: hardReserve,
      available_marketing: quota.monthlyLimit - hardReserve,
      monitors_with_email: 0,
      status_page_subs: 0,
      marketing_sent: 0,
      alert_sent: 0,
      burst_sent: 0,
      status: 'active',
      calculated_at: null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.error('AOE: failed to create quota record', { month, error: error.message })
    return null
  }

  return data as AoeEmailQuota
}

// ---------------------------------------------------------------------------
// Update quota after recalculation (quota manager cron)
// ---------------------------------------------------------------------------

export async function upsertQuota(input: {
  month: string
  reservedAlerts: number
  safetyBuffer: number
  hardReserve: number
  availableMarketing: number
  monitorsWithEmail: number
  statusPageSubs: number
  status: AoeQuotaStatus
}): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('aoe_email_quota')
    .upsert({
      month: input.month,
      total_quota: AOE_CONFIG.quota.monthlyLimit,
      reserved_alerts: input.reservedAlerts,
      safety_buffer: input.safetyBuffer,
      hard_reserve: input.hardReserve,
      available_marketing: input.availableMarketing,
      monitors_with_email: input.monitorsWithEmail,
      status_page_subs: input.statusPageSubs,
      status: input.status,
      calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'month' })

  if (error) {
    logger.error('AOE: failed to upsert quota', { error: error.message })
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// Increment marketing_sent counter
// ---------------------------------------------------------------------------

export async function incrementMarketingSent(count: number): Promise<void> {
  const supabase = createAdminClient()
  const month = getCurrentMonth()

  const { error } = await supabase.rpc('aoe_increment_marketing_sent', {
    p_month: month,
    p_count: count,
  })

  // Fallback if RPC not available — read then write
  if (error) {
    const { data } = await supabase
      .from('aoe_email_quota')
      .select('marketing_sent')
      .eq('month', month)
      .single()

    if (data) {
      await supabase
        .from('aoe_email_quota')
        .update({ marketing_sent: (data.marketing_sent ?? 0) + count, updated_at: new Date().toISOString() })
        .eq('month', month)
    }
  }
}

// ---------------------------------------------------------------------------
// Increment burst_sent counter
// ---------------------------------------------------------------------------

export async function incrementBurstSent(count: number): Promise<void> {
  const supabase = createAdminClient()
  const month = getCurrentMonth()

  const { data } = await supabase
    .from('aoe_email_quota')
    .select('burst_sent')
    .eq('month', month)
    .single()

  if (data) {
    await supabase
      .from('aoe_email_quota')
      .update({ burst_sent: (data.burst_sent ?? 0) + count, updated_at: new Date().toISOString() })
      .eq('month', month)
  }
}

// ---------------------------------------------------------------------------
// Update quota status (paused_85, upgrade_required_95)
// ---------------------------------------------------------------------------

export async function updateQuotaStatus(status: AoeQuotaStatus): Promise<void> {
  const supabase = createAdminClient()
  const month = getCurrentMonth()

  await supabase
    .from('aoe_email_quota')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('month', month)
}

// ---------------------------------------------------------------------------
// Get current quota state — used by sending crons before every send
// ---------------------------------------------------------------------------

export async function getQuotaState(): Promise<AoeQuotaState | null> {
  const quota = await getOrCreateQuota()
  if (!quota) return null

  const remainingMarketing = Math.max(0, quota.available_marketing - quota.marketing_sent)

  return {
    availableForMarketing: quota.available_marketing,
    alreadySentMarketing: quota.marketing_sent,
    remainingMarketing,
    hardReserve: quota.hard_reserve,
    status: quota.status,
    isMarketingAllowed: quota.status === 'active' && remainingMarketing > 0,
  }
}

// ---------------------------------------------------------------------------
// Get last day burst available quota
// Remaining quota minus hard reserve (2%)
// ---------------------------------------------------------------------------

export async function getBurstQuota(): Promise<number> {
  const quota = await getOrCreateQuota()
  if (!quota) return 0

  const totalSent = quota.marketing_sent + quota.alert_sent + quota.burst_sent
  const remaining = quota.total_quota - totalSent - quota.hard_reserve

  return Math.max(0, remaining)
}

// ---------------------------------------------------------------------------
// Get quota for admin dashboard display
// ---------------------------------------------------------------------------

export async function getQuotaForDashboard(): Promise<AoeEmailQuota | null> {
  const supabase = createAdminClient()
  const month = getCurrentMonth()

  const { data, error } = await supabase
    .from('aoe_email_quota')
    .select('*')
    .eq('month', month)
    .single()

  if (error) return null
  return data as AoeEmailQuota
}
