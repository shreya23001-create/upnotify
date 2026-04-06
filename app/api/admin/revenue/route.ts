import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanRow {
  name: string
  slug: string
  price_monthly_gbp: number
  price_annual_gbp: number | null
}

interface CompetePlanRow {
  name: string
  slug: string
  price_monthly_pence: number
  price_yearly_pence: number | null
}

interface SubRow {
  id: string
  org_id: string
  status: string
  billing_cycle: string
  plans: PlanRow
}

interface CompeteSubRow {
  id: string
  org_id: string
  status: string
  billing_cycle: string
  compete_plans: CompetePlanRow
}

interface OrgRow {
  id: string
  name: string
}

interface UserRow {
  id: string
  org_id: string
  email: string
}

interface InvoiceRow {
  id: string
  org_id: string
  amount_gbp: number
  status: string
  invoice_pdf_url: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
  subscription_id: string | null
  organisations: { name: string } | null
  subscriptions: {
    billing_cycle: string
    plans: { name: string; slug: string } | null
  } | null
}

interface EnrichedInvoice {
  id: string
  org_id: string
  orgName: string
  userEmail: string
  amount_gbp: number
  status: string
  invoice_pdf_url: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
  planName: string | null
  billingCycle: string | null
}

// ---------------------------------------------------------------------------
// Admin check
// ---------------------------------------------------------------------------

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALLOWED_STATUSES = new Set(['all', 'paid', 'open', 'void'])
const ALLOWED_SORT_BY = new Set(['created_at', 'amount_gbp'])
const ALLOWED_SORT_DIR = new Set(['asc', 'desc'])

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// ---------------------------------------------------------------------------
// GET /api/admin/revenue
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)

  const page    = parsePositiveInt(searchParams.get('page'), 1)
  const limit   = parsePositiveInt(searchParams.get('limit'), 25)
  const rawStatus  = searchParams.get('status') ?? 'all'
  const rawSortBy  = searchParams.get('sortBy') ?? 'created_at'
  const rawSortDir = searchParams.get('sortDir') ?? 'desc'

  const statusFilter = ALLOWED_STATUSES.has(rawStatus) ? rawStatus : 'all'
  const sortBy       = ALLOWED_SORT_BY.has(rawSortBy)  ? rawSortBy  : 'created_at'
  const ascending    = ALLOWED_SORT_DIR.has(rawSortDir) ? rawSortDir === 'asc' : false

  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  // -------------------------------------------------------------------------
  // 1. Active base subscriptions
  // -------------------------------------------------------------------------
  const { data: subsRaw } = await supabase
    .from('subscriptions')
    .select('id, org_id, status, billing_cycle, plans(name, slug, price_monthly_gbp, price_annual_gbp)')
    .eq('status', 'active')

  const subs = (subsRaw ?? []) as unknown as SubRow[]

  // -------------------------------------------------------------------------
  // 2. Active Compete subscriptions
  // -------------------------------------------------------------------------
  const { data: competeSubsRaw } = await supabase
    .from('compete_subscriptions')
    .select('id, org_id, status, billing_cycle, compete_plans(name, slug, price_monthly_pence, price_yearly_pence)')
    .eq('status', 'active')

  const competeSubs = (competeSubsRaw ?? []) as unknown as CompeteSubRow[]

  // -------------------------------------------------------------------------
  // 3. Users keyed by org_id (for email lookup)
  // -------------------------------------------------------------------------
  const { data: usersRaw } = await supabase
    .from('users')
    .select('id, org_id, email')

  const usersByOrgId = new Map<string, string>()
  for (const u of (usersRaw ?? []) as unknown as UserRow[]) {
    if (!usersByOrgId.has(u.org_id)) {
      usersByOrgId.set(u.org_id, u.email)
    }
  }

  // -------------------------------------------------------------------------
  // 4. Total count of paid invoices (all, not paginated — for totalRevenuePence)
  // -------------------------------------------------------------------------
  const { data: allPaidRaw } = await supabase
    .from('invoices')
    .select('amount_gbp')
    .eq('status', 'paid')

  const totalRevenuePence = ((allPaidRaw ?? []) as { amount_gbp: number }[])
    .reduce((sum, i) => sum + Math.round((i.amount_gbp ?? 0) * 100), 0)

  // -------------------------------------------------------------------------
  // 5. Paginated invoices with org + plan details
  // -------------------------------------------------------------------------
  let invoiceQuery = supabase
    .from('invoices')
    .select(
      'id, org_id, amount_gbp, status, invoice_pdf_url, period_start, period_end, created_at, subscription_id, organisations(name), subscriptions(billing_cycle, plans(name, slug))',
      { count: 'exact' }
    )
    .order(sortBy, { ascending })
    .range(offset, offset + limit - 1)

  if (statusFilter !== 'all') {
    invoiceQuery = invoiceQuery.eq('status', statusFilter)
  }

  const { data: invoicesRaw, count: invoiceCount } = await invoiceQuery

  const invoices = (invoicesRaw ?? []) as unknown as InvoiceRow[]
  const total      = invoiceCount ?? 0
  const totalPages = Math.ceil(total / limit)

  const enrichedInvoices: EnrichedInvoice[] = invoices.map(inv => ({
    id:              inv.id,
    org_id:          inv.org_id,
    orgName:         inv.organisations?.name ?? '',
    userEmail:       usersByOrgId.get(inv.org_id) ?? '',
    amount_gbp:      inv.amount_gbp,
    status:          inv.status,
    invoice_pdf_url: inv.invoice_pdf_url,
    period_start:    inv.period_start,
    period_end:      inv.period_end,
    created_at:      inv.created_at,
    planName:        inv.subscriptions?.plans?.name ?? null,
    billingCycle:    inv.subscriptions?.billing_cycle ?? null,
  }))

  // -------------------------------------------------------------------------
  // 6. MRR calculations — base plans
  // -------------------------------------------------------------------------
  let baseMrrPence = 0
  const planBreakdown: Record<string, { count: number; mrrPence: number }> = {}

  for (const sub of subs) {
    const plan = sub.plans
    if (!plan) continue
    const monthlyPence =
      sub.billing_cycle === 'annual' && plan.price_annual_gbp != null
        ? Math.round((plan.price_annual_gbp / 12) * 100)
        : Math.round(plan.price_monthly_gbp * 100)
    baseMrrPence += monthlyPence
    if (!planBreakdown[plan.name]) planBreakdown[plan.name] = { count: 0, mrrPence: 0 }
    planBreakdown[plan.name].count++
    planBreakdown[plan.name].mrrPence += monthlyPence
  }

  // -------------------------------------------------------------------------
  // 7. MRR calculations — Compete plans
  // -------------------------------------------------------------------------
  let competeMrrPence = 0
  const competeBreakdown: Record<string, { count: number; mrrPence: number }> = {}

  for (const sub of competeSubs) {
    const plan = sub.compete_plans
    if (!plan) continue
    const monthlyPence =
      sub.billing_cycle === 'annual' && plan.price_yearly_pence != null
        ? Math.round(plan.price_yearly_pence / 12)
        : plan.price_monthly_pence
    competeMrrPence += monthlyPence
    if (!competeBreakdown[plan.name]) competeBreakdown[plan.name] = { count: 0, mrrPence: 0 }
    competeBreakdown[plan.name].count++
    competeBreakdown[plan.name].mrrPence += monthlyPence
  }

  // -------------------------------------------------------------------------
  // 8. Response
  // -------------------------------------------------------------------------
  return NextResponse.json({
    success: true,
    mrr: {
      basePence:    baseMrrPence,
      competePence: competeMrrPence,
      totalPence:   baseMrrPence + competeMrrPence,
    },
    planBreakdown,
    competeBreakdown,
    totalRevenuePence,
    activeSubscriptions:       subs.length,
    activeCompeteSubscriptions: competeSubs.length,
    invoices: enrichedInvoices,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
}
