import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getRulesByOrg, createRule, updateRule, deleteRule } from '@/lib/db/pricing-rules'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rules = await getRulesByOrg(user.org_id)
  return NextResponse.json({ success: true, rules })
}

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as Record<string, unknown>

  if (!body.ruleName || !body.triggerType) {
    return NextResponse.json({ error: 'Rule name and trigger type are required' }, { status: 400 })
  }

  const rule = await createRule({
    orgId: user.org_id,
    ruleName: body.ruleName as string,
    triggerType: body.triggerType as string,
    triggerThresholdPct: Number(body.triggerThresholdPct) || 0,
    responseAction: (body.responseAction as string) || 'alert',
    responseAdjustPct: Number(body.responseAdjustPct) || 0,
    responseAdjustDirection: (body.responseAdjustDirection as string) || 'match',
    safetyMinPricePence: body.safetyMinPricePence ? Number(body.safetyMinPricePence) : undefined,
    safetyMaxPricePence: body.safetyMaxPricePence ? Number(body.safetyMaxPricePence) : undefined,
    safetyMaxChangePct: Number(body.safetyMaxChangePct) || 20,
    safetyMaxChangesPerDay: Number(body.safetyMaxChangesPerDay) || 3,
    webhookUrl: (body.webhookUrl as string) || undefined,
  })

  if (!rule) {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }

  return NextResponse.json({ success: true, rule })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { ruleId: string; updates: Record<string, unknown> }

  if (!body.ruleId) {
    return NextResponse.json({ error: 'ruleId is required' }, { status: 400 })
  }

  const success = await updateRule(body.ruleId, user.org_id, body.updates as Parameters<typeof updateRule>[2])

  return NextResponse.json({ success })
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { ruleId: string }

  if (!body.ruleId) {
    return NextResponse.json({ error: 'ruleId is required' }, { status: 400 })
  }

  const success = await deleteRule(body.ruleId, user.org_id)
  return NextResponse.json({ success })
}
