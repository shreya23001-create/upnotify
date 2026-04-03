import { NextRequest, NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

type SimulatedStatus = 'up' | 'down' | 'degraded'

interface SimulationResponse {
  status: SimulatedStatus
  responseTimeMs: number
  statusCode: number
  checkedAt: string
}

/**
 * GET /api/v1/simulate?status=up|down|degraded
 *
 * Returns mock monitoring data for end-to-end testing.
 * Protected: only super_admin users can access.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const config = getServerConfig()

  // Verify super admin access via Authorization header (Bearer <access_token>)
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabase = createAdminClient()

  // Verify the token and get the user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // Check if user is super admin
  const adminEmails = config.admin.emails.map((e: string) => e.toLowerCase())
  const userEmail = (authUser.email ?? '').toLowerCase()
  if (!adminEmails.includes(userEmail)) {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 })
  }

  const statusParam = request.nextUrl.searchParams.get('status') ?? 'up'
  const validStatuses: SimulatedStatus[] = ['up', 'down', 'degraded']
  const status: SimulatedStatus = validStatuses.includes(statusParam as SimulatedStatus)
    ? (statusParam as SimulatedStatus)
    : 'up'

  const responseTimeMap: Record<SimulatedStatus, number> = {
    up: 85 + Math.floor(Math.random() * 60),
    degraded: 1200 + Math.floor(Math.random() * 800),
    down: 0,
  }

  const statusCodeMap: Record<SimulatedStatus, number> = {
    up: 200,
    degraded: 200,
    down: 503,
  }

  const response: SimulationResponse = {
    status,
    responseTimeMs: responseTimeMap[status],
    statusCode: statusCodeMap[status],
    checkedAt: new Date().toISOString(),
  }

  logger.info('Simulation endpoint called', { status, userEmail })

  return NextResponse.json(response)
}
