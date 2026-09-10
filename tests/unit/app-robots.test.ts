import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import robots from '@/app/robots'

const ORIG_VERCEL_ENV = process.env.VERCEL_ENV

describe('app/robots.ts — robots.txt generator', () => {
  beforeEach(() => {
    delete process.env.VERCEL_ENV
  })

  afterEach(() => {
    if (ORIG_VERCEL_ENV === undefined) {
      delete process.env.VERCEL_ENV
    } else {
      process.env.VERCEL_ENV = ORIG_VERCEL_ENV
    }
  })

  it('blocks every user-agent when VERCEL_ENV is unset (local dev)', () => {
    const result = robots()
    expect(result.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(result.sitemap).toBeUndefined()
  })

  it('blocks every user-agent on Vercel preview deploys', () => {
    process.env.VERCEL_ENV = 'preview'
    const result = robots()
    expect(result.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(result.sitemap).toBeUndefined()
  })

  it('blocks every user-agent on Vercel dev deploys', () => {
    process.env.VERCEL_ENV = 'development'
    const result = robots()
    expect(result.rules).toEqual([{ userAgent: '*', disallow: '/' }])
  })

  it('exposes the sitemap on production', () => {
    process.env.VERCEL_ENV = 'production'
    const result = robots()
    expect(result.sitemap).toBe('https://upnotify-monitoring.vercel.app/sitemap.xml')
  })

  it('includes a wildcard allow rule on production', () => {
    process.env.VERCEL_ENV = 'production'
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const wildcard = rules.find(r => r.userAgent === '*')
    expect(wildcard).toBeDefined()
    expect(wildcard?.allow).toBe('/')
    expect(wildcard?.disallow).toEqual(['/api/', '/dashboard/', '/settings/', '/admin/', '/invite/', '/auth/'])
  })

  it('includes explicit allow rules for every welcomed AI bot on production', () => {
    process.env.VERCEL_ENV = 'production'
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const userAgents = rules.map(r => r.userAgent).filter(Boolean) as string[]

    const expected = [
      'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
      'ClaudeBot', 'anthropic-ai',
      'PerplexityBot',
      'Google-Extended',
      'Bingbot',
      'cohere-ai',
      'Amazonbot',
      'ia_archiver',
    ]
    for (const bot of expected) {
      expect(userAgents).toContain(bot)
    }
  })

  it('applies the same internal-path disallow to AI bots as to the wildcard', () => {
    process.env.VERCEL_ENV = 'production'
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const aiBotRules = rules.filter(r => r.userAgent !== '*' && r.userAgent)

    for (const rule of aiBotRules) {
      expect(rule.allow).toBe('/')
      expect(rule.disallow).toEqual(['/api/', '/dashboard/', '/settings/', '/admin/', '/invite/', '/auth/'])
    }
  })
})
