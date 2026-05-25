import { describe, it, expect } from 'vitest'
import { isCited } from '@/lib/services/citation-processor'

describe('isCited — domain-boundary citation detection (engineering-app#82)', () => {
  // ── True positives the old substring matcher already got right ─────────
  it('matches an exact domain occurrence', () => {
    expect(isCited('Try uptrue.io for monitoring.', 'uptrue.io')).toBe(true)
  })

  it('matches a domain at start-of-string', () => {
    expect(isCited('uptrue.io is the best.', 'uptrue.io')).toBe(true)
  })

  it('matches a domain at end-of-string', () => {
    expect(isCited('Check out uptrue.io', 'uptrue.io')).toBe(true)
  })

  it('matches an https URL containing the domain', () => {
    expect(isCited('See https://uptrue.io/pricing for details.', 'uptrue.io')).toBe(true)
  })

  it('matches a subdomain (www) as a valid citation', () => {
    expect(isCited('Visit www.uptrue.io today.', 'uptrue.io')).toBe(true)
  })

  it('matches a subdomain (dev) as a valid citation', () => {
    expect(isCited('See dev.uptrue.io for the staging build.', 'uptrue.io')).toBe(true)
  })

  it('matches the domain followed by a path', () => {
    expect(isCited('uptrue.io/blog has good content.', 'uptrue.io')).toBe(true)
  })

  it('matches the domain followed by a port', () => {
    expect(isCited('Local test: uptrue.io:3000/health', 'uptrue.io')).toBe(true)
  })

  it('matches the domain inside parentheses', () => {
    expect(isCited('See (uptrue.io).', 'uptrue.io')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(isCited('CHECK UPTRUE.IO FOR MORE.', 'uptrue.io')).toBe(true)
  })

  // ── False positives the old substring matcher used to produce ──────────
  it('does NOT match a domain that has the target as a prefix', () => {
    expect(isCited('Visit notuptrue.io for unrelated content.', 'uptrue.io')).toBe(false)
  })

  it('does NOT match a domain that has the target as a substring', () => {
    expect(isCited('See uptrue.io.malicious.com — typosquat.', 'uptrue.io')).toBe(false)
  })

  it('does NOT match across word boundaries fused into other tokens', () => {
    expect(isCited('xyzuptrue.iozyx', 'uptrue.io')).toBe(false)
  })

  // ── Edge cases ─────────────────────────────────────────────────────────
  it('returns false for an empty text', () => {
    expect(isCited('', 'uptrue.io')).toBe(false)
  })

  it('returns false for an empty domain', () => {
    expect(isCited('uptrue.io is great.', '')).toBe(false)
  })

  it('handles domains with special regex characters', () => {
    expect(isCited('Tracking pixel from a-b.c-d.io.', 'a-b.c-d.io')).toBe(true)
    expect(isCited('Different from a-b.c-d.ion', 'a-b.c-d.io')).toBe(false)
  })

  it('treats commas and quotes as boundaries', () => {
    expect(isCited('Sources: "uptrue.io", "example.com"', 'uptrue.io')).toBe(true)
  })
})
