import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAgencyWaitlistEntries,
  getAgencyWaitlistStats,
  updateAgencyWaitlistStatus,
} from '@/lib/db/agency-waitlist'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<{ isAdmin: boolean; email: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { isAdmin: false, email: '' }

  const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return { isAdmin: adminEmails.includes(user.email.toLowerCase()), email: user.email }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { isAdmin: admin } = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'all'
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const [{ entries, total }, stats] = await Promise.all([
    getAgencyWaitlistEntries({ status, limit, offset }),
    getAgencyWaitlistStats(),
  ])

  return NextResponse.json({ success: true, entries, total, stats })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { isAdmin: admin, email } = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    entryId: string
    action: 'approve' | 'reject' | 'contact'
    notes?: string
  }

  if (!body.entryId || !body.action) {
    return NextResponse.json({ error: 'entryId and action are required' }, { status: 400 })
  }

  const statusMap: Record<string, 'approved' | 'rejected' | 'contacted'> = {
    approve: 'approved',
    reject: 'rejected',
    contact: 'contacted',
  }

  const newStatus = statusMap[body.action]
  if (!newStatus) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const success = await updateAgencyWaitlistStatus(body.entryId, newStatus, email, body.notes)

  if (!success) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
