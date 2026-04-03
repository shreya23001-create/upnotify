import { NextResponse, type NextRequest } from 'next/server'
import { validateApiKey } from '@/lib/db/api-keys'
import { getProductByUrl, writePrice } from '@/lib/db/ecom-products'
import { logger } from '@/lib/utils/logger'

/**
 * Webhook endpoint for receiving price data from external stores.
 * Authenticated via API key (query param or Authorization header).
 * Body: { productUrl, price, currency?, stockStatus? }
 *
 * This is how WooCommerce, Shopify, BigCommerce etc. send data to Uptrue.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate via API key
    const url = new URL(request.url)
    const keyFromQuery = url.searchParams.get('key')
    const authHeader = request.headers.get('Authorization')
    const keyFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    const rawKey = keyFromQuery ?? keyFromHeader
    if (!rawKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const apiKey = await validateApiKey(rawKey)
    if (!apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const orgId = apiKey.org_id

    // Parse body
    const body = await request.json() as Record<string, unknown>
    const {
      productUrl, price, currency, stockStatus,
    } = body as {
      productUrl?: string
      price?: number
      currency?: string
      stockStatus?: string
    }

    if (!productUrl || typeof productUrl !== 'string') {
      return NextResponse.json({ error: 'productUrl is required' }, { status: 400 })
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'price must be a positive number' }, { status: 400 })
    }

    // Find the product by URL in this org
    const product = await getProductByUrl(productUrl.trim(), orgId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found. Ensure this URL is tracked in Compete.' },
        { status: 404 }
      )
    }

    // Validate stock status
    const validStockStatuses = ['in_stock', 'out_of_stock', 'low_stock']
    const validatedStock = typeof stockStatus === 'string' && validStockStatuses.includes(stockStatus)
      ? stockStatus
      : null

    // Write price data
    const priceEntry = await writePrice(product.id, orgId, {
      price,
      currency: typeof currency === 'string' && currency.length === 3 ? currency.toUpperCase() : 'GBP',
      stock_status: validatedStock,
      extraction_method: 'manual',
      confidence: 1.0,
      raw_extracted_value: String(price),
    })

    if (!priceEntry) {
      return NextResponse.json({ error: 'Failed to write price data' }, { status: 500 })
    }

    logger.info('Compete webhook price received', {
      orgId,
      productId: product.id,
      price,
      currency: currency ?? 'GBP',
    })

    return NextResponse.json({
      success: true,
      productId: product.id,
      priceRecorded: price,
    })
  } catch (err) {
    logger.error('POST /api/v1/compete/webhook failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
