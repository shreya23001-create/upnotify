import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * Auth callback handler.
 * Supabase redirects here after magic-link click or Google OAuth.
 * Exchanges the one-time code for a session, then redirects to
 * the dashboard (or whatever `next` query param specifies).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error('Auth callback failed', { error: error.message })
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
