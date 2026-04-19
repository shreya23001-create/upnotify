import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { createAdminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

const SPAM_CUTOFF_HOURS = 24

async function assertAdmin() {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) return null
  return user
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tab    = req.nextUrl.searchParams.get('tab') ?? 'inbox'
  const sort   = req.nextUrl.searchParams.get('sort') ?? 'newest'
  const page   = Math.max(0, parseInt(req.nextUrl.searchParams.get('page') ?? '0'))
  const limit  = 25

  const spamCutoff = new Date(Date.now() - SPAM_CUTOFF_HOURS * 3600000).toISOString()

  let query = db().from('contact_messages').select('*', { count: 'exact' })

  if (tab === 'inbox') {
    query = query.in('status', ['verified', 'read'])
  } else if (tab === 'spam') {
    query = query.eq('status', 'pending_verification').lt('created_at', spamCutoff)
  }
  // 'all' — no filter

  query = query.order('created_at', { ascending: sort === 'oldest' })
  query = query.range(page * limit, (page + 1) * limit - 1)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Unread count for badge
  const { count: unreadCount } = await db()
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified')

  return NextResponse.json({ messages: data ?? [], total: count ?? 0, unread: unreadCount ?? 0 })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids, action } = await req.json() as { ids?: string[]; action?: string }
  if (!ids?.length || !action) return NextResponse.json({ error: 'ids and action required' }, { status: 400 })

  if (action === 'mark_read') {
    await db().from('contact_messages').update({ status: 'read', is_read: true }).in('id', ids)
  } else if (action === 'mark_unread') {
    await db().from('contact_messages').update({ status: 'verified', is_read: false }).in('id', ids).eq('status', 'read')
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids } = await req.json() as { ids?: string[] }
  if (!ids?.length) return NextResponse.json({ error: 'ids required' }, { status: 400 })

  await db().from('contact_messages').delete().in('id', ids)
  return NextResponse.json({ success: true })
}
