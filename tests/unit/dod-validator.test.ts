import { describe, it, expect } from 'vitest'
import { validateDoD, type DoDInput } from '@/lib/utils/dod-validator'

const validFaq = {
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Q1', acceptedAnswer: { '@type': 'Answer', text: 'A1' } },
    { '@type': 'Question', name: 'Q2', acceptedAnswer: { '@type': 'Answer', text: 'A2' } },
    { '@type': 'Question', name: 'Q3', acceptedAnswer: { '@type': 'Answer', text: 'A3' } },
    { '@type': 'Question', name: 'Q4', acceptedAnswer: { '@type': 'Answer', text: 'A4' } },
  ],
}

const goodBody = `# How to Fix SSL Certificate Expired Error

If you're seeing an SSL certificate expired error, here's how to fix it.

## Step 1 — Renew the certificate

Run \`certbot renew\` on your server to renew the SSL certificate.

The SSL certificate expired error typically means your Let's Encrypt cert needs renewal.

![SSL renewal flow](https://example.com/ssl.svg)

For monitoring, see our [SSL monitoring hub](/monitoring/ssl-certificate-monitoring) and our companion guide on [DNS monitoring](/monitoring/dns-monitoring).

You can also test with our [free SSL checker](/tools/ssl-checker) and [sign up for free](/signup) to monitor automatically.

This is an SSL certificate expired error you can fix in minutes. Learn more at the [pricing page](/pricing).
${' word'.repeat(820)}
`.trim()

function makeInput(overrides: Partial<DoDInput> = {}): DoDInput {
  return {
    slug: 'fix-ssl-certificate-expired-error',
    title: 'How to Fix SSL Certificate Expired Error',
    bodyMarkdown: goodBody,
    primaryKeyword: 'ssl certificate expired error',
    secondaryKeywords: ['certbot renew', "let's encrypt", 'ssl renewal'],
    postType: 'troubleshooting',
    faqJsonb: validFaq,
    brandPrefixRequired: false,
    existingSlugs: [],
    ...overrides,
  }
}

describe('validateDoD — happy path', () => {
  it('passes a well-formed troubleshooting draft', () => {
    const result = validateDoD(makeInput())
    expect(result.pass).toBe(true)
    expect(result.hardFails).toHaveLength(0)
  })
})

describe('validateDoD — primary keyword', () => {
  it('hard-fails when primary keyword absent from body', () => {
    const result = validateDoD(makeInput({
      bodyMarkdown: '# Something\n\nNo keyword here at all.',
    }))
    expect(result.pass).toBe(false)
    expect(result.hardFails.some(c => c.id === 'primary_kw_body')).toBe(true)
  })

  it('soft-warns when primary keyword absent from title', () => {
    const result = validateDoD(makeInput({ title: 'Some unrelated title' }))
    expect(result.softFails.some(c => c.id === 'primary_kw_title')).toBe(true)
  })
})

describe('validateDoD — FAQ', () => {
  it('hard-fails when FAQ missing', () => {
    const result = validateDoD(makeInput({ faqJsonb: null }))
    expect(result.hardFails.some(c => c.id === 'faq_schema')).toBe(true)
  })

  it('hard-fails when FAQ has < 3 questions', () => {
    const result = validateDoD(makeInput({
      faqJsonb: {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Q1', acceptedAnswer: { '@type': 'Answer', text: 'A1' } },
        ],
      },
    }))
    expect(result.hardFails.some(c => c.id === 'faq_schema')).toBe(true)
  })

  it('hard-fails when FAQ has > 6 questions', () => {
    const tooMany = {
      '@type': 'FAQPage',
      mainEntity: Array.from({ length: 7 }, (_, i) => ({
        '@type': 'Question',
        name: `Q${i}`,
        acceptedAnswer: { '@type': 'Answer', text: `A${i}` },
      })),
    }
    const result = validateDoD(makeInput({ faqJsonb: tooMany }))
    expect(result.hardFails.some(c => c.id === 'faq_schema')).toBe(true)
  })

  it('hard-fails when FAQ is wrong schema', () => {
    const result = validateDoD(makeInput({ faqJsonb: { '@type': 'WebPage' } }))
    expect(result.hardFails.some(c => c.id === 'faq_schema')).toBe(true)
  })
})

describe('validateDoD — slug rules', () => {
  it('hard-fails on bad slug shape', () => {
    const result = validateDoD(makeInput({ slug: 'BAD_SLUG!' }))
    expect(result.hardFails.some(c => c.id === 'slug_rule')).toBe(true)
  })

  it('hard-fails on slug collision', () => {
    const result = validateDoD(makeInput({
      slug: 'fix-ssl-certificate-expired-error',
      existingSlugs: ['fix-ssl-certificate-expired-error'],
    }))
    expect(result.hardFails.some(c => c.id === 'slug_unique')).toBe(true)
  })

  it('passes when slug is unique', () => {
    const result = validateDoD(makeInput({ existingSlugs: ['some-other-slug'] }))
    expect(result.hardFails.some(c => c.id === 'slug_unique')).toBe(false)
  })
})

describe('validateDoD — word count', () => {
  it('soft-fails when below threshold', () => {
    const result = validateDoD(makeInput({
      postType: 'commercial', // requires 1800 words
      bodyMarkdown: 'Short body. ssl certificate expired error mention.',
    }))
    expect(result.softFails.some(c => c.id === 'word_count')).toBe(true)
  })
})

describe('validateDoD — brand-guard integration', () => {
  it('hard-fails on forbidden Score suffix', () => {
    const result = validateDoD(makeInput({
      bodyMarkdown: goodBody.replace('SSL', 'Uptrue AI Visibility Score and SSL'),
    }))
    expect(result.hardFails.some(c => c.id === 'brand_guard')).toBe(true)
  })
})

describe('validateDoD — forbidden phrases', () => {
  it('soft-warns on AI-slop phrases', () => {
    const result = validateDoD(makeInput({
      bodyMarkdown: goodBody + "\n\nIn today's digital landscape, we delve into SSL.",
    }))
    expect(result.softFails.some(c => c.id === 'forbidden_phrases')).toBe(true)
  })
})

describe('validateDoD — image present', () => {
  it('soft-warns when no image / SVG', () => {
    const noImage = goodBody.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    const result = validateDoD(makeInput({ bodyMarkdown: noImage }))
    expect(result.softFails.some(c => c.id === 'image_present')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Edge case regression tests
// ---------------------------------------------------------------------------

describe('validateDoD — link dedupe (regression)', () => {
  it('counts the same hub URL appearing 3 times as 1 unique hub link', () => {
    const dupeBody = `# Title

ssl certificate expired error mention. ssl certificate expired error.

See [SSL hub](/monitoring/ssl-certificate-monitoring) for details.
And [our SSL guide](/monitoring/ssl-certificate-monitoring) covers more.
Plus [the SSL monitoring page](/monitoring/ssl-certificate-monitoring) again.
Try [free SSL tool](/tools/ssl-checker) and [sign up](/signup).
![](placeholder.svg)
${' word'.repeat(820)}
`.trim()

    const result = validateDoD(makeInput({ bodyMarkdown: dupeBody }))
    const hubCheck = [...result.passes, ...result.softFails, ...result.hardFails]
      .find(c => c.id === 'links_hub')
    // Same URL 3 times = 1 unique = should soft-fail (need 2 unique)
    expect(hubCheck?.pass).toBe(false)
    expect(hubCheck?.detail).toContain('1 unique')
  })

  it('passes when 2 different hub URLs each appear once', () => {
    // goodBody has /monitoring/ssl... AND /monitoring/dns... — two unique
    const result = validateDoD(makeInput())
    const hubCheck = [...result.passes, ...result.softFails, ...result.hardFails]
      .find(c => c.id === 'links_hub')
    expect(hubCheck?.pass).toBe(true)
  })

  it('treats absolute upnotify-monitoring.vercel.app URL same as relative path', () => {
    const mixedBody = goodBody.replace(
      '/monitoring/ssl-certificate-monitoring',
      'https://upnotify-monitoring.vercel.app/monitoring/ssl-certificate-monitoring'
    )
    // Should still count as same canonical hub link
    const result = validateDoD(makeInput({ bodyMarkdown: mixedBody }))
    const hubCheck = [...result.passes, ...result.softFails, ...result.hardFails]
      .find(c => c.id === 'links_hub')
    // /monitoring/ssl... appears via absolute, /monitoring/dns... appears via relative
    // = 2 unique
    expect(hubCheck?.pass).toBe(true)
  })
})

describe('validateDoD — primary keyword case insensitivity', () => {
  it('matches primary keyword in body regardless of case', () => {
    const upperBody = goodBody.replace(/ssl certificate expired error/g, 'SSL CERTIFICATE EXPIRED ERROR')
    const result = validateDoD(makeInput({ bodyMarkdown: upperBody }))
    expect(result.hardFails.some(c => c.id === 'primary_kw_body')).toBe(false)
  })
})
