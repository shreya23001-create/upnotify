import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { UserCredit } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreditResult {
  success: boolean
  error?: string
}

interface ApplyCreditResult extends CreditResult {
  totalAppliedPence?: number
  creditCount?: number
}

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
): Promise<CreditResult> {
  const supabase = createAdminClient()

  // Block credits for trial subscriptions — only paid plans can earn credits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('org_id', orgId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    logger.warn('UserCredits: No active subscription found', { userId, orgId })
    return { success: false, error: 'No active subscription found.' }
  }

  if (subscription.status === 'trialing') {
    logger.info('UserCredits: Credit blocked — user is on trial', { userId, orgId, ruleKey })
    return { success: false, error: 'Credits are not available during the trial period. Upgrade to a paid plan to start earning credits.' }
  }

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

// ---------------------------------------------------------------------------
// Credit balance for an organisation (all users combined)
// ---------------------------------------------------------------------------

/**
 * Get the total unapplied, non-expired credit balance for an entire org in pence.
 * Useful for billing displays and invoice credit calculations.
 */
export async function getCreditBalanceForOrg(orgId: string): Promise<number> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_credits')
    .select('amount_pence')
    .eq('org_id', orgId)
    .eq('applied', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (error) {
    logger.error('UserCredits: Failed to get org credit balance', { orgId, error: error.message })
    return 0
  }

  return (data ?? []).reduce((sum, c) => sum + c.amount_pence, 0)
}

// ---------------------------------------------------------------------------
// Apply credits to Stripe invoice (Phase 1 — DB tracking only)
// ---------------------------------------------------------------------------

/**
 * Marks all unapplied, non-expired credits for an org as applied.
 * Returns the total amount in pence that should be deducted from the next invoice.
 *
 * Phase 1 (MVP): Credits are tracked in the DB and shown in billing UI.
 * The message "Your credit will be applied to your next bill" is displayed.
 * Actual Stripe invoice item creation (negative amount line item) is Phase 2.
 *
 * Phase 2 (future): This function will also call Stripe API to create a
 * negative invoice item via stripe.invoiceItems.create({ amount: -totalPence, ... })
 */
export async function applyCreditsToStripeInvoice(
  orgId: string
): Promise<ApplyCreditResult> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Fetch all unapplied, non-expired credits for this org
  const { data: credits, error: fetchError } = await supabase
    .from('user_credits')
    .select('id, amount_pence')
    .eq('org_id', orgId)
    .eq('applied', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (fetchError) {
    logger.error('UserCredits: Failed to fetch unapplied credits', { orgId, error: fetchError.message })
    return { success: false, error: 'Failed to fetch credits.' }
  }

  if (!credits || credits.length === 0) {
    return { success: true, totalAppliedPence: 0, creditCount: 0 }
  }

  const totalPence = credits.reduce((sum, c) => sum + c.amount_pence, 0)
  const creditIds = credits.map(c => c.id)

  // Mark all as applied
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ applied: true, applied_at: now })
    .in('id', creditIds)

  if (updateError) {
    logger.error('UserCredits: Failed to mark credits as applied', { orgId, error: updateError.message })
    return { success: false, error: 'Failed to apply credits.' }
  }

  logger.info('UserCredits: Credits applied to invoice', {
    orgId,
    totalPence,
    creditCount: credits.length,
  })

  // Phase 2 TODO: Create Stripe negative invoice item
  // await stripe.invoiceItems.create({
  //   customer: stripeCustomerId,
  //   amount: -totalPence,
  //   currency: 'gbp',
  //   description: `Uptrue credit applied (${credits.length} credits)`,
  // })

  return {
    success: true,
    totalAppliedPence: totalPence,
    creditCount: credits.length,
  }
}
