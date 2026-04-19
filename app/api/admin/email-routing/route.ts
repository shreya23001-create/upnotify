import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { getEmailRoutings, updateEmailRouting } from '@/lib/db/email-providers'
import type { EmailType } from '@/lib/db/email-providers'

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const routings = await getEmailRoutings()
  return NextResponse.json({ routings })
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email_type, provider_id, fallback_provider_id } = await req.json() as {
    email_type?: EmailType
    provider_id?: string | null
    fallback_provider_id?: string | null
  }

  if (!email_type) return NextResponse.json({ error: 'email_type is required' }, { status: 400 })

  const ok = await updateEmailRouting(email_type, provider_id ?? null, fallback_provider_id ?? null)
  if (!ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
