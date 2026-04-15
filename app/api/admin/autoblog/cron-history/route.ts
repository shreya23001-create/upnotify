import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/utils/config'
import { getCronHistoryForPaths } from '@/lib/db/autoblog'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return getConfig().admin.emails.includes(user.email)
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const historyMap = await getCronHistoryForPaths([path], 5)
  return NextResponse.json({ history: historyMap[path] ?? [] })
}
