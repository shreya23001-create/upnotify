import { describe, it, expect } from 'vitest'
import { SITE_INFO } from '@/lib/constants/tracker-site-info'
import type { SiteInfo } from '@/lib/constants/tracker-site-info'

// ---------------------------------------------------------------------------
// SiteInfo interface — seoTitle/seoDescription optional fields (#143 fix)
// ---------------------------------------------------------------------------

describe('tracker-site-info SEO overrides', () => {
  describe('salesforce.com override (targets "sfdc status" keyword)', () => {
    const entry = SITE_INFO['salesforce.com']

    it('has a custom seoTitle that includes the SFDC acronym', () => {
      expect(entry.seoTitle).toBeDefined()
      expect(entry.seoTitle).toContain('SFDC')
    })

    it('seoTitle does not end with "| Uptrue" twice (no double-append risk)', () => {
      const title = entry.seoTitle ?? ''
      const count = (title.match(/Uptrue/g) ?? []).length
      expect(count).toBeLessThanOrEqual(1)
    })

    it('has a custom seoDescription that mentions Salesforce', () => {
      expect(entry.seoDescription).toBeDefined()
      expect(entry.seoDescription).toContain('Salesforce')
    })

    it('seoDescription is reasonably sized for meta tags (under 200 chars)', () => {
      expect((entry.seoDescription ?? '').length).toBeLessThanOrEqual(200)
    })
  })

  describe('seoTitle/seoDescription are optional — other entries are unaffected', () => {
    const sampledDomains = ['github.com', 'stripe.com', 'shopify.com', 'vercel.com']

    for (const domain of sampledDomains) {
      it(`${domain} does not have seoTitle override`, () => {
        expect(SITE_INFO[domain]?.seoTitle).toBeUndefined()
      })

      it(`${domain} does not have seoDescription override`, () => {
        expect(SITE_INFO[domain]?.seoDescription).toBeUndefined()
      })
    }
  })

  describe('SiteInfo type contract', () => {
    it('all entries satisfy the SiteInfo interface (required fields present)', () => {
      for (const [domain, info] of Object.entries(SITE_INFO)) {
        expect(typeof info.name, `${domain}.name`).toBe('string')
        expect(typeof info.category, `${domain}.category`).toBe('string')
        expect(Array.isArray(info.alternatives), `${domain}.alternatives`).toBe(true)
      }
    })

    it('seoTitle when set is always a non-empty string', () => {
      for (const [domain, info] of Object.entries(SITE_INFO)) {
        if (info.seoTitle !== undefined) {
          expect(info.seoTitle.length, `${domain}.seoTitle`).toBeGreaterThan(0)
        }
      }
    })
  })
})
