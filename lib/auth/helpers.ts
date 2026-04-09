/**
 * Route classification helpers used by the proxy (middleware)
 * and any server-side auth logic.
 */

const PUBLIC_ROUTES: ReadonlyArray<string> = [
  '/',
  '/auth/callback',
  '/score',
  '/tracker',
  '/leaderboard',
  '/tools',
  '/terms',
  '/privacy',
  '/cookies',
  '/dpa',
  '/acceptable-use',
  '/agency-agreement',
  '/refund-policy',
  '/gdpr',
  '/ai-disclaimer',
  '/automated-pricing-policy',
  '/sla',
  '/subprocessors',
  '/security',
  '/blog',
  '/about',
  '/contact',
  '/credits',
  '/referrals',
  '/compete',
]

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname.startsWith('/status/')) return true
  if (pathname.startsWith('/score/')) return true
  if (pathname.startsWith('/tracker/')) return true
  if (pathname.startsWith('/blog/')) return true
  if (pathname.startsWith('/tools/')) return true
  if (pathname.startsWith('/api/cron/')) return true
  if (pathname.startsWith('/api/badge/')) return true
  if (pathname.startsWith('/api/v1/tracker/')) return true
  if (pathname.startsWith('/api/tools/')) return true
  if (pathname.startsWith('/api/webhooks/')) return true
  if (pathname.startsWith('/api/v1/agency-waitlist')) return true
  if (pathname === '/api/v1/plans') return true
  if (pathname === '/api/v1/compete/plans') return true
  if (pathname.startsWith('/api/debug/')) return true
  if (pathname.startsWith('/invite/')) return true
  if (pathname.startsWith('/r/')) return true
  return false
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/signup'
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin')
}
