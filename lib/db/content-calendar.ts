import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// content_calendar + boss_digest_runs are introduced in migration 00085.
// Until that migration applies and database.types.ts is regenerated, the
// typed admin client does not recognise them. Cast to the base
// SupabaseClient locally — remove this helper once types regenerate.
function getRawClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalendarPostType =
  | 'hub_foundational'
  | 'troubleshooting'
  | 'informational'
  | 'commercial'
  | 'combined_intent'

export type CalendarStatus =
  | 'planned'
  | 'generating'
  | 'drafted'
  | 'approved'
  | 'published'
  | 'failed'
  | 'skipped'

export type CalendarAuthor = 'Aradhna' | 'Sachin' | 'Steve' | 'Krithi'

export interface CalendarRow {
  id: string
  publish_date: string         // YYYY-MM-DD
  post_type: CalendarPostType
  hub: string | null
  primary_keyword: string
  secondary_keywords: string[]
  search_volume: number | null
  kd: number | null
  url_path: string
  title_draft: string
  author: CalendarAuthor
  brand_prefix_required: boolean
  status: CalendarStatus
  blog_post_id: string | null
  generated_at: string | null
  failed_at: string | null
  failure_reason: string | null
  created_at: string
  updated_at: string
}

export interface CalendarRowInput {
  publish_date: string
  post_type: CalendarPostType
  hub: string | null
  primary_keyword: string
  secondary_keywords: string[]
  search_volume: number | null
  kd: number | null
  url_path: string
  title_draft: string
  author: CalendarAuthor
  brand_prefix_required: boolean
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Pick the next calendar row due for generation.
 * "Due" = status='planned' AND publish_date <= today.
 * Oldest-first within today's batch.
 */
export async function getNextDueCalendarRow(): Promise<CalendarRow | null> {
  const supabase = getRawClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('status', 'planned')
    .lte('publish_date', today)
    .order('publish_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('content_calendar.getNextDueCalendarRow failed', { error: error.message })
    return null
  }

  return data as CalendarRow | null
}

/**
 * Get all rows for a given date — used by admin views.
 */
export async function getCalendarRowsByDate(date: string): Promise<CalendarRow[]> {
  const supabase = getRawClient()
  const { data, error } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('publish_date', date)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('content_calendar.getCalendarRowsByDate failed', { error: error.message })
    return []
  }
  return (data ?? []) as CalendarRow[]
}

/**
 * Get existing slugs from blog_posts + content_calendar (planned/in-flight),
 * for slug-collision check.
 */
export async function getAllReservedSlugs(): Promise<string[]> {
  const supabase = getRawClient()

  const [{ data: blogSlugs }, { data: calendarPaths }] = await Promise.all([
    supabase.from('blog_posts').select('slug'),
    supabase.from('content_calendar').select('url_path').not('url_path', 'is', null),
  ])

  const slugs = new Set<string>()
  for (const row of blogSlugs ?? []) {
    if (row.slug) slugs.add(row.slug as string)
  }
  for (const row of calendarPaths ?? []) {
    const path = row.url_path as string
    if (!path) continue
    // Extract slug portion from /blog/<slug> or /tools/<slug>
    const match = path.match(/^\/(?:blog|tools)\/([^/]+)$/)
    if (match) slugs.add(match[1])
  }
  return [...slugs]
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Bulk insert calendar rows — used by the seed script that imports
 * keyword-research/Content_Calendar.csv into the DB.
 *
 * Returns count inserted (skipping any that already exist by url_path).
 */
export async function bulkInsertCalendarRows(rows: CalendarRowInput[]): Promise<number> {
  if (rows.length === 0) return 0

  const supabase = getRawClient()
  const { data, error } = await supabase
    .from('content_calendar')
    .upsert(rows, { onConflict: 'url_path', ignoreDuplicates: true })
    .select('id')

  if (error) {
    logger.error('content_calendar.bulkInsertCalendarRows failed', { error: error.message, count: rows.length })
    throw error
  }
  return data?.length ?? 0
}

/**
 * Mark a row as 'generating' — atomic claim for the cron.
 * Returns the claimed row, or null if another worker beat us to it.
 */
export async function claimCalendarRow(id: string): Promise<CalendarRow | null> {
  const supabase = getRawClient()
  const { data, error } = await supabase
    .from('content_calendar')
    .update({ status: 'generating' })
    .eq('id', id)
    .eq('status', 'planned')
    .select('*')
    .maybeSingle()

  if (error) {
    logger.error('content_calendar.claimCalendarRow failed', { id, error: error.message })
    return null
  }
  return data as CalendarRow | null
}

/**
 * Update a row after generation — links to blog_posts.id on success,
 * or stores failure reason on failure.
 */
export async function updateCalendarRowResult(
  id: string,
  update: {
    status: CalendarStatus
    blog_post_id?: string | null
    generated_at?: string | null
    failed_at?: string | null
    failure_reason?: string | null
  }
): Promise<void> {
  const supabase = getRawClient()
  const { error } = await supabase
    .from('content_calendar')
    .update(update)
    .eq('id', id)

  if (error) {
    logger.error('content_calendar.updateCalendarRowResult failed', { id, error: error.message })
    throw error
  }
}

/**
 * Reset stuck 'generating' rows back to 'planned'.
 * Called at top of draft-runner cron in case a previous run crashed.
 */
export async function resetStuckGeneratingRows(olderThanMinutes = 30): Promise<number> {
  const supabase = getRawClient()
  const threshold = new Date(Date.now() - olderThanMinutes * 60_000).toISOString()
  const { data, error } = await supabase
    .from('content_calendar')
    .update({ status: 'planned' })
    .eq('status', 'generating')
    .lt('updated_at', threshold)
    .select('id')

  if (error) {
    logger.error('content_calendar.resetStuckGeneratingRows failed', { error: error.message })
    return 0
  }
  return data?.length ?? 0
}