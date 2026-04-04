import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveRulesForProcessing, logRuleExecution } from '@/lib/db/pricing-rules'
import { sendUserMessage } from '@/lib/db/user-messages'
import { sendAlertEmail } from '@/lib/services/email'
import { logger } from '@/lib/utils/logger'
import type { PricingRule } from '@/lib/db/pricing-rules'

interface PriceChange {
  productId: string
  orgId: string
  oldPricePence: number
  newPricePence: number
  productName: string
  productUrl: string
  stockStatus?: string
}

/**
 * Evaluate all active pricing rules against a price change.
 * Called after every price extraction that detects a change.
 */
export async function evaluateRulesForPriceChange(change: PriceChange): Promise<void> {
  const rules = await getActiveRulesForProcessing()

  // Filter rules that match this product
  const matchingRules = rules.filter(r =>
    r.watch_product_id === change.productId && r.is_active
  )

  for (const rule of matchingRules) {
    try {
      await processRule(rule, change)
    } catch (err) {
      logger.error('Rule processing error', {
        ruleId: rule.id,
        error: err instanceof Error ? err.message : 'Unknown',
      })
    }
  }
}

async function processRule(rule: PricingRule, change: PriceChange): Promise<void> {
  const pctChange = change.oldPricePence > 0
    ? ((change.newPricePence - change.oldPricePence) / change.oldPricePence) * 100
    : 0

  // Check if trigger condition is met
  const triggered = checkTrigger(rule, pctChange, change)
  if (!triggered) return

  // Check daily execution limit
  const withinLimit = await checkDailyLimit(rule)
  if (!withinLimit) {
    await logRuleExecution({
      orgId: change.orgId,
      ruleId: rule.id,
      watchProductId: change.productId,
      oldPricePence: change.oldPricePence,
      newPricePence: change.newPricePence,
      competitorPricePence: change.newPricePence,
      actionTaken: 'blocked_limit',
      details: { reason: 'Daily execution limit reached', limit: rule.safety_max_changes_per_day },
    })
    return
  }

  // Calculate the new price for auto-update
  const calculatedPrice = calculateResponsePrice(rule, change.newPricePence)

  // Check safety limits
  if (rule.auto_update_enabled && calculatedPrice !== null) {
    const safetyCheck = checkSafetyLimits(rule, change.oldPricePence, calculatedPrice)
    if (!safetyCheck.safe) {
      await logRuleExecution({
        orgId: change.orgId,
        ruleId: rule.id,
        watchProductId: change.productId,
        oldPricePence: change.oldPricePence,
        newPricePence: calculatedPrice,
        competitorPricePence: change.newPricePence,
        actionTaken: 'blocked_safety',
        details: { reason: safetyCheck.reason },
      })

      // Still notify the user about the blocked action
      await notifyUser(rule, change, calculatedPrice, true)
      return
    }
  }

  if (rule.auto_update_enabled && rule.webhook_url && calculatedPrice !== null) {
    // Auto-update: send webhook to user's store
    await executeAutoUpdate(rule, change, calculatedPrice)
  } else {
    // Alert only: notify the user
    await notifyUser(rule, change, calculatedPrice, false)
    await logRuleExecution({
      orgId: change.orgId,
      ruleId: rule.id,
      watchProductId: change.productId,
      oldPricePence: change.oldPricePence,
      newPricePence: change.newPricePence,
      competitorPricePence: change.newPricePence,
      actionTaken: 'alert_sent',
    })
  }
}

function checkTrigger(rule: PricingRule, pctChange: number, change: PriceChange): boolean {
  const absPct = Math.abs(pctChange)
  const threshold = rule.trigger_threshold_pct

  switch (rule.trigger_type) {
    case 'price_change':
      return absPct >= threshold
    case 'price_drop':
      return pctChange <= -threshold
    case 'price_increase':
      return pctChange >= threshold
    case 'stock_out':
      return change.stockStatus === 'out_of_stock'
    case 'stock_back':
      return change.stockStatus === 'in_stock'
    default:
      return false
  }
}

function calculateResponsePrice(rule: PricingRule, competitorPricePence: number): number | null {
  if (rule.response_action !== 'auto_update') return null

  const adjustPct = rule.response_adjust_pct

  switch (rule.response_adjust_direction) {
    case 'match':
      return competitorPricePence
    case 'undercut':
      return Math.round(competitorPricePence * (1 - adjustPct / 100))
    case 'above':
      return Math.round(competitorPricePence * (1 + adjustPct / 100))
    default:
      return competitorPricePence
  }
}

function checkSafetyLimits(
  rule: PricingRule,
  currentPricePence: number,
  newPricePence: number
): { safe: boolean; reason?: string } {
  // Min price check
  if (rule.safety_min_price_pence !== null && newPricePence < rule.safety_min_price_pence) {
    return { safe: false, reason: `New price \u00A3${(newPricePence / 100).toFixed(2)} is below minimum \u00A3${(rule.safety_min_price_pence / 100).toFixed(2)}` }
  }

  // Max price check
  if (rule.safety_max_price_pence !== null && newPricePence > rule.safety_max_price_pence) {
    return { safe: false, reason: `New price \u00A3${(newPricePence / 100).toFixed(2)} exceeds maximum \u00A3${(rule.safety_max_price_pence / 100).toFixed(2)}` }
  }

  // Max change % check
  if (currentPricePence > 0) {
    const changePct = Math.abs((newPricePence - currentPricePence) / currentPricePence * 100)
    if (changePct > rule.safety_max_change_pct) {
      return { safe: false, reason: `Price change ${changePct.toFixed(1)}% exceeds max allowed ${rule.safety_max_change_pct}%` }
    }
  }

  return { safe: true }
}

async function checkDailyLimit(rule: PricingRule): Promise<boolean> {
  const supabase = createAdminClient()
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()

  const { count } = await supabase
    .from('pricing_rule_executions')
    .select('id', { count: 'exact', head: true })
    .eq('rule_id', rule.id)
    .gte('created_at', oneDayAgo)
    .in('action_taken', ['auto_updated', 'alert_sent'])

  return (count ?? 0) < rule.safety_max_changes_per_day
}

async function executeAutoUpdate(
  rule: PricingRule,
  change: PriceChange,
  newPricePence: number
): Promise<void> {
  const payload = {
    event: 'price_update',
    product_url: change.productUrl,
    product_name: change.productName,
    competitor_price: { amount: change.newPricePence, currency: 'GBP' },
    new_price: { amount: newPricePence, currency: 'GBP' },
    old_price: { amount: change.oldPricePence, currency: 'GBP' },
    rule_name: rule.rule_name,
    timestamp: new Date().toISOString(),
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  // Sign with HMAC if secret is set
  if (rule.webhook_secret) {
    const crypto = await import('crypto')
    const signature = crypto
      .createHmac('sha256', rule.webhook_secret)
      .update(JSON.stringify(payload))
      .digest('hex')
    headers['X-Uptrue-Signature'] = `sha256=${signature}`
  }

  try {
    const res = await fetch(rule.webhook_url!, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })

    const responseBody = await res.text().catch(() => '')

    await logRuleExecution({
      orgId: change.orgId,
      ruleId: rule.id,
      watchProductId: change.productId,
      oldPricePence: change.oldPricePence,
      newPricePence: newPricePence,
      competitorPricePence: change.newPricePence,
      actionTaken: res.ok ? 'auto_updated' : 'webhook_failed',
      webhookResponseCode: res.status,
      webhookResponseBody: responseBody.slice(0, 500),
    })

    if (!res.ok) {
      logger.warn('Auto-update webhook failed', {
        ruleId: rule.id,
        status: res.status,
      })
      // Notify user of failure
      await notifyUser(rule, change, newPricePence, false, `Auto-update webhook returned ${res.status}. Price was NOT updated.`)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown'
    await logRuleExecution({
      orgId: change.orgId,
      ruleId: rule.id,
      watchProductId: change.productId,
      oldPricePence: change.oldPricePence,
      newPricePence: newPricePence,
      competitorPricePence: change.newPricePence,
      actionTaken: 'webhook_failed',
      details: { error: errorMsg },
    })
    logger.error('Auto-update webhook exception', { ruleId: rule.id, error: errorMsg })
  }
}

async function notifyUser(
  rule: PricingRule,
  change: PriceChange,
  calculatedPrice: number | null,
  blocked: boolean,
  extraMessage?: string
): Promise<void> {
  const supabase = createAdminClient()

  // Find the org owner for notification
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .eq('org_id', change.orgId)
    .eq('role', 'owner')
    .limit(1)

  const owner = users?.[0]
  if (!owner) return

  const pctChange = change.oldPricePence > 0
    ? ((change.newPricePence - change.oldPricePence) / change.oldPricePence * 100).toFixed(1)
    : '0'

  const direction = change.newPricePence > change.oldPricePence ? 'increased' : 'decreased'
  const title = blocked
    ? `Price rule blocked: ${rule.rule_name}`
    : `Price alert: ${change.productName} ${direction} ${Math.abs(Number(pctChange))}%`

  const body = [
    `${change.productName} price ${direction} from \u00A3${(change.oldPricePence / 100).toFixed(2)} to \u00A3${(change.newPricePence / 100).toFixed(2)} (${pctChange}%).`,
    calculatedPrice !== null ? `Calculated response price: \u00A3${(calculatedPrice / 100).toFixed(2)}.` : '',
    blocked ? 'Action was blocked by safety limits.' : '',
    extraMessage ?? '',
  ].filter(Boolean).join(' ')

  // In-app message
  await sendUserMessage({
    userId: owner.id,
    orgId: change.orgId,
    title,
    body,
    type: blocked ? 'warning' : 'info',
    category: 'general',
    actionUrl: '/dashboard/compete',
    actionLabel: 'View Compete',
  })

  // Email if configured
  if (rule.alert_channels?.includes('email') && owner.email) {
    await sendAlertEmail({
      to: owner.email,
      subject: `[Uptrue Compete] ${title}`,
      body,
    })
  }
}
