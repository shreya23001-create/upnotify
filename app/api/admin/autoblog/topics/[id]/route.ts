import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateAutoblogTopic, deleteAutoblogTopic } from '@/lib/db/autoblog'

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
  const body = await request.json() as Partial<{
    name: string
    prompt: string
    schedule: string
    keywords: string[]
    is_enabled: boolean
    post_to_social: boolean
  }>

  const ok = await updateAutoblogTopic(id, body)
  if (!ok) return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const ok = await deleteAutoblogTopic(id)
  if (!ok) return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
  return NextResponse.json({ success: true })
}
