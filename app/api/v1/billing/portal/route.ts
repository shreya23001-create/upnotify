import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { createPortalSession } from '@/lib/services/stripe'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function POST(): Promise<NextResponse> {
  try {
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
