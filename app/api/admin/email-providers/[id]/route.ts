import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { updateEmailProvider, deleteEmailProvider } from '@/lib/db/email-providers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const ok = await updateEmailProvider(id, body)
  if (!ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const ok = await deleteEmailProvider(id)
  if (!ok) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
