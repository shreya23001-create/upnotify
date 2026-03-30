import { type NextRequest, NextResponse } from 'next/server'
import { createProxyClient } from '@/lib/supabase/proxy'
import { isPublicRoute, isAuthRoute, isAdminRoute } from '@/lib/auth/helpers'

/**
 * Next.js 16 proxy (replaces middleware.ts).
 * Runs on the edge for every matched request. Handles:
 *  - Session refresh via Supabase cookie exchange
 *  - Redirect unauthenticated users away from protected routes
 *  - Redirect authenticated users away from auth pages
 *  - Block non-admin users from /admin routes
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { supabase, response } = createProxyClient(request)
  const pathname = request.nextUrl.pathname

  // Public routes — no auth check needed
  if (isPublicRoute(pathname)) return response()

  // Refresh session (validates the cookie, exchanges tokens if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth pages: redirect already-authenticated users to dashboard
  if (isAuthRoute(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response()
  }

  // Protected routes: redirect unauthenticated users to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes: verify super-admin email whitelist
  if (isAdminRoute(pathname)) {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim())

    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
