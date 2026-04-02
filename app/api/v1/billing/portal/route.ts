import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { createPortalSession } from '@/lib/services/stripe'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'billing-portal')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const org = await getCurrentOrganisation()
    if (!org?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account. Subscribe to a plan first.' },
        { status: 400 }
      )
    }

    const config = getConfig()
    const url = await createPortalSession(
      org.stripe_customer_id,
      config.app.url
    )

    return NextResponse.json({ url })
  } catch (error) {
    logger.error('Portal session error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
