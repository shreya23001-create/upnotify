import { describe, it, expect, vi } from 'vitest'

// Stub the logger so import doesn't pull in real Supabase/server bindings.
vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { substituteDomain } from '@/lib/services/profile-introspector'

describe('substituteDomain', () => {
  it('substitutes a single placeholder', () => {
    expect(substituteDomain('What is {domain}?', 'example.com'))
      .toBe('What is example.com?')
  })

  it('substitutes multiple placeholders', () => {
    expect(substituteDomain('Compare {domain} vs other sites. Why visit {domain}?', 'example.com'))
      .toBe('Compare example.com vs other sites. Why visit example.com?')
  })

  it('leaves text unchanged when no placeholder is present', () => {
    expect(substituteDomain('Tell me about Cornwall.', 'example.com'))
      .toBe('Tell me about Cornwall.')
  })

  it('does not partial-match similar tokens', () => {
    // {domain_name} should not be touched because we only replace the exact {domain}
    expect(substituteDomain('What is {domain_name}?', 'example.com'))
      .toBe('What is {domain_name}?')
  })

  it('handles empty domain by leaving placeholder visible', () => {
    expect(substituteDomain('What is {domain}?', ''))
      .toBe('What is ?')
  })

  it('substitutes a domain with special characters', () => {
    expect(substituteDomain('What is {domain}?', 'my-site.co.uk'))
      .toBe('What is my-site.co.uk?')
  })
})
