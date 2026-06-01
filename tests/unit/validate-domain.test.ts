import { describe, it, expect } from 'vitest'
import { isValidCustomDomain, normaliseDomain } from '@/lib/utils/validate-domain'

describe('normaliseDomain', () => {
  it('strips https://, www., trailing path, port, whitespace', () => {
    expect(normaliseDomain('  https://www.Status.example.com/foo?bar=1:8443  ')).toBe('status.example.com')
  })
  it('lowercases', () => {
    expect(normaliseDomain('FOO.BAR.IO')).toBe('foo.bar.io')
  })
  it('leaves a bare host alone', () => {
    expect(normaliseDomain('status.example.io')).toBe('status.example.io')
  })
})

describe('isValidCustomDomain', () => {
  it.each([
    'status.example.com',
    'sp.foo.co.uk',
    'a.io',
    'app.acme-corp.io',
    'sub.sub.example.org',
    'http://example.com',             // protocol auto-stripped
    'https://status.example.com/path', // protocol + path auto-stripped
    'example.com:8443',               // port auto-stripped
  ])('accepts %s', (host) => {
    expect(isValidCustomDomain(host)).toBe(true)
  })

  it.each([
    'noTLD',                          // single label
    '.leadingdot.com',                // empty label
    'trailingdot.com.',               // empty label
    '-bad.com',                       // leading hyphen
    'bad-.com',                       // trailing hyphen
    'status..example.com',            // empty label
    'spaces in.example.com',          // spaces
    'newline\nin.example.com',        // control char
    'tab\tin.example.com',            // control char
    '127.0.0.1',                      // IP, all-numeric TLD
    '',                               // empty
    'a'.repeat(254) + '.com',         // > 253 chars
  ])('rejects %j', (host) => {
    expect(isValidCustomDomain(host)).toBe(false)
  })

  it('rejects non-string inputs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidCustomDomain(undefined as any)).toBe(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidCustomDomain(123 as any)).toBe(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidCustomDomain(null as any)).toBe(false)
  })

  it('round-trip: normalised input passes', () => {
    const raw = 'https://www.Status.Example.com/foo'
    expect(isValidCustomDomain(normaliseDomain(raw))).toBe(true)
  })
})
