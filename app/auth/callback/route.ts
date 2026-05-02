import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/utils/rate-limiter'
// Trial removed — users start on Free plan
import { recordReferralSignup } from '@/lib/db/referrals'
import { acceptTeamInvite } from '@/lib/db/team'
import { markConverted } from '@/lib/aoe/db/aoe-outreach-log'

/**
 * Validates that a redirect path is safe (relative, no open-redirect vectors).
 * Rejects protocol-relative URLs ("//evil.com"), absolute URLs ("https://…"),
 * and paths that don't start with "/".
 */
function isValidRedirectPath(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('://')) return false
  if (path.length > 200) return false // prevent oversized redirect paths
  return true
}

/**
 * Auth callback handler.
 * Supabase redirects here after magic-link click or Google OAuth.
 * Exchanges the one-time code for a session, then redirects to
 * the dashboard (or whatever `next` query param specifies).
 *
 * Also handles:
 * - New users start on Free plan (no trial)
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
      // Redirect to whichever page the link originated from (login or signup)
      const fromSignup = nextPath.includes('signup') || searchParams.get('from') === 'signup'
      const errorDest = fromSignup ? `${origin}/signup?error=auth_error` : `${origin}/login?error=auth_error`
      return NextResponse.redirect(errorDest)
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const adminClient = createAdminClient()
      const userEmail = user.email ?? ''

      // Check if this is a new user (created within the last 60 seconds)
      const createdAt = new Date(user.created_at)
      const isNewUser = Date.now() - createdAt.getTime() < 60_000

      // Check for pending team invites for this email
      const { data: pendingInvites } = await adminClient
        .from('team_invites')
        .select('id, token, org_id')
        .eq('email', userEmail.toLowerCase())
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .limit(1)

      const pendingInvite = pendingInvites?.[0] ?? null

      if (isNewUser) {
        if (pendingInvite) {
          // New user with pending invite: accept the invite to join the existing org
          // instead of creating a standalone org. The DB trigger already created
          // a new org for this user, so we need to accept the invite which will
          // move them to the correct org.
          const acceptResult = await acceptTeamInvite(
            pendingInvite.token,
            user.id,
            userEmail
          )
          if (acceptResult.success) {
            logger.info('New user auto-joined org via pending invite', {
              userId: user.id,
              orgId: pendingInvite.org_id,
            })
          } else {
            logger.warn('Failed to auto-accept invite for new user', {
              userId: user.id,
              error: acceptResult.error,
            })
          }
        } else {
          // New user with no invite: start on Free plan (no trial)
          const { data: dbUser } = await adminClient
            .from('users')
            .select('id, org_id')
            .eq('id', user.id)
            .single()

          if (dbUser) {
            // No trial subscription created — user starts on Free plan

            // Record referral if ref code present
            if (refCode && refCode.length > 0) {
              await recordReferralSignup(refCode, dbUser.id, dbUser.org_id)
            }

            // AOE conversion tracking — check if this domain was outreached
            const emailDomain = userEmail.split('@')[1]
            if (emailDomain) {
              await markConverted(emailDomain, 'free').catch(() => {
                // Non-blocking — conversion tracking failure must never break signup
              })
            }
          }
        }
      } else if (pendingInvite) {
        // Existing user with pending invite: auto-accept on login
        const acceptResult = await acceptTeamInvite(
          pendingInvite.token,
          user.id,
          userEmail
        )
        if (acceptResult.success) {
          logger.info('Existing user auto-joined org via pending invite', {
            userId: user.id,
            orgId: pendingInvite.org_id,
          })
        } else {
          logger.warn('Failed to auto-accept invite for existing user', {
            userId: user.id,
            error: acceptResult.error,
          })
        }
      }
    }

    return NextResponse.redirect(`${origin}${nextPath}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
