import { describe, it, expect } from 'vitest'
import { isPublicRoute, isAuthRoute, isAdminRoute } from '@/lib/auth/helpers'

describe('isPublicRoute', () => {
  it('returns true for home page', () => {
    expect(isPublicRoute('/')).toBe(true)
  })

  it('returns true for auth callback', () => {
    expect(isPublicRoute('/auth/callback')).toBe(true)
  })

  it('returns true for status pages', () => {
    expect(isPublicRoute('/status/acme-corp')).toBe(true)
  })

  it('returns false for dashboard', () => {
    expect(isPublicRoute('/dashboard')).toBe(false)
  })

  it('returns false for admin', () => {
    expect(isPublicRoute('/admin')).toBe(false)
  })

  // Regression cases for the May 2026 hotfix — these public pages were
  // shipping to prod but the proxy was redirecting them to /login because
  // they weren't in PUBLIC_ROUTES (and the prefix matchers required a
  // trailing slash). Lock them in so it can't happen again.
  describe('marketing surfaces (May 2026 hotfix regression cases)', () => {
    it('returns true for /monitoring exact (not just /monitoring/<slug>)', () => {
      expect(isPublicRoute('/monitoring')).toBe(true)
    })

    it('returns true for /monitoring/<industry> children', () => {
      expect(isPublicRoute('/monitoring/saas-uptime-monitoring')).toBe(true)
      expect(isPublicRoute('/monitoring/http-uptime-monitoring')).toBe(true)
    })

    it('returns true for /integrations exact and children', () => {
      expect(isPublicRoute('/integrations')).toBe(true)
      expect(isPublicRoute('/integrations/slack')).toBe(true)
      expect(isPublicRoute('/integrations/teams')).toBe(true)
      expect(isPublicRoute('/integrations/telegram')).toBe(true)
      expect(isPublicRoute('/integrations/webhook')).toBe(true)
    })

    // #166 — footer "API Docs" and "Status" links were redirecting to /login
    // (and API Docs 404'd) because the routes weren't treated as public.
    it('returns true for /api-docs and /status footer links', () => {
      expect(isPublicRoute('/api-docs')).toBe(true)
      expect(isPublicRoute('/status')).toBe(true)
    })

    it('returns true for /free-uptime-monitoring', () => {
      expect(isPublicRoute('/free-uptime-monitoring')).toBe(true)
    })

    it('returns true for /wordpress-monitor', () => {
      expect(isPublicRoute('/wordpress-monitor')).toBe(true)
    })

    it('returns true for /changelog', () => {
      expect(isPublicRoute('/changelog')).toBe(true)
    })

    it('returns true for /tools exact and pillar children', () => {
      expect(isPublicRoute('/tools')).toBe(true)
      expect(isPublicRoute('/tools/uptime')).toBe(true)
      expect(isPublicRoute('/tools/security')).toBe(true)
      expect(isPublicRoute('/tools/dns')).toBe(true)
      expect(isPublicRoute('/tools/ai-seo')).toBe(true)
    })
  })
})

describe('isAuthRoute', () => {
  it('returns true for login', () => {
    expect(isAuthRoute('/login')).toBe(true)
  })

  it('returns true for signup', () => {
    expect(isAuthRoute('/signup')).toBe(true)
  })

  it('returns false for dashboard', () => {
    expect(isAuthRoute('/dashboard')).toBe(false)
  })
})

describe('isAdminRoute', () => {
  it('returns true for /admin', () => {
    expect(isAdminRoute('/admin')).toBe(true)
  })

  it('returns true for /admin/users', () => {
    expect(isAdminRoute('/admin/users')).toBe(true)
  })

  it('returns false for /dashboard', () => {
    expect(isAdminRoute('/dashboard')).toBe(false)
  })
})
