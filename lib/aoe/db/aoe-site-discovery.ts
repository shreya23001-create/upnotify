// =============================================================================
// AOE — Automated Outreach Engine
// DB: aoe_site_discovery — sites queued for monitoring then emailing
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { AoeEmailSource, AoePlatform, AoeSiteDiscovery, AoeSiteStatus } from '../types'

// ---------------------------------------------------------------------------
// Insert a newly discovered site (skip duplicates)
// ---------------------------------------------------------------------------

export async function insertDiscoveredSite(input: {
  domain: string
  platform: AoePlatform | null
  email: string | null
  emailSource: AoeEmailSource | null
}): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('aoe_site_discovery')
    .upsert({
      domain: input.domain,
      platform: input.platform,
      email: input.email,
      email_source: input.emailSource,
      status: input.email ? 'pending_check' : 'skip',
      skip_reason: input.email ? null : 'no_email',
      discovered_at: new Date().toISOString(),
    }, { onConflict: 'domain', ignoreDuplicates: true })

  if (error) {
    logger.error('AOE: failed to insert discovered site', { domain: input.domain, error: error.message })
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// Get sites pending nightly check (batch for checker cron)
// ---------------------------------------------------------------------------

export async function getSitesPendingCheck(limit: number): Promise<AoeSiteDiscovery[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aoe_site_discovery')
    .select('*')
    .in('status', ['pending_check', 'checking'])
    .lt('check_count', 18) // max 18 checks (3 nights × 6)
    .order('discovered_at', { ascending: true })
    .limit(limit)

  if (error) {
    logger.error('AOE: failed to get sites pending check', { error: error.message })
    return []
  }

  return (data ?? []) as AoeSiteDiscovery[]
}

// ---------------------------------------------------------------------------
// Increment check count and update status
// ---------------------------------------------------------------------------

export async function incrementCheckCount(domain: string): Promise<void> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('aoe_site_discovery')
    .select('check_count')
    .eq('domain', domain)
    .single()

  if (data) {
    const newCount = (data.check_count ?? 0) + 1
    await supabase
      .from('aoe_site_discovery')
      .update({
        check_count: newCount,
        status: 'checking',
        last_checked_at: new Date().toISOString(),
      })
      .eq('domain', domain)
  }
}

// ---------------------------------------------------------------------------
// Mark site as ready to email (after 3 nights of checks)
// ---------------------------------------------------------------------------

export async function markSiteReady(domain: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_site_discovery')
    .update({ status: 'ready', ready_at: new Date().toISOString() })
    .eq('domain', domain)
}

// ---------------------------------------------------------------------------
// Mark site as skip (no issues found, not worth emailing)
// ---------------------------------------------------------------------------

export async function markSiteSkip(domain: string, reason: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_site_discovery')
    .update({ status: 'skip', skip_reason: reason })
    .eq('domain', domain)
}

// ---------------------------------------------------------------------------
// Get sites ready to email (for emailer cron)
// ---------------------------------------------------------------------------

export async function getSitesReadyToEmail(limit: number): Promise<AoeSiteDiscovery[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aoe_site_discovery')
    .select('*')
    .eq('status', 'ready')
    .not('email', 'is', null)
    .order('ready_at', { ascending: true })
    .limit(limit)

  if (error) {
    logger.error('AOE: failed to get sites ready to email', { error: error.message })
    return []
  }

  return (data ?? []) as AoeSiteDiscovery[]
}

// ---------------------------------------------------------------------------
// Mark site as emailed
// ---------------------------------------------------------------------------

export async function markSiteEmailed(domain: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_site_discovery')
    .update({ status: 'emailed', emailed_at: new Date().toISOString() })
    .eq('domain', domain)
}

// ---------------------------------------------------------------------------
// Mark site as opted out
// ---------------------------------------------------------------------------

export async function markSiteOptedOut(domain: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_site_discovery')
    .update({ status: 'opted_out' })
    .eq('domain', domain)
}

// ---------------------------------------------------------------------------
// Store the result of the llms.txt check (called by outreach-checker at completion)
// ---------------------------------------------------------------------------

export async function setLlmsTxtStatus(domain: string, hasLlmsTxt: boolean): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_site_discovery')
    .update({ has_llms_txt: hasLlmsTxt })
    .eq('domain', domain)
}

// ---------------------------------------------------------------------------
// Check if domain already exists in discovery
// ---------------------------------------------------------------------------

export async function domainExists(domain: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('aoe_site_discovery')
    .select('id', { count: 'exact', head: true })
    .eq('domain', domain)

  return (count ?? 0) > 0
}

// ---------------------------------------------------------------------------
// Get discovery stats for admin dashboard
// ---------------------------------------------------------------------------

export async function getDiscoveryStats(): Promise<Record<AoeSiteStatus | string, number>> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aoe_site_discovery')
    .select('status')

  if (error || !data) return {}

  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.status] = (counts[row.status] ?? 0) + 1
  }

  return counts
}

// ---------------------------------------------------------------------------
// Get last discovery date for system health
// ---------------------------------------------------------------------------

export async function getLastDiscoveryAt(): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('aoe_site_discovery')
    .select('discovered_at')
    .order('discovered_at', { ascending: false })
    .limit(1)
    .single()

  return data?.discovered_at ?? null
}
