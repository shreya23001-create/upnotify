'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { writeAuditLog } from '@/lib/db/audit'
import { checkRateLimitByKey, AUTH_RATE_LIMIT } from '@/lib/utils/rate-limiter'
import { recordReferralSignup } from '@/lib/db/referrals'
import { acceptTeamInvite } from '@/lib/db/team'
import { markConverted } from '@/lib/aoe/db/aoe-outreach-log'

/**
 * Send a magic-link OTP to the given email address.
 * Returns an object with an optional error message for the UI.
 */
export async function signInWithEmail(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email') as string | null
  const origin = formData.get('origin') as string | null
  const ref = formData.get('ref') as string | null
  const next = formData.get('next') as string | null
  const fullname = formData.get('fullname') as string | null
  const isSignup = formData.get('fullname') !== null

  if (!email) {
    return { error: 'Email is required' }
  }

  if (email.length > 254) {
    return { error: 'Email address is too long.' }
  }

  if (isSignup && !fullname?.trim()) {
    return { error: 'Full name is required' }
  }

  if (isSignup && fullname && fullname.trim().length > 100) {
    return { error: 'Full name must be 100 characters or fewer.' }
  }

  const hdrsForRateLimit = await headers()
  const ip = hdrsForRateLimit.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rateLimit = checkRateLimitByKey(`magic-link:${ip}`, AUTH_RATE_LIMIT)
  if (!rateLimit.allowed) {
    return { error: 'Too many attempts. Please wait a few minutes before trying again.' }
  }

  const supabase = await createClient()
  const baseUrl = origin || getConfig().app.url
  const params = new URLSearchParams()
  if (ref) params.set('ref', ref)
  if (next) params.set('next', next)
  const queryStr = params.toString()
  const callbackUrl = queryStr ? `${baseUrl}/auth/callback?${queryStr}` : `${baseUrl}/auth/callback`

  const userAgent = hdrsForRateLimit.get('user-agent') ?? undefined
  const ipForAudit = ip === 'unknown' ? undefined : ip

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl },
  })

  if (error) {
    logger.error('Magic link sign in failed', { error: error.message })
    await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.magic_link_failed', ipAddress: ipForAudit, userAgent, metadata: { email } })
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('rate') || msg.includes('too many')) {
      return { error: 'Too many attempts. Please wait a minute before trying again.' }
    }
    // Never reveal whether an email is registered or not (account enumeration prevention).
    // Silently succeed for all other errors — the UI shows "Check your email" and
    // no email is sent if the address is unregistered or signups are disabled.
    await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.magic_link_silent_404', ipAddress: ipForAudit, userAgent, metadata: { email } })
    return {}
  }

  await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.magic_link_requested', ipAddress: ipForAudit, userAgent, metadata: { email } })
  return {}
}

/**
 * Start a Google OAuth flow and return the redirect URL.
 * The caller (client component) must redirect the browser.
 * Accepts optional referral code to pass through to callback.
 */
export async function signInWithGoogle(origin: string, ref?: string, next?: string): Promise<{
  url?: string
  error?: string
}> {
  const supabase = await createClient()
  const baseUrl = origin || getConfig().app.url
  const params = new URLSearchParams()
  if (ref) params.set('ref', ref)
  if (next) params.set('next', next)
  const queryStr = params.toString()
  const callbackUrl = queryStr ? `${baseUrl}/auth/callback?${queryStr}` : `${baseUrl}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl },
  })

  if (error || !data.url) {
    logger.error('Google sign in failed', { error: error?.message })
    await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.google_oauth_failed', metadata: { error: error?.message } })
    return { error: 'Failed to initiate Google sign in.' }
  }

  return { url: data.url }
}

/**
 * Runs the same "new user setup" work the OAuth/magic-link callback used to
 * do: accept a pending team invite if one exists, otherwise record referral
 * + AOE conversion tracking for a fresh standalone signup. Org/workspace/user
 * rows themselves are already created by the on_auth_user_created DB trigger
 * regardless of auth method, so this only needs the side-effects that trigger
 * can't do (looking up invites by email, calling external tracking).
 */
async function runNewUserSetup(userId: string, email: string, refCode?: string | null): Promise<void> {
  const adminClient = createAdminClient()
  const userEmail = email.toLowerCase()

  const { data: pendingInvites } = await adminClient
    .from('team_invites')
    .select('id, token, org_id')
    .eq('email', userEmail)
    .eq('status', 'pending')
    .gte('expires_at', new Date().toISOString())
    .limit(1)

  const pendingInvite = pendingInvites?.[0] ?? null

  if (pendingInvite) {
    const acceptResult = await acceptTeamInvite(pendingInvite.token, userId, userEmail)
    if (acceptResult.success) {
      logger.info('New user auto-joined org via pending invite', { userId, orgId: pendingInvite.org_id })
    } else {
      logger.warn('Failed to auto-accept invite for new user', { userId, error: acceptResult.error })
    }
    return
  }

  const { data: dbUser } = await adminClient
    .from('users')
    .select('id, org_id')
    .eq('id', userId)
    .single()

  if (dbUser) {
    if (refCode) {
      await recordReferralSignup(refCode, dbUser.id, dbUser.org_id)
    }
    const emailDomain = userEmail.split('@')[1]
    if (emailDomain) {
      await markConverted(emailDomain, 'free').catch(() => {
        // Non-blocking — conversion tracking failure must never break signup
      })
    }
  }
}

/**
 * Create a new account with email + password. Supabase sends a verification
 * email, but the account and org are usable immediately per the DB trigger —
 * verification only gates certain flows if you later choose to require it.
 */
export async function signUpWithPassword(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null
  const fullname = (formData.get('fullname') as string | null)?.trim()
  const ref = formData.get('ref') as string | null
  const origin = formData.get('origin') as string | null

  if (!email) return { error: 'Email is required' }
  if (email.length > 254) return { error: 'Email address is too long.' }
  if (!fullname) return { error: 'Full name is required' }
  if (fullname.length > 100) return { error: 'Full name must be 100 characters or fewer.' }
  if (!password) return { error: 'Password is required' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rateLimit = checkRateLimitByKey(`signup:${ip}`, AUTH_RATE_LIMIT)
  if (!rateLimit.allowed) {
    return { error: 'Too many attempts. Please wait a few minutes before trying again.' }
  }

  const supabase = await createClient()
  const baseUrl = origin || getConfig().app.url
  const userAgent = hdrs.get('user-agent') ?? undefined
  const ipForAudit = ip === 'unknown' ? undefined : ip

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullname },
      emailRedirectTo: `${baseUrl}/dashboard`,
    },
  })

  if (error) {
    logger.error('Password signup failed', { error: error.message })
    await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.signup_failed', ipAddress: ipForAudit, userAgent, metadata: { email, error: error.message } })
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return { error: 'An account with this email already exists. Try logging in instead.' }
    }
    return { error: error.message || 'Failed to create account. Please try again.' }
  }

  if (!data.user) {
    return { error: 'Failed to create account. Please try again.' }
  }

  await runNewUserSetup(data.user.id, email, ref)

  await writeAuditLog({
    orgId: 'system',
    userId: data.user.id,
    action: 'auth.login.success',
    ipAddress: ipForAudit,
    userAgent,
    metadata: { email, provider: 'password', isNewUser: true },
  })

  redirect('/dashboard')
}

/**
 * Sign in with email + password.
 */
export async function signInWithPassword(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null

  if (!email) return { error: 'Email is required' }
  if (!password) return { error: 'Password is required' }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rateLimit = checkRateLimitByKey(`login:${ip}`, AUTH_RATE_LIMIT)
  if (!rateLimit.allowed) {
    return { error: 'Too many attempts. Please wait a few minutes before trying again.' }
  }

  const supabase = await createClient()
  const userAgent = hdrs.get('user-agent') ?? undefined
  const ipForAudit = ip === 'unknown' ? undefined : ip

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    logger.warn('Password login failed', { email, error: error.message })
    await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.login.failed', ipAddress: ipForAudit, userAgent, metadata: { email, reason: error.message } })
    return { error: 'Invalid email or password.' }
  }

  const provider = (data.user.app_metadata as { provider?: string } | null)?.provider ?? 'email'
  const adminClient = createAdminClient()
  const { data: dbUser } = await adminClient
    .from('users')
    .select('org_id')
    .eq('id', data.user.id)
    .single()

  await writeAuditLog({
    orgId: (dbUser?.org_id as string | undefined) ?? 'system',
    userId: data.user.id,
    action: 'auth.login.success',
    ipAddress: ipForAudit,
    userAgent,
    metadata: { email, provider, isNewUser: false },
  })

  redirect('/dashboard')
}

/**
 * Sign the current user out and redirect to /login.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined
  const userAgent = hdrs.get('user-agent') ?? undefined
  await writeAuditLog({ orgId: 'system', userId: user?.id ?? null, action: 'auth.logout', ipAddress: ip, userAgent, metadata: { email: user?.email } })
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Send a password reset email. Always returns success (no error) so this
 * can't be used to enumerate which emails have accounts.
 */
export async function requestPasswordReset(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get('email') as string | null)?.trim()
  const origin = formData.get('origin') as string | null

  if (!email) return { error: 'Email is required' }
  if (email.length > 254) return { error: 'Email address is too long.' }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rateLimit = checkRateLimitByKey(`password-reset:${ip}`, AUTH_RATE_LIMIT)
  if (!rateLimit.allowed) {
    return { error: 'Too many attempts. Please wait a few minutes before trying again.' }
  }

  const supabase = await createClient()
  const baseUrl = origin || getConfig().app.url
  const userAgent = hdrs.get('user-agent') ?? undefined
  const ipForAudit = ip === 'unknown' ? undefined : ip

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/reset-password`,
  })

  if (error) {
    logger.error('Password reset request failed', { error: error.message })
  }
  // Never reveal whether the email is registered — same result either way.
  await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.password_reset_requested', ipAddress: ipForAudit, userAgent, metadata: { email } })
  return {}
}

/**
 * Set a new password. Requires an active recovery session, established by
 * clicking the link from requestPasswordReset (Supabase handles that
 * session exchange client-side before this action is called).
 */
export async function updatePassword(formData: FormData): Promise<{ error?: string }> {
  const password = formData.get('password') as string | null

  if (!password) return { error: 'Password is required' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your reset link has expired. Please request a new one.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    logger.error('Password update failed', { error: error.message, userId: user.id })
    return { error: 'Failed to update password. Please try again.' }
  }

  await writeAuditLog({ orgId: 'system', userId: user.id, action: 'auth.password_reset_completed', metadata: { email: user.email } })
  return {}
}
