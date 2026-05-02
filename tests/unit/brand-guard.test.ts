import { describe, it, expect } from 'vitest'
import { checkBrandGuards, hasHardBrandViolations } from '@/lib/utils/brand-guard'

const subdomain = { surface: 'aivisibility-subdomain' as const, brandPrefixRequired: true }
const main = { surface: 'main' as const, brandPrefixRequired: false }

describe('checkBrandGuards — name guard', () => {
  it('passes correct usage with ™', () => {
    const content = 'Welcome to Uptrue AI Visibility™ — the AI citation monitoring platform.'
    const result = checkBrandGuards(content, subdomain)
    expect(result.violations.filter(v => v.severity === 'hard')).toHaveLength(0)
  })

  it('flags bare "AI Visibility" on subdomain', () => {
    const content = 'AI Visibility is the new SEO. Track it now.'
    const result = checkBrandGuards(content, subdomain)
    expect(result.ok).toBe(false)
    expect(result.violations.some(v => v.rule === 'name_guard' && v.message.includes('Bare'))).toBe(true)
  })

  it('does NOT flag bare "AI Visibility" on main when prefix not required', () => {
    const content = 'AI Visibility matters for B2B SaaS brands.'
    const result = checkBrandGuards(content, main)
    expect(result.violations.some(v => v.rule === 'name_guard' && v.message.includes('Bare'))).toBe(false)
  })

  it('flags "Uptrue AI" without "Visibility"', () => {
    const content = 'Try Uptrue AI to get started.'
    const result = checkBrandGuards(content, main)
    expect(result.ok).toBe(false)
    expect(result.violations.some(v => v.message.includes('must be followed by "Visibility"'))).toBe(true)
  })

  it('flags forbidden "Score" suffix', () => {
    const content = 'Get your Uptrue AI Visibility Score today.'
    const result = checkBrandGuards(content, main)
    expect(result.ok).toBe(false)
    expect(result.violations.some(v => v.rule === 'forbidden_score')).toBe(true)
  })

  it('flags missing ™ on first mention', () => {
    const content = 'Uptrue AI Visibility is amazing. Use Uptrue AI Visibility today.'
    const result = checkBrandGuards(content, main)
    expect(result.violations.some(v => v.rule === 'name_guard' && v.message.includes('™'))).toBe(true)
  })

  it('passes if ™ appears anywhere', () => {
    const content = 'Welcome to Uptrue AI Visibility™. The first AI-citation tracker.'
    const result = checkBrandGuards(content, subdomain)
    expect(result.violations.some(v => v.message.includes('™'))).toBe(false)
  })
})

describe('checkBrandGuards — CTA URL guard', () => {
  it('passes correct subdomain link', () => {
    const content = 'Check your [Uptrue AI Visibility™](https://aivisibility.uptrue.io) score.'
    const result = checkBrandGuards(content, main)
    expect(result.violations.filter(v => v.severity === 'hard')).toHaveLength(0)
  })

  it('flags AI Visibility link to main domain ai-visibility path', () => {
    const content = 'Try [AI Visibility](https://uptrue.io/ai-visibility) now.'
    const result = checkBrandGuards(content, main)
    expect(result.ok).toBe(false)
    expect(result.violations.some(v => v.rule === 'cta_url' && v.severity === 'hard')).toBe(true)
  })

  it('flags AI Visibility link to /ai-check on main', () => {
    const content = 'Check at [AI Visibility tool](https://uptrue.io/ai-check).'
    const result = checkBrandGuards(content, main)
    expect(result.ok).toBe(false)
  })

  it('soft-warns on AI Visibility text linking to non-AI main path', () => {
    const content = 'Read about [AI Visibility](https://uptrue.io/blog/something).'
    const result = checkBrandGuards(content, main)
    const softCtaViolations = result.violations.filter(v => v.rule === 'cta_url' && v.severity === 'soft')
    expect(softCtaViolations.length).toBeGreaterThan(0)
  })

  it('passes regular blog links unrelated to AI Visibility', () => {
    const content = 'See our [SSL guide](https://uptrue.io/blog/ssl-guide).'
    const result = checkBrandGuards(content, main)
    expect(result.ok).toBe(true)
  })

  it('handles HTML anchor tags', () => {
    const content = 'Try <a href="https://uptrue.io/ai-visibility">AI Visibility</a> now.'
    const result = checkBrandGuards(content, main)
    expect(result.ok).toBe(false)
  })

  it('does not flag anchor links', () => {
    const content = 'See [AI Visibility section](#ai-visibility) below.'
    const result = checkBrandGuards(content, main)
    expect(result.violations.some(v => v.rule === 'cta_url' && v.severity === 'hard')).toBe(false)
  })
})

describe('hasHardBrandViolations', () => {
  it('returns true when hard violation exists', () => {
    expect(
      hasHardBrandViolations('Get your Uptrue AI Visibility Score now.', main)
    ).toBe(true)
  })

  it('returns false on clean content', () => {
    expect(
      hasHardBrandViolations('Welcome to Uptrue AI Visibility™.', main)
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Edge case regression tests
// ---------------------------------------------------------------------------

describe('checkBrandGuards — URL variations', () => {
  it('passes subdomain URL with trailing slash', () => {
    const content = 'Try [Uptrue AI Visibility™](https://aivisibility.uptrue.io/) today.'
    const result = checkBrandGuards(content, main)
    expect(result.violations.filter(v => v.severity === 'hard')).toHaveLength(0)
  })

  it('passes subdomain URL with deep path', () => {
    const content = '[Uptrue AI Visibility™ check](https://aivisibility.uptrue.io/check?domain=example.com)'
    const result = checkBrandGuards(content, main)
    expect(result.violations.filter(v => v.severity === 'hard')).toHaveLength(0)
  })

  it('flags uppercase variant of forbidden score', () => {
    const content = 'See your UPTRUE AI VISIBILITY SCORE.'
    const result = checkBrandGuards(content, main)
    expect(result.violations.some(v => v.rule === 'forbidden_score')).toBe(true)
  })

  it('does not flag generic competitor brand mention', () => {
    // "Google AI visibility" is a generic phrase, not our brand
    const content = 'Google AI visibility for brands is improving.'
    const result = checkBrandGuards(content, main)
    // On main with no brand-prefix-required, this is allowed
    expect(result.ok).toBe(true)
  })

  it('case-insensitively flags Score', () => {
    const content = 'Your uptrue ai visibility score is 75.'
    const result = checkBrandGuards(content, main)
    expect(result.violations.some(v => v.rule === 'forbidden_score')).toBe(true)
  })
})

describe('checkBrandGuards — empty content', () => {
  it('passes on empty string', () => {
    const result = checkBrandGuards('', main)
    expect(result.ok).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('passes on content with no brand mentions', () => {
    const result = checkBrandGuards('# How to fix SSL\n\nRun certbot renew.', main)
    expect(result.ok).toBe(true)
  })
})
