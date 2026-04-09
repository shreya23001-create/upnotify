import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { deleteEngineKey } from '@/lib/db/ai-engines'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const ok = await deleteEngineKey(id)
  if (!ok) return NextResponse.json({ error: 'Failed to delete key.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
