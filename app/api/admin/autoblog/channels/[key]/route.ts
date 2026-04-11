import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toggleAutoblogChannel, updateAutoblogChannel } from '@/lib/db/autoblog'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse> {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key } = await params
  const body = await request.json() as { is_enabled?: boolean; post_to_social?: boolean }

  if (body.is_enabled !== undefined) {
    const ok = await toggleAutoblogChannel(key, body.is_enabled)
    if (!ok) return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
  }

  if (body.post_to_social !== undefined) {
    const ok = await updateAutoblogChannel(key, { post_to_social: body.post_to_social })
    if (!ok) return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
