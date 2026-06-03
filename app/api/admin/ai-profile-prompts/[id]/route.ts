import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { updateProfilePrompt, deleteProfilePrompt } from '@/lib/db/ai-profile-prompts'

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

  const allowed = ['prompt_text', 'sort_order', 'is_active', 'admin_notes']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  // Trim prompt_text if present
  if (typeof update.prompt_text === 'string') {
    update.prompt_text = (update.prompt_text as string).trim()
    if (!update.prompt_text) {
      return NextResponse.json({ error: 'prompt_text cannot be empty.' }, { status: 400 })
    }
  }
  if ('admin_notes' in update && update.admin_notes === '') update.admin_notes = null

  const ok = await updateProfilePrompt(id, update)
  if (!ok) return NextResponse.json({ error: 'Failed to update prompt.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const ok = await deleteProfilePrompt(id)
  if (!ok) return NextResponse.json({ error: 'Failed to delete prompt.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
