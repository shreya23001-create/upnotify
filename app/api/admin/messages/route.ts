import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { broadcastMessage } from '@/lib/db/user-messages'

export const dynamic = 'force-dynamic'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ isAdmin: boolean; email: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { isAdmin: false, email: '' }

  const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdminUser = adminEmails.includes(user.email.toLowerCase())

  return { isAdmin: isAdminUser, email: user.email }
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { isAdmin: admin } = await isAdmin(supabase)

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('admin_broadcasts')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 })
  }

  return NextResponse.json({ success: true, broadcasts: data ?? [] })
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { isAdmin: admin, email } = await isAdmin(supabase)

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    title: string
    body: string
    type?: string
    audience: string
    actionUrl?: string
    actionLabel?: string
  }

  if (!body.title || !body.body || !body.audience) {
    return NextResponse.json({ error: 'Title, body, and audience are required' }, { status: 400 })
  }

  const result = await broadcastMessage({
    title: body.title,
    body: body.body,
    type: (body.type ?? 'info') as 'info' | 'warning' | 'success' | 'error' | 'system',
    audience: body.audience as 'all' | 'free' | 'lite' | 'builder' | 'scale' | 'trial' | 'agency',
    sentBy: email,
    actionUrl: body.actionUrl,
    actionLabel: body.actionLabel,
  })

  return NextResponse.json({ success: true, recipientCount: result.recipientCount })
}
