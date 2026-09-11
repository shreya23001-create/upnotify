import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { getEmailProviders, createEmailProvider } from '@/lib/db/email-providers'
import type { EmailProviderType } from '@/lib/db/email-providers'

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const providers = await getEmailProviders()
  return NextResponse.json({ providers })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as {
    name?: string
    type?: EmailProviderType
    config?: Record<string, unknown>
    from_email?: string
    from_name?: string
    is_active?: boolean
  }

  if (!body.name || !body.type || !body.from_email) {
    return NextResponse.json({ error: 'name, type, and from_email are required' }, { status: 400 })
  }

  const provider = await createEmailProvider({
    name: body.name,
    type: body.type,
    config: body.config ?? {},
    from_email: body.from_email,
    from_name: body.from_name ?? 'Upnotify',
    is_active: body.is_active ?? true,
  })

  if (!provider) return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
  return NextResponse.json({ provider }, { status: 201 })
}
