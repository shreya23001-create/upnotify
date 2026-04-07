import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export interface User360Profile {
  userId: string
  email: string
  fullName: string | null
  orgId: string
  orgName: string
  isActive: boolean
  joinedAt: string
  // Subscription
  planName: string
  planSlug: string
  billingCycle: string | null
  subStatus: string | null
  currentPeriodEnd: string | null
  // Spend
  totalSpendGbp: number
  invoiceCount: number
  lastInvoiceAt: string | null
  // Usage
  monitorCount: number
  activeMonitorCount: number
  alertChannelCount: number
  statusPageCount: number
  // Score (0–100) — calculated server-side (legacy, kept for sort compatibility)
  score: number
  scoreBreakdown: {
    spend: number      // 0–35
    monitors: number   // 0–25
    plan: number       // 0–20
    tenure: number     // 0–20
  }
  // Health score — cached from organisations table (refreshed by cron weekly)
  healthScore: number | null
  healthScoreLabel: string | null
  healthScoreAt: string | null
}

function calcScore(profile: Omit<User360Profile, 'score' | 'scoreBreakdown'>): { score: number; scoreBreakdown: User360Profile['scoreBreakdown'] } {
  // Spend score: 0–35 pts (scales to £200+ = full)
  const spendScore = Math.min(35, Math.round((profile.totalSpendGbp / 200) * 35))

  // Monitor score: 0–25 pts (5+ monitors = 15, 20+ = full)
  const monitorScore = Math.min(25, Math.round((profile.monitorCount / 20) * 25))

  // Plan score: 0–20 pts
  const planScores: Record<string, number> = {
    'free': 0, 'lite': 5, 'starter': 10, 'pro': 20, 'agency': 20,
  }
  const planScore = planScores[profile.planSlug?.toLowerCase() ?? 'free'] ?? 0

  // Tenure score: 0–20 pts (12+ months = full)
  const monthsActive = Math.max(0, (Date.now() - new Date(profile.joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const tenureScore = Math.min(20, Math.round((monthsActive / 12) * 20))

  const score = spendScore + monitorScore + planScore + tenureScore

  return {
    score,
    scoreBreakdown: { spend: spendScore, monitors: monitorScore, plan: planScore, tenure: tenureScore },
  }
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Fetch all data in parallel
  const [
    { data: usersRaw },
    { data: orgsRaw },
    { data: subsRaw },
    { data: invoicesRaw },
    { data: monitorsRaw },
    { data: alertsRaw },
    { data: statusPagesRaw },
    { data: plansRaw },
    { data: competePlansRaw },
  ] = await Promise.all([
    supabase.from('users').select('id, email, full_name, org_id, is_active, created_at').order('created_at', { ascending: false }),
    supabase.from('organisations').select('id, name, health_score, health_score_label, health_score_at'),
    supabase.from('subscriptions').select('org_id, status, billing_cycle, current_period_end, plan_id, plans(name, slug)'),
    supabase.from('invoices').select('org_id, amount_gbp, status, created_at').eq('status', 'paid'),
    supabase.from('monitors').select('org_id, status'),
    supabase.from('alert_channels').select('org_id').eq('is_enabled', true),
    supabase.from('status_pages').select('org_id'),
    supabase.from('plans').select('id, name, slug'),
    supabase.from('compete_plans').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  // Build lookup maps
  type OrgRow = { id: string; name: string; health_score: number | null; health_score_label: string | null; health_score_at: string | null }
  const orgMap = new Map<string, OrgRow>()
  for (const o of (orgsRaw ?? []) as unknown as OrgRow[]) {
    orgMap.set(o.id, o)
  }

  const planMap = new Map<string, { name: string; slug: string }>()
  for (const p of (plansRaw ?? []) as { id: string; name: string; slug: string }[]) {
    planMap.set(p.id, { name: p.name, slug: p.slug })
  }

  // Subscription by org_id (take first active, else first)
  type SubWithPlan = { org_id: string; status: string; billing_cycle: string | null; current_period_end: string | null; plan_id: string; plans: { name: string; slug: string } | null }
  const subByOrg = new Map<string, SubWithPlan>()
  for (const s of (subsRaw ?? []) as unknown as SubWithPlan[]) {
    const existing = subByOrg.get(s.org_id)
    if (!existing || (s.status === 'active' && existing.status !== 'active')) {
      subByOrg.set(s.org_id, s)
    }
  }

  // Invoice aggregates by org_id
  type InvRow = { org_id: string; amount_gbp: number; status: string; created_at: string }
  const invoicesByOrg = new Map<string, { totalGbp: number; count: number; lastAt: string | null }>()
  for (const inv of (invoicesRaw ?? []) as InvRow[]) {
    const existing = invoicesByOrg.get(inv.org_id) ?? { totalGbp: 0, count: 0, lastAt: null }
    existing.totalGbp += (inv.amount_gbp ?? 0) / 100
    existing.count++
    if (!existing.lastAt || inv.created_at > existing.lastAt) existing.lastAt = inv.created_at
    invoicesByOrg.set(inv.org_id, existing)
  }

  // Monitor counts by org_id
  type MonRow = { org_id: string; status: string }
  const monitorsByOrg = new Map<string, { total: number; active: number }>()
  for (const m of (monitorsRaw ?? []) as MonRow[]) {
    const existing = monitorsByOrg.get(m.org_id) ?? { total: 0, active: 0 }
    existing.total++
    if (m.status === 'active') existing.active++
    monitorsByOrg.set(m.org_id, existing)
  }

  // Alert channels by org_id
  const alertsByOrg = new Map<string, number>()
  for (const a of (alertsRaw ?? []) as { org_id: string }[]) {
    alertsByOrg.set(a.org_id, (alertsByOrg.get(a.org_id) ?? 0) + 1)
  }

  // Status pages by org_id
  const statusPagesByOrg = new Map<string, number>()
  for (const sp of (statusPagesRaw ?? []) as { org_id: string }[]) {
    statusPagesByOrg.set(sp.org_id, (statusPagesByOrg.get(sp.org_id) ?? 0) + 1)
  }

  // Build profile per user — exclude admin accounts from the list
  const adminEmailSet = new Set(
    (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  )
  type UserRow = { id: string; email: string; full_name: string | null; org_id: string; is_active: boolean; created_at: string }
  const profiles: User360Profile[] = []

  for (const u of (usersRaw ?? []) as UserRow[]) {
    if (adminEmailSet.has(u.email.toLowerCase())) continue
    const sub = subByOrg.get(u.org_id)
    const invoiceData = invoicesByOrg.get(u.org_id) ?? { totalGbp: 0, count: 0, lastAt: null }
    const monitors = monitorsByOrg.get(u.org_id) ?? { total: 0, active: 0 }

    const planName = sub?.plans?.name ?? 'Free'
    const planSlug = sub?.plans?.slug ?? 'free'
    const orgData = orgMap.get(u.org_id)

    const base: Omit<User360Profile, 'score' | 'scoreBreakdown'> = {
      userId: u.id,
      email: u.email,
      fullName: u.full_name,
      orgId: u.org_id,
      orgName: orgData?.name ?? '',
      isActive: u.is_active,
      joinedAt: u.created_at,
      planName,
      planSlug,
      billingCycle: sub?.billing_cycle ?? null,
      subStatus: sub?.status ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
      totalSpendGbp: invoiceData.totalGbp,
      invoiceCount: invoiceData.count,
      lastInvoiceAt: invoiceData.lastAt,
      monitorCount: monitors.total,
      activeMonitorCount: monitors.active,
      alertChannelCount: alertsByOrg.get(u.org_id) ?? 0,
      statusPageCount: statusPagesByOrg.get(u.org_id) ?? 0,
      healthScore: orgData?.health_score ?? null,
      healthScoreLabel: orgData?.health_score_label ?? null,
      healthScoreAt: orgData?.health_score_at ?? null,
    }

    profiles.push({ ...base, ...calcScore(base) })
  }

  const plans = (plansRaw ?? []) as { id: string; name: string; slug: string }[]
  const competePlans = (competePlansRaw ?? []) as { id: string; name: string; slug: string }[]

  return NextResponse.json({ success: true, profiles, plans, competePlans })
}
