import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import {
  createProduct,
  deleteProduct,
  getProductsByOrg,
  writePrice,
} from '@/lib/db/ecom-products'
import { checkCompeteAccess, checkCompeteProductLimit } from '@/lib/utils/plan-limits'
import { extractDomain } from '@/lib/services/price-extraction'
import { logger } from '@/lib/utils/logger'

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const hasAccess = await checkCompeteAccess(user.org_id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Compete is not available on your plan' }, { status: 403 })
    }

    const products = await getProductsByOrg(user.org_id)
    return NextResponse.json({ products })
  } catch (err) {
    logger.error('GET /api/v1/compete/products failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const hasAccess = await checkCompeteAccess(user.org_id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Compete is not available on your plan' }, { status: 403 })
    }

    const limitCheck = await checkCompeteProductLimit(user.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Product limit reached (${limitCheck.limit}). Upgrade your plan.` },
        { status: 403 }
      )
    }

    const body = await request.json() as Record<string, unknown>
    const {
      url, name, is_own_product, product_group_id,
      css_selector, extraction_method,
      price, currency, stock_status, confidence,
    } = body as {
      url?: string
      name?: string
      is_own_product?: boolean
      product_group_id?: string
      css_selector?: string
      extraction_method?: string
      price?: number
      currency?: string
      stock_status?: string
      confidence?: number
    }

    if (!url || typeof url !== 'string' || url.length < 10 || url.length > 2048) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const domain = extractDomain(url)
    const productName = typeof name === 'string' && name.trim() ? name.trim() : domain

    const product = await createProduct({
      org_id: user.org_id,
      name: productName,
      url: url.trim(),
      domain,
      is_own_product: is_own_product === true,
      extraction_method: typeof extraction_method === 'string' ? extraction_method : 'auto',
      css_selector: typeof css_selector === 'string' && css_selector.trim() ? css_selector.trim() : null,
      product_group_id: typeof product_group_id === 'string' && product_group_id ? product_group_id : null,
    })

    if (!product) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // If we have extraction data from preview, write initial price
    if (typeof price === 'number' && price > 0) {
      await writePrice(product.id, user.org_id, {
        price,
        currency: typeof currency === 'string' ? currency : 'GBP',
        stock_status: typeof stock_status === 'string' ? stock_status : null,
        extraction_method: typeof extraction_method === 'string' ? extraction_method : null,
        confidence: typeof confidence === 'number' ? confidence : null,
      })
    }

    logger.info('Compete product created', { orgId: user.org_id, productId: product.id, domain })
    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/v1/compete/products failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 })
    }

    const deleted = await deleteProduct(id, user.org_id)
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 404 })
    }

    logger.info('Compete product deleted', { orgId: user.org_id, productId: id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('DELETE /api/v1/compete/products failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
