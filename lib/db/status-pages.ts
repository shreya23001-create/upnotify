import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { StatusPage } from '@/lib/types'

export async function getStatusPagesByMonitorId(monitorId: string): Promise<StatusPage[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('status_pages')
    .select('id, slug, monitor_ids')
    .contains('monitor_ids', [monitorId])
  if (error) {
    logger.error('Failed to get status pages by monitor', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as StatusPage[]
}

export async function getStatusPagesByWorkspace(workspaceId: string): Promise<StatusPage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('status_pages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get status pages', { error: error.message })
    return []
  }
  return data ?? []
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = createAdminClient()
  let query = supabase.from('status_pages').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query.limit(1)
  return (data?.length ?? 0) > 0
}

export async function getStatusPageBySlug(slug: string): Promise<StatusPage | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('status_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (error) { logger.error('Failed to get status page by slug', { error: error.message }); return null }
  return data
}

export async function getStatusPageById(id: string): Promise<StatusPage | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('status_pages').select('*').eq('id', id).single()
  if (error) { logger.error('Failed to get status page', { error: error.message }); return null }
  return data
}

export async function createStatusPage(input: {
  org_id: string; workspace_id: string; name: string; slug: string; monitor_ids: string[]; is_published?: boolean
}): Promise<StatusPage | null> {
  const supabase = createAdminClient()
  const { data: page, error } = await supabase.from('status_pages').insert(input).select().single()
  if (error) {
    if (error.code === '23505') { logger.warn('Slug already taken', { slug: input.slug }); return null }
    logger.error('Failed to create status page', { error: error.message })
    return null
  }
  return page
}

export async function updateStatusPage(id: string, updates: {
  name?: string; slug?: string; monitor_ids?: string[]; is_published?: boolean
}): Promise<StatusPage | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('status_pages').update(updates).eq('id', id).select().single()
  if (error) { logger.error('Failed to update status page', { error: error.message }); return null }
  return data
}

export async function deleteStatusPage(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('status_pages').delete().eq('id', id)
  if (error) { logger.error('Failed to delete status page', { error: error.message }); return false }
  return true
}

export async function getUptimePercentage(monitorId: string, days: number = 90): Promise<number> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('check_results')
    .select('status')
    .eq('monitor_id', monitorId)
    .gte('checked_at', since)
  if (error || !data || data.length === 0) return 100
  const upCount = data.filter(r => r.status === 'up').length
  return Math.round((upCount / data.length) * 10000) / 100
}

export async function subscribeToStatusPage(statusPageId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const token = crypto.randomUUID()
  const { error } = await supabase.from('status_page_subscribers').insert({
    status_page_id: statusPageId, email, confirmation_token: token
  })
  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already subscribed' }
    logger.error('Failed to subscribe', { error: error.message })
    return { success: false, error: 'Failed to subscribe' }
  }
  return { success: true }
}

export async function subscribeWebhookToStatusPage(
  statusPageId: string,
  webhookUrl: string,
  webhookType: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const token = crypto.randomUUID()
  // Store webhook subscriptions using a prefixed email field
  // Format: "webhook:<type>:<url>" — distinguishes from email subscribers
  const encodedEmail = `webhook:${webhookType}:${webhookUrl}`
  const { error } = await supabase.from('status_page_subscribers').insert({
    status_page_id: statusPageId,
    email: encodedEmail,
    confirmation_token: token,
  })
  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already subscribed' }
    logger.error('Failed to subscribe webhook', { error: error.message })
    return { success: false, error: 'Failed to subscribe' }
  }
  return { success: true }
}

export async function unsubscribeFromStatusPage(token: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('status_page_subscribers').delete().eq('unsubscribe_token', token)
  if (error) { logger.error('Failed to unsubscribe', { error: error.message }); return false }
  return true
}

export async function bulkDeleteStatusPages(ids: string[], orgId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('status_pages')
    .delete()
    .in('id', ids)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to bulk delete status pages', { error: error.message, count: ids.length })
    return false
  }
  logger.info('Bulk deleted status pages', { count: ids.length, orgId })
  return true
}

export async function bulkUpdateStatusPageVisibility(ids: string[], orgId: string, isPublished: boolean): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('status_pages')
    .update({ is_published: isPublished })
    .in('id', ids)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to bulk update status page visibility', { error: error.message, isPublished, count: ids.length })
    return false
  }
  logger.info('Bulk updated status page visibility', { count: ids.length, isPublished, orgId })
  return true
}
