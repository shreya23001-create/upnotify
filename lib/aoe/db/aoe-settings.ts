// =============================================================================
// AOE — Automated Outreach Engine
// DB: aoe_settings — admin-controlled toggles
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { AoeSettings } from '../types'

// ---------------------------------------------------------------------------
// Read all settings as a typed object
// ---------------------------------------------------------------------------

export async function getAoeSettings(): Promise<AoeSettings> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('aoe_settings')
    .select('key, value')

  if (error) {
    logger.error('AOE: failed to load settings', { error: error.message })
    // Return safe defaults — all campaigns disabled if settings unreadable
    return {
      master_enabled: false,
      campaign_ssl_expiry: false,
      campaign_site_down: false,
      campaign_ecom_down: false,
      campaign_compete_cold: false,
      campaign_ai_seo: false,
      last_day_burst_enabled: false,
      daily_discovery_limit: 1000,
      daily_email_limit: 500,
      cooldown_days: 30,
    }
  }

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }

  return {
    master_enabled:           map['master_enabled']         === 'true',
    campaign_ssl_expiry:      map['campaign_ssl_expiry']    === 'true',
    campaign_site_down:       map['campaign_site_down']     === 'true',
    campaign_ecom_down:       map['campaign_ecom_down']     === 'true',
    campaign_compete_cold:    map['campaign_compete_cold']  === 'true',
    campaign_ai_seo:          map['campaign_ai_seo']        === 'true',
    last_day_burst_enabled:   map['last_day_burst_enabled'] === 'true',
    daily_discovery_limit:    parseInt(map['daily_discovery_limit'] ?? '5000', 10),
    daily_email_limit:        parseInt(map['daily_email_limit']     ?? '2000', 10),
    cooldown_days:            parseInt(map['cooldown_days']         ?? '30',   10),
  }
}

// ---------------------------------------------------------------------------
// Update a single setting (admin panel)
// ---------------------------------------------------------------------------

export async function updateAoeSetting(
  key: string,
  value: string,
  updatedBy: string,
): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('aoe_settings')
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: updatedBy }, { onConflict: 'key' })

  if (error) {
    logger.error('AOE: failed to update setting', { key, error: error.message })
    return false
  }

  logger.info('AOE: setting updated', { key, value, updatedBy })
  return true
}

// ---------------------------------------------------------------------------
// Get all settings as raw rows (for admin display)
// ---------------------------------------------------------------------------

export async function getAoeSettingsRaw(): Promise<{ key: string; value: string; updated_at: string; updated_by: string | null }[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('aoe_settings')
    .select('key, value, updated_at, updated_by')
    .order('key')

  if (error) {
    logger.error('AOE: failed to load raw settings', { error: error.message })
    return []
  }

  return data ?? []
}
