import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { createCompetitorMonitor, deleteCompetitorMonitor } from '@/lib/db/competitor-monitors'
import { checkCompetitorLimit } from '@/lib/utils/plan-limits'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { domain: rawDomain, display_name } = body as { domain?: string; display_name?: string }

    if (!rawDomain || typeof rawDomain !== 'string' || rawDomain.trim().length === 0) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Extract hostname — accept full URLs (https://x.com/) or bare domains (x.com)
    let cleanDomain: string
    try {
      const withProtocol = rawDomain.trim().startsWith('http') ? rawDomain.trim() : `https://${rawDomain.trim()}`
      const parsed = new URL(withProtocol)
      cleanDomain = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
    } catch {
      return NextResponse.json({ error: 'Could not parse domain. Use a format like: example.com' }, { status: 400 })
    }

    if (!cleanDomain || cleanDomain.length < 3 || cleanDomain.length > 253 || !cleanDomain.includes('.')) {
      return NextResponse.json({ error: 'Invalid domain. Use a format like: example.com' }, { status: 400 })
    }

    // Check plan limit
    const limitCheck = await checkCompetitorLimit(user.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Competitor limit reached (${limitCheck.limit}). Upgrade your plan.` },
        { status: 403 }
      )
    }

    // Check for duplicate before insert (friendlier error than a 500)
    const adminDb = createAdminClient()
    const { count: existCount } = await adminDb
      .from('competitor_monitors')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', user.org_id)
      .eq('domain', cleanDomain)
    if ((existCount ?? 0) > 0) {
      return NextResponse.json({ error: `${cleanDomain} is already being monitored.` }, { status: 409 })
    }

    const competitor = await createCompetitorMonitor({
      org_id: user.org_id,
      domain: cleanDomain,
      display_name: typeof display_name === 'string' && display_name.trim()
        ? display_name.trim()
        : cleanDomain,
    })

    if (!competitor) {
      return NextResponse.json({ error: 'Failed to create competitor monitor. Please try again.' }, { status: 500 })
    }

    logger.info('Competitor monitor created', { orgId: user.org_id, domain: cleanDomain })
    return NextResponse.json({ competitor }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/v1/competitors failed', {
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
      return NextResponse.json({ error: 'Missing competitor ID' }, { status: 400 })
    }

    const deleted = await deleteCompetitorMonitor(id, user.org_id)
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 404 })
    }

    logger.info('Competitor monitor deleted', { orgId: user.org_id, id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('DELETE /api/v1/competitors failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
