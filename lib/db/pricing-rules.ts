import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface PricingRule {
  id: string
  org_id: string
  product_group_id: string | null
  rule_name: string
  watch_product_id: string | null
  my_product_id: string | null
  trigger_type: 'price_change' | 'price_drop' | 'price_increase' | 'stock_out' | 'stock_back'
  trigger_threshold_pct: number
  response_action: 'alert' | 'auto_update'
  response_adjust_pct: number
  response_adjust_direction: 'match' | 'undercut' | 'above'
  safety_min_price_pence: number | null
  safety_max_price_pence: number | null
  safety_max_change_pct: number
  safety_max_changes_per_day: number
  auto_update_enabled: boolean
  auto_update_confirmed_at: string | null
  webhook_url: string | null
  webhook_secret: string | null
  alert_channels: string[]
  is_active: boolean
  last_triggered_at: string | null
  trigger_count: number
  created_at: string
}

export interface RuleExecution {
  id: string
  org_id: string
  rule_id: string
  watch_product_id: string | null
  old_price_pence: number | null
  new_price_pence: number | null
  competitor_price_pence: number | null
  action_taken: string
  webhook_response_code: number | null
  details: Record<string, unknown>
  created_at: string
}

export async function getRulesByOrg(orgId: string): Promise<PricingRule[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ecom_pricing_rules')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as PricingRule[]
}

export async function createRule(params: {
  orgId: string
  ruleName: string
  watchProductId?: string
  myProductId?: string
  productGroupId?: string
  triggerType: string
  triggerThresholdPct: number
  responseAction: string
  responseAdjustPct?: number
  responseAdjustDirection?: string
  safetyMinPricePence?: number
  safetyMaxPricePence?: number
  safetyMaxChangePct?: number
  safetyMaxChangesPerDay?: number
  webhookUrl?: string
  webhookSecret?: string
  alertChannels?: string[]
}): Promise<PricingRule | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ecom_pricing_rules')
    .insert({
      org_id: params.orgId,
      rule_name: params.ruleName,
      rule_type: params.triggerType,
      watch_product_id: params.watchProductId ?? null,
      my_product_id: params.myProductId ?? null,
      product_group_id: params.productGroupId ?? null,
      trigger_type: params.triggerType,
      trigger_threshold_pct: params.triggerThresholdPct,
      condition: { threshold_pct: params.triggerThresholdPct },
      response_action: params.responseAction,
      action_type: params.responseAction,
      response_adjust_pct: params.responseAdjustPct ?? 0,
      response_adjust_direction: params.responseAdjustDirection ?? 'match',
      safety_min_price_pence: params.safetyMinPricePence ?? null,
      safety_max_price_pence: params.safetyMaxPricePence ?? null,
      safety_max_change_pct: params.safetyMaxChangePct ?? 20,
      safety_max_changes_per_day: params.safetyMaxChangesPerDay ?? 3,
      webhook_url: params.webhookUrl ?? null,
      webhook_secret: params.webhookSecret ?? null,
      alert_channels: params.alertChannels ?? ['in_app'],
    })
    .select()
    .single()

  if (error) return null
  return data as unknown as PricingRule
}

export async function updateRule(
  ruleId: string,
  orgId: string,
  updates: Partial<Pick<PricingRule,
    'rule_name' | 'trigger_type' | 'trigger_threshold_pct' | 'response_action' |
    'response_adjust_pct' | 'response_adjust_direction' |
    'safety_min_price_pence' | 'safety_max_price_pence' | 'safety_max_change_pct' |
    'safety_max_changes_per_day' | 'webhook_url' | 'webhook_secret' |
    'alert_channels' | 'is_active'
  >>
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ecom_pricing_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('org_id', orgId)

  return !error
}

export async function enableAutoUpdate(ruleId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ecom_pricing_rules')
    .update({
      auto_update_enabled: true,
      auto_update_confirmed_at: new Date().toISOString(),
      response_action: 'auto_update',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)
    .eq('org_id', orgId)

  return !error
}

export async function disableAutoUpdate(ruleId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ecom_pricing_rules')
    .update({
      auto_update_enabled: false,
      response_action: 'alert',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)
    .eq('org_id', orgId)

  return !error
}

export async function deleteRule(ruleId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ecom_pricing_rules')
    .delete()
    .eq('id', ruleId)
    .eq('org_id', orgId)

  return !error
}

export async function getRuleExecutions(orgId: string, ruleId?: string, limit = 50): Promise<RuleExecution[]> {
  const supabase = await createClient()

  let query = supabase
    .from('pricing_rule_executions')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (ruleId) query = query.eq('rule_id', ruleId)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as unknown as RuleExecution[]
}

export async function logRuleExecution(params: {
  orgId: string
  ruleId: string
  watchProductId?: string
  oldPricePence?: number
  newPricePence?: number
  competitorPricePence?: number
  actionTaken: string
  webhookResponseCode?: number
  webhookResponseBody?: string
  details?: Record<string, unknown>
}): Promise<void> {
  const supabase = createAdminClient()

  await supabase.from('pricing_rule_executions').insert({
    org_id: params.orgId,
    rule_id: params.ruleId,
    watch_product_id: params.watchProductId ?? null,
    old_price_pence: params.oldPricePence ?? null,
    new_price_pence: params.newPricePence ?? null,
    competitor_price_pence: params.competitorPricePence ?? null,
    action_taken: params.actionTaken,
    webhook_response_code: params.webhookResponseCode ?? null,
    webhook_response_body: params.webhookResponseBody ?? null,
    details: (params.details ?? {}) as unknown as Record<string, never>,
  })

  // Update rule last triggered timestamp
  await supabase
    .from('ecom_pricing_rules')
    .update({ last_triggered_at: new Date().toISOString(), trigger_count: 0 })
    .eq('id', params.ruleId)
}

// ---------- Admin ----------

export async function getActiveRulesForProcessing(): Promise<PricingRule[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ecom_pricing_rules')
    .select('*')
    .eq('is_active', true)

  if (error) return []
  return (data ?? []) as unknown as PricingRule[]
}
