/**
 * POST /api/admin/razorpay/sync-plans
 *
 * One-time setup endpoint. Creates Razorpay plans for every paid INR plan
 * and stores the resulting plan IDs back in the `plans` table.
 *
 * Safe to re-run — skips plans that already have a Razorpay plan ID.
 * Call this from the admin panel once Razorpay keys are configured.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRazorpayPlan, razorpayErrorMessage } from '@/lib/services/payments-razorpay'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

interface PlanRow {
  id: string
  name: string
  slug: string
  price_monthly_inr: number
  price_annual_inr: number
  razorpay_monthly_plan_id: string | null
  razorpay_annual_plan_id: string | null
}

export async function POST(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, name, slug, price_monthly_inr, price_annual_inr, razorpay_monthly_plan_id, razorpay_annual_plan_id')
    .neq('slug', 'free')
    .eq('is_visible', true)
    .order('price_monthly_inr', { ascending: true })

  if (error || !plans) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }

  const results: { slug: string; monthly?: string; annual?: string; skipped?: string[]; errors?: string[] }[] = []

  for (const plan of plans as unknown as PlanRow[]) {
    const skipped: string[] = []
    const errors: string[] = []
    let monthlyPlanId = plan.razorpay_monthly_plan_id
    let annualPlanId  = plan.razorpay_annual_plan_id

    // Monthly plan
    if (!monthlyPlanId && plan.price_monthly_inr > 0) {
      try {
        const rzpPlan = await createRazorpayPlan({
          name:         `${plan.name} Monthly`,
          amountPaise:  plan.price_monthly_inr,
          period:       'monthly',
          planSlug:     plan.slug,
          billingCycle: 'monthly',
        })
        monthlyPlanId = rzpPlan.id
      } catch (err) {
        const msg = razorpayErrorMessage(err)
        logger.error('Razorpay sync: failed to create monthly plan', { slug: plan.slug, error: msg })
        skipped.push('monthly')
        errors.push(`monthly: ${msg}`)
      }
    } else if (monthlyPlanId) {
      skipped.push('monthly (already exists)')
    }

    // Annual plan
    if (!annualPlanId && plan.price_annual_inr > 0) {
      try {
        const rzpPlan = await createRazorpayPlan({
          name:         `${plan.name} Annual`,
          amountPaise:  plan.price_annual_inr,
          period:       'yearly',
          planSlug:     plan.slug,
          billingCycle: 'annual',
        })
        annualPlanId = rzpPlan.id
      } catch (err) {
        const msg = razorpayErrorMessage(err)
        logger.error('Razorpay sync: failed to create annual plan', { slug: plan.slug, error: msg })
        skipped.push('annual')
        errors.push(`annual: ${msg}`)
      }
    } else if (annualPlanId) {
      skipped.push('annual (already exists)')
    }

    // Save back to DB
    if (monthlyPlanId || annualPlanId) {
      await supabase
        .from('plans')
        .update({
          ...(monthlyPlanId ? { razorpay_monthly_plan_id: monthlyPlanId } : {}),
          ...(annualPlanId  ? { razorpay_annual_plan_id:  annualPlanId  } : {}),
        })
        .eq('id', plan.id)
    }

    results.push({
      slug:    plan.slug,
      monthly: monthlyPlanId ?? undefined,
      annual:  annualPlanId  ?? undefined,
      skipped: skipped.length ? skipped : undefined,
      errors:  errors.length ? errors : undefined,
    })
  }

  logger.info('Razorpay plan sync complete', { results })
  return NextResponse.json({ success: true, results })
}
