import { logger } from '@/lib/utils/logger'

// ============================================================
// Price Extraction Service — extracts price from product page URL
// Tries: JSON-LD → Open Graph → Microdata → CSS Selector
// Zero external deps — uses fetch + string parsing
// ============================================================

export type ExtractionMethod = 'json-ld' | 'meta-tags' | 'microdata' | 'css-selector' | 'manual'
export type StockStatus = 'in_stock' | 'out_of_stock' | 'low_stock'

export interface PriceExtractionResult {
  success: boolean
  price: number | null
  currency: string
  stockStatus: StockStatus | null
  productName: string | null
  extractionMethod: ExtractionMethod
  confidence: number
  rawExtractedValue: string | null
  error?: string
}

const FETCH_TIMEOUT_MS = 15000
const USER_AGENT = 'Mozilla/5.0 (compatible; UptrueBot/1.0; +https://uptrue.io)'

/** Main entry: extract price from a given URL */
export async function extractPrice(
  url: string,
  cssSelector?: string | null
): Promise<PriceExtractionResult> {
  try {
    const html = await fetchPage(url)
    if (!html) {
      return failureResult('Failed to fetch page')
    }

    // 1. Try JSON-LD (most reliable — 60%+ of ecommerce sites)
    const jsonLdResult = extractFromJsonLd(html)
    if (jsonLdResult.success) {
      return jsonLdResult
    }

    // 2. Try Open Graph meta tags
    const ogResult = extractFromOpenGraph(html)
    if (ogResult.success) {
      return ogResult
    }

    // 3. Try Microdata
    const microdataResult = extractFromMicrodata(html)
    if (microdataResult.success) {
      return microdataResult
    }

    // 4. Try CSS selector (if provided by user)
    if (cssSelector) {
      const cssResult = extractFromCssSelector(html, cssSelector)
      if (cssResult.success) {
        return cssResult
      }
    }

    return failureResult('No price data found on page')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error('Price extraction failed', { url, error: errorMessage })
    return failureResult(errorMessage)
  }
}

// ============================================================
// Fetcher
// ============================================================

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      logger.warn('Page fetch returned non-OK status', { url, status: response.status })
      return null
    }

    return await response.text()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error('Failed to fetch product page', { url, error: errorMessage })
    return null
  }
}

// ============================================================
// 1. JSON-LD Extraction
// ============================================================

function extractFromJsonLd(html: string): PriceExtractionResult {
  // Find all <script type="application/ld+json"> blocks
  const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null = scriptRegex.exec(html)

  while (match !== null) {
    try {
      const jsonContent = match[1].trim()
      const parsed = JSON.parse(jsonContent) as Record<string, unknown>

      // Handle both single object and array of objects
      const items: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of items) {
        const result = extractProductFromJsonLd(item)
        if (result) {
          return result
        }

        // Check @graph array (common in WooCommerce / Yoast)
        if (Array.isArray(item['@graph'])) {
          for (const graphItem of item['@graph'] as Record<string, unknown>[]) {
            const graphResult = extractProductFromJsonLd(graphItem)
            if (graphResult) {
              return graphResult
            }
          }
        }
      }
    } catch {
      // Invalid JSON — skip this block
    }
    match = scriptRegex.exec(html)
  }

  return failureResult('No JSON-LD product data found')
}

function extractProductFromJsonLd(
  item: Record<string, unknown>
): PriceExtractionResult | null {
  const itemType = String(item['@type'] || '')
  if (!itemType.includes('Product') && itemType !== 'IndividualProduct') {
    return null
  }

  const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
  if (!offers) {
    return null
  }

  // offers can be a single object or an array
  const offerList: Record<string, unknown>[] = Array.isArray(offers) ? offers : [offers]

  // If AggregateOffer, look at lowPrice
  for (const offer of offerList) {
    const offerType = String(offer['@type'] || '')

    let rawPrice: string | null = null
    let currency = 'GBP'
    let stockStatus: StockStatus | null = null

    if (offerType === 'AggregateOffer') {
      rawPrice = String(offer.lowPrice ?? offer.price ?? '')
    } else {
      rawPrice = String(offer.price ?? '')
    }

    if (offer.priceCurrency) {
      currency = String(offer.priceCurrency)
    }

    // Parse availability
    const availability = String(offer.availability ?? '')
    stockStatus = parseSchemaAvailability(availability)

    const price = parsePrice(rawPrice)
    if (price !== null) {
      return {
        success: true,
        price,
        currency,
        stockStatus,
        productName: typeof item.name === 'string' ? item.name : null,
        extractionMethod: 'json-ld',
        confidence: 0.95,
        rawExtractedValue: rawPrice,
      }
    }
  }

  return null
}

// ============================================================
// 2. Open Graph Meta Tags
// ============================================================

function extractFromOpenGraph(html: string): PriceExtractionResult {
  // Try og:price:amount and product:price:amount
  const pricePatterns = [
    /content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["'](?:og|product):price:amount["']/i,
    /property\s*=\s*["'](?:og|product):price:amount["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  ]

  const currencyPatterns = [
    /content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["'](?:og|product):price:currency["']/i,
    /property\s*=\s*["'](?:og|product):price:currency["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  ]

  const titlePatterns = [
    /content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:title["']/i,
    /property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  ]

  let rawPrice: string | null = null
  let currency = 'GBP'
  let productName: string | null = null

  for (const pattern of pricePatterns) {
    const priceMatch = pattern.exec(html)
    if (priceMatch) {
      rawPrice = priceMatch[1]
      break
    }
  }

  for (const pattern of currencyPatterns) {
    const currencyMatch = pattern.exec(html)
    if (currencyMatch) {
      currency = currencyMatch[1]
      break
    }
  }

  for (const pattern of titlePatterns) {
    const titleMatch = pattern.exec(html)
    if (titleMatch) {
      productName = titleMatch[1]
      break
    }
  }

  if (rawPrice) {
    const price = parsePrice(rawPrice)
    if (price !== null) {
      return {
        success: true,
        price,
        currency,
        stockStatus: null,
        productName,
        extractionMethod: 'meta-tags',
        confidence: 0.80,
        rawExtractedValue: rawPrice,
      }
    }
  }

  return failureResult('No OG price meta tags found')
}

// ============================================================
// 3. Microdata Extraction
// ============================================================

function extractFromMicrodata(html: string): PriceExtractionResult {
  // Look for itemprop="price" with content attribute
  const pricePatterns = [
    /itemprop\s*=\s*["']price["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /content\s*=\s*["']([^"']+)["'][^>]*itemprop\s*=\s*["']price["']/i,
  ]

  const currencyPatterns = [
    /itemprop\s*=\s*["']priceCurrency["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /content\s*=\s*["']([^"']+)["'][^>]*itemprop\s*=\s*["']priceCurrency["']/i,
  ]

  let rawPrice: string | null = null
  let currency = 'GBP'

  for (const pattern of pricePatterns) {
    const priceMatch = pattern.exec(html)
    if (priceMatch) {
      rawPrice = priceMatch[1]
      break
    }
  }

  for (const pattern of currencyPatterns) {
    const currencyMatch = pattern.exec(html)
    if (currencyMatch) {
      currency = currencyMatch[1]
      break
    }
  }

  if (rawPrice) {
    const price = parsePrice(rawPrice)
    if (price !== null) {
      return {
        success: true,
        price,
        currency,
        stockStatus: null,
        productName: null,
        extractionMethod: 'microdata',
        confidence: 0.70,
        rawExtractedValue: rawPrice,
      }
    }
  }

  return failureResult('No microdata price found')
}

// ============================================================
// 4. CSS Selector Extraction (regex-based approximation)
// ============================================================

function extractFromCssSelector(
  html: string,
  selector: string
): PriceExtractionResult {
  // Simple approach: look for elements matching common patterns
  // We extract class/id from the selector and search for content
  const cleanSelector = selector.trim()

  // Handle .class-name and #id-name
  let contentRegex: RegExp | null = null

  if (cleanSelector.startsWith('.')) {
    const className = cleanSelector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    contentRegex = new RegExp(
      `class\\s*=\\s*["'][^"']*${className}[^"']*["'][^>]*>([^<]+)`,
      'i'
    )
  } else if (cleanSelector.startsWith('#')) {
    const idName = cleanSelector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    contentRegex = new RegExp(
      `id\\s*=\\s*["']${idName}["'][^>]*>([^<]+)`,
      'i'
    )
  } else if (cleanSelector.startsWith('[')) {
    // Attribute selector like [data-price]
    const attrMatch = /\[([a-zA-Z0-9-]+)(?:=["']?([^"'\]]+))?]/.exec(cleanSelector)
    if (attrMatch) {
      const attrName = attrMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      contentRegex = new RegExp(
        `${attrName}\\s*=\\s*["']?[^"'>]*["']?[^>]*>([^<]+)`,
        'i'
      )
    }
  }

  if (contentRegex) {
    const contentMatch = contentRegex.exec(html)
    if (contentMatch) {
      const rawValue = contentMatch[1].trim()
      const price = parsePrice(rawValue)
      if (price !== null) {
        return {
          success: true,
          price,
          currency: 'GBP',
          stockStatus: null,
          productName: null,
          extractionMethod: 'css-selector',
          confidence: 0.60,
          rawExtractedValue: rawValue,
        }
      }
    }
  }

  return failureResult('CSS selector did not match any price')
}

// ============================================================
// Helpers
// ============================================================

/** Parse a price string into a number, handling various formats */
function parsePrice(raw: string): number | null {
  if (!raw || typeof raw !== 'string') return null

  // Remove currency symbols and whitespace, keep digits, dots, commas
  const cleaned = raw
    .replace(/[£$€¥₹\s]/g, '')
    .replace(/,(\d{2})$/, '.$1')     // European format: 1.234,56 → 1234.56
    .replace(/,/g, '')               // Remove remaining commas
    .trim()

  const parsed = parseFloat(cleaned)
  if (isNaN(parsed) || parsed < 0 || parsed > 999999999) {
    return null
  }
  return Math.round(parsed * 100) / 100
}

/** Parse schema.org availability string into our stock status */
function parseSchemaAvailability(availability: string): StockStatus | null {
  const lower = availability.toLowerCase()
  if (lower.includes('instock') || lower.includes('in_stock')) return 'in_stock'
  if (lower.includes('outofstock') || lower.includes('out_of_stock')) return 'out_of_stock'
  if (lower.includes('limitedavailability') || lower.includes('low_stock')) return 'low_stock'
  if (lower.includes('preorder') || lower.includes('backorder')) return 'in_stock'
  return null
}

/** Create a failure result */
function failureResult(error: string): PriceExtractionResult {
  return {
    success: false,
    price: null,
    currency: 'GBP',
    stockStatus: null,
    productName: null,
    extractionMethod: 'json-ld',
    confidence: 0,
    rawExtractedValue: null,
    error,
  }
}

/** Extract domain from a URL */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}
