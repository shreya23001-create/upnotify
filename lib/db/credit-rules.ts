import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { CreditRule } from '@/lib/types'

/** Fetch all credit rules ordered by rule_key */
export async function getAllCreditRules(): Promise<CreditRule[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('credit_rules')
    .select('*')
    .order('rule_key', { ascending: true })

  if (error) {
    logger.error('CreditRules: Failed to get all credit rules', { error: error.message })
    return []
  }
  return data ?? []
}

/** Update a credit rule by ID — partial update */
export async function updateCreditRule(
  id: string,
  updates: Partial<Omit<CreditRule, 'id' | 'created_at' | 'updated_at'>>
): Promise<CreditRule | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('credit_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('CreditRules: Failed to update credit rule', { error: error.message, ruleId: id })
    return null
  }
  return data
}

/** Toggle credit rule active/inactive */
export async function toggleCreditRuleActive(id: string, isActive: boolean): Promise<CreditRule | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('credit_rules')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('CreditRules: Failed to toggle credit rule', { error: error.message, ruleId: id })
    return null
  }
  return data
}
