// =============================================================================
// AOE — Automated Outreach Engine
// Admin API: aoe-stats — dashboard data endpoint
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentMonth } from '@/lib/aoe/db/aoe-email-quota'
import { getAoeCampaignStats } from '@/lib/aoe/db/aoe-outreach-log'
import { getDiscoveryStats } from '@/lib/aoe/db/aoe-site-discovery'
import { getAoeSettingsRaw } from '@/lib/aoe/db/aoe-settings'
import { AOE_CONFIG } from '@/lib/aoe/config'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const month = getCurrentMonth()

  const [quota, campaignStats, discoveryStats, settingsRaw] = await Promise.all([
    supabase
      .from('aoe_email_quota')
      .select('*')
      .eq('month', month)
      .single(),
    getAoeCampaignStats(month),
    getDiscoveryStats(),
    getAoeSettingsRaw(),
  ])

  const q = quota.data
  const totalSent = q ? (q.marketing_sent + q.alert_sent + q.burst_sent) : 0
  const usagePct = q ? Math.round((totalSent / AOE_CONFIG.quota.monthlyLimit) * 100) : 0

  return NextResponse.json({
    ok: true,
    month,
    quota: q ? {
      month: q.month,
      totalQuota: q.total_quota,
      totalSent,
      usagePct,
      marketingSent: q.marketing_sent,
      alertSent: q.alert_sent,
      burstSent: q.burst_sent,
      availableMarketing: q.available_marketing,
      reservedAlerts: q.reserved_alerts,
      safetyBuffer: q.safety_buffer,
      hardReserve: q.hard_reserve,
      monitorsWithEmail: q.monitors_with_email,
      statusPageSubs: q.status_page_subs,
      status: q.status,
      calculatedAt: q.calculated_at,
    } : null,
    campaigns: campaignStats,
    discovery: discoveryStats,
    settings: settingsRaw,
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { key: string; value: boolean | number | string }
  try {
    body = await request.json() as { key: string; value: boolean | number | string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { key, value } = body
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('aoe_settings')
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
