import { describe, it, expect } from 'vitest'
import { getKeywordSuggestions } from '@/lib/utils/keyword-suggestions'

describe('getKeywordSuggestions', () => {
  it('returns checkout suggestions for cart URLs', () => {
    const suggestions = getKeywordSuggestions('https://shop.com/checkout')
    expect(suggestions.positive).toContain('Place Order')
    expect(suggestions.positive).toContain('Checkout')
    expect(suggestions.negative).toContain('error')
    expect(suggestions.negative).toContain('out of stock')
  })

  it('returns checkout suggestions for payment URLs', () => {
    const suggestions = getKeywordSuggestions('https://shop.com/payment')
    expect(suggestions.positive).toContain('Secure Payment')
    expect(suggestions.negative).toContain('failed')
  })

  it('returns checkout suggestions for cart URLs', () => {
    const suggestions = getKeywordSuggestions('https://shop.com/cart')
    expect(suggestions.positive).toContain('Add to Cart')
  })

  it('returns contact page suggestions', () => {
    const suggestions = getKeywordSuggestions('https://site.com/contact')
    expect(suggestions.positive).toContain('Send Message')
    expect(suggestions.positive).toContain('Contact Us')
    expect(suggestions.negative).toContain('error')
  })

  it('returns form page suggestions for enquiry URLs', () => {
    const suggestions = getKeywordSuggestions('https://site.com/enquiry')
    expect(suggestions.positive).toContain('Submit')
    expect(suggestions.negative).toContain('server error')
  })

  it('returns login page suggestions', () => {
    const suggestions = getKeywordSuggestions('https://app.com/login')
    expect(suggestions.positive).toContain('Sign In')
    expect(suggestions.positive).toContain('Password')
    expect(suggestions.negative).toContain('maintenance')
  })

  it('returns signin page suggestions', () => {
    const suggestions = getKeywordSuggestions('https://app.com/signin')
    expect(suggestions.positive).toContain('Login')
  })

  it('returns API/status page suggestions', () => {
    const suggestions = getKeywordSuggestions('https://api.service.com/health')
    expect(suggestions.positive).toContain('ok')
    expect(suggestions.positive).toContain('healthy')
    expect(suggestions.negative).toContain('down')
    expect(suggestions.negative).toContain('outage')
  })

  it('returns status page suggestions', () => {
    const suggestions = getKeywordSuggestions('https://status.example.com')
    expect(suggestions.positive).toContain('operational')
  })

  it('returns pricing page suggestions', () => {
    const suggestions = getKeywordSuggestions('https://example.com/pricing')
    expect(suggestions.positive).toContain('Pro')
    expect(suggestions.positive).toContain('Get Started')
    expect(suggestions.negative).toContain('error')
  })

  it('returns homepage suggestions for .com domains', () => {
    const suggestions = getKeywordSuggestions('https://example.com')
    expect(suggestions.positive).toContain('Welcome')
    expect(suggestions.negative).toContain('viagra')
    expect(suggestions.negative).toContain('casino')
    expect(suggestions.negative).toContain('fatal error')
  })

  it('returns homepage suggestions for .io domains', () => {
    const suggestions = getKeywordSuggestions('https://uptrue.io')
    expect(suggestions.positive).toContain('Home')
    expect(suggestions.negative).toContain('database error')
  })

  it('returns homepage suggestions for URLs ending with /', () => {
    const suggestions = getKeywordSuggestions('https://example.com/')
    expect(suggestions.positive.length).toBeGreaterThan(0)
    expect(suggestions.negative.length).toBeGreaterThan(0)
  })

  it('returns default suggestions for generic URLs', () => {
    const suggestions = getKeywordSuggestions('https://example.com/some-random-page')
    expect(suggestions.positive.length).toBe(0)
    expect(suggestions.negative).toContain('fatal error')
    expect(suggestions.negative).toContain('server error')
    expect(suggestions.negative).toContain('500')
  })

  it('returns empty suggestions for empty URL', () => {
    const suggestions = getKeywordSuggestions('')
    expect(suggestions.positive.length).toBe(0)
    expect(suggestions.negative.length).toBe(0)
  })

  it('is case insensitive for URL matching', () => {
    const suggestions = getKeywordSuggestions('https://shop.com/CHECKOUT')
    expect(suggestions.positive).toContain('Place Order')
  })
})
