import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { enableAutoUpdate, disableAutoUpdate } from '@/lib/db/pricing-rules'
import { writeAuditLog } from '@/lib/db/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { ruleId: string }

  if (!body.ruleId) {
    return NextResponse.json({ error: 'ruleId is required' }, { status: 400 })
  }

  const success = await enableAutoUpdate(body.ruleId, user.org_id)

  if (success) {
    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'compete.auto_update_enabled',
      resourceType: 'pricing_rule',
      resourceId: body.ruleId,
    })
  }

  return NextResponse.json({ success })
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { ruleId: string }

  if (!body.ruleId) {
    return NextResponse.json({ error: 'ruleId is required' }, { status: 400 })
  }

  const success = await disableAutoUpdate(body.ruleId, user.org_id)

  if (success) {
    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'compete.auto_update_disabled',
      resourceType: 'pricing_rule',
      resourceId: body.ruleId,
    })
  }

  return NextResponse.json({ success })
}
