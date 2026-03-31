import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { updateOrganisation } from '@/lib/db/organisations'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can update organisation' }, { status: 403 })

    const body = await request.json()
    const { name, slug, timezone } = body as { name?: string; slug?: string; timezone?: string }

    const updates: { name?: string; slug?: string; timezone?: string } = {}
    if (name) updates.name = name
    if (slug) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (timezone) updates.timezone = timezone

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const org = await updateOrganisation(user.org_id, updates)
    if (!org) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    logger.info('Organisation updated', { orgId: user.org_id, updates })
    return NextResponse.json({ success: true, organisation: org })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
