import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { updateIncidentStatus } from '@/lib/db/incidents'
import { logger } from '@/lib/utils/logger'

const VALID_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const
type IncidentStatus = typeof VALID_STATUSES[number]

/**
 * POST /api/v1/incidents/update
 * Updates the status of an incident for the current user's org.
 * Body: { incidentId: string, status: string, resolutionNote?: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json() as {
      incidentId?: string
      status?: string
      resolutionNote?: string
    }

    const { incidentId, status, resolutionNote } = body

    if (!incidentId || typeof incidentId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid incidentId' }, { status: 400 })
    }

    if (!status || !VALID_STATUSES.includes(status as IncidentStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const success = await updateIncidentStatus(
      incidentId,
      user.org_id,
      status as IncidentStatus,
      resolutionNote
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update incident. It may not exist or you may not have access.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Incident update API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
