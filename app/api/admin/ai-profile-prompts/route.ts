import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getAllProfilePromptsAdmin, createProfilePrompt } from '@/lib/db/ai-profile-prompts'

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const prompts = await getAllProfilePromptsAdmin()
  return NextResponse.json({ prompts })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const promptText = typeof body.prompt_text === 'string' ? body.prompt_text.trim() : ''
  if (!promptText) {
    return NextResponse.json({ error: 'prompt_text is required.' }, { status: 400 })
  }

  const prompt = await createProfilePrompt({
    prompt_text: promptText,
    sort_order:  Number(body.sort_order ?? 99),
    is_active:   Boolean(body.is_active ?? true),
    admin_notes: body.admin_notes ? String(body.admin_notes) : null,
  })

  if (!prompt) return NextResponse.json({ error: 'Failed to create prompt.' }, { status: 500 })
  return NextResponse.json({ prompt }, { status: 201 })
}
