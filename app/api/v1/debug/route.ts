import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'

// TEMPORARY DEBUG ENDPOINT — REMOVE BEFORE PRODUCTION
export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'No user found', user: null })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    is_super_admin: user.is_super_admin,
    role: user.role,
    org_id: user.org_id,
  })
}
