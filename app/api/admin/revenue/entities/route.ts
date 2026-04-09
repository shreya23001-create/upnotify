import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ─── Auth ────────────────────────────────────────────────────────────────────

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type GroupBy = 'day' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year'

interface InvoiceRow {
  id: string
  org_id: string
  amount_gbp: number
  currency: string
  status: string
  created_at: string
}

export interface PeriodRow {
  periodKey: string
  periodLabel: string
  visionAmount: number      // pence
  visionInvoices: number
  visionCustomers: number
  crozentAmount: number     // paise
  crozentInvoices: number
  crozentCustomers: number
}

export interface EntitySummary {
  totalAmount: number       // pence or paise
  totalInvoices: number
  uniqueCustomers: number
}

export interface EntitiesResponse {
  groupBy: GroupBy
  dateFrom: string | null
  dateTo: string | null
  vision: EntitySummary
  crozent: EntitySummary
  periods: PeriodRow[]
}

// ─── Period helpers ───────────────────────────────────────────────────────────

function getPeriodKey(date: Date, groupBy: GroupBy): string {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()

  switch (groupBy) {
    case 'day':
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    case 'week': {
      // ISO week number
      const startOfYear = new Date(Date.UTC(y, 0, 1))
      const diff = date.getTime() - startOfYear.getTime()
      const weekNum = Math.ceil((diff / 86_400_000 + startOfYear.getUTCDay() + 1) / 7)
      return `${y}-W${String(weekNum).padStart(2, '0')}`
    }
    case 'month':
      return `${y}-${String(m).padStart(2, '0')}`
    case 'quarter':
      return `${y}-Q${Math.ceil(m / 3)}`
    case 'halfYear':
      return `${y}-H${m <= 6 ? 1 : 2}`
    case 'year':
      return `${y}`
  }
}

export function getPeriodLabel(key: string, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'day': {
      const d = new Date(key + 'T00:00:00Z')
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    }
    case 'week': {
      const [yr, wk] = key.split('-W')
      return `Week ${wk}, ${yr}`
    }
    case 'month': {
      const [yr, mo] = key.split('-')
      const d = new Date(Date.UTC(parseInt(yr), parseInt(mo) - 1, 1))
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    }
    case 'quarter':
      return key.replace('-Q', ' Q')
    case 'halfYear':
      return key.replace('-H', ' H')
    case 'year':
      return key
  }
}

const ALLOWED_GROUP_BY = new Set<GroupBy>(['day', 'week', 'month', 'quarter', 'halfYear', 'year'])

// ─── GET /api/admin/revenue/entities ─────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const rawGroupBy = searchParams.get('groupBy') ?? 'month'
  const groupBy: GroupBy = ALLOWED_GROUP_BY.has(rawGroupBy as GroupBy) ? (rawGroupBy as GroupBy) : 'month'
  const dateFrom = searchParams.get('dateFrom') ?? null   // YYYY-MM-DD
  const dateTo   = searchParams.get('dateTo')   ?? null   // YYYY-MM-DD

  const supabase = createAdminClient()

  let query = supabase
    .from('invoices')
    .select('id, org_id, amount_gbp, currency, status, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: true })

  if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`)
  if (dateTo)   query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)

  const { data: raw } = await query
  const invoices = (raw ?? []) as InvoiceRow[]

  // ── Bucket ──────────────────────────────────────────────────────────────────

  interface Bucket {
    visionAmount: number
    visionInvoices: number
    visionOrgs: Set<string>
    crozentAmount: number
    crozentInvoices: number
    crozentOrgs: Set<string>
  }

  const buckets = new Map<string, Bucket>()
  const allVisionOrgs = new Set<string>()
  const allCrozentOrgs = new Set<string>()
  let totalVision = 0
  let totalCrozent = 0
  let visionInvoiceCount = 0
  let crozentInvoiceCount = 0

  for (const inv of invoices) {
    const key = getPeriodKey(new Date(inv.created_at), groupBy)
    if (!buckets.has(key)) {
      buckets.set(key, {
        visionAmount: 0, visionInvoices: 0, visionOrgs: new Set(),
        crozentAmount: 0, crozentInvoices: 0, crozentOrgs: new Set(),
      })
    }
    const b = buckets.get(key)!
    const isCrozent = (inv.currency ?? 'gbp').toLowerCase() === 'inr'

    if (isCrozent) {
      b.crozentAmount += inv.amount_gbp
      b.crozentInvoices++
      b.crozentOrgs.add(inv.org_id)
      allCrozentOrgs.add(inv.org_id)
      totalCrozent += inv.amount_gbp
      crozentInvoiceCount++
    } else {
      b.visionAmount += inv.amount_gbp
      b.visionInvoices++
      b.visionOrgs.add(inv.org_id)
      allVisionOrgs.add(inv.org_id)
      totalVision += inv.amount_gbp
      visionInvoiceCount++
    }
  }

  const periods: PeriodRow[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      periodKey:        key,
      periodLabel:      getPeriodLabel(key, groupBy),
      visionAmount:     b.visionAmount,
      visionInvoices:   b.visionInvoices,
      visionCustomers:  b.visionOrgs.size,
      crozentAmount:    b.crozentAmount,
      crozentInvoices:  b.crozentInvoices,
      crozentCustomers: b.crozentOrgs.size,
    }))

  const response: EntitiesResponse = {
    groupBy,
    dateFrom,
    dateTo,
    vision: {
      totalAmount:     totalVision,
      totalInvoices:   visionInvoiceCount,
      uniqueCustomers: allVisionOrgs.size,
    },
    crozent: {
      totalAmount:     totalCrozent,
      totalInvoices:   crozentInvoiceCount,
      uniqueCustomers: allCrozentOrgs.size,
    },
    periods,
  }

  return NextResponse.json(response)
}
