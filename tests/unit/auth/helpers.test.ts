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
