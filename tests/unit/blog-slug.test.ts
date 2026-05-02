import { describe, it, expect } from 'vitest'
import {
  slugifyPrimaryKeyword,
  isSlugCollision,
  generateUniqueSlug,
  validateSlug,
} from '@/lib/utils/blog-slug'

describe('slugifyPrimaryKeyword', () => {
  it('lowercases the keyword', () => {
    expect(slugifyPrimaryKeyword('SSL Certificate Monitoring')).toBe('ssl-certificate-monitoring')
  })

  it('replaces special chars with hyphens', () => {
    expect(slugifyPrimaryKeyword("ssl certificate (expired) error!")).toBe('ssl-certificate-expired-error')
  })

  it('strips leading article — the', () => {
    expect(slugifyPrimaryKeyword('the best uptime monitoring tools')).toBe('best-uptime-monitoring-tools')
  })

  it('strips leading article — a', () => {
    expect(slugifyPrimaryKeyword('a guide to dns monitoring')).toBe('guide-to-dns-monitoring')
  })

  it('strips leading article — an', () => {
    expect(slugifyPrimaryKeyword('an introduction to ssl')).toBe('introduction-to-ssl')
  })

  it('does not strip articles mid-string', () => {
    expect(slugifyPrimaryKeyword('what is the dns')).toBe('what-is-the-dns')
  })

  it('handles diacritics', () => {
    expect(slugifyPrimaryKeyword('café monitoring')).toBe('cafe-monitoring')
  })

  it('collapses multiple hyphens', () => {
    expect(slugifyPrimaryKeyword('ssl - - - monitoring')).toBe('ssl-monitoring')
  })

  it('strips leading/trailing hyphens', () => {
    expect(slugifyPrimaryKeyword('-ssl monitoring-')).toBe('ssl-monitoring')
  })

  it('caps at 60 chars at word boundary', () => {
    const long = 'how to set up automatic ssl renewal for nginx with letsencrypt and docker'
    const slug = slugifyPrimaryKeyword(long)
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('throws on empty input', () => {
    expect(() => slugifyPrimaryKeyword('')).toThrow()
  })

  it('throws on non-string input', () => {
    // @ts-expect-error — intentional bad type for runtime test
    expect(() => slugifyPrimaryKeyword(null)).toThrow()
  })
})

describe('isSlugCollision', () => {
  it('detects reserved-path collision', () => {
    expect(isSlugCollision('admin', [])).toBe(true)
    expect(isSlugCollision('monitoring', [])).toBe(true)
    expect(isSlugCollision('tools', [])).toBe(true)
  })

  it('detects existing-slug collision', () => {
    expect(isSlugCollision('ssl-monitoring', ['ssl-monitoring', 'dns-monitoring'])).toBe(true)
  })

  it('returns false on unique slug', () => {
    expect(isSlugCollision('new-blog-post', ['ssl-monitoring'])).toBe(false)
  })
})

describe('generateUniqueSlug', () => {
  it('returns base slug when no collision', () => {
    expect(generateUniqueSlug('ssl monitoring', [])).toBe('ssl-monitoring')
  })

  it('appends -guide on first collision', () => {
    expect(generateUniqueSlug('ssl monitoring', ['ssl-monitoring'])).toBe('ssl-monitoring-guide')
  })

  it('appends -explained on second collision', () => {
    expect(
      generateUniqueSlug('ssl monitoring', ['ssl-monitoring', 'ssl-monitoring-guide'])
    ).toBe('ssl-monitoring-explained')
  })

  it('appends -<year> on third collision', () => {
    const year = new Date().getUTCFullYear()
    expect(
      generateUniqueSlug('ssl monitoring', [
        'ssl-monitoring',
        'ssl-monitoring-guide',
        'ssl-monitoring-explained',
      ])
    ).toBe(`ssl-monitoring-${year}`)
  })

  it('handles reserved-path collision', () => {
    const slug = generateUniqueSlug('monitoring', [])
    expect(slug).not.toBe('monitoring')
    expect(slug.startsWith('monitoring-')).toBe(true)
  })

  it('throws on degenerate empty keyword', () => {
    expect(() => generateUniqueSlug('!!!@@@', [])).toThrow()
  })
})

describe('validateSlug', () => {
  it('returns null for valid slug', () => {
    expect(validateSlug('ssl-certificate-monitoring')).toBeNull()
  })

  it('flags empty slug', () => {
    expect(validateSlug('')).toBe('Slug is empty')
  })

  it('flags slugs over 60 chars', () => {
    const long = 'a'.repeat(61)
    expect(validateSlug(long)).toContain('exceeds 60')
  })

  it('flags special chars', () => {
    expect(validateSlug('ssl monitoring!')).toBe('Slug contains invalid characters')
    expect(validateSlug('ssl_monitoring')).toBe('Slug contains invalid characters')
    expect(validateSlug('SSL-monitoring')).toBe('Slug contains invalid characters')
  })

  it('flags leading/trailing hyphens', () => {
    expect(validateSlug('-ssl-monitoring')).toBe('Slug has leading or trailing hyphen')
    expect(validateSlug('ssl-monitoring-')).toBe('Slug has leading or trailing hyphen')
  })

  it('flags double hyphens', () => {
    expect(validateSlug('ssl--monitoring')).toBe('Slug contains double hyphens')
  })

  it('flags leading articles', () => {
    expect(validateSlug('the-best-monitoring')).toContain('article')
    expect(validateSlug('a-guide-to-dns')).toContain('article')
    expect(validateSlug('an-overview')).toContain('article')
  })

  it('flags reserved paths', () => {
    expect(validateSlug('admin')).toContain('reserved path')
    expect(validateSlug('monitoring')).toContain('reserved path')
  })
})
