'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { writeAuditLog } from '@/lib/db/audit'

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

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()
  const baseUrl = origin || getConfig().app.url
  const params = new URLSearchParams()
  if (ref) params.set('ref', ref)
  if (next) params.set('next', next)
  const queryStr = params.toString()
  const callbackUrl = queryStr ? `${baseUrl}/auth/callback?${queryStr}` : `${baseUrl}/auth/callback`

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined
  const userAgent = hdrs.get('user-agent') ?? undefined

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl },
  })

  if (error) {
    logger.error('Magic link sign in failed', { error: error.message })
    await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.magic_link_failed', ipAddress: ip, userAgent, metadata: { email } })
    return { error: 'Failed to send magic link. Please try again.' }
  }

  await writeAuditLog({ orgId: 'system', userId: null, action: 'auth.magic_link_requested', ipAddress: ip, userAgent, metadata: { email } })
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
