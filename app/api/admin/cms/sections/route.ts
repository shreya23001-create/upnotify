import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllLandingSections, createSection } from '@/lib/db/page-sections'
import { logger } from '@/lib/utils/logger'

function isAdmin(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const sections = await getAllLandingSections()
    return NextResponse.json({ success: true, sections })
  } catch (error) {
    logger.error('CMS: GET sections failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as {
      section_key:  string
      section_type: string
      content:      Record<string, unknown>
      sort_order:   number
      page?:        string
    }

    if (!body.section_key || !body.section_type) {
      return NextResponse.json({ error: 'section_key and section_type are required' }, { status: 400 })
    }

    const section = await createSection(
      body.section_key,
      body.section_type,
      body.content ?? {},
      body.sort_order ?? 999,
      user.id,
      body.page ?? 'landing'
    )

    if (!section) return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
    return NextResponse.json({ success: true, section }, { status: 201 })
  } catch (error) {
    logger.error('CMS: POST section failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
