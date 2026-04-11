import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toggleAutoblogSource, deleteAutoblogSource } from '@/lib/db/autoblog'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json() as { is_enabled: boolean }
  const ok = await toggleAutoblogSource(id, body.is_enabled)
  if (!ok) return NextResponse.json({ error: 'Failed to update source' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const ok = await deleteAutoblogSource(id)
  if (!ok) return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  return NextResponse.json({ success: true })
}
