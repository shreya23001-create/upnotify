import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Referral } from '@/lib/types'

/**
 * Generate a unique referral code for a user.
 * Format: 6 alphanumeric chars, stored on the users table.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  const supabase = createAdminClient()

  // Check if user already has a referral code
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (userError) {
    logger.error('Referrals: Failed to get user referral code', { userId, error: userError.message })
    return null
  }

  if (user.referral_code) {
    return user.referral_code
  }

  // Generate a unique code — 8 chars alphanumeric
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ referral_code: code })
    .eq('id', userId)

  if (updateError) {
    logger.error('Referrals: Failed to set referral code', { userId, error: updateError.message })
    return null
  }

  return code
}

/**
 * Look up who owns a referral code.
 */
export async function getUserByReferralCode(code: string): Promise<{ id: string; org_id: string } | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, org_id')
    .eq('referral_code', code)
    .single()

  if (error) {
    logger.error('Referrals: Failed to find user by referral code', { code, error: error.message })
    return null
  }
  return data
}

/**
 * Get all referrals created by a user.
 */
export async function getReferralsByUser(userId: string): Promise<Referral[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Referrals: Failed to get referrals', { userId, error: error.message })
    return []
  }
  return data ?? []
}

/**
 * Record that a referred user signed up.
 * Called during auth callback when ref param is present.
 */
export async function recordReferralSignup(
  referralCode: string,
  referredUserId: string,
  referredOrgId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Find the referrer
  const referrer = await getUserByReferralCode(referralCode)
  if (!referrer) {
    return { success: false, error: 'Invalid referral code.' }
  }

  // Do not allow self-referral
  if (referrer.id === referredUserId) {
    return { success: false, error: 'Cannot refer yourself.' }
  }

  // Check if this referred user already has a referral recorded
  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referred_id', referredUserId)

  if ((count ?? 0) > 0) {
    return { success: false, error: 'User already has a referral.' }
  }

  const { error: insertError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referrer_org_id: referrer.org_id,
      referred_id: referredUserId,
      referred_org_id: referredOrgId,
      referral_code: referralCode,
      status: 'signed_up',
    })

  if (insertError) {
    logger.error('Referrals: Failed to record signup', { referralCode, error: insertError.message })
    return { success: false, error: 'Failed to record referral.' }
  }

  return { success: true }
}

/**
 * Complete a referral — award credits to both parties.
 * Called when the referred user upgrades to a paid plan.
 */
export async function completeReferral(
  referredUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Find the pending referral for this user
  const { data: referral, error: refError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_id', referredUserId)
    .eq('status', 'signed_up')
    .single()

  if (refError || !referral) {
    return { success: false, error: 'No pending referral found.' }
  }

  // Import awardCredit dynamically to avoid circular dependency
  const { awardCredit } = await import('@/lib/db/user-credits')

  // Award credit to the referrer (500 pence = GBP5)
  const referrerResult = await awardCredit(
    referral.referrer_id,
    referral.referrer_org_id,
    'referral',
    500
  )

  // Award credit to the referred user (500 pence = GBP5)
  if (referral.referred_id && referral.referred_org_id) {
    await awardCredit(
      referral.referred_id,
      referral.referred_org_id,
      'referral',
      500
    )
  }

  // Mark referral as completed
  const { error: updateError } = await supabase
    .from('referrals')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', referral.id)

  if (updateError) {
    logger.error('Referrals: Failed to complete referral', { referralId: referral.id, error: updateError.message })
    return { success: false, error: 'Failed to complete referral.' }
  }

  if (!referrerResult.success) {
    logger.error('Referrals: Failed to award referrer credit', { referrerId: referral.referrer_id })
  }

  return { success: true }
}
