import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMessages, getUnreadCount, markMessageRead, markAllRead } from '@/lib/db/user-messages'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [messages, unreadCount] = await Promise.all([
    getUserMessages(user.id),
    getUnreadCount(user.id),
  ])

  return NextResponse.json({ success: true, messages, unreadCount })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { messageId?: string; markAllRead?: boolean }

  if (body.markAllRead) {
    await markAllRead(user.id)
    return NextResponse.json({ success: true })
  }

  if (body.messageId) {
    const result = await markMessageRead(body.messageId, user.id)
    return NextResponse.json({ success: result })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
