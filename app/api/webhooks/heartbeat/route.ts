import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const monitorId = url.searchParams.get('id')

  if (!monitorId) {
    return NextResponse.json({ error: 'Missing monitor id' }, { status: 400 })
  }

  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  // TODO: validate API key against api_keys table

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('monitors')
    .update({ last_checked_at: now })
    .eq('id', monitorId)
    .eq('type', 'heartbeat')

  if (error) {
    logger.error('Failed to update heartbeat', { error: error.message, monitorId })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, received_at: now })
}
