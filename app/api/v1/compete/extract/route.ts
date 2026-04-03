import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { checkCompeteAccess } from '@/lib/utils/plan-limits'
import { extractPrice } from '@/lib/services/price-extraction'
import { logger } from '@/lib/utils/logger'

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

    const body = await request.json() as Record<string, unknown>
    const { url, css_selector } = body as { url?: string; css_selector?: string }

    if (!url || typeof url !== 'string' || url.length < 10 || url.length > 2048) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const result = await extractPrice(
      url.trim(),
      typeof css_selector === 'string' && css_selector.trim() ? css_selector.trim() : undefined
    )

    logger.info('Price extraction attempted', {
      orgId: user.org_id,
      url,
      success: result.success,
      method: result.extractionMethod,
    })

    return NextResponse.json(result)
  } catch (err) {
    logger.error('POST /api/v1/compete/extract failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
