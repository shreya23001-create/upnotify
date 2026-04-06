// =============================================================================
// AOE — Automated Outreach Engine
// DB: aoe_outreach_log — every email sent
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { AoeCampaign, AoeEmailSource, AoeOutreachLog, AoePlatform, AoeProduct } from '../types'

// ---------------------------------------------------------------------------
// Log a sent email
// ---------------------------------------------------------------------------

export async function logAoeEmailSent(input: {
  domain: string
  emailSentTo: string
  emailSource: AoeEmailSource
  campaign: AoeCampaign
  platform: AoePlatform | null
  product: AoeProduct
  resendMessageId: string | null
}): Promise<AoeOutreachLog | null> {
  const supabase = createAdminClient()
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('aoe_outreach_log')
    .insert({
      domain: input.domain,
      email_sent_to: input.emailSentTo,
      email_source: input.emailSource,
      campaign: input.campaign,
      platform: input.platform,
      product: input.product,
      sent_at: now.toISOString(),
      resend_message_id: input.resendMessageId,
      month,
    })
    .select()
    .single()

  if (error) {
    logger.error('AOE: failed to log email sent', { domain: input.domain, error: error.message })
    return null
  }

  return data as AoeOutreachLog
}

// ---------------------------------------------------------------------------
// Check if domain was emailed recently (cooldown check)
// ---------------------------------------------------------------------------

export async function wasRecentlyEmailed(domain: string, cooldownDays: number): Promise<boolean> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('aoe_outreach_log')
    .select('id', { count: 'exact', head: true })
    .eq('domain', domain)
    .gte('sent_at', cutoff)

  return (count ?? 0) > 0
}

// ---------------------------------------------------------------------------
// Check if domain has opted out
// ---------------------------------------------------------------------------

export async function hasOptedOut(domain: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { count } = await supabase
    .from('aoe_outreach_log')
    .select('id', { count: 'exact', head: true })
    .eq('domain', domain)
    .eq('opted_out', true)

  return (count ?? 0) > 0
}

// ---------------------------------------------------------------------------
// Mark email as opted out (via unsubscribe endpoint)
// ---------------------------------------------------------------------------

export async function markOptedOut(resendMessageId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('aoe_outreach_log')
    .update({ opted_out: true, opted_out_at: new Date().toISOString() })
    .eq('resend_message_id', resendMessageId)

  if (error) {
    logger.error('AOE: failed to mark opted out', { resendMessageId, error: error.message })
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// Mark email as opened (Resend webhook)
// ---------------------------------------------------------------------------

export async function markOpened(resendMessageId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_outreach_log')
    .update({ opened_at: new Date().toISOString() })
    .eq('resend_message_id', resendMessageId)
    .is('opened_at', null) // only set first open
}

// ---------------------------------------------------------------------------
// Mark email as clicked (Resend webhook)
// ---------------------------------------------------------------------------

export async function markClicked(resendMessageId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_outreach_log')
    .update({ clicked_at: new Date().toISOString() })
    .eq('resend_message_id', resendMessageId)
    .is('clicked_at', null)
}

// ---------------------------------------------------------------------------
// Mark bounced / spam complaint (Resend webhook)
// ---------------------------------------------------------------------------

export async function markBounced(resendMessageId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_outreach_log')
    .update({ bounced: true })
    .eq('resend_message_id', resendMessageId)
}

export async function markSpamComplaint(resendMessageId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_outreach_log')
    .update({ spam_complaint: true, opted_out: true, opted_out_at: new Date().toISOString() })
    .eq('resend_message_id', resendMessageId)
}

// ---------------------------------------------------------------------------
// Mark converted (called from signup flow)
// ---------------------------------------------------------------------------

export async function markConverted(domain: string, plan: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('aoe_outreach_log')
    .update({ converted: true, converted_at: new Date().toISOString(), converted_plan: plan })
    .eq('domain', domain)
    .eq('converted', false)
}

// ---------------------------------------------------------------------------
// Get campaign stats for admin dashboard
// ---------------------------------------------------------------------------

export async function getAoeCampaignStats(month: string): Promise<{
  campaign: string
  sent: number
  opened: number
  clicked: number
  converted: number
  bounced: number
  spam: number
}[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aoe_outreach_log')
    .select('campaign, opened_at, clicked_at, converted, bounced, spam_complaint')
    .eq('month', month)

  if (error || !data) return []

  const stats: Record<string, { sent: number; opened: number; clicked: number; converted: number; bounced: number; spam: number }> = {}

  for (const row of data) {
    if (!stats[row.campaign]) {
      stats[row.campaign] = { sent: 0, opened: 0, clicked: 0, converted: 0, bounced: 0, spam: 0 }
    }
    stats[row.campaign].sent++
    if (row.opened_at)       stats[row.campaign].opened++
    if (row.clicked_at)      stats[row.campaign].clicked++
    if (row.converted)       stats[row.campaign].converted++
    if (row.bounced)         stats[row.campaign].bounced++
    if (row.spam_complaint)  stats[row.campaign].spam++
  }

  return Object.entries(stats).map(([campaign, s]) => ({ campaign, ...s }))
}

// ---------------------------------------------------------------------------
// Get last sent_at for system health cron monitoring
// ---------------------------------------------------------------------------

export async function getAoeLastSentAt(): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('aoe_outreach_log')
    .select('sent_at')
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  return data?.sent_at ?? null
}
