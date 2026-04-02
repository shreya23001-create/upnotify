import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/utils/rate-limiter'

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

  // Validate redirect target to prevent open redirect attacks.
  // Must be a relative path starting with "/" and must not be
  // a protocol-relative URL ("//evil.com") or contain "://".
  const nextPath = isValidRedirectPath(nextParam) ? nextParam : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error('Auth callback failed', { error: error.message })
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    return NextResponse.redirect(`${origin}${nextPath}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
