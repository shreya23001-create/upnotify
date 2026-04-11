import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// Tables added in migration 00064 - not yet in generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db() { return createAdminClient() as unknown as any }

// =============================================================================
// Types
// =============================================================================

export interface AutoblogChannel {
  id: string
  key: string
  name: string
  description: string | null
  is_enabled: boolean
  post_to_social: boolean
  cron_path: string | null
  created_at: string
  updated_at: string
}

export interface AutoblogSource {
  id: string
  name: string
  url: string
  type: string
  category: string | null
  is_enabled: boolean
  last_fetched_at: string | null
  item_count: number
  created_at: string
}

export interface AutoblogFeedItem {
  id: string
  source_id: string
  title: string
  url: string
  summary: string | null
  published_at: string | null
  is_processed: boolean
  fetched_at: string
}

export interface AutoblogTopic {
  id: string
  name: string
  prompt: string
  schedule: string
  keywords: string[]
  is_enabled: boolean
  post_to_social: boolean
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export interface AutoblogRun {
  id: string
  channel_key: string | null
  topic_id: string | null
  blog_post_id: string | null
  title: string | null
  status: string
  confidence_score: number | null
  sources_count: number
  source_key: string | null
  post_to_social: boolean
  error_message: string | null
  ran_at: string
}

// =============================================================================
// Channels
// =============================================================================

export async function getAutoblogChannels(): Promise<AutoblogChannel[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_channels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to get autoblog channels', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogChannel[]
}

export async function toggleAutoblogChannel(key: string, isEnabled: boolean): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('autoblog_channels')
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('key', key)

  if (error) {
    logger.error('Failed to toggle autoblog channel', { error: error.message, key })
    return false
  }
  return true
}

export async function updateAutoblogChannel(key: string, updates: { post_to_social?: boolean }): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('autoblog_channels')
    .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('key', key)

  if (error) {
    logger.error('Failed to update autoblog channel', { error: error.message, key })
    return false
  }
  return true
}

export async function getAutoblogChannelByKey(key: string): Promise<AutoblogChannel | null> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_channels')
    .select('*')
    .eq('key', key)
    .single()

  if (error) return null
  return data as unknown as AutoblogChannel
}

// =============================================================================
// Sources
// =============================================================================

export async function getAutoblogSources(): Promise<AutoblogSource[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_sources')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    logger.error('Failed to get autoblog sources', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogSource[]
}

export async function getEnabledAutoblogSources(): Promise<AutoblogSource[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_sources')
    .select('*')
    .eq('is_enabled', true)
    .order('category', { ascending: true })

  if (error) {
    logger.error('Failed to get enabled autoblog sources', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogSource[]
}

export async function createAutoblogSource(input: {
  name: string
  url: string
  type?: string
  category?: string
}): Promise<AutoblogSource | null> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_sources')
    .insert({
      name: input.name,
      url: input.url,
      type: input.type ?? 'rss',
      category: input.category ?? 'other',
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create autoblog source', { error: error.message })
    return null
  }
  return data as unknown as AutoblogSource
}

export async function toggleAutoblogSource(id: string, isEnabled: boolean): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('autoblog_sources')
    .update({ is_enabled: isEnabled } as Record<string, unknown>)
    .eq('id', id)

  if (error) {
    logger.error('Failed to toggle autoblog source', { error: error.message, id })
    return false
  }
  return true
}

export async function deleteAutoblogSource(id: string): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('autoblog_sources')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete autoblog source', { error: error.message, id })
    return false
  }
  return true
}

export async function updateSourceFetchStats(id: string, itemCount: number): Promise<void> {
  const supabase = db()
  await supabase
    .from('autoblog_sources')
    .update({
      last_fetched_at: new Date().toISOString(),
      item_count: itemCount,
    } as Record<string, unknown>)
    .eq('id', id)
}

// =============================================================================
// Feed Items
// =============================================================================

export async function upsertFeedItems(items: Array<{
  source_id: string
  title: string
  url: string
  summary?: string | null
  published_at?: string | null
}>): Promise<number> {
  if (items.length === 0) return 0
  const supabase = db()

  // Insert new items only - skip existing URLs (unique constraint on url)
  const { data, error } = await supabase
    .from('autoblog_feed_items')
    .upsert(items, { onConflict: 'url', ignoreDuplicates: true })
    .select('id')

  if (error) {
    logger.error('Failed to upsert feed items', { error: error.message })
    return 0
  }
  return data?.length ?? 0
}

export async function getUnprocessedFeedItems(limit = 100): Promise<AutoblogFeedItem[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_feed_items')
    .select('*')
    .eq('is_processed', false)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get unprocessed feed items', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogFeedItem[]
}

export async function getRecentFeedItems(hours = 48, limit = 200): Promise<AutoblogFeedItem[]> {
  const supabase = db()
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('autoblog_feed_items')
    .select('*')
    .gte('fetched_at', since)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get recent feed items', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogFeedItem[]
}

export async function markFeedItemsProcessed(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = db()
  await supabase
    .from('autoblog_feed_items')
    .update({ is_processed: true } as Record<string, unknown>)
    .in('id', ids)
}

// =============================================================================
// Topics
// =============================================================================

export async function getAutoblogTopics(): Promise<AutoblogTopic[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_topics')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get autoblog topics', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogTopic[]
}

export async function getEnabledAutoblogTopics(): Promise<AutoblogTopic[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_topics')
    .select('*')
    .eq('is_enabled', true)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to get enabled autoblog topics', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogTopic[]
}

export async function createAutoblogTopic(input: {
  name: string
  prompt: string
  schedule: string
  keywords?: string[]
  post_to_social?: boolean
}): Promise<AutoblogTopic | null> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_topics')
    .insert({
      name: input.name,
      prompt: input.prompt,
      schedule: input.schedule,
      keywords: input.keywords ?? [],
      post_to_social: input.post_to_social ?? true,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create autoblog topic', { error: error.message })
    return null
  }
  return data as unknown as AutoblogTopic
}

export async function updateAutoblogTopic(id: string, updates: Partial<{
  name: string
  prompt: string
  schedule: string
  keywords: string[]
  is_enabled: boolean
  post_to_social: boolean
}>): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('autoblog_topics')
    .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', id)

  if (error) {
    logger.error('Failed to update autoblog topic', { error: error.message, id })
    return false
  }
  return true
}

export async function deleteAutoblogTopic(id: string): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('autoblog_topics')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete autoblog topic', { error: error.message, id })
    return false
  }
  return true
}

export async function updateTopicLastRun(id: string): Promise<void> {
  const supabase = db()
  await supabase
    .from('autoblog_topics')
    .update({ last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', id)
}

// =============================================================================
// Runs
// =============================================================================

export async function createAutoblogRun(input: {
  channel_key?: string | null
  topic_id?: string | null
  blog_post_id?: string | null
  title?: string | null
  status: string
  confidence_score?: number | null
  sources_count?: number
  source_key?: string | null
  post_to_social?: boolean
  error_message?: string | null
}): Promise<string | null> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_runs')
    .insert({
      channel_key: input.channel_key ?? null,
      topic_id: input.topic_id ?? null,
      blog_post_id: input.blog_post_id ?? null,
      title: input.title ?? null,
      status: input.status,
      confidence_score: input.confidence_score ?? null,
      sources_count: input.sources_count ?? 0,
      source_key: input.source_key ?? null,
      post_to_social: input.post_to_social ?? false,
      error_message: input.error_message ?? null,
    })
    .select('id')
    .single()

  if (error) {
    logger.error('Failed to create autoblog run', { error: error.message })
    return null
  }
  return data?.id ?? null
}

export async function getAutoblogRuns(limit = 50): Promise<AutoblogRun[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('autoblog_runs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get autoblog runs', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as AutoblogRun[]
}

export async function sourceKeyAlreadyProcessed(sourceKey: string): Promise<boolean> {
  const supabase = db()
  const { count } = await supabase
    .from('autoblog_runs')
    .select('id', { count: 'exact', head: true })
    .eq('source_key', sourceKey)
    .in('status', ['generated', 'skipped'])

  return (count ?? 0) > 0
}
