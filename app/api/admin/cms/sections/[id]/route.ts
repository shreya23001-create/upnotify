import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSection, deleteSection } from '@/lib/db/page-sections'
import { logger } from '@/lib/utils/logger'

function isAdmin(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json() as {
      content?:    Record<string, unknown>
      theme?:      Record<string, unknown> | null
      is_visible?: boolean
      sort_order?: number
    }

    const updated = await updateSection(id, body as Parameters<typeof updateSection>[1], user.id)
    if (!updated) return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })

    return NextResponse.json({ success: true, section: updated })
  } catch (error) {
    logger.error('CMS: PATCH section failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const ok = await deleteSection(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('CMS: DELETE section failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
