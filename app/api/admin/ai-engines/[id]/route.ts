import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { updateEngine } from '@/lib/db/ai-engines'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const allowed = ['name', 'slug', 'description', 'type', 'signal_quality', 'signal_note',
                   'is_free', 'is_active', 'sort_order', 'admin_notes']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const ok = await updateEngine(id, update)
  if (!ok) return NextResponse.json({ error: 'Failed to update engine.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
