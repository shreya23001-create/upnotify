import { describe, it, expect } from 'vitest'
import { normaliseContent } from '@/lib/db/blog-posts'

describe('normaliseContent', () => {
  it('returns empty object for null', () => {
    expect(normaliseContent(null)).toEqual({})
  })

  it('returns empty object for undefined', () => {
    expect(normaliseContent(undefined)).toEqual({})
  })

  it('returns empty object for empty string (would otherwise produce { body: "" } — equivalent 404)', () => {
    expect(normaliseContent('')).toEqual({})
  })

  it('wraps a non-empty string into { body: <string> }', () => {
    expect(normaliseContent('# Hello world')).toEqual({ body: '# Hello world' })
  })

  it('preserves untouched objects', () => {
    const input = { body: 'hello', midCta: { heading: 'h', buttonLabel: 'l', buttonUrl: 'u' } }
    expect(normaliseContent(input)).toEqual(input)
  })

  it('preserves objects with html field (legacy outage/PMB shape)', () => {
    const input = { html: '<p>hello</p>' }
    expect(normaliseContent(input)).toEqual(input)
  })

  it('returns empty object for arrays (JSONB allows them, renderer cannot)', () => {
    expect(normaliseContent(['a', 'b'])).toEqual({})
  })

  it('returns empty object for numbers', () => {
    expect(normaliseContent(42)).toEqual({})
  })

  it('returns empty object for booleans', () => {
    expect(normaliseContent(true)).toEqual({})
  })

  it('handles the regression case — raw markdown string from buggy generator', () => {
    // This is exactly what calendar-blog-generator passed pre-fix:
    // content: draft.bodyMarkdown — a multi-line markdown string
    const markdown = '# Title\n\nFirst paragraph.\n\n## Section\n\nMore text.'
    expect(normaliseContent(markdown)).toEqual({ body: markdown })
  })

  it('handles the empty-string regression case — produces 404-safe empty object, not { body: "" }', () => {
    // If we returned { body: "" } the row would still 404 in the renderer.
    // Returning {} is the same end result but clearer in DB inspection.
    expect(normaliseContent('')).toEqual({})
  })
})
