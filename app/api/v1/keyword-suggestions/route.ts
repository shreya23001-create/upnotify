import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getKeywordSuggestionsFromDB } from '@/lib/db/keyword-suggestions'

/**
 * GET /api/v1/keyword-suggestions?url=https://example.com/checkout
 * Returns keyword suggestions filtered by URL pattern.
 * Requires authentication.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
