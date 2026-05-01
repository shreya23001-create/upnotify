import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export interface OutagePriorityMonitor {
  id: number
  monitor_id: string
  service_group: string
  priority: number // 1=critical, 2=high
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OutageRssFeed {
  id: number
  source_name: string
  feed_url: string
  category_slug: string | null
  is_enabled: boolean
  last_fetched_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Priority Monitors
// ============================================================================

export async function getOutagePriorityMonitors(): Promise<OutagePriorityMonitor[]> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('outage_priority_monitors')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) throw error
    return (data || []) as OutagePriorityMonitor[]
  } catch (error) {
    logger.error('getOutagePriorityMonitors failed', { error: String(error) })
    return []
  }
}

export async function getOutagePriorityMonitor(monitorId: string): Promise<OutagePriorityMonitor | null> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('outage_priority_monitors')
      .select('*')
      .eq('monitor_id', monitorId)
      .single()

    if (error?.code === 'PGRST116') return null
    if (error) throw error
    return (data as OutagePriorityMonitor | null) || null
  } catch (error) {
    logger.error('getOutagePriorityMonitor failed', { monitorId, error: String(error) })
    return null
  }
}

export async function createOutagePriorityMonitor(
  monitorId: string,
  serviceGroup: string,
  priority: number = 1,
  notes?: string
): Promise<OutagePriorityMonitor | null> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('outage_priority_monitors')
      .insert({
        monitor_id: monitorId,
        service_group: serviceGroup,
        priority,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    logger.info('Created outage priority monitor', { monitorId, serviceGroup })
    return (data as OutagePriorityMonitor | null) || null
  } catch (error) {
    logger.error('createOutagePriorityMonitor failed', { monitorId, serviceGroup, error: String(error) })
    return null
  }
}

export async function updateOutagePriorityMonitor(
  id: number,
  updates: Partial<Omit<OutagePriorityMonitor, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('outage_priority_monitors')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    logger.error('updateOutagePriorityMonitor failed', { id, error: String(error) })
    return false
  }
}

export async function deleteOutagePriorityMonitor(id: number): Promise<boolean> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('outage_priority_monitors')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    logger.error('deleteOutagePriorityMonitor failed', { id, error: String(error) })
    return false
  }
}

export async function getServiceGroupForMonitor(monitorId: string): Promise<string | null> {
  try {
    const monitor = await getOutagePriorityMonitor(monitorId)
    return monitor?.service_group || null
  } catch (error) {
    logger.error('getServiceGroupForMonitor failed', { monitorId, error: String(error) })
    return null
  }
}

export async function hasOpenBlogForServiceGroup(serviceGroup: string): Promise<string | null> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('public_incidents')
      .select('id, blog_post_id')
      .eq('service_group', serviceGroup)
      .is('resolved_at', null)
      .not('blog_generated_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error?.code === 'PGRST116') return null
    if (error) throw error
    return (data as { blog_post_id: string | null } | null)?.blog_post_id || null
  } catch (error) {
    logger.error('hasOpenBlogForServiceGroup failed', { serviceGroup, error: String(error) })
    return null
  }
}

// ============================================================================
// RSS Feeds
// ============================================================================

export async function getOutageRssFeeds(): Promise<OutageRssFeed[]> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('outage_rss_feeds')
      .select('*')
      .eq('is_enabled', true)
      .order('source_name', { ascending: true })

    if (error) throw error
    return (data || []) as OutageRssFeed[]
  } catch (error) {
    logger.error('getOutageRssFeeds failed', { error: String(error) })
    return []
  }
}

export async function getOutageRssFeedsForCategory(categorySlug: string): Promise<OutageRssFeed[]> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('outage_rss_feeds')
      .select('*')
      .eq('is_enabled', true)
      .or(`category_slug.eq.${categorySlug},category_slug.is.null`)

    if (error) throw error
    return (data || []) as OutageRssFeed[]
  } catch (error) {
    logger.error('getOutageRssFeedsForCategory failed', { categorySlug, error: String(error) })
    return []
  }
}

export async function createOutageRssFeed(
  sourceName: string,
  feedUrl: string,
  categorySlug?: string | null
): Promise<OutageRssFeed | null> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('outage_rss_feeds')
      .insert({
        source_name: sourceName,
        feed_url: feedUrl,
        category_slug: categorySlug || null,
        is_enabled: true,
      })
      .select()
      .single()

    if (error) throw error
    logger.info('Created outage RSS feed', { sourceName, feedUrl })
    return (data as OutageRssFeed | null) || null
  } catch (error) {
    logger.error('createOutageRssFeed failed', { sourceName, feedUrl, error: String(error) })
    return null
  }
}

export async function updateOutageRssFeed(
  id: number,
  updates: Partial<Omit<OutageRssFeed, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('outage_rss_feeds')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    logger.error('updateOutageRssFeed failed', { id, error: String(error) })
    return false
  }
}

export async function deleteOutageRssFeed(id: number): Promise<boolean> {
  try {
    const client = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('outage_rss_feeds')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    logger.error('deleteOutageRssFeed failed', { id, error: String(error) })
    return false
  }
}
