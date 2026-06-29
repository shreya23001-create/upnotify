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
  '/monitoring',
  '/integrations',
  '/wordpress-monitor',
  '/free-uptime-monitoring',
  '/changelog',
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
  '/help',
  '/api-docs',
]

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname === '/status') return true
  if (pathname.startsWith('/status/')) return true
  if (pathname.startsWith('/score/')) return true
  if (pathname.startsWith('/tracker/')) return true
  if (pathname.startsWith('/blog/')) return true
  if (pathname.startsWith('/monitoring/')) return true
  if (pathname.startsWith('/tools/')) return true
  if (pathname.startsWith('/integrations/')) return true
  if (pathname.startsWith('/api/v1/')) return true
  if (pathname.startsWith('/api/cron/')) return true
  if (pathname.startsWith('/api/badge/')) return true
  if (pathname.startsWith('/api/v1/tracker/')) return true
  if (pathname.startsWith('/api/tools/')) return true
  if (pathname.startsWith('/api/webhooks/')) return true
  if (pathname.startsWith('/api/v1/wp-agent/')) return true
  if (pathname.startsWith('/api/v1/agency-waitlist')) return true
  if (pathname === '/api/v1/plans') return true
  if (pathname === '/api/v1/compete/plans') return true
  if (pathname.startsWith('/api/debug/')) return true
  if (pathname.startsWith('/invite/')) return true
  if (pathname.startsWith('/r/')) return true
  // Public API routes that must be accessible without a session
  if (pathname === '/api/contact') return true
  if (pathname === '/api/contact/verify') return true
  if (pathname === '/api/v1/blog/subscribe') return true
  if (pathname === '/api/v1/email/unsubscribe') return true
  if (pathname === '/api/v1/team/invite-details') return true
  if (pathname === '/api/v1/team/accept') return true
  if (pathname === '/api/v1/compete/webhook') return true
  if (pathname === '/api/v1/status-pages/subscribe') return true
  if (pathname === '/api/v1/status-pages/unsubscribe') return true
  if (pathname === '/api/v1/outreach/unsubscribe') return true
  return false
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/signup'
}

export function isPrivateRoute(pathname: string): boolean {
  if (pathname.startsWith('/dashboard')) return true
  if (pathname.startsWith('/admin')) return true
  if (pathname === '/deactivated') return true
  return false
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin')
}
