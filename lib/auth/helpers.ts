/**
 * Route classification helpers used by the proxy (middleware)
 * and any server-side auth logic.
 */

const PUBLIC_ROUTES: ReadonlyArray<string> = ['/', '/auth/callback']

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname.startsWith('/status/')) return true
  return false
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/signup'
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin')
}
