import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getAllEnginesAdmin, createEngine } from '@/lib/db/ai-engines'

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const engines = await getAllEnginesAdmin()
  return NextResponse.json({ engines })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { name, slug, description, type, signal_quality, signal_note, is_free, is_active, sort_order, admin_notes, model_id } = body

  if (!name || !slug || !type || !signal_quality) {
    return NextResponse.json({ error: 'name, slug, type, and signal_quality are required.' }, { status: 400 })
  }

  const engine = await createEngine({
    name:           String(name),
    slug:           String(slug),
    description:    String(description ?? ''),
    logo_url:       null,
    type:           type as 'llms_txt' | 'citation' | 'both',
    signal_quality: signal_quality as 'high' | 'medium' | 'indicative',
    signal_note:    String(signal_note ?? ''),
    is_free:        Boolean(is_free),
    is_active:      Boolean(is_active ?? true),
    sort_order:     Number(sort_order ?? 99),
    admin_notes:    admin_notes ? String(admin_notes) : null,
    model_id:       model_id ? String(model_id) : null,
  })

  if (!engine) return NextResponse.json({ error: 'Failed to create engine.' }, { status: 500 })
  return NextResponse.json({ engine }, { status: 201 })
}
