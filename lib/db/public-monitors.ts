import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ============================================================
// Types for public tracker tables (not in generated DB types yet)
// ============================================================

export interface PublicMonitor {
  id: string
  domain: string
  display_name: string
  category: string
  check_interval_seconds: number
  is_active: boolean
  last_checked_at: string | null
  last_status: string
  last_response_time_ms: number | null
  created_at: string
  updated_at: string
}

export interface PublicCheckResult {
  id: string
  monitor_id: string
  status: string
  response_time_ms: number | null
  status_code: number | null
  error_message: string | null
  checked_at: string
}

export interface PublicIncident {
  id: string
  monitor_id: string
  started_at: string
  resolved_at: string | null
  cause: string | null
  status_code: number | null
}

export interface PublicAlertSubscriber {
  id: string
  monitor_id: string
  email: string
  verified: boolean
  verification_token: string
  created_at: string
}

// ============================================================
// Read queries (use admin client — public_monitors has public SELECT RLS)
// ============================================================

export async function getAllPublicMonitors(): Promise<PublicMonitor[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_monitors')
    .select('*')
    .order('category', { ascending: true })
    .order('display_name', { ascending: true })

  if (error) {
    logger.error('Failed to get all public monitors', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as PublicMonitor[]
}

export async function getActivePublicMonitors(): Promise<PublicMonitor[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_monitors')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('display_name', { ascending: true })

  if (error) {
    logger.error('Failed to get active public monitors', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as PublicMonitor[]
}

export async function getPublicMonitorByDomain(domain: string): Promise<PublicMonitor | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_monitors')
    .select('*')
    .eq('domain', domain)
    .single()

  if (error) {
    logger.error('Failed to get public monitor by domain', { error: error.message, domain })
    return null
  }
  return data as unknown as PublicMonitor
}

export async function getPublicMonitorById(id: string): Promise<PublicMonitor | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_monitors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to get public monitor by id', { error: error.message, id })
    return null
  }
  return data as unknown as PublicMonitor
}

// ============================================================
// Write queries (admin client — service role bypasses RLS)
// ============================================================

export async function createPublicMonitor(data: {
  domain: string
  display_name: string
  category?: string
  check_interval_seconds?: number
}): Promise<PublicMonitor | null> {
  const supabase = createAdminClient()
  const { data: monitor, error } = await supabase
    .from('public_monitors')
    .insert({
      domain: data.domain,
      display_name: data.display_name,
      category: data.category ?? 'other',
      check_interval_seconds: data.check_interval_seconds ?? 300,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create public monitor', { error: error.message, domain: data.domain })
    return null
  }
  return monitor as unknown as PublicMonitor
}

export async function updatePublicMonitor(
  id: string,
  updates: { domain?: string; display_name?: string; category?: string; check_interval_seconds?: number }
): Promise<PublicMonitor | null> {
  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = {}
  if (updates.domain !== undefined) updateData.domain = updates.domain
  if (updates.display_name !== undefined) updateData.display_name = updates.display_name
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.check_interval_seconds !== undefined) updateData.check_interval_seconds = updates.check_interval_seconds

  const { data, error } = await supabase
    .from('public_monitors')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update public monitor', { error: error.message, id })
    return null
  }
  return data as unknown as PublicMonitor
}

export async function deletePublicMonitor(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('public_monitors')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete public monitor', { error: error.message, id })
    return false
  }
  return true
}

export async function togglePublicMonitor(id: string, isActive: boolean): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('public_monitors')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    logger.error('Failed to toggle public monitor', { error: error.message, id, isActive })
    return false
  }
  return true
}

export async function updatePublicMonitorStatus(
  id: string,
  updates: { last_status: string; last_checked_at: string; last_response_time_ms?: number | null }
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('public_monitors')
    .update(updates)
    .eq('id', id)

  if (error) {
    logger.error('Failed to update public monitor status', { error: error.message, id })
  }
}

// ============================================================
// Check results
// ============================================================

export async function writePublicCheckResult(data: {
  monitor_id: string
  status: string
  response_time_ms?: number
  status_code?: number
  error_message?: string
}): Promise<PublicCheckResult | null> {
  const supabase = createAdminClient()
  const { data: result, error } = await supabase
    .from('public_check_results')
    .insert(data)
    .select()
    .single()

  if (error) {
    logger.error('Failed to write public check result', { error: error.message })
    return null
  }
  return result as unknown as PublicCheckResult
}

export async function getPublicCheckResults(monitorId: string, days: number = 7): Promise<PublicCheckResult[]> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('public_check_results')
    .select('*')
    .eq('monitor_id', monitorId)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: false })
    .limit(500)

  if (error) {
    logger.error('Failed to get public check results', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as PublicCheckResult[]
}

// ============================================================
// Incidents
// ============================================================

export async function getPublicIncidents(monitorId: string): Promise<PublicIncident[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_incidents')
    .select('*')
    .eq('monitor_id', monitorId)
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) {
    logger.error('Failed to get public incidents', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as PublicIncident[]
}

export async function getOpenPublicIncident(monitorId: string): Promise<PublicIncident | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_incidents')
    .select('*')
    .eq('monitor_id', monitorId)
    .is('resolved_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as unknown as PublicIncident
}

export async function createPublicIncident(data: {
  monitor_id: string
  cause?: string
  status_code?: number
}): Promise<PublicIncident | null> {
  const supabase = createAdminClient()
  const { data: incident, error } = await supabase
    .from('public_incidents')
    .insert({
      monitor_id: data.monitor_id,
      cause: data.cause ?? null,
      status_code: data.status_code ?? null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create public incident', { error: error.message })
    return null
  }
  return incident as unknown as PublicIncident
}

export async function resolvePublicIncident(monitorId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: incident } = await supabase
    .from('public_incidents')
    .select('*')
    .eq('monitor_id', monitorId)
    .is('resolved_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (incident) {
    await supabase
      .from('public_incidents')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', incident.id)
  }
}

// ============================================================
// Uptime calculation
// ============================================================

export async function calculatePublicUptime(monitorId: string, days: number = 30): Promise<number> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('public_check_results')
    .select('status')
    .eq('monitor_id', monitorId)
    .gte('checked_at', since.toISOString())

  if (error || !data || data.length === 0) return 100

  const total = data.length
  const upCount = data.filter(r => r.status === 'up').length
  return Math.round((upCount / total) * 10000) / 100
}

// ============================================================
// Subscribers
// ============================================================

export async function subscribeToPublicMonitor(monitorId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('public_alert_subscribers')
    .select('id')
    .eq('monitor_id', monitorId)
    .eq('email', email)
    .single()

  if (existing) {
    return { success: true } // Already subscribed, return success silently
  }

  const { error } = await supabase
    .from('public_alert_subscribers')
    .insert({ monitor_id: monitorId, email })

  if (error) {
    logger.error('Failed to subscribe to public monitor', { error: error.message })
    return { success: false, error: 'Failed to subscribe. Please try again.' }
  }

  return { success: true }
}
