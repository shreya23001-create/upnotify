import { NextResponse, type NextRequest } from 'next/server'
import { addEngineKey } from '@/lib/db/ai-engines'
import { getCurrentUser } from '@/lib/db/users'
import { logger } from '@/lib/utils/logger'

interface Params { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: engineId } = await params

  let body: { label?: string; apiKey?: string; monthlyLimit?: number }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { label, apiKey, monthlyLimit } = body

  if (!label?.trim() || !apiKey?.trim() || !monthlyLimit) {
    return NextResponse.json({ error: 'label, apiKey, and monthlyLimit are required.' }, { status: 400 })
  }
  if (monthlyLimit < 1 || monthlyLimit > 1_000_000) {
    return NextResponse.json({ error: 'Monthly limit must be between 1 and 1,000,000.' }, { status: 400 })
  }

  const ok = await addEngineKey(engineId, label.trim(), apiKey.trim(), monthlyLimit)
  if (!ok) {
    logger.error('addEngineKey API failed', { engineId })
    return NextResponse.json({ error: 'Failed to save key. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
