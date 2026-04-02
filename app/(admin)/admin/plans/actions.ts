'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/db/users'
import { updatePlan, togglePlanActive } from '@/lib/db/plans'
import { updateCreditRule, toggleCreditRuleActive } from '@/lib/db/credit-rules'
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
    'has_status_page_custom_domain', 'has_white_label',
    'has_voice_calls', 'is_visible',
  ] as const
  for (const field of boolFields) {
    const value = formData.get(field)
    updates[field] = value === 'true' || value === 'on'
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
