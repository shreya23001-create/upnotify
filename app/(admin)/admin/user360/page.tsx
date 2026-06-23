import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/db/users'
import { MonitorLimitOverrideForm } from '@/components/admin/monitor-limit-override-form'
import { MonitorDomainCards } from '@/components/admin/monitor-domain-cards'
import { canAccessAdminModule, canWriteAdminModule } from '@/lib/db/admin-roles'
import { WpMonitorLimitOverrideForm } from '@/components/admin/wp-monitor-limit-override-form'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtAmount(pence: number, currency = 'gbp'): string {
  const amount = (pence / 100).toFixed(2)
  const symbols: Record<string, string> = { gbp: '£', usd: '$', eur: '€', inr: '₹' }
  return `${symbols[currency.toLowerCase()] ?? currency.toUpperCase() + ' '}${amount}`
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function User360Page({
  searchParams,
}: {
  searchParams: Promise<{ org_id?: string; email?: string; period?: string }>
}): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const isSuperAdmin = !!user.is_super_admin
  const [canRead] = await Promise.all([
    canAccessAdminModule(user.email, isSuperAdmin, 'user360'),
    canWriteAdminModule(user.email, isSuperAdmin, 'user360'),
  ])
  if (!canRead) redirect('/admin')

  const { org_id, email, period } = await searchParams
  const supabase = createAdminClient()

  // ── Resolve org from org_id or email lookup ──────────────────────────────
  let orgId = org_id ?? null

  if (!orgId && email) {
    const { data: userRow } = await supabase
      .from('users')
      .select('org_id')
      .ilike('email', email.trim())
      .limit(1)
      .maybeSingle()
    orgId = userRow?.org_id ?? null
  }

  // ── Load all data in parallel ────────────────────────────────────────────
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [orgResult, usersResult, subsResult, invoicesResult, monitorsResult, incidentsResult, statusPagesResult, alertChannelsResult, auditLogResult, checkResultsResult, competeSubResult, ecomProductsResult, apiKeysResult] =
    orgId
      ? await Promise.all([
          supabase.from('organisations').select('*, monitor_limit_override, wp_monitor_limit_override').eq('id', orgId).single(),
          supabase.from('users').select('id, email, full_name, created_at, last_sign_in_at, is_super_admin').eq('org_id', orgId),
          supabase.from('subscriptions').select('id, status, billing_cycle, current_period_end, created_at, plans(name, slug, price_monthly_gbp, price_annual_gbp, monitor_limit, check_interval_seconds, status_page_limit, has_slack_teams, has_webhooks, has_api_access, ai_report_limit, max_team_members)').eq('org_id', orgId).order('created_at', { ascending: false }),
          supabase.from('invoices').select('id, amount_gbp, currency, status, invoice_pdf_url, created_at, period_start').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
          supabase.from('monitors').select('id, name, target, status, type, check_interval_seconds, is_paused, created_at').eq('org_id', orgId).order('created_at', { ascending: false }),
          supabase.from('incidents').select('id, started_at, resolved_at, cause').eq('org_id', orgId).order('started_at', { ascending: false }).limit(5),
          supabase.from('status_pages').select('id, title, slug, is_published').eq('org_id', orgId),
          supabase.from('alert_channels').select('id, type, is_enabled').eq('org_id', orgId),
          supabase.from('audit_log').select('id, action, resource_type, resource_id, created_at, metadata, user_id').eq('org_id', orgId).order('created_at', { ascending: false }).limit(50),
          supabase.from('check_results').select('checked_at').eq('org_id', orgId).gte('checked_at', sixMonthsAgo.toISOString()).limit(200000),
          supabase.from('compete_subscriptions').select('id, status, billing_cycle, current_period_end, extra_products_purchased, created_at, compete_plan_id').eq('org_id', orgId).eq('status', 'active').maybeSingle(),
          supabase.from('ecom_products').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true),
          supabase.from('api_keys').select('id, name, key_prefix, scopes, created_at, last_used_at, is_revoked').eq('org_id', orgId).eq('is_revoked', false).order('created_at', { ascending: false }),
        ])
      : Array(13).fill({ data: null, error: null, count: null })

  const org = orgResult.data as Record<string, unknown> | null
  const monitorLimitOverride = (orgResult.data?.monitor_limit_override as number | null) ?? null
  const wpMonitorLimitOverride = (orgResult.data?.wp_monitor_limit_override as number | null) ?? null
  const users = (usersResult.data ?? []) as Array<{ id: string; email: string; full_name: string | null; created_at: string; last_sign_in_at: string | null; is_super_admin: boolean }>
  const subs = (subsResult.data ?? []) as Array<{ id: string; status: string; billing_cycle: string; current_period_end: string | null; created_at: string; plans: { name: string; slug: string; price_monthly_gbp: number; price_annual_gbp: number | null; monitor_limit: number | null; check_interval_seconds: number; status_page_limit: number | null; has_slack_teams: boolean; has_webhooks: boolean; has_api_access: boolean; ai_report_limit: number | null; max_team_members: number | null } | null }>
  const invoices = (invoicesResult.data ?? []) as Array<{ id: string; amount_gbp: number; currency: string; status: string; invoice_pdf_url: string | null; created_at: string; period_start: string | null }>
  const monitors = (monitorsResult.data ?? []) as Array<{ id: string; name: string; target: string; status: string; type: string; check_interval_seconds: number; is_paused: boolean; created_at: string }>
  const incidents = (incidentsResult.data ?? []) as Array<{ id: string; started_at: string; resolved_at: string | null; cause: string | null }>
  const statusPages = (statusPagesResult.data ?? []) as Array<{ id: string; title: string; slug: string; is_published: boolean }>
  const alertChannels = (alertChannelsResult.data ?? []) as Array<{ id: string; type: string; is_enabled: boolean }>
  const auditLog = (auditLogResult.data ?? []) as Array<{ id: string; action: string; resource_type: string | null; resource_id: string | null; created_at: string; metadata: Record<string, unknown> | null; user_id: string | null }>
  const rawChecks = (checkResultsResult.data ?? []) as Array<{ checked_at: string }>

  type CompeteSubRow = { id: string; status: string; billing_cycle: string; current_period_end: string | null; extra_products_purchased: number; created_at: string; compete_plan_id: string }
  const competeSub = competeSubResult.data as CompeteSubRow | null
  const ecomProductCount = ecomProductsResult.count ?? 0

  type ApiKeyRow = { id: string; name: string; key_prefix: string; scopes: string[]; created_at: string; last_used_at: string | null; is_revoked: boolean }
  const orgApiKeys = (apiKeysResult?.data ?? []) as ApiKeyRow[]

  // Fetch compete plan details if there's an active compete subscription
  type CompetePlanDetails = { name: string; slug: string; product_limit: number; price_monthly_pence: number; price_yearly_pence: number | null; has_yearly_discount: boolean }
  let competePlan: CompetePlanDetails | null = null
  if (competeSub?.compete_plan_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cp } = await (supabase as unknown as any).from('compete_plans').select('name, slug, product_limit, price_monthly_pence, price_yearly_pence, has_yearly_discount').eq('id', competeSub.compete_plan_id).maybeSingle()
    competePlan = (cp as CompetePlanDetails | null)
  }

  const activeSub = subs.find(s => s.status === 'active')
  const activePlan = activeSub?.plans ?? null
  const monitorUpCount = monitors.filter(m => m.status === 'up').length
  const monitorDownCount = monitors.filter(m => m.status === 'down').length
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const totalRevGbp = paidInvoices.filter(i => i.currency !== 'inr').reduce((sum, i) => sum + (i.amount_gbp ?? 0), 0)
  const totalRevInr = paidInvoices.filter(i => i.currency === 'inr').reduce((sum, i) => sum + (i.amount_gbp ?? 0), 0)
  const totalRevDisplay = totalRevInr > 0 ? fmtAmount(totalRevInr, 'inr') : fmtAmount(totalRevGbp)
  const enabledChannelTypes = new Set(alertChannels.filter(c => c.is_enabled).map(c => c.type))

  // ── Unit economics ───────────────────────────────────────────────────────
  // Monthly run rate (pence): use annual/12 for annual billing, monthly price otherwise
  const monthlyRevenuePence = activePlan
    ? (activeSub?.billing_cycle === 'annual' && activePlan.price_annual_gbp
        ? Math.round(activePlan.price_annual_gbp / 12)
        : activePlan.price_monthly_gbp)
    : 0

  // Estimated checks per month from active monitors
  const SECONDS_PER_MONTH = 30 * 24 * 3600
  const activeMonitors = monitors.filter(m => !m.is_paused)
  const checksPerMonthEst = activeMonitors.reduce((sum, m) => {
    const interval = m.check_interval_seconds || 60
    return sum + Math.floor(SECONDS_PER_MONTH / interval)
  }, 0)

  // Cost per check: 0.001p (= £0.00001) — configurable via COST_PER_CHECK_MILLIPENCE env var
  const costPerCheckMillipence = Number(process.env.COST_PER_CHECK_MILLIPENCE ?? 1)
  const estimatedCostPence = Math.round(checksPerMonthEst * costPerCheckMillipence / 1000)
  const grossMarginPence = monthlyRevenuePence - estimatedCostPence
  const marginPct = monthlyRevenuePence > 0 ? Math.round((grossMarginPence / monthlyRevenuePence) * 100) : 0

  // Aggregate actual check counts by YYYY-MM
  const checksByMonth: Record<string, number> = {}
  for (const row of rawChecks) {
    const key = row.checked_at.slice(0, 7)
    checksByMonth[key] = (checksByMonth[key] ?? 0) + 1
  }

  // Build last-6-months chart data
  type ChartMonth = { label: string; key: string; revenuePence: number; costPence: number; checks: number }
  const chartMonths: ChartMonth[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-GB', { month: 'short', year: '2-digit' })
    const checks = checksByMonth[key] ?? 0
    const costPence = Math.round(checks * costPerCheckMillipence / 1000)
    chartMonths.push({ label, key, revenuePence: monthlyRevenuePence, costPence, checks })
  }

  // SVG chart helpers
  const chartW = 580
  const chartH = 140
  const padL = 44
  const padB = 28
  const padT = 12
  const innerW = chartW - padL - 10
  const innerH = chartH - padB - padT
  const maxVal = Math.max(...chartMonths.flatMap(m => [m.revenuePence, m.costPence]), 100)
  const groupW = Math.floor(innerW / 6)
  const barW = Math.floor(groupW * 0.35)

  function scaleY(pence: number): number {
    return padT + innerH - Math.round((pence / maxVal) * innerH)
  }
  function barH(pence: number): number {
    return Math.max(2, Math.round((pence / maxVal) * innerH))
  }
  function groupX(i: number): number {
    return padL + i * groupW + Math.floor(groupW * 0.08)
  }

  // ── Predictive Growth Chart ──────────────────────────────────────────────
  const planMonitorLimit = activePlan?.monitor_limit ?? null

  // Determine history window based on period param
  const earliestUser = users.length > 0 ? users.reduce((a, b) => a.created_at < b.created_at ? a : b) : null
  const joinDate = earliestUser ? new Date(earliestUser.created_at) : new Date()
  joinDate.setDate(1) // start of join month

  const now = new Date()
  now.setDate(1)
  const monthsSinceJoin = Math.max(1,
    (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())
  )

  // period: 'all' = from join date, '6m' = 6 months, '12m' = 12 months (default)
  const selectedPeriod = period === 'all' ? monthsSinceJoin : period === '6m' ? 6 : 12
  const histMonthCount = Math.min(selectedPeriod, Math.max(selectedPeriod, 1))

  // Group existing monitors by month of creation
  const creationByMonth: Record<string, number> = {}
  for (const m of monitors) {
    if (m.created_at) {
      const key = m.created_at.slice(0, 7)
      creationByMonth[key] = (creationByMonth[key] ?? 0) + 1
    }
  }

  // Build history month keys array (oldest first)
  const hist12Keys: string[] = []
  for (let i = histMonthCount - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    hist12Keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Anchor: monitors that predate our window
  const oldMonitorCount = monitors.filter(m => m.created_at && m.created_at.slice(0, 7) < hist12Keys[0]).length
  type GrowthMonth = { key: string; label: string; newCount: number; runningTotal: number }
  const growthMonths: GrowthMonth[] = []
  let runningTotal = oldMonitorCount
  for (const key of hist12Keys) {
    const d = new Date(key + '-01')
    const label = d.toLocaleString('en-GB', { month: 'short', year: '2-digit' })
    const newCount = creationByMonth[key] ?? 0
    runningTotal += newCount
    growthMonths.push({ key, label, newCount, runningTotal })
  }

  // Linear regression: average monthly new monitors over last 3 months
  const recentGrowthMonths = growthMonths.slice(-3)
  const avgMonthlyGrowth = recentGrowthMonths.length > 0
    ? recentGrowthMonths.reduce((s, m) => s + m.newCount, 0) / recentGrowthMonths.length
    : 0

  // Project 6 months forward
  type ProjectedMonth = { key: string; label: string; projectedTotal: number; exceedsLimit: boolean }
  const projectedMonths: ProjectedMonth[] = []
  let projRunning = monitors.length // anchor at actual current count
  for (let i = 1; i <= 6; i++) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-GB', { month: 'short', year: '2-digit' })
    projRunning = Math.round(projRunning + avgMonthlyGrowth)
    projectedMonths.push({
      key, label, projectedTotal: projRunning,
      exceedsLimit: planMonitorLimit !== null && projRunning > planMonitorLimit,
    })
  }
  const limitCrossMonth = planMonitorLimit !== null ? projectedMonths.find(m => m.exceedsLimit) : null

  // ── Compete plan computations ────────────────────────────────────────────
  const cp = competePlan as CompetePlanDetails | null
  const competeMonthlyRevPence = competeSub && cp
    ? (competeSub.billing_cycle === 'annual' && cp.price_yearly_pence
        ? Math.round(cp.price_yearly_pence / 12)
        : cp.price_monthly_pence)
    : 0
  const totalProductLimit = cp ? cp.product_limit + (competeSub?.extra_products_purchased ?? 0) : 0
  const productUsagePct = totalProductLimit > 0 ? Math.round((ecomProductCount / totalProductLimit) * 100) : 0

  // SVG line chart helpers for growth chart
  const gcW = 580
  const gcH = 160
  const gcPadL = 36
  const gcPadB = 30
  const gcPadT = 16
  const gcInnerW = gcW - gcPadL - 10
  const gcInnerH = gcH - gcPadB - gcPadT
  const allPoints = [...growthMonths.map(m => m.runningTotal), ...projectedMonths.map(m => m.projectedTotal), planMonitorLimit ?? 0]
  const gcMaxVal = Math.max(...allPoints, 1)
  const totalPoints = growthMonths.length + projectedMonths.length // 18 total
  const gcPointX = (i: number) => gcPadL + Math.round((i / (totalPoints - 1)) * gcInnerW)
  const gcPointY = (val: number) => gcPadT + gcInnerH - Math.round((val / gcMaxVal) * gcInnerH)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User 360</h1>
          <p className="admin-page-subtitle">Full view of a user or organisation.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/users" className="btn btn-secondary" style={{ fontSize: 13 }}>← Users</Link>
          <Link href="/admin/revenue" className="btn btn-secondary" style={{ fontSize: 13 }}>← Revenue</Link>
        </div>
      </div>

      {/* Search bar */}
      <form method="GET" className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          name="email"
          className="form-input"
          placeholder="Search by email…"
          defaultValue={email ?? ''}
          style={{ flex: 1, minWidth: 220, fontSize: 13 }}
        />
        <input
          name="org_id"
          className="form-input"
          placeholder="…or paste org ID"
          defaultValue={orgId ?? ''}
          style={{ flex: 1, minWidth: 220, fontSize: 13 }}
        />
        <button type="submit" className="btn btn-primary" style={{ fontSize: 13 }}>Look up</button>
      </form>

      {/* No result state */}
      {(org_id || email) && !org && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          No organisation found for that email or ID.
        </div>
      )}

      {/* Empty state — no search yet */}
      {!org_id && !email && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          Enter an email address or org ID above to look up a user.
        </div>
      )}

      {org && (
        <>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Plan', value: activeSub?.plans?.name ?? 'Free' },
              { label: 'Billing', value: activeSub ? activeSub.billing_cycle : '—' },
              { label: 'Monitors', value: String(monitors.length) },
              { label: 'Up / Down', value: `${monitorUpCount} / ${monitorDownCount}` },
              { label: 'Total Paid', value: totalRevDisplay },
              { label: 'Invoices', value: String(invoices.length) },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Unit Economics */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Unit Economics — Revenue vs Cost of Service
            </h3>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                {
                  label: 'Monthly Run Rate',
                  value: fmtAmount(monthlyRevenuePence),
                  sub: activeSub?.billing_cycle === 'annual' ? 'annual ÷ 12' : 'monthly',
                  color: 'var(--accent)',
                },
                {
                  label: 'Checks / Month',
                  value: checksPerMonthEst.toLocaleString(),
                  sub: `${activeMonitors.length} active monitors`,
                  color: 'var(--text-primary)',
                },
                {
                  label: 'Est. Cost / Month',
                  value: fmtAmount(estimatedCostPence),
                  sub: `${(costPerCheckMillipence / 10).toFixed(4)}p per check`,
                  color: estimatedCostPence > monthlyRevenuePence ? '#ef4444' : '#22c55e',
                },
                {
                  label: 'Gross Margin',
                  value: `${marginPct}%`,
                  sub: fmtAmount(grossMarginPence) + ' / mo',
                  color: marginPct < 30 ? '#ef4444' : marginPct < 60 ? '#f97316' : '#22c55e',
                },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* SVG bar chart — Revenue vs Cost last 6 months */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} /> Revenue (amortized)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: '#f97316', display: 'inline-block' }} /> Est. Cost (actual checks)
                </span>
              </div>
              <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible', maxWidth: chartW }}>
                {/* Y-axis gridlines + labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                  const val = Math.round(maxVal * pct)
                  const y = scaleY(val)
                  return (
                    <g key={pct}>
                      <line x1={padL} y1={y} x2={chartW - 10} y2={y}
                        stroke="var(--border-light, #e2e8f0)" strokeWidth="1" strokeDasharray={pct === 0 ? '0' : '3,3'} />
                      <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-muted, #94a3b8)">
                        £{(val / 100).toFixed(val >= 10000 ? 0 : 2)}
                      </text>
                    </g>
                  )
                })}

                {/* Bars per month */}
                {chartMonths.map((m, i) => {
                  const gx = groupX(i)
                  const rH = barH(m.revenuePence)
                  const cH = barH(m.costPence)
                  return (
                    <g key={m.key}>
                      {/* Revenue bar */}
                      <rect x={gx} y={scaleY(m.revenuePence)} width={barW} height={rH}
                        fill="#3b82f6" rx="2" opacity="0.85" />
                      {/* Cost bar */}
                      <rect x={gx + barW + 3} y={scaleY(m.costPence)} width={barW} height={cH}
                        fill="#f97316" rx="2" opacity="0.85" />
                      {/* X label */}
                      <text x={gx + barW} y={chartH - 4} textAnchor="middle" fontSize="9" fill="var(--text-muted, #94a3b8)">
                        {m.label}
                      </text>
                      {/* Check count tooltip-style label on cost bar if >0 */}
                      {m.checks > 0 && cH > 14 && (
                        <text x={gx + barW + 3 + barW / 2} y={scaleY(m.costPence) + 10}
                          textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
                          {m.checks >= 1000 ? `${(m.checks / 1000).toFixed(0)}k` : m.checks}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Per-monitor cost table */}
            {activeMonitors.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                  Per-monitor cost breakdown ({activeMonitors.length} active)
                </summary>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Monitor</th>
                      <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Interval</th>
                      <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Checks/mo</th>
                      <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Est. cost/mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMonitors.map(m => {
                      const interval = m.check_interval_seconds || 60
                      const checks = Math.floor(SECONDS_PER_MONTH / interval)
                      const cost = Math.round(checks * costPerCheckMillipence / 1000)
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '5px 0', fontWeight: 500 }}>{m.name}</td>
                          <td style={{ padding: '5px 0', color: 'var(--text-muted)' }}>
                            {interval >= 60 ? `${interval / 60}m` : `${interval}s`}
                          </td>
                          <td style={{ padding: '5px 0', textAlign: 'right' }}>{checks.toLocaleString()}</td>
                          <td style={{ padding: '5px 0', textAlign: 'right', color: 'var(--text-muted)' }}>{fmtAmount(cost)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </details>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
              Cost estimate based on {(costPerCheckMillipence / 10).toFixed(4)}p per check (Vercel invocation + DB write).
              Set <code>COST_PER_CHECK_MILLIPENCE</code> env var to adjust.
            </p>
          </div>

          {/* Predictive Growth Chart */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>
                Monitor Growth &amp; Limit Forecast
              </h3>
              {/* Period filter — server-side navigation (links update URL) */}
              <div style={{ display: 'flex', gap: 4 }}>
                {([['6m', '6 months'], ['12m', '12 months'], ['all', `All time (${monthsSinceJoin}mo)`]] as const).map(([val, label]) => {
                  const isActive = (period ?? '12m') === val
                  const href = `?${new URLSearchParams({ ...(orgId ? { org_id: orgId } : {}), ...(email ? { email } : {}), period: val }).toString()}`
                  return (
                    <Link
                      key={val}
                      href={href}
                      style={{
                        fontSize: 12, padding: '4px 10px', borderRadius: 6, textDecoration: 'none',
                        background: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: isActive ? 'white' : 'var(--text-muted)',
                        fontWeight: isActive ? 700 : 400,
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                {
                  label: 'Current Monitors',
                  value: String(monitors.length),
                  sub: planMonitorLimit !== null ? `of ${planMonitorLimit} limit` : 'unlimited plan',
                  color: planMonitorLimit !== null && monitors.length / planMonitorLimit > 0.8 ? '#ef4444' : 'var(--text-primary)',
                },
                {
                  label: 'Avg Monthly Growth',
                  value: avgMonthlyGrowth > 0 ? `+${avgMonthlyGrowth.toFixed(1)}` : '0',
                  sub: 'monitors / month (3-mo avg)',
                  color: avgMonthlyGrowth > 0 ? '#22c55e' : 'var(--text-muted)',
                },
                {
                  label: 'In 6 Months',
                  value: projectedMonths[5]
                    ? String(projectedMonths[5].projectedTotal)
                    : '—',
                  sub: projectedMonths[5]?.exceedsLimit ? '⚠ over limit' : 'projected',
                  color: projectedMonths[5]?.exceedsLimit ? '#ef4444' : 'var(--text-primary)',
                },
                {
                  label: 'Limit Breach',
                  value: limitCrossMonth ? limitCrossMonth.label : '—',
                  sub: limitCrossMonth ? 'upgrade needed' : planMonitorLimit === null ? 'unlimited' : 'no breach forecast',
                  color: limitCrossMonth ? '#ef4444' : '#22c55e',
                },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 24, height: 3, background: '#3b82f6', display: 'inline-block', borderRadius: 2 }} /> Actual monitors
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 24, height: 3, background: '#93c5fd', display: 'inline-block', borderRadius: 2, opacity: 0.7 }} /> Forecast (trend)
              </span>
              {planMonitorLimit !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 24, height: 3, background: '#ef4444', display: 'inline-block', borderRadius: 2 }} /> Plan limit
                </span>
              )}
            </div>

            {/* SVG line chart */}
            <svg width="100%" viewBox={`0 0 ${gcW} ${gcH}`} style={{ overflow: 'visible', maxWidth: gcW }}>
              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const val = Math.round(gcMaxVal * pct)
                const y = gcPointY(val)
                return (
                  <g key={pct}>
                    <line x1={gcPadL} y1={y} x2={gcW - 10} y2={y}
                      stroke="var(--border-light, #e2e8f0)" strokeWidth="1" strokeDasharray={pct === 0 ? '0' : '3,3'} />
                    <text x={gcPadL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-muted, #94a3b8)">{val}</text>
                  </g>
                )
              })}

              {/* Plan limit line */}
              {planMonitorLimit !== null && (
                <>
                  <line
                    x1={gcPadL} y1={gcPointY(planMonitorLimit)}
                    x2={gcW - 10} y2={gcPointY(planMonitorLimit)}
                    stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.8"
                  />
                  <text x={gcW - 8} y={gcPointY(planMonitorLimit) - 4} textAnchor="end" fontSize="9" fill="#ef4444" fontWeight="600">
                    limit ({planMonitorLimit})
                  </text>
                </>
              )}

              {/* Separator line between historical and projected */}
              {growthMonths.length > 0 && (
                <line
                  x1={gcPointX(growthMonths.length - 1)} y1={gcPadT}
                  x2={gcPointX(growthMonths.length - 1)} y2={gcPadT + gcInnerH}
                  stroke="var(--border-light, #e2e8f0)" strokeWidth="1" strokeDasharray="4,2" opacity="0.7"
                />
              )}

              {/* Historical area fill */}
              {growthMonths.length > 1 && (() => {
                const pts = growthMonths.map((m, i) => `${gcPointX(i)},${gcPointY(m.runningTotal)}`).join(' ')
                const firstX = gcPointX(0)
                const lastX = gcPointX(growthMonths.length - 1)
                const baseY = gcPadT + gcInnerH
                return (
                  <polygon
                    points={`${firstX},${baseY} ${pts} ${lastX},${baseY}`}
                    fill="#3b82f6" opacity="0.08"
                  />
                )
              })()}

              {/* Historical line */}
              {growthMonths.length > 1 && (
                <polyline
                  points={growthMonths.map((m, i) => `${gcPointX(i)},${gcPointY(m.runningTotal)}`).join(' ')}
                  fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"
                />
              )}

              {/* Projected line (starts from last historical point) */}
              {projectedMonths.length > 0 && growthMonths.length > 0 && (() => {
                const lastHistIdx = growthMonths.length - 1
                const lastHistVal = growthMonths[lastHistIdx].runningTotal
                const projPts = [
                  `${gcPointX(lastHistIdx)},${gcPointY(lastHistVal)}`,
                  ...projectedMonths.map((m, i) => `${gcPointX(growthMonths.length + i)},${gcPointY(m.projectedTotal)}`),
                ].join(' ')
                return (
                  <polyline
                    points={projPts}
                    fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="6,3" strokeLinejoin="round"
                  />
                )
              })()}

              {/* Historical dots */}
              {growthMonths.map((m, i) => (
                <circle key={m.key} cx={gcPointX(i)} cy={gcPointY(m.runningTotal)} r="3"
                  fill="#3b82f6" />
              ))}

              {/* Projected dots — red if over limit */}
              {projectedMonths.map((m, i) => (
                <circle key={m.key} cx={gcPointX(growthMonths.length + i)} cy={gcPointY(m.projectedTotal)} r="3"
                  fill={m.exceedsLimit ? '#ef4444' : '#93c5fd'} />
              ))}

              {/* X-axis labels — show every other month to avoid crowding */}
              {[...growthMonths, ...projectedMonths].map((m, i) => {
                if (i % 3 !== 0 && i !== growthMonths.length - 1 + projectedMonths.length) return null
                const isProj = i >= growthMonths.length
                return (
                  <text key={m.key} x={gcPointX(i)} y={gcH - 4}
                    textAnchor="middle" fontSize="9"
                    fill={isProj ? '#93c5fd' : 'var(--text-muted, #94a3b8)'}
                  >
                    {m.label}
                  </text>
                )
              })}
            </svg>

            {monitors.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                No monitors yet — growth chart will populate as monitors are added.
              </p>
            )}
          </div>

          {/* Compete Plan Section — only shown if org has active compete subscription */}
          {competeSub && cp && (
              <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '3px solid #8b5cf6' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b5cf6' }}>
                  Compete Plan
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Plan', value: cp.name, sub: competeSub.billing_cycle, color: '#8b5cf6' },
                    {
                      label: 'Compete Revenue',
                      value: fmtAmount(competeMonthlyRevPence),
                      sub: competeSub.billing_cycle === 'annual' ? 'annual ÷ 12' : 'monthly',
                      color: '#22c55e',
                    },
                    {
                      label: 'Products Tracked',
                      value: `${ecomProductCount} / ${totalProductLimit}`,
                      sub: `${productUsagePct}% of limit`,
                      color: productUsagePct > 80 ? '#ef4444' : 'var(--text-primary)',
                    },
                    {
                      label: 'Extra Products',
                      value: String(competeSub.extra_products_purchased),
                      sub: competeSub.extra_products_purchased > 0 ? 'purchased' : 'none',
                      color: 'var(--text-primary)',
                    },
                    {
                      label: 'Combined MRR',
                      value: fmtAmount(monthlyRevenuePence + competeMonthlyRevPence),
                      sub: 'monitor + compete',
                      color: '#22c55e',
                    },
                    {
                      label: 'Period Ends',
                      value: fmtDate(competeSub.current_period_end),
                      sub: 'compete subscription',
                      color: 'var(--text-muted)',
                    },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Usage bar */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Product usage</span>
                    <span style={{ fontWeight: 600 }}>{ecomProductCount} of {totalProductLimit} ({productUsagePct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-primary)', borderRadius: 4 }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, productUsagePct)}%`,
                      background: productUsagePct > 80 ? '#ef4444' : productUsagePct > 50 ? '#f59e0b' : '#8b5cf6',
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  {competeSub.extra_products_purchased > 0 && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Includes {competeSub.extra_products_purchased} extra products purchased on top of {cp.product_limit} base limit.
                    </p>
                  )}
                </div>
              </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Org / Account */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Organisation</h3>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['Name', org.name as string],
                    ['Org ID', org.id as string],
                    ['Created', fmtDate(org.created_at as string)],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: '5px 0', color: 'var(--text-muted)', width: 90 }}>{k}</td>
                      <td style={{ padding: '5px 0', fontWeight: 500, wordBreak: 'break-all' }}>{v || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Users */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Users</h3>
              {users.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No users found.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '7px 0' }}>
                          <div style={{ fontWeight: 600 }}>{u.full_name || u.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last login: {fmtDate(u.last_sign_in_at)}</div>
                        </td>
                        <td style={{ padding: '7px 0', textAlign: 'right' }}>
                          {u.is_super_admin && <span className="badge badge-warning" style={{ fontSize: 10 }}>Admin</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Subscription */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Subscriptions</h3>
            {subs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Free plan — no subscription.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Plan</th><th>Billing</th><th>Status</th><th>Renews</th><th>Started</th></tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.plans?.name ?? '—'}</td>
                      <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{s.billing_cycle}</td>
                      <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{s.status}</span></td>
                      <td style={{ fontSize: 12 }}>{fmtDate(s.current_period_end)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Recent invoices */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Recent Invoices</h3>
              {invoices.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No invoices.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(inv.created_at)}</td>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: 'var(--color-success)' }}>{fmtAmount(inv.amount_gbp, inv.currency)}</td>
                        <td style={{ padding: '6px 0' }}><span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-neutral'}`}>{inv.status}</span></td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>
                          {inv.invoice_pdf_url
                            ? <a href={inv.invoice_pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent)' }}>PDF ↗</a>
                            : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent incidents */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Recent Incidents</h3>
              {incidents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No incidents. 🎉</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '6px 0' }}>
                          <div style={{ fontSize: 12 }}>{inc.cause ?? 'Unreachable'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(inc.started_at)}</div>
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>
                          {inc.resolved_at
                            ? <span className="badge badge-success" style={{ fontSize: 10 }}>Resolved</span>
                            : <span className="badge badge-danger" style={{ fontSize: 10 }}>Open</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Monitors */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Monitors ({monitors.length})
            </h3>
            <MonitorDomainCards monitors={monitors} />
          </div>

          {/* Plan Enforcement Panel */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Plan Limits vs Actual Usage
            </h3>
            {!activePlan ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Free plan — no subscription limits configured.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Feature</th><th>Plan Limit</th><th>Actual Usage</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: 'Monitors',
                      limit: monitorLimitOverride !== null
                        ? `${monitorLimitOverride} (override)`
                        : activePlan.monitor_limit ? String(activePlan.monitor_limit) : 'Unlimited',
                      used: String(monitors.length),
                      ok: monitorLimitOverride !== null
                        ? monitors.length <= monitorLimitOverride
                        : !activePlan.monitor_limit || monitors.length <= activePlan.monitor_limit,
                    },
                    {
                      feature: 'Check Interval',
                      limit: activePlan.check_interval_seconds >= 60 ? `${activePlan.check_interval_seconds / 60} min` : `${activePlan.check_interval_seconds}s`,
                      used: '—',
                      ok: true,
                    },
                    {
                      feature: 'Status Pages',
                      limit: activePlan.status_page_limit ? String(activePlan.status_page_limit) : 'Unlimited',
                      used: String(statusPages.length),
                      ok: !activePlan.status_page_limit || statusPages.length <= activePlan.status_page_limit,
                    },
                    {
                      feature: 'Slack / Teams Alerts',
                      limit: activePlan.has_slack_teams ? 'Allowed' : 'Blocked',
                      used: enabledChannelTypes.has('slack') || enabledChannelTypes.has('teams') ? 'Active' : 'Not used',
                      ok: activePlan.has_slack_teams || (!enabledChannelTypes.has('slack') && !enabledChannelTypes.has('teams')),
                    },
                    {
                      feature: 'Webhooks',
                      limit: activePlan.has_webhooks ? 'Allowed' : 'Blocked',
                      used: enabledChannelTypes.has('webhook') ? 'Active' : 'Not used',
                      ok: activePlan.has_webhooks || !enabledChannelTypes.has('webhook'),
                    },
                    {
                      feature: 'API Access',
                      limit: activePlan.has_api_access ? 'Allowed' : 'Blocked',
                      used: '—',
                      ok: true,
                    },
                    {
                      feature: 'AI Reports',
                      limit: activePlan.ai_report_limit ? `${activePlan.ai_report_limit}/month` : 'Unlimited',
                      used: '—',
                      ok: true,
                    },
                    {
                      feature: 'Team Members',
                      limit: activePlan.max_team_members ? String(activePlan.max_team_members) : 'Unlimited',
                      used: String(users.length),
                      ok: !activePlan.max_team_members || users.length <= activePlan.max_team_members,
                    },
                  ].map(row => (
                    <tr key={row.feature}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{row.feature}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.limit}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{row.used}</td>
                      <td>
                        <span className={`badge ${row.ok ? 'badge-success' : 'badge-danger'}`}>
                          {row.ok ? 'OK' : 'OVER LIMIT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Monitor Limit Override */}
          {orgId && (
            <>
            <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: '3px solid #f59e0b' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Monitor Limit Override
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Override this org&apos;s monitor limit regardless of their plan.
                Plan limit: <strong>{activePlan?.monitor_limit ?? 'Unlimited'}</strong>.
                Current monitors: <strong>{monitors.length}</strong>.
                Leave blank to clear and revert to plan limit.
              </p>
              <MonitorLimitOverrideForm
                orgId={orgId}
                currentOverride={monitorLimitOverride}
                planLimit={activePlan?.monitor_limit ?? null}
              />
            </div>
            {/* WP Monitor Limit Override */}
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                🔌 WP Monitor Limit Override
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Override this org&apos;s WordPress monitor limit regardless of their plan.
                Plan default: <strong>{(activePlan as unknown as { wp_monitor_limit?: number } | null)?.wp_monitor_limit ?? 0}</strong>.
                Leave blank to revert to plan default.
              </p>
              <WpMonitorLimitOverrideForm
                orgId={orgId}
                currentOverride={wpMonitorLimitOverride}
                planLimit={(activePlan as unknown as { wp_monitor_limit?: number } | null)?.wp_monitor_limit ?? null}
              />
            </div>
            </>
          )}

          {/* Activity Log */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Activity Log <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>(last 50 events)</span>
            </h3>
            {auditLog.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {auditLog.map((entry, i) => {
                  const isAdmin = entry.action.startsWith('admin.')
                  const isBilling = entry.action.includes('billing') || entry.action.includes('subscription') || entry.action.includes('plan')
                  const isAuth = entry.action.includes('login') || entry.action.includes('logout') || entry.action.includes('imperson')
                  const dotColor = isAdmin ? 'var(--color-warning, #f59e0b)' : isBilling ? 'var(--success)' : isAuth ? 'var(--accent)' : 'var(--text-muted)'
                  return (
                    <div key={entry.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < auditLog.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: isAdmin ? 'var(--color-warning, #f59e0b)' : 'var(--text-primary)' }}>
                            {entry.action}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDateTime(entry.created_at)}</span>
                        </div>
                        {entry.resource_type && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {entry.resource_type}{entry.resource_id ? ` · ${entry.resource_id.slice(0, 8)}…` : ''}
                          </div>
                        )}
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {Object.entries(entry.metadata).filter(([k]) => !['error'].includes(k)).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* API Keys */}
          {orgId && (
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>API Keys</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Keys</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{orgApiKeys.length}</div>
                </div>
                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Used</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {orgApiKeys.some(k => k.last_used_at)
                      ? fmtDateTime(orgApiKeys.filter(k => k.last_used_at).sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())[0]?.last_used_at)
                      : 'Never used'}
                  </div>
                </div>
              </div>
              {orgApiKeys.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Prefix</th>
                        <th>Scopes</th>
                        <th>Created</th>
                        <th>Last Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgApiKeys.map(k => (
                        <tr key={k.id}>
                          <td style={{ fontWeight: 500 }}>{k.name}</td>
                          <td><code style={{ fontSize: 12, background: 'var(--bg-muted)', padding: '2px 6px', borderRadius: 4 }}>{k.key_prefix}...</code></td>
                          <td><span className="badge badge-outline" style={{ fontSize: 11 }}>{k.scopes.join(', ')}</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{fmtDate(k.created_at)}</td>
                          <td style={{ color: k.last_used_at ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {k.last_used_at ? fmtDateTime(k.last_used_at) : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No API keys created for this org.</p>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {users[0] && (
                <Link
                  href={`/admin?impersonate=${users[0].id}`}
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                >
                  👤 Impersonate {users[0].email}
                </Link>
              )}
              <Link href={`/admin/users?org_id=${orgId}`} className="btn btn-secondary" style={{ fontSize: 13 }}>
                🏢 View in Users list
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
