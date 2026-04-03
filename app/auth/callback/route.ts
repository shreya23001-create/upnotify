import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/utils/rate-limiter'
import { createTrialSubscription } from '@/lib/db/subscriptions'
import { recordReferralSignup } from '@/lib/db/referrals'

/**
 * Validates that a redirect path is safe (relative, no open-redirect vectors).
 * Rejects protocol-relative URLs ("//evil.com"), absolute URLs ("https://…"),
 * and paths that don't start with "/".
 */
function isValidRedirectPath(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('://')) return false
  return true
}

/**
 * Auth callback handler.
 * Supabase redirects here after magic-link click or Google OAuth.
 * Exchanges the one-time code for a session, then redirects to
 * the dashboard (or whatever `next` query param specifies).
 *
 * Also handles:
 * - Reverse trial: creates a 14-day Builder trial for new users
 * - Referrals: records referral signup if ref param is present
 *
 * Rate limited: 10 requests per 15 minutes per IP.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const rateLimit = checkRateLimit(request, AUTH_RATE_LIMIT, 'auth')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      },
    )
  }
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/dashboard'
  const refCode = searchParams.get('ref')

  // Validate redirect target to prevent open redirect attacks.
  const nextPath = isValidRedirectPath(nextParam) ? nextParam : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error('Auth callback failed', { error: error.message })
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check if this is a new user (created within the last 60 seconds)
      const createdAt = new Date(user.created_at)
      const isNewUser = Date.now() - createdAt.getTime() < 60_000

      if (isNewUser) {
        // Look up the user record to get org_id
        const adminClient = createAdminClient()
        const { data: dbUser } = await adminClient
          .from('users')
          .select('id, org_id')
          .eq('id', user.id)
          .single()

        if (dbUser) {
          // Create 14-day Builder trial (reverse trial)
          await createTrialSubscription(dbUser.org_id)

          // Record referral if ref code present
          if (refCode && refCode.length > 0) {
            await recordReferralSignup(refCode, dbUser.id, dbUser.org_id)
          }
        }
      }
    }

    return NextResponse.redirect(`${origin}${nextPath}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
