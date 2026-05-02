import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reorderSections } from '@/lib/db/page-sections'
import { logger } from '@/lib/utils/logger'

function isAdmin(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as { orders: Array<{ id: string; sort_order: number }> }

    if (!Array.isArray(body.orders) || body.orders.length === 0) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 })
    }

    const ok = await reorderSections(body.orders)
    if (!ok) return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('CMS: POST reorder failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
