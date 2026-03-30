'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

/**
 * Send a magic-link OTP to the given email address.
 * Returns an object with an optional error message for the UI.
 */
export async function signInWithEmail(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email') as string | null
  const origin = formData.get('origin') as string | null

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()
  const baseUrl = origin || getConfig().app.url

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${baseUrl}/auth/callback` },
  })

  if (error) {
    logger.error('Magic link sign in failed', { error: error.message })
    return { error: 'Failed to send magic link. Please try again.' }
  }

  return {}
}

/**
 * Start a Google OAuth flow and return the redirect URL.
 * The caller (client component) must redirect the browser.
 */
export async function signInWithGoogle(origin: string): Promise<{
  url?: string
  error?: string
}> {
  const supabase = await createClient()
  const baseUrl = origin || getConfig().app.url

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${baseUrl}/auth/callback` },
  })

  if (error || !data.url) {
    logger.error('Google sign in failed', { error: error?.message })
    return { error: 'Failed to initiate Google sign in.' }
  }

  return { url: data.url }
}

/**
 * Sign the current user out and redirect to /login.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
