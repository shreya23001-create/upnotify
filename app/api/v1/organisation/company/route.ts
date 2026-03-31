import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { updateCompanyDetails } from '@/lib/db/organisations'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const org = await updateCompanyDetails(user.org_id, body)
    if (!org) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    logger.info('Company details updated', { orgId: user.org_id })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
