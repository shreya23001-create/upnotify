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

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Active subscriptions with plan details
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, org_id, status, billing_cycle, plans(name, slug, price_monthly_gbp, price_annual_gbp)')
    .eq('status', 'active')

  // Compete subscriptions
  const { data: competeSubs } = await supabase
    .from('compete_subscriptions')
    .select('id, org_id, status, billing_cycle, compete_plans(name, slug, price_monthly_pence, price_yearly_pence)')
    .eq('status', 'active')

  // Invoices (last 20)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, org_id, amount_gbp, status, invoice_pdf_url, period_start, period_end, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  // Calculate MRR from base plans
  let baseMrrPence = 0
  const planBreakdown: Record<string, { count: number; mrrPence: number }> = {}

  for (const sub of subs ?? []) {
    const plan = (sub as unknown as { plans: { name: string; price_monthly_gbp: number; price_annual_gbp: number | null } }).plans
    if (!plan) continue
    const monthlyPence = sub.billing_cycle === 'annual' && plan.price_annual_gbp
      ? Math.round(plan.price_annual_gbp / 12)
      : plan.price_monthly_gbp
    baseMrrPence += monthlyPence
    if (!planBreakdown[plan.name]) planBreakdown[plan.name] = { count: 0, mrrPence: 0 }
    planBreakdown[plan.name].count++
    planBreakdown[plan.name].mrrPence += monthlyPence
  }

  // Calculate Compete MRR
  let competeMrrPence = 0
  const competeBreakdown: Record<string, { count: number; mrrPence: number }> = {}

  for (const sub of competeSubs ?? []) {
    const plan = (sub as unknown as { compete_plans: { name: string; price_monthly_pence: number; price_yearly_pence: number | null } }).compete_plans
    if (!plan) continue
    const monthlyPence = sub.billing_cycle === 'annual' && plan.price_yearly_pence
      ? Math.round(plan.price_yearly_pence / 12)
      : plan.price_monthly_pence
    competeMrrPence += monthlyPence
    if (!competeBreakdown[plan.name]) competeBreakdown[plan.name] = { count: 0, mrrPence: 0 }
    competeBreakdown[plan.name].count++
    competeBreakdown[plan.name].mrrPence += monthlyPence
  }

  // Total revenue from invoices
  const totalRevenuePence = (invoices ?? [])
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.amount_gbp ?? 0), 0)

  return NextResponse.json({
    success: true,
    mrr: {
      basePence: baseMrrPence,
      competePence: competeMrrPence,
      totalPence: baseMrrPence + competeMrrPence,
    },
    planBreakdown,
    competeBreakdown,
    totalRevenuePence,
    activeSubscriptions: (subs ?? []).length,
    activeCompeteSubscriptions: (competeSubs ?? []).length,
    recentInvoices: invoices ?? [],
  })
}
