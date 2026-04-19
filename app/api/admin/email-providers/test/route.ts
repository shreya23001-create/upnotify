import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { getEmailProvider, updateEmailProvider } from '@/lib/db/email-providers'
import { testEmailProvider } from '@/lib/services/email'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { provider_id, test_to } = await req.json() as { provider_id?: string; test_to?: string }
  if (!provider_id || !test_to) {
    return NextResponse.json({ error: 'provider_id and test_to are required' }, { status: 400 })
  }

  const provider = await getEmailProvider(provider_id)
  if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

  const result = await testEmailProvider(provider, test_to)

  await updateEmailProvider(provider_id, {
    test_last_at: new Date().toISOString(),
    test_status: result.success ? 'ok' : 'error',
    test_error: result.success ? null : (result.error ?? 'Unknown error'),
  })

  return NextResponse.json(result)
}
