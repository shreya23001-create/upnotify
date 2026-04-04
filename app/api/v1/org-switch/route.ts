import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json() as { targetOrgId: string }

  if (!body.targetOrgId) {
    return NextResponse.json({ error: 'targetOrgId is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get current user data
  const { data: userData } = await admin
    .from('users')
    .select('id, org_id, original_org_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify the target org is either their original org or current org
  const allowedOrgs = [userData.org_id, userData.original_org_id].filter(Boolean)
  if (!allowedOrgs.includes(body.targetOrgId)) {
    return NextResponse.json({ error: 'You do not have access to this organisation' }, { status: 403 })
  }

  // Get default workspace for target org
  const { data: workspace } = await admin
    .from('workspaces')
    .select('id')
    .eq('org_id', body.targetOrgId)
    .limit(1)
    .single()

  // Switch the user
  const { error } = await admin
    .from('users')
    .update({
      org_id: body.targetOrgId,
      workspace_id: workspace?.id ?? null,
    })
    .eq('id', user.id)

  if (error) {
    logger.error('Org switch failed', { userId: user.id, error: error.message })
    return NextResponse.json({ error: 'Failed to switch organisation' }, { status: 500 })
  }

  logger.info('User switched organisation', { userId: user.id, from: userData.org_id, to: body.targetOrgId })

  return NextResponse.json({ success: true })
}
