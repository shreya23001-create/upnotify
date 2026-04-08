'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/db/users'
import { updatePlan, togglePlanActive } from '@/lib/db/plans'
import { updateCreditRule, toggleCreditRuleActive } from '@/lib/db/credit-rules'
import { updateCompetePlan } from '@/lib/db/compete-plans'
import { logger } from '@/lib/utils/logger'

interface ActionResult {
  success: boolean
  error?: string
}

/** Update a plan's pricing and limits from the admin panel */
export async function updatePlanAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const id = formData.get('id') as string
  if (!id) return { success: false, error: 'Plan ID is required' }

  const updates: Record<string, unknown> = {}

  const stringFields = ['name', 'slug', 'type'] as const
  for (const field of stringFields) {
    const value = formData.get(field)
    if (typeof value === 'string' && value.trim() !== '') updates[field] = value
  }

  const intFields = [
    'price_monthly_gbp', 'price_annual_gbp',
    'price_monthly_usd', 'price_annual_usd',
    'price_monthly_inr', 'price_annual_inr',
    'onboarding_fee_gbp',
    'monitor_limit', 'check_interval_seconds',
    'client_workspace_limit', 'max_team_members',
    'data_retention_days', 'voice_call_monthly_limit',
    'status_page_limit', 'ai_report_limit',
    'competitor_limit',
    'llms_txt_limit', 'citation_check_monthly_limit',
  ] as const
  const nullableIntFields = ['price_annual_gbp', 'price_annual_usd', 'price_annual_inr', 'monitor_limit', 'client_workspace_limit', 'data_retention_days']
  for (const field of intFields) {
    const raw = formData.get(field)
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = parseInt(raw, 10)
      if (isNaN(parsed)) {
        return { success: false, error: `Invalid number for ${field}` }
      }
      updates[field] = parsed
    } else if (raw === '' || raw === null) {
      if (nullableIntFields.includes(field)) {
        updates[field] = null
      }
    }
  }

  const boolFields = [
    'has_api_access', 'has_ai_predictive',
    'has_email_alerts', 'has_slack_teams', 'has_webhooks',
    'has_status_pages', 'has_status_page_custom_domain',
    'has_white_label', 'has_voice_calls', 'is_visible',
  ] as const
  for (const field of boolFields) {
    // Hidden field sends "false", checkbox sends "true" — getAll returns both when checked
    const values = formData.getAll(field)
    updates[field] = values.includes('true')
  }

  const stripeFields = ['stripe_price_id_monthly', 'stripe_price_id_annual'] as const
  for (const field of stripeFields) {
    const value = formData.get(field) as string | null
    if (value !== null) updates[field] = value || null
  }

  const result = await updatePlan(id, updates)
  if (!result) {
    logger.error('Admin: Plan update failed', { planId: id })
    return { success: false, error: 'Failed to update plan' }
  }

  logger.info('Admin: Plan updated', { planId: id, planName: result.name })
  revalidatePath('/admin/plans')
  revalidatePath('/admin')
  return { success: true }
}

/** Toggle plan visibility */
export async function togglePlanVisibilityAction(id: string, isVisible: boolean): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const result = await togglePlanActive(id, isVisible)
  if (!result) return { success: false, error: 'Failed to toggle plan visibility' }

  logger.info('Admin: Plan visibility toggled', { planId: id, isVisible })
  revalidatePath('/admin/plans')
  return { success: true }
}

/** Update a credit rule */
export async function updateCreditRuleAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const id = formData.get('id') as string
  if (!id) return { success: false, error: 'Credit rule ID is required' }

  const updates: Record<string, unknown> = {}

  const displayName = formData.get('display_name') as string | null
  if (displayName) updates.display_name = displayName

  const creditType = formData.get('credit_type') as string | null
  if (creditType) updates.credit_type = creditType

  const creditIntFields = ['credit_amount_pence', 'max_per_user', 'max_credit_per_month_pence'] as const
  for (const field of creditIntFields) {
    const raw = formData.get(field)
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = parseInt(raw, 10)
      if (isNaN(parsed)) {
        return { success: false, error: `Invalid number for ${field}` }
      }
      updates[field] = parsed
    }
  }

  const result = await updateCreditRule(id, updates)
  if (!result) return { success: false, error: 'Failed to update credit rule' }

  logger.info('Admin: Credit rule updated', { ruleId: id })
  revalidatePath('/admin/plans')
  return { success: true }
}

/** Update a compete plan's Stripe IDs and active status */
export async function updateCompetePlanAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const id = formData.get('id') as string
  if (!id) return { success: false, error: 'Compete plan ID is required' }

  const updates: Parameters<typeof updateCompetePlan>[1] = {}

  const stripeProductId = formData.get('stripe_product_id') as string | null
  if (stripeProductId !== null) updates.stripe_product_id = stripeProductId || null

  const stripeMonthlyPriceId = formData.get('stripe_monthly_price_id') as string | null
  if (stripeMonthlyPriceId !== null) updates.stripe_monthly_price_id = stripeMonthlyPriceId || null

  const stripeYearlyPriceId = formData.get('stripe_yearly_price_id') as string | null
  if (stripeYearlyPriceId !== null) updates.stripe_yearly_price_id = stripeYearlyPriceId || null

  const isActiveVal = formData.get('is_active')
  if (isActiveVal !== null) updates.is_active = isActiveVal === 'true'

  const result = await updateCompetePlan(id, updates)
  if (!result) return { success: false, error: 'Failed to update compete plan' }

  logger.info('Admin: Compete plan updated', { planId: id })
  revalidatePath('/admin/plans')
  return { success: true }
}

/** Toggle credit rule active/inactive */
export async function toggleCreditRuleActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const result = await toggleCreditRuleActive(id, isActive)
  if (!result) return { success: false, error: 'Failed to toggle credit rule' }

  logger.info('Admin: Credit rule toggled', { ruleId: id, isActive })
  revalidatePath('/admin/plans')
  return { success: true }
}
