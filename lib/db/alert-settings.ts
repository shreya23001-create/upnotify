import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export type AlertMode = 'off' | 'smart'
export type SeverityFloor = 'critical' | 'warning' | 'all'

export interface OrgAlertSettings {
  org_id: string
  mode: AlertMode
  digest_window_minutes: 5 | 10 | 30 | 60
  instant_severity_floor: SeverityFloor
  same_host_grouping: boolean
  flap_badge_threshold: number
  created_at: string
  updated_at: string
}

const DEFAULT_SETTINGS: Omit<OrgAlertSettings, 'org_id' | 'created_at' | 'updated_at'> = {
  mode: 'smart',
  digest_window_minutes: 30,
  instant_severity_floor: 'critical',
  same_host_grouping: true,
  flap_badge_threshold: 3,
}

// Type-erased client until tables are in generated types
function client(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

/**
 * Always returns a settings row — if none exists for this org (e.g. signup
 * before the migration ran, or org created via SQL not the app), inserts the
 * default 'off' row to preserve per-event behaviour. Caller never has to
 * branch on null.
 */
export async function getOrgAlertSettings(orgId: string): Promise<OrgAlertSettings> {
  const supabase = client()
  const { data, error } = await supabase
    .from('org_alert_settings')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle()

  if (error) {
    logger.warn('alert-settings: read failed, falling back to defaults', { orgId, error: error.message })
    return { org_id: orgId, ...DEFAULT_SETTINGS, created_at: '', updated_at: '' }
  }

  if (data) return data as OrgAlertSettings

  // First-touch: insert defaults so the next read is fast.
  // New orgs always start on Smart Digest (mode='smart').
  const insert = { org_id: orgId, ...DEFAULT_SETTINGS }
  const { data: inserted, error: insertErr } = await supabase
    .from('org_alert_settings')
    .insert(insert)
    .select('*')
    .single()

  if (insertErr || !inserted) {
    logger.warn('alert-settings: default insert failed, returning ephemeral defaults', { orgId, error: insertErr?.message })
    return { org_id: orgId, ...DEFAULT_SETTINGS, created_at: '', updated_at: '' }
  }

  return inserted as OrgAlertSettings
}

export interface UpdateAlertSettingsInput {
  mode?: AlertMode
  digest_window_minutes?: 5 | 10 | 30 | 60
  instant_severity_floor?: SeverityFloor
  same_host_grouping?: boolean
  flap_badge_threshold?: number
}

export async function updateOrgAlertSettings(
  orgId: string,
  patch: UpdateAlertSettingsInput
): Promise<{ success: boolean; error?: string }> {
  // Ensure a row exists before update — UPSERT keeps the API simple for callers.
  await getOrgAlertSettings(orgId)

  const supabase = client()
  const { error } = await supabase
    .from('org_alert_settings')
    .update(patch)
    .eq('org_id', orgId)

  if (error) {
    logger.error('alert-settings: update failed', { orgId, error: error.message, patch })
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Returns true when the incoming severity is at or above the configured
 * floor — i.e. should bypass the buffer and send instantly every time.
 */
export function severityAtOrAboveFloor(severity: string, floor: SeverityFloor): boolean {
  // Numeric ranking: critical > warning > info. Lower number = higher severity.
  const rank = (s: string): number => {
    const v = (s || '').toLowerCase()
    if (v === 'critical' || v === 'p1') return 1
    if (v === 'warning' || v === 'p2' || v === 'high') return 2
    return 3 // info / p3 / unknown — lowest
  }
  const incomingRank = rank(severity)
  const floorRank = floor === 'critical' ? 1 : floor === 'warning' ? 2 : 3
  return incomingRank <= floorRank
}
