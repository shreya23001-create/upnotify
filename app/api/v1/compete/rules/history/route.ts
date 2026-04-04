import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getRuleExecutions } from '@/lib/db/pricing-rules'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const executions = await getRuleExecutions(user.org_id)
  return NextResponse.json({ success: true, executions })
}
