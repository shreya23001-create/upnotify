import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { exportUserData } from '@/lib/db/gdpr'
import { writeAuditLog } from '@/lib/db/audit'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

/** GDPR data export: 1 request per hour per user. */
const EXPORT_RATE_LIMIT = {
  maxRequests: 1,
  windowMs: 60 * 60 * 1000,
} as const

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // --- Authentication ---
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // --- Rate limiting (keyed by user ID for accuracy) ---
    const rateLimit = checkRateLimit(request, EXPORT_RATE_LIMIT, `gdpr-export:${user.id}`)
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetAt - Date.now()) / 1000
      )
      return NextResponse.json(
        { error: 'Too many requests. You can export your data once per hour.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      )
    }

    // --- Extract request metadata for audit log ---
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip')?.trim() ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    // --- Perform data export ---
    const result = await exportUserData(user.id, user.org_id)

    if (!result.success) {
      logger.error('GDPR export failed', {
        userId: user.id,
        orgId: user.org_id,
        error: result.error,
      })
      return NextResponse.json(
        { error: 'Failed to export data. Please try again later.' },
        { status: 500 }
      )
    }

    // --- Audit log the export event ---
    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'user.data_exported',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      metadata: {
        monitorsCount: result.data.monitors.length,
        incidentsCount: result.data.incidents.length,
        checkResultsCount: result.data.checkResults.length,
      },
    })

    // --- Return JSON as downloadable file ---
    const jsonBody = JSON.stringify(result.data, null, 2)

    return new NextResponse(jsonBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="uptrue-data-export.json"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error('GDPR export route threw an exception', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
