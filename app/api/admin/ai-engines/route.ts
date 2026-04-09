import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getAllEnginesAdmin } from '@/lib/db/ai-engines'

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const engines = await getAllEnginesAdmin()
  return NextResponse.json({ engines })
}
