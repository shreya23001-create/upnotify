import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCmsTheme, updateCmsTheme } from '@/lib/db/page-sections'
import { logger } from '@/lib/utils/logger'
import type { CmsThemeSettings } from '@/lib/types/cms'

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!user.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const theme = await getCmsTheme()
    return NextResponse.json({ success: true, theme })
  } catch (error) {
    logger.error('CMS: GET theme failed', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!user.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
