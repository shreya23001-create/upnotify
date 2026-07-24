import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export type EventType = 'open' | 'recovery'

export interface BufferedEventInput {
  org_id: string
  monitor_id: string
  incident_id: string | null
  event_type: EventType
  severity: string
  subject: string
  headline: string
  detail?: string
  monitor_name: string
  monitor_target: string
  monitor_type: string
  metadata?: Record<string, unknown>
  instant_sent_at?: string | null // ISO timestamp; null if buffered only
}

export interface BufferedEvent extends BufferedEventInput {
  id: string
  digested_at: string | null
  created_at: string
}

function client(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

/**
 * Insert one event into the buffer. If `instant_sent_at` is set, the event
 * was also sent as an instant email — it still appears in the next digest
 * so the digest tells the full story.
 */
export async function bufferEvent(input: BufferedEventInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = client()
  const { data, error } = await supabase
    .from('pending_alert_events')
    .insert({
      org_id: input.org_id,
      monitor_id: input.monitor_id,
      incident_id: input.incident_id,
      event_type: input.event_type,
      severity: input.severity,
      subject: input.subject,
      headline: input.headline,
      detail: input.detail ?? null,
      monitor_name: input.monitor_name,
      monitor_target: input.monitor_target,
      monitor_type: input.monitor_type,
      metadata: input.metadata ?? {},
      instant_sent_at: input.instant_sent_at ?? null,
    })
    .select('id')
    .single()

  if (error || !data) {
    logger.error('alert-buffer: insert failed', { error: error?.message, orgId: input.org_id })
    return { ok: false, error: error?.message ?? 'insert failed' }
  }
  return { ok: true, id: data.id as string }
}

/**
 * Returns true if there is at least one un-digested event for this org.
 * Used to decide "is this the first event in this org's current window?"
 *
 * Note: "first in window" is defined as "no other un-digested events
 * exist". Once the flusher digests a batch, the next event becomes the
 * new "first" and triggers another instant email.
 */
export async function hasPendingEventsForOrg(orgId: string): Promise<boolean> {
  const supabase = client()
  const { count, error } = await supabase
    .from('pending_alert_events')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .is('digested_at', null)

  if (error) {
    logger.warn('alert-buffer: count check failed; treating as has-events to be safe', { orgId, error: error.message })
    return true // safer to NOT send a duplicate instant on error
  }
  return (count ?? 0) > 0
}

/**
 * Find every org that has at least one un-digested event whose age
 * exceeds the org's configured digest_window_minutes. The flusher cron
 * uses this to know who to flush.
 */
export async function getOrgsReadyToFlush(): Promise<Array<{
  org_id: string
  digest_window_minutes: number
  oldest_event_at: string
  event_count: number
}>> {
  const supabase = client()
  // Single round-trip via SQL — relies on Postgres directly. Falls back to
  // two-query if rpc isn't deployed.
  type Row = {
    org_id: string
    digest_window_minutes: number
    oldest_event_at: string
    event_count: number
  }
  const { data, error } = await supabase.rpc('get_orgs_ready_to_flush')

  if (!error && data) return data as Row[]

  // Fallback — slower but works without the SQL function. Joins client-side.
  logger.warn('alert-buffer: rpc get_orgs_ready_to_flush unavailable, using fallback', { error: error?.message })

  const { data: pending, error: pendingErr } = await supabase
    .from('pending_alert_events')
    .select('org_id, created_at')
    .is('digested_at', null)

  if (pendingErr || !pending) {
    logger.error('alert-buffer: fallback pending-events query failed — no orgs will be flushed this tick', {
      error: pendingErr?.message,
    })
    return []
  }

  const grouped = new Map<string, { oldest: string; count: number }>()
  for (const row of pending as Array<{ org_id: string; created_at: string }>) {
    const cur = grouped.get(row.org_id)
    if (!cur || row.created_at < cur.oldest) {
      grouped.set(row.org_id, { oldest: row.created_at, count: (cur?.count ?? 0) + 1 })
    } else {
      cur.count += 1
    }
  }

  if (grouped.size === 0) return []

  const orgIds = [...grouped.keys()]
  const { data: settings, error: setErr } = await supabase
    .from('org_alert_settings')
    .select('org_id, digest_window_minutes')
    .in('org_id', orgIds)

  if (setErr || !settings) return []

  const settingsByOrg = new Map(
    (settings as Array<{ org_id: string; digest_window_minutes: number }>).map(s => [s.org_id, s.digest_window_minutes])
  )

  const now = Date.now()
  const ready: Row[] = []
  for (const [orgId, info] of grouped) {
    const window = settingsByOrg.get(orgId) ?? 30
    const oldestMs = new Date(info.oldest).getTime()
    if (now - oldestMs >= window * 60 * 1000) {
      ready.push({
        org_id: orgId,
        digest_window_minutes: window,
        oldest_event_at: info.oldest,
        event_count: info.count,
      })
    }
  }
  return ready
}

// PostgREST silently caps an unbounded select at 1000 rows. A flapping fleet
// can buffer far more than that, so we PAGE through with .range() until a short
// page comes back — otherwise only the oldest 1000 are ever fetched (and the
// rest never get digested → the same digest re-sends forever).
const PENDING_PAGE = 1000

export async function getPendingEventsForOrg(orgId: string): Promise<BufferedEvent[]> {
  const supabase = client()
  const all: BufferedEvent[] = []
  let from = 0

  for (;;) {
    const { data, error } = await supabase
      .from('pending_alert_events')
      .select('*')
      .eq('org_id', orgId)
      .is('digested_at', null)
      .order('created_at', { ascending: true })
      .range(from, from + PENDING_PAGE - 1)

    if (error) {
      logger.error('alert-buffer: fetch pending failed', { orgId, error: error.message, from })
      break
    }
    if (!data || data.length === 0) break
    all.push(...(data as BufferedEvent[]))
    if (data.length < PENDING_PAGE) break
    from += PENDING_PAGE
  }

  return all
}

// A single .in('id', [...]) with ~1000 uuids builds an oversized request that
// PostgREST rejects (URI/query limit) — the update then silently fails and the
// events never get digested. Chunk the ids so each statement stays small.
const MARK_CHUNK = 200

export async function markEventsDigested(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return
  const supabase = client()
  const now = new Date().toISOString()

  for (let i = 0; i < eventIds.length; i += MARK_CHUNK) {
    const batch = eventIds.slice(i, i + MARK_CHUNK)
    const { error } = await supabase
      .from('pending_alert_events')
      .update({ digested_at: now })
      .in('id', batch)

    if (error) {
      logger.error('alert-buffer: mark-digested batch failed', { error: error.message, count: batch.length })
    }
  }
}
