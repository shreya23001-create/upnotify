import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const limit = Math.min(100, Number(url.searchParams.get('limit')) || 30)
  const actionFilter = url.searchParams.get('action') || ''

  const supabase = createAdminClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (actionFilter) {
    query = query.ilike('action', `%${actionFilter}%`)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }

  // Enrich with user emails
  const logs = data ?? []
  const userIds = [...new Set(logs.map(l => l.user_id).filter((id): id is string => !!id))]
  let userMap = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds)
    userMap = new Map((users ?? []).map(u => [u.id, u.email]))
  }

  const enrichedLogs = logs.map(l => ({
    ...l,
    user_email: l.user_id ? userMap.get(l.user_id) ?? null : null,
  }))

  return NextResponse.json({ success: true, logs: enrichedLogs, total: count ?? 0 })
}
