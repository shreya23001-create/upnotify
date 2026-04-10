/**
 * GET  /api/admin/revenue/razorpay-upgrades
 *   Returns all Razorpay annual upgrade credit records with optional filters.
 *   Query params:
 *     status   — all | pending | refunded | waived  (default: all)
 *     dateFrom — YYYY-MM-DD  (upgraded_at >=)
 *     dateTo   — YYYY-MM-DD  (upgraded_at <=)
 *     page     — 1-based page number (default: 1)
 *     pageSize — rows per page (default: 50, max: 200)
 *
 * PATCH /api/admin/revenue/razorpay-upgrades
 *   Updates the refund status of one record.
 *   Body: { id, refund_status, refunded_amount_inr?, refund_notes? }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RefundStatus = 'pending' | 'refunded' | 'waived'

export interface UpgradeLogRow {
  id: string
  org_id: string
  org_name: string
  user_email: string
  old_razorpay_subscription_id: string
  old_plan_name: string
  old_plan_slug: string
  old_plan_price_annual_inr: number
  old_subscription_started_at: string
  old_subscription_period_end: string
  new_razorpay_subscription_id: string
  new_plan_name: string
  new_plan_slug: string
  new_plan_price_annual_inr: number
  upgraded_at: string
  days_remaining: number
  credit_amount_inr: number
  refund_status: RefundStatus
  refunded_at: string | null
  refunded_amount_inr: number | null
  refund_notes: string | null
  created_at: string
}

export interface UpgradesResponse {
  rows: UpgradeLogRow[]
  total: number
  page: number
  pageSize: number
  summary: {
    totalPendingInr: number
    totalRefundedInr: number
    countPending: number
    countRefunded: number
    countWaived: number
  }
}

const ALLOWED_STATUSES = new Set<string>(['pending', 'refunded', 'waived'])

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)

  const rawStatus  = searchParams.get('status') ?? 'all'
  const dateFrom   = searchParams.get('dateFrom') ?? null
  const dateTo     = searchParams.get('dateTo')   ?? null
  const page       = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10))
  const pageSize   = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)))

  const supabase = createAdminClient()

  // ── Summary aggregates (all time, no date filter) ──────────────────────────
  const { data: allRows } = await supabase
    .from('razorpay_annual_upgrade_log')
    .select('credit_amount_inr, refunded_amount_inr, refund_status')

  const summary = {
    totalPendingInr:  0,
    totalRefundedInr: 0,
    countPending:     0,
    countRefunded:    0,
    countWaived:      0,
  }
  for (const r of allRows ?? []) {
    if (r.refund_status === 'pending')  { summary.totalPendingInr  += r.credit_amount_inr;  summary.countPending++ }
    if (r.refund_status === 'refunded') { summary.totalRefundedInr += r.refunded_amount_inr ?? r.credit_amount_inr; summary.countRefunded++ }
    if (r.refund_status === 'waived')   { summary.countWaived++ }
  }

  // ── Filtered query ─────────────────────────────────────────────────────────
  let query = supabase
    .from('razorpay_annual_upgrade_log')
    .select('*', { count: 'exact' })
    .order('upgraded_at', { ascending: false })

  if (ALLOWED_STATUSES.has(rawStatus)) {
    query = query.eq('refund_status', rawStatus)
  }
  if (dateFrom) query = query.gte('upgraded_at', `${dateFrom}T00:00:00.000Z`)
  if (dateTo)   query = query.lte('upgraded_at', `${dateTo}T23:59:59.999Z`)

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1
  query = query.range(from, to)

  const { data: rows, count, error } = await query

  if (error) {
    logger.error('Admin: failed to fetch razorpay annual upgrades', { error: error.message })
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }

  const response: UpgradesResponse = {
    rows:     (rows ?? []) as UpgradeLogRow[],
    total:    count ?? 0,
    page,
    pageSize,
    summary,
  }

  return NextResponse.json(response)
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

interface PatchBody {
  id: string
  refund_status: RefundStatus
  refunded_amount_inr?: number
  refund_notes?: string
}

export async function PATCH(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Partial<PatchBody>

  if (!b.id || typeof b.id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  if (!b.refund_status || !ALLOWED_STATUSES.has(b.refund_status)) {
    return NextResponse.json({ error: 'refund_status must be pending | refunded | waived' }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    refund_status: b.refund_status,
  }

  if (b.refund_status === 'refunded') {
    update.refunded_at         = new Date().toISOString()
    update.refunded_amount_inr = typeof b.refunded_amount_inr === 'number' ? b.refunded_amount_inr : null
  }

  if (b.refund_notes !== undefined) {
    update.refund_notes = b.refund_notes
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('razorpay_annual_upgrade_log')
    .update(update)
    .eq('id', b.id)

  if (error) {
    logger.error('Admin: failed to update razorpay annual upgrade log', {
      id: b.id,
      error: error.message,
    })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  logger.info('Admin: razorpay annual upgrade record updated', {
    id: b.id,
    refund_status: b.refund_status,
  })

  return NextResponse.json({ success: true })
}
