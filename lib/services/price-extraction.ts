import { logger } from '@/lib/utils/logger'

// ============================================================
// Price Extraction Service — Phase 1 enhanced
// Order: JSON-LD → Next.js hydration → Shopify → Open Graph
//        → Microdata → data-price attrs → CSS selector
// Improvements: realistic browser headers, retry on 429/503,
//   currency symbol detection to fix USD→GBP on UK sites
// ============================================================

export type ExtractionMethod = 'json-ld' | 'meta-tags' | 'microdata' | 'css-selector' | 'manual' | 'next-data' | 'shopify'
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
  originalPrice: number | null
  isOnSale: boolean
  discountPct: number | null
  relatedProducts: RelatedProduct[]
}

export interface RelatedProduct {
  name: string
  url: string | null
  price: number | null
  currency: string
}

const FETCH_TIMEOUT_MS = 20000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

// Realistic Chrome 120 on Windows — passes basic UA checks
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Full browser header set — Sec-Fetch-* and Sec-CH-UA headers are required by
// many CDNs/WAFs to confirm this looks like a real browser navigation
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': CHROME_UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"',
  'Connection': 'keep-alive',
}

// ============================================================
// Main entry
// ============================================================

export async function extractPrice(
  url: string,
  cssSelector?: string | null
): Promise<PriceExtractionResult> {
  try {
    const html = await fetchPage(url)
    if (!html) {
      return failureResult('Failed to fetch page')
    }

    // Detect dominant currency symbol in the HTML — used to correct
    // wrong currency in structured data (e.g. USD returned on .co.uk sites
    // because Vercel's US edge triggers geo-IP USD pricing in the JSON-LD)
    const htmlCurrency = detectCurrencyFromHtml(html, url)

    // 1. JSON-LD — most reliable, 60%+ of ecommerce sites
    const jsonLdResult = extractFromJsonLd(html)
    if (jsonLdResult.success) {
      return { ...jsonLdResult, currency: resolveCurrency(jsonLdResult.currency, htmlCurrency) }
    }

    // 2. window.__NEXT_DATA__ — Next.js stores (Shopify Hydrogen, many modern stores)
    const nextDataResult = extractFromNextData(html)
    if (nextDataResult.success) {
      return { ...nextDataResult, currency: resolveCurrency(nextDataResult.currency, htmlCurrency) }
    }

    // 3. Shopify embedded product data
    const shopifyResult = extractFromShopify(html)
    if (shopifyResult.success) {
      return { ...shopifyResult, currency: resolveCurrency(shopifyResult.currency, htmlCurrency) }
    }

    // 4. Open Graph meta tags
    const ogResult = extractFromOpenGraph(html)
    if (ogResult.success) {
      return { ...ogResult, currency: resolveCurrency(ogResult.currency, htmlCurrency) }
    }

    // 5. Microdata (schema.org itemprop)
    const microdataResult = extractFromMicrodata(html)
    if (microdataResult.success) {
      return { ...microdataResult, currency: resolveCurrency(microdataResult.currency, htmlCurrency) }
    }

    // 6. data-price / data-product-price attributes
    const dataPriceResult = extractFromDataAttributes(html, htmlCurrency)
    if (dataPriceResult.success) {
      return dataPriceResult
    }

    // 7. CSS selector (user-provided)
    if (cssSelector) {
      const cssResult = extractFromCssSelector(html, cssSelector, htmlCurrency)
      if (cssResult.success) {
        return cssResult
      }
    }

    return failureResult('No price data found on page')
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error('Price extraction failed', { url, error: errorMessage })
    return failureResult(errorMessage)
  }
}

// ============================================================
// Fetcher — realistic headers + retry on 429/503
// ============================================================

async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      // Add Referer on retries (looks like a navigation from a search engine)
      const headers: Record<string, string> = { ...BROWSER_HEADERS }
      if (attempt > 0) {
        headers['Referer'] = 'https://www.google.co.uk/'
        headers['Sec-Fetch-Site'] = 'cross-site'
      }

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeout)

      // Rate limited or server overloaded — back off and retry
      if (response.status === 429 || response.status === 503) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * (attempt + 1)
          logger.warn('Rate limited fetching product page, retrying', { url, status: response.status, delay, attempt })
          await sleep(delay)
          continue
        }
        logger.warn('Page fetch rate limited after retries', { url, status: response.status })
        return null
      }

      if (!response.ok) {
        logger.warn('Page fetch returned non-OK status', { url, status: response.status })
        return null
      }

      return await response.text()
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        logger.warn('Fetch attempt failed, retrying', { url, attempt, error: String(err) })
        await sleep(RETRY_DELAY_MS)
        continue
      }
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error('Failed to fetch product page', { url, error: errorMessage })
      return null
    }
  }
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================
// Currency detection — scan HTML for dominant currency symbol
// Used to correct wrong currency in structured data
// ============================================================

function detectCurrencyFromHtml(html: string, url: string): string | null {
  // URL-based hints (fast path)
  try {
    const hostname = new URL(url).hostname
    if (hostname.endsWith('.co.uk') || hostname.includes('-uk.') || hostname.includes('.uk/')) {
      // UK domain — strong hint for GBP
      // Still check HTML to confirm
    }
  } catch { /* ignore */ }

  // Count currency symbols in the page content
  // Avoid counting symbols inside <script> and <style> to reduce noise
  const bodyHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')

  const gbp = (bodyHtml.match(/£/g) ?? []).length
  const usd = (bodyHtml.match(/\$(?!\d*[a-zA-Z])/g) ?? []).length // $ not followed by variable name
  const eur = (bodyHtml.match(/€/g) ?? []).length

  if (gbp === 0 && usd === 0 && eur === 0) return null

  const max = Math.max(gbp, usd, eur)
  if (max === gbp) return 'GBP'
  if (max === eur) return 'EUR'
  return 'USD'
}

/** If structured data says USD but HTML strongly indicates GBP, use GBP.
 *  Fixes the Vercel US-edge geo-IP problem where US servers see USD prices. */
function resolveCurrency(structuredCurrency: string, htmlCurrency: string | null): string {
  if (!htmlCurrency) return structuredCurrency
  // Only override if there's a clear mismatch — USD in structured data vs GBP in HTML
  if (structuredCurrency === 'USD' && htmlCurrency === 'GBP') return 'GBP'
  if (structuredCurrency === 'USD' && htmlCurrency === 'EUR') return 'EUR'
  return structuredCurrency
}

// ============================================================
// 1. JSON-LD Extraction (improved)
// ============================================================

function extractFromJsonLd(html: string): PriceExtractionResult {
  const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null = scriptRegex.exec(html)

  while (match !== null) {
    try {
      const jsonContent = match[1].trim()
      const parsed = JSON.parse(jsonContent) as Record<string, unknown>

      const items: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of items) {
        // Direct Product match
        const result = extractProductFromJsonLd(item)
        if (result) return result

        // ItemPage wrapping a Product (common on WooCommerce, Magento)
        const itemType = String(item['@type'] || '')
        if (itemType.includes('ItemPage') || itemType.includes('WebPage')) {
          const mainEntity = item.mainEntity as Record<string, unknown> | undefined
          if (mainEntity) {
            const pageResult = extractProductFromJsonLd(mainEntity)
            if (pageResult) return pageResult
          }
        }

        // @graph array (Yoast SEO, RankMath, etc.)
        if (Array.isArray(item['@graph'])) {
          for (const graphItem of item['@graph'] as Record<string, unknown>[]) {
            const graphResult = extractProductFromJsonLd(graphItem)
            if (graphResult) return graphResult
          }
        }
      }
    } catch {
      // Invalid JSON — skip
    }
    match = scriptRegex.exec(html)
  }

  return failureResult('No JSON-LD product data found')
}

function extractProductFromJsonLd(item: Record<string, unknown>): PriceExtractionResult | null {
  const rawType = item['@type']
  const itemType = Array.isArray(rawType)
    ? rawType.map(String).join(' ')
    : String(rawType || '')

  // Match Product, IndividualProduct, ProductModel, schema:Product
  if (
    !itemType.includes('Product') &&
    !itemType.includes('IndividualProduct') &&
    !itemType.includes('ProductModel')
  ) {
    return null
  }

  const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
  if (!offers) return null

  const offerList: Record<string, unknown>[] = Array.isArray(offers) ? offers : [offers]

  for (const offer of offerList) {
    const offerType = String(offer['@type'] || '')

    let rawPrice: string | null = null
    let currency = 'GBP'

    if (offerType === 'AggregateOffer') {
      rawPrice = String(offer.lowPrice ?? offer.price ?? '')
    } else {
      rawPrice = String(offer.price ?? '')
    }

    // priceCurrency or currency field
    if (offer.priceCurrency) currency = String(offer.priceCurrency)
    else if (offer.currency) currency = String(offer.currency)

    const availability = String(offer.availability ?? '')
    const stockStatus = parseSchemaAvailability(availability)
    const price = parsePrice(rawPrice)

    if (price !== null) {
      let originalPrice: number | null = null
      let isOnSale = false
      let discountPct: number | null = null

      // Detect sale
      for (const o of offerList) {
        const highPrice = parsePrice(String(o.highPrice ?? ''))
        if (highPrice !== null && highPrice > price) {
          originalPrice = highPrice
          isOnSale = true
          discountPct = Math.round(((highPrice - price) / highPrice) * 100)
        }
        if (o.priceValidUntil) isOnSale = true
        const salePrice = parsePrice(String(o.salePrice ?? ''))
        if (salePrice !== null && salePrice < price) {
          originalPrice = price
          isOnSale = true
          discountPct = Math.round(((price - salePrice) / price) * 100)
        }
      }

      // Related products
      const relatedProducts: RelatedProduct[] = []
      for (const key of ['isRelatedTo', 'isSimilarTo', 'isAccessoryOrSparePartFor']) {
        const related = item[key]
        if (related) {
          const relatedList = Array.isArray(related) ? related : [related]
          for (const rel of relatedList as Record<string, unknown>[]) {
            if (rel && typeof rel === 'object' && rel.name) {
              relatedProducts.push({
                name: String(rel.name),
                url: typeof rel.url === 'string' ? rel.url : null,
                price: parsePrice(String(
                  (rel as Record<string, unknown>).offers
                    ? ((rel as Record<string, unknown>).offers as Record<string, unknown>).price ?? ''
                    : ''
                )),
                currency,
              })
            }
          }
        }
      }

      return {
        success: true,
        price,
        currency,
        stockStatus,
        productName: typeof item.name === 'string' ? item.name : null,
        extractionMethod: 'json-ld',
        confidence: 0.95,
        rawExtractedValue: rawPrice,
        originalPrice,
        isOnSale,
        discountPct,
        relatedProducts: relatedProducts.slice(0, 10),
      }
    }
  }

  return null
}

// ============================================================
// 2. window.__NEXT_DATA__ (Next.js hydration data)
// Covers: Shopify Hydrogen, Vercel Commerce, many modern stores
// ============================================================

function extractFromNextData(html: string): PriceExtractionResult {
  const match = /<script[^>]*id\s*=\s*["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html)
  if (!match) return failureResult('No Next.js hydration data')

  try {
    const data = JSON.parse(match[1]) as Record<string, unknown>

    // Walk common Next.js pageProps paths to find a product with a price
    const candidates = collectPaths(data, ['product', 'productByHandle', 'node', 'item'], 4)

    for (const candidate of candidates) {
      if (typeof candidate !== 'object' || candidate === null) continue
      const obj = candidate as Record<string, unknown>

      // Shopify Storefront API shape: priceRange.minVariantPrice.amount
      const priceRange = obj.priceRange as Record<string, unknown> | undefined
      if (priceRange) {
        const minVariant = priceRange.minVariantPrice as Record<string, unknown> | undefined
        const amount = minVariant?.amount ?? priceRange.minVariantPrice
        const currency = String(
          (minVariant as Record<string, unknown>)?.currencyCode ??
          (priceRange.minVariantPrice as Record<string, unknown>)?.currencyCode ??
          'GBP'
        )
        const price = parsePrice(String(amount ?? ''))
        if (price !== null) {
          return {
            success: true,
            price,
            currency,
            stockStatus: parseAvailabilityText(String(obj.availableForSale ?? obj.available ?? '')),
            productName: typeof obj.title === 'string' ? obj.title : null,
            extractionMethod: 'next-data',
            confidence: 0.90,
            rawExtractedValue: String(amount),
            originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
          }
        }
      }

      // Variants array: pick first variant price
      const variants = obj.variants as unknown
      if (Array.isArray(variants) && variants.length > 0) {
        const v = variants[0] as Record<string, unknown>
        const price = parsePrice(String(
          v.price ?? v.priceV2?.amount ?? v.price_data?.unit_amount ?? ''
        ))
        if (price !== null) {
          const unitAmount = v.price_data?.unit_amount as number | undefined
          // Stripe-style unit_amount is in pence
          const finalPrice = unitAmount ? unitAmount / 100 : price
          return {
            success: true,
            price: finalPrice,
            currency: String(v.currency ?? v.price_data?.currency ?? 'GBP').toUpperCase(),
            stockStatus: parseAvailabilityText(String(v.available ?? v.inventory_policy ?? '')),
            productName: typeof obj.title === 'string' ? obj.title : null,
            extractionMethod: 'next-data',
            confidence: 0.85,
            rawExtractedValue: String(v.price ?? ''),
            originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
          }
        }
      }

      // Direct price field on the product object
      const directPrice = parsePrice(String(obj.price ?? obj.salePrice ?? obj.currentPrice ?? ''))
      if (directPrice !== null && directPrice > 0 && directPrice < 99999) {
        return {
          success: true,
          price: directPrice,
          currency: String(obj.currency ?? obj.currencyCode ?? 'GBP'),
          stockStatus: null,
          productName: typeof obj.title === 'string' ? obj.title : typeof obj.name === 'string' ? obj.name : null,
          extractionMethod: 'next-data',
          confidence: 0.80,
          rawExtractedValue: String(obj.price ?? ''),
          originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
        }
      }
    }
  } catch {
    // JSON parse failure — not a Next.js page or malformed
  }

  return failureResult('No product data in Next.js hydration')
}

/** Collect values at any path that contains one of the given keys, up to maxDepth */
function collectPaths(obj: unknown, keys: string[], maxDepth: number, depth = 0): unknown[] {
  if (depth > maxDepth || obj === null || typeof obj !== 'object') return []
  const results: unknown[] = []
  const record = obj as Record<string, unknown>

  for (const key of keys) {
    if (key in record) results.push(record[key])
  }

  for (const val of Object.values(record)) {
    if (typeof val === 'object' && val !== null) {
      results.push(...collectPaths(val, keys, maxDepth, depth + 1))
    }
  }

  return results
}

// ============================================================
// 3. Shopify embedded product data
// Covers: classic Shopify themes (Dawn, Debut, Brooklyn, etc.)
// ============================================================

function extractFromShopify(html: string): PriceExtractionResult {
  // Pattern 1: var meta = {"product": {...}} (Shopify theme standard)
  const metaMatch = /var\s+meta\s*=\s*(\{[\s\S]*?"product"[\s\S]*?\});/.exec(html)
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]) as Record<string, unknown>
      const product = meta.product as Record<string, unknown> | undefined
      if (product) {
        const variants = product.variants as Array<Record<string, unknown>> | undefined
        if (variants?.length) {
          const v = variants[0]
          // Shopify price is in pence (cents): 2999 = £29.99
          const rawPrice = v.price as number | string | undefined
          if (rawPrice !== undefined) {
            const pence = typeof rawPrice === 'number' ? rawPrice : parseInt(String(rawPrice), 10)
            if (!isNaN(pence) && pence > 0) {
              return {
                success: true,
                price: pence / 100,
                currency: 'GBP',
                stockStatus: v.available === true ? 'in_stock' : v.available === false ? 'out_of_stock' : null,
                productName: typeof product.title === 'string' ? product.title : null,
                extractionMethod: 'shopify',
                confidence: 0.92,
                rawExtractedValue: String(rawPrice),
                originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
              }
            }
          }
        }
      }
    } catch { /* continue */ }
  }

  // Pattern 2: ShopifyAnalytics.meta.price (older themes)
  const analyticsMatch = /ShopifyAnalytics\.meta\s*=\s*(\{[\s\S]*?\});/.exec(html)
  if (analyticsMatch) {
    try {
      const meta = JSON.parse(analyticsMatch[1]) as Record<string, unknown>
      const price = (meta.product as Record<string, unknown>)?.price as number | string | undefined
      if (price !== undefined) {
        const pence = typeof price === 'number' ? price : parseInt(String(price), 10)
        if (!isNaN(pence) && pence > 0) {
          return {
            success: true,
            price: pence / 100,
            currency: 'GBP',
            stockStatus: null,
            productName: null,
            extractionMethod: 'shopify',
            confidence: 0.88,
            rawExtractedValue: String(price),
            originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
          }
        }
      }
    } catch { /* continue */ }
  }

  // Pattern 3: window.Shopify.currency.active (currency detection only — helps other extractors)
  // Not a price source itself, but confirms currency

  return failureResult('No Shopify product data found')
}

// ============================================================
// 4. Open Graph Meta Tags (improved patterns)
// ============================================================

function extractFromOpenGraph(html: string): PriceExtractionResult {
  const pricePatterns = [
    /content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["'](?:og|product):price:amount["']/i,
    /property\s*=\s*["'](?:og|product):price:amount["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    // Twitter Card product price (some shops use this)
    /content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']twitter:data1["']/i,
    /name\s*=\s*["']twitter:data1["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    // Generic name="price"
    /name\s*=\s*["']price["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']price["']/i,
  ]

  const currencyPatterns = [
    /content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["'](?:og|product):price:currency["']/i,
    /property\s*=\s*["'](?:og|product):price:currency["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /name\s*=\s*["']twitter:label1["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  ]

  const titlePatterns = [
    /property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:title["']/i,
  ]

  let rawPrice: string | null = null
  let currency = 'GBP'
  let productName: string | null = null

  for (const pattern of pricePatterns) {
    const m = pattern.exec(html)
    if (m?.[1]) { rawPrice = m[1]; break }
  }
  for (const pattern of currencyPatterns) {
    const m = pattern.exec(html)
    if (m?.[1]) { currency = m[1]; break }
  }
  for (const pattern of titlePatterns) {
    const m = pattern.exec(html)
    if (m?.[1]) { productName = m[1]; break }
  }

  if (rawPrice) {
    const price = parsePrice(rawPrice)
    if (price !== null) {
      return {
        success: true, price, currency, stockStatus: null, productName,
        extractionMethod: 'meta-tags', confidence: 0.80,
        rawExtractedValue: rawPrice,
        originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
      }
    }
  }

  return failureResult('No OG price meta tags found')
}

// ============================================================
// 5. Microdata (schema.org itemprop)
// ============================================================

function extractFromMicrodata(html: string): PriceExtractionResult {
  const pricePatterns = [
    /itemprop\s*=\s*["']price["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /content\s*=\s*["']([^"']+)["'][^>]*itemprop\s*=\s*["']price["']/i,
    // data-itemprop pattern used by some CMSes
    /data-itemprop\s*=\s*["']price["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  ]
  const currencyPatterns = [
    /itemprop\s*=\s*["']priceCurrency["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /content\s*=\s*["']([^"']+)["'][^>]*itemprop\s*=\s*["']priceCurrency["']/i,
  ]

  let rawPrice: string | null = null
  let currency = 'GBP'

  for (const pattern of pricePatterns) {
    const m = pattern.exec(html)
    if (m?.[1]) { rawPrice = m[1]; break }
  }
  for (const pattern of currencyPatterns) {
    const m = pattern.exec(html)
    if (m?.[1]) { currency = m[1]; break }
  }

  if (rawPrice) {
    const price = parsePrice(rawPrice)
    if (price !== null) {
      return {
        success: true, price, currency, stockStatus: null, productName: null,
        extractionMethod: 'microdata', confidence: 0.70,
        rawExtractedValue: rawPrice,
        originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
      }
    }
  }

  return failureResult('No microdata price found')
}

// ============================================================
// 6. data-price / data-product-price attributes
// Common in Shopify themes, WooCommerce, custom themes
// ============================================================

function extractFromDataAttributes(html: string, htmlCurrency: string | null): PriceExtractionResult {
  const currency = htmlCurrency ?? 'GBP'

  // data-product-price — Shopify themes (value in pence)
  const shopifyPriceMatch = /data-product-price\s*=\s*["'](\d+)["']/i.exec(html)
  if (shopifyPriceMatch) {
    const pence = parseInt(shopifyPriceMatch[1], 10)
    if (!isNaN(pence) && pence > 0) {
      return {
        success: true, price: pence / 100, currency,
        stockStatus: null, productName: null,
        extractionMethod: 'css-selector', confidence: 0.75,
        rawExtractedValue: shopifyPriceMatch[1],
        originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
      }
    }
  }

  // data-price — WooCommerce and many other themes (decimal value)
  const dataPriceMatch = /data-price\s*=\s*["'](\d+\.?\d*)["']/i.exec(html)
  if (dataPriceMatch) {
    const price = parsePrice(dataPriceMatch[1])
    if (price !== null) {
      return {
        success: true, price, currency,
        stockStatus: null, productName: null,
        extractionMethod: 'css-selector', confidence: 0.72,
        rawExtractedValue: dataPriceMatch[1],
        originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
      }
    }
  }

  // data-sale-price
  const salePriceMatch = /data-sale-price\s*=\s*["'](\d+\.?\d*)["']/i.exec(html)
  if (salePriceMatch) {
    const price = parsePrice(salePriceMatch[1])
    if (price !== null) {
      return {
        success: true, price, currency,
        stockStatus: null, productName: null,
        extractionMethod: 'css-selector', confidence: 0.70,
        rawExtractedValue: salePriceMatch[1],
        originalPrice: null, isOnSale: true, discountPct: null, relatedProducts: [],
      }
    }
  }

  return failureResult('No data-price attributes found')
}

// ============================================================
// 7. CSS Selector (user-provided, regex-based approximation)
// ============================================================

function extractFromCssSelector(
  html: string,
  selector: string,
  htmlCurrency: string | null
): PriceExtractionResult {
  const currency = htmlCurrency ?? 'GBP'
  const cleanSelector = selector.trim()
  let contentRegex: RegExp | null = null

  if (cleanSelector.startsWith('.')) {
    const className = cleanSelector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    contentRegex = new RegExp(`class\\s*=\\s*["'][^"']*${className}[^"']*["'][^>]*>([^<]+)`, 'i')
  } else if (cleanSelector.startsWith('#')) {
    const idName = cleanSelector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    contentRegex = new RegExp(`id\\s*=\\s*["']${idName}["'][^>]*>([^<]+)`, 'i')
  } else if (cleanSelector.startsWith('[')) {
    const attrMatch = /\[([a-zA-Z0-9-]+)(?:=["']?([^"'\]]+))?]/.exec(cleanSelector)
    if (attrMatch) {
      const attrName = attrMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      contentRegex = new RegExp(`${attrName}\\s*=\\s*["']?[^"'>]*["']?[^>]*>([^<]+)`, 'i')
    }
  }

  if (contentRegex) {
    const m = contentRegex.exec(html)
    if (m) {
      const rawValue = m[1].trim()
      const price = parsePrice(rawValue)
      if (price !== null) {
        return {
          success: true, price, currency, stockStatus: null, productName: null,
          extractionMethod: 'css-selector', confidence: 0.60,
          rawExtractedValue: rawValue,
          originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
        }
      }
    }
  }

  return failureResult('CSS selector did not match any price')
}

// ============================================================
// Helpers
// ============================================================

function parsePrice(raw: string): number | null {
  if (!raw || typeof raw !== 'string') return null

  const cleaned = raw
    .replace(/[£$€¥₹\s]/g, '')
    .replace(/,(\d{2})$/, '.$1')   // European: 1.234,56 → 1234.56
    .replace(/,/g, '')
    .trim()

  const parsed = parseFloat(cleaned)
  if (isNaN(parsed) || parsed < 0 || parsed > 999999999) return null
  return Math.round(parsed * 100) / 100
}

function parseSchemaAvailability(availability: string): StockStatus | null {
  const lower = availability.toLowerCase()
  if (lower.includes('instock') || lower.includes('in_stock')) return 'in_stock'
  if (lower.includes('outofstock') || lower.includes('out_of_stock')) return 'out_of_stock'
  if (lower.includes('limitedavailability') || lower.includes('low_stock')) return 'low_stock'
  if (lower.includes('preorder') || lower.includes('backorder')) return 'in_stock'
  return null
}

function parseAvailabilityText(text: string): StockStatus | null {
  if (!text) return null
  if (text === 'true' || text === '1') return 'in_stock'
  if (text === 'false' || text === '0') return 'out_of_stock'
  return parseSchemaAvailability(text)
}

function failureResult(error: string): PriceExtractionResult {
  return {
    success: false, price: null, currency: 'GBP', stockStatus: null,
    productName: null, extractionMethod: 'json-ld', confidence: 0,
    rawExtractedValue: null, error,
    originalPrice: null, isOnSale: false, discountPct: null, relatedProducts: [],
  }
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}
