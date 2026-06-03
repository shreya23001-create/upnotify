import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getKeywordSuggestionsFromDB } from '@/lib/db/keyword-suggestions'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

/**
 * GET /api/v1/keyword-suggestions?url=https://example.com/checkout
 * Returns keyword suggestions filtered by URL pattern.
 * Requires authentication.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit(request, API_V1_RATE_LIMIT, 'keyword-suggestions')
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) } },
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const url = request.nextUrl.searchParams.get('url') ?? ''
  const suggestions = await getKeywordSuggestionsFromDB(url)

  return NextResponse.json({
    positive: suggestions.positive.map(s => ({
      keyword: s.keyword,
      category: s.category,
      description: s.description,
    })),
    negative: suggestions.negative.map(s => ({
      keyword: s.keyword,
      category: s.category,
      description: s.description,
    })),
  })
}
