import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { updateOutageBlogWithResolution } from '@/lib/services/blog-generator'

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
  status_page_url: string | null
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

export interface PaginatedPublicMonitors {
  monitors: PublicMonitor[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getActivePublicMonitorsPaginated(options: {
  page: number
  pageSize: number
  category?: string
}): Promise<PaginatedPublicMonitors> {
  const supabase = createAdminClient()
  const { page, pageSize, category } = options
  const offset = (page - 1) * pageSize

  let countQuery = supabase
    .from('public_monitors')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  let dataQuery = supabase
    .from('public_monitors')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('display_name', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (category && category !== 'all') {
    countQuery = countQuery.ilike('category', category)
    dataQuery = dataQuery.ilike('category', category)
  }

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery])

  if (countResult.error) {
    logger.error('Failed to count public monitors', { error: countResult.error.message })
  }
  if (dataResult.error) {
    logger.error('Failed to get paginated public monitors', { error: dataResult.error.message })
  }

  const total = countResult.count ?? 0
  const monitors = (dataResult.data ?? []) as unknown as PublicMonitor[]

  return {
    monitors,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/**
 * Get sites currently down or degraded, excluding a given domain.
 * Same category sites are returned first, then others — up to `limit` total.
 */
export async function getCurrentlyDownSites(
  excludeDomain: string,
  category: string,
  limit: number = 7
): Promise<Pick<PublicMonitor, 'id' | 'domain' | 'display_name' | 'category' | 'last_status'>[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('public_monitors')
    .select('id, domain, display_name, category, last_status')
    .in('last_status', ['down', 'degraded'])
    .eq('is_active', true)
    .neq('domain', excludeDomain)
    .order('category', { ascending: true })
    .limit(50) // fetch a pool, sort in JS to put same-category first

  if (error) {
    logger.error('Failed to get currently down sites', { error: error.message })
    return []
  }

  const rows = (data ?? []) as Pick<PublicMonitor, 'id' | 'domain' | 'display_name' | 'category' | 'last_status'>[]

  // Same category first, then others
  const sameCategory = rows.filter(r => r.category === category)
  const others = rows.filter(r => r.category !== category)

  return [...sameCategory, ...others].slice(0, limit)
}

export async function getPublicMonitorCategories(): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_monitors')
    .select('category')
    .eq('is_active', true)

  if (error) {
    logger.error('Failed to get public monitor categories', { error: error.message })
    return []
  }

  const categories = new Set<string>()
  for (const row of (data ?? []) as Array<{ category: string }>) {
    if (row.category) categories.add(row.category)
  }
  return Array.from(categories).sort()
}

export async function getPublicMonitorIncidentCount(monitorId: string, days: number = 30): Promise<number> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { count, error } = await supabase
    .from('public_incidents')
    .select('id', { count: 'exact', head: true })
    .eq('monitor_id', monitorId)
    .gte('started_at', since.toISOString())

  if (error) {
    logger.error('Failed to count public incidents', { error: error.message })
    return 0
  }
  return count ?? 0
}

export async function getPublicMonitorAvgResponseTime(monitorId: string, days: number = 30): Promise<number | null> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('public_check_results')
    .select('response_time_ms')
    .eq('monitor_id', monitorId)
    .eq('status', 'up')
    .gte('checked_at', since.toISOString())
    .not('response_time_ms', 'is', null)

  if (error || !data || data.length === 0) return null

  const times = data
    .map(r => (r as { response_time_ms: number | null }).response_time_ms)
    .filter((t): t is number => t !== null)

  if (times.length === 0) return null
  return Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
}

export async function getPublicMonitorByDomain(domain: string): Promise<PublicMonitor | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_monitors')
    .select('*')
    .eq('domain', domain)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    logger.error('Failed to get public monitor by domain', { error: error.message, domain })
    return null
  }
  return data ? (data as unknown as PublicMonitor) : null
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
  updates: { domain?: string; display_name?: string; category?: string; check_interval_seconds?: number; status_page_url?: string | null }
): Promise<PublicMonitor | null> {
  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = {}
  if (updates.domain !== undefined) updateData.domain = updates.domain
  if (updates.display_name !== undefined) updateData.display_name = updates.display_name
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.check_interval_seconds !== undefined) updateData.check_interval_seconds = updates.check_interval_seconds
  if (updates.status_page_url !== undefined) updateData.status_page_url = updates.status_page_url

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
  const now = new Date()
  const blogEligibleAfter = new Date(now.getTime() + 15 * 60 * 1000).toISOString()
  const { data: incident, error } = await supabase
    .from('public_incidents')
    .insert({
      monitor_id: data.monitor_id,
      cause: data.cause ?? null,
      status_code: data.status_code ?? null,
      started_at: now.toISOString(),
      blog_eligible_after: blogEligibleAfter,
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
  const now = new Date()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: incident } = await (supabase as any)
    .from('public_incidents')
    .select('id, started_at, blog_generated_at, blog_post_id')
    .eq('monitor_id', monitorId)
    .is('resolved_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (incident) {
    await supabase
      .from('public_incidents')
      .update({ resolved_at: now.toISOString() })
      .eq('id', incident.id)

    // If incident has a linked blog post, update it with resolution details
    if ((incident as { blog_generated_at?: string; blog_post_id?: number }).blog_generated_at && (incident as { blog_post_id?: number }).blog_post_id) {
      const startTime = new Date((incident as { started_at: string }).started_at).getTime()
      const endTime = now.getTime()
      const durationMs = endTime - startTime
      const durationMinutes = Math.ceil(durationMs / 60000)
      const durationHours = Math.floor(durationMinutes / 60)
      const durationRemainingMinutes = durationMinutes % 60

      const downtimeDuration = durationHours > 0
        ? `${durationHours}h ${durationRemainingMinutes}m`
        : `${durationMinutes}m`

      await updateOutageBlogWithResolution((incident as { blog_post_id: number }).blog_post_id, downtimeDuration, now.toISOString())
    }
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
