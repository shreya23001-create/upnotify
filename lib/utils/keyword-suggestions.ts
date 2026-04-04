interface KeywordSuggestions {
  positive: string[]
  negative: string[]
}

/**
 * Returns smart keyword suggestions based on the URL pattern.
 * Used in the monitor creation/editing form to help users pick relevant keywords.
 */
export function getKeywordSuggestions(url: string): KeywordSuggestions {
  const suggestions: KeywordSuggestions = { positive: [], negative: [] }

  if (!url || url.trim().length === 0) {
    // Default suggestions shown before URL is entered
    suggestions.positive = ['Welcome', 'Home', 'Sign In', 'Contact']
    suggestions.negative = ['fatal error', 'server error', '503', 'database error', 'maintenance mode', 'not found', 'hacked', 'viagra', 'casino']
    return suggestions
  }

  const urlLower = url.toLowerCase()

  // Checkout / cart / payment pages
  if (urlLower.includes('checkout') || urlLower.includes('cart') || urlLower.includes('payment')) {
    suggestions.positive = ['Place Order', 'Checkout', 'Add to Cart', 'Secure Payment']
    suggestions.negative = ['error', 'failed', 'out of stock', 'unavailable']
    return suggestions
  }

  // Contact / form / enquiry pages
  if (urlLower.includes('contact') || urlLower.includes('form') || urlLower.includes('enquir')) {
    suggestions.positive = ['Send Message', 'Submit', 'Contact Us', 'Email']
    suggestions.negative = ['error', 'failed', 'server error']
    return suggestions
  }

  // Login / sign-in / auth pages
  if (urlLower.includes('login') || urlLower.includes('signin') || urlLower.includes('auth')) {
    suggestions.positive = ['Sign In', 'Login', 'Password']
    suggestions.negative = ['maintenance', 'unavailable', 'error']
    return suggestions
  }

  // API / status / health pages
  if (urlLower.includes('api') || urlLower.includes('status') || urlLower.includes('health')) {
    suggestions.positive = ['ok', 'healthy', 'operational']
    suggestions.negative = ['error', 'down', 'degraded', 'outage']
    return suggestions
  }

  // Pricing pages
  if (urlLower.includes('pricing') || urlLower.includes('plans')) {
    suggestions.positive = ['Free', 'Pro', 'Enterprise', 'Subscribe', 'Get Started']
    suggestions.negative = ['error', 'unavailable', 'maintenance']
    return suggestions
  }

  // Homepage (ends with / or domain TLD)
  if (urlLower.endsWith('/') || urlLower.endsWith('.com') || urlLower.endsWith('.io') || urlLower.endsWith('.co.uk') || urlLower.endsWith('.org') || urlLower.endsWith('.net')) {
    suggestions.positive = ['Welcome', 'Home']
    suggestions.negative = ['viagra', 'casino', 'fatal error', 'database error', 'not found']
    return suggestions
  }

  // Default — general page
  suggestions.positive = []
  suggestions.negative = ['fatal error', 'server error', '500', '503', 'database error', 'not found']

  return suggestions
}
