import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/db/api-keys'
import { logger } from '@/lib/utils/logger'
import { heartbeatParamsSchema } from '@/lib/validations/schemas'
import { validateInput } from '@/lib/validations/validate'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const params = { id: url.searchParams.get('id') ?? undefined }
  const parsed = validateInput(heartbeatParamsSchema, params, 'heartbeat')
  if (!parsed.success) return parsed.response

  const monitorId = parsed.data.id

  const rawKey = request.headers.get('x-api-key')
  if (!rawKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const apiKey = await validateApiKey(rawKey)
  if (!apiKey) {
    logger.warn('Heartbeat rejected: invalid API key', { monitorId })
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Verify the monitor belongs to the same org as the API key
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: monitor, error: lookupError } = await supabase
    .from('monitors')
    .select('org_id')
    .eq('id', monitorId)
    .eq('type', 'heartbeat')
    .single()

  if (lookupError || !monitor) {
    return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
  }

  if (monitor.org_id !== apiKey.org_id) {
    logger.warn('Heartbeat rejected: org mismatch', {
      monitorId,
      monitorOrg: monitor.org_id,
      keyOrg: apiKey.org_id,
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

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
