import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { UserCredit } from '@/lib/types'

/**
 * Get all credits for a user (visible to the user via RLS).
 */
export async function getUserCredits(userId: string): Promise<UserCredit[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) {
    logger.error('UserCredits: Failed to get credits', { userId, error: error.message })
    return []
  }
  return data ?? []
}

/**
 * Get the total active (not applied, not expired) credit balance for a user in pence.
 */
export async function getUserCreditBalance(userId: string): Promise<number> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_credits')
    .select('amount_pence')
    .eq('user_id', userId)
    .eq('applied', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (error) {
    logger.error('UserCredits: Failed to get credit balance', { userId, error: error.message })
    return 0
  }

  return (data ?? []).reduce((sum, c) => sum + c.amount_pence, 0)
}

/**
 * Award a credit to a user. Uses admin client to bypass RLS.
 * Checks max_per_user and max_credit_per_month_pence from the rule.
 */
export async function awardCredit(
  userId: string,
  orgId: string,
  ruleKey: string,
  amountPence: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Fetch the rule to validate limits
  const { data: rule, error: ruleError } = await supabase
    .from('credit_rules')
    .select('*')
    .eq('rule_key', ruleKey)
    .eq('is_active', true)
    .single()

  if (ruleError || !rule) {
    logger.error('UserCredits: Rule not found or inactive', { ruleKey, error: ruleError?.message })
    return { success: false, error: 'Credit rule not found or inactive.' }
  }

  // Check how many times user has earned this rule
  const { count: existingCount } = await supabase
    .from('user_credits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('rule_key', ruleKey)

  if ((existingCount ?? 0) >= rule.max_per_user) {
    return { success: false, error: 'Maximum credits for this action already reached.' }
  }

  // Check monthly credit cap
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: monthlyCredits } = await supabase
    .from('user_credits')
    .select('amount_pence')
    .eq('user_id', userId)
    .gte('earned_at', monthStart.toISOString())

  const monthlyTotal = (monthlyCredits ?? []).reduce((sum, c) => sum + c.amount_pence, 0)
  const maxMonthly = rule.max_credit_per_month_pence ?? 1000

  if (monthlyTotal + amountPence > maxMonthly) {
    return { success: false, error: 'Monthly credit cap reached.' }
  }

  // Calculate expiry — credits expire after 12 months
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const { error: insertError } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      org_id: orgId,
      rule_key: ruleKey,
      amount_pence: amountPence,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    logger.error('UserCredits: Failed to award credit', { userId, ruleKey, error: insertError.message })
    return { success: false, error: 'Failed to award credit.' }
  }

  return { success: true }
}
