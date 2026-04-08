// =============================================================================
// AOE — Automated Outreach Engine
// DB: aoe_site_checks — nightly silent check results
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { AOE_CONFIG } from '../config'
import type { AoeSiteCheck, AoeSiteCategory, AoeSiteCheckSummary } from '../types'

// ---------------------------------------------------------------------------
// Log a check result
// ---------------------------------------------------------------------------

export async function logSiteCheck(input: {
  domain: string
  responseTimeMs: number | null
  statusCode: number | null
  isDown: boolean
  sslExpiryDays: number | null
  errorMessage: string | null
  checkNumber: number
}): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('aoe_site_checks')
    .insert({
      domain: input.domain,
      checked_at: new Date().toISOString(),
      response_time_ms: input.responseTimeMs,
      status_code: input.statusCode,
      is_down: input.isDown,
      ssl_expiry_days: input.sslExpiryDays,
      error_message: input.errorMessage,
      check_number: input.checkNumber,
    })

  if (error) {
    logger.error('AOE: failed to log site check', { domain: input.domain, error: error.message })
  }
}

// ---------------------------------------------------------------------------
// Get all checks for a domain
// ---------------------------------------------------------------------------

export async function getSiteChecks(domain: string): Promise<AoeSiteCheck[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aoe_site_checks')
    .select('*')
    .eq('domain', domain)
    .order('check_number', { ascending: true })

  if (error) return []
  return (data ?? []) as AoeSiteCheck[]
}

// ---------------------------------------------------------------------------
// Categorise a domain after 3 nights of checks
// hasLlmsTxt: pass the result of the llms.txt check from aoe_site_discovery
// Priority: down > ssl_expiry > slow > ecom_issue > compete > no_llms_txt > skip
// ---------------------------------------------------------------------------

export async function categorizeSite(
  domain: string,
  platform: string | null,
  hasLlmsTxt?: boolean | null,
): Promise<AoeSiteCheckSummary> {
  const checks = await getSiteChecks(domain)
  const { campaigns } = AOE_CONFIG

  const downCount     = checks.filter(c => c.is_down).length
  const slowCount     = checks.filter(c => !c.is_down && (c.response_time_ms ?? 0) > campaigns.site_slow.slowThresholdMs).length
  const responseTimes = checks.filter(c => c.response_time_ms !== null).map(c => c.response_time_ms as number)
  const avgResponseMs = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0
  const worstResponseMs = responseTimes.length > 0 ? Math.max(...responseTimes) : 0
  const sslExpiryDays = checks.find(c => c.ssl_expiry_days !== null)?.ssl_expiry_days ?? null

  let category: AoeSiteCategory = 'skip'

  if (downCount >= 1) {
    category = (platform === 'shopify' || platform === 'woocommerce') ? 'ecom_issue' : 'down'
  } else if (sslExpiryDays !== null && sslExpiryDays <= 14) {
    category = 'ssl_expiry'
  } else if (slowCount >= 4) {
    category = 'slow'
  } else if (platform === 'shopify' || platform === 'woocommerce') {
    category = 'compete' // no issues, but ecommerce — pitch Compete
  } else if (hasLlmsTxt === false) {
    category = 'no_llms_txt' // healthy site missing llms.txt — pitch AI SEO tools
  }

  return {
    domain,
    platform: platform as AoeSiteCheckSummary['platform'],
    category,
    downCount,
    slowCount,
    avgResponseMs,
    sslExpiryDays,
    worstResponseMs,
  }
}

// ---------------------------------------------------------------------------
// Delete old checks (cleanup — keep last 30 days only)
// ---------------------------------------------------------------------------

export async function deleteOldSiteChecks(): Promise<void> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  await supabase
    .from('aoe_site_checks')
    .delete()
    .lt('checked_at', cutoff)
}
