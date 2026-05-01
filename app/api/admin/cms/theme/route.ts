import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCmsTheme, updateCmsTheme } from '@/lib/db/page-sections'
import { logger } from '@/lib/utils/logger'
import type { CmsThemeSettings } from '@/lib/types/cms'

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

    const theme = await getCmsTheme()
    return NextResponse.json({ success: true, theme })
  } catch (error) {
    logger.error('CMS: GET theme failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as { settings: CmsThemeSettings }
    if (!body.settings) {
      return NextResponse.json({ error: 'settings object is required' }, { status: 400 })
    }

    const theme = await updateCmsTheme(body.settings, user.id)
    if (!theme) return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })

    return NextResponse.json({ success: true, theme })
  } catch (error) {
    logger.error('CMS: PATCH theme failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
