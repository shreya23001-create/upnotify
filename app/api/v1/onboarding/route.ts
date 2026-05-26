import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { createMonitor } from '@/lib/db/monitors'
import { checkMonitorLimit } from '@/lib/utils/plan-limits'
import { dispatchChecker } from '@/lib/services/checker'
import { writeCheckResult } from '@/lib/db/check-results'
import { updateMonitorStatus } from '@/lib/db/monitors'
import { sendWelcomeEmail } from '@/lib/services/email-nurture'
import { logger } from '@/lib/utils/logger'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from '@/lib/checkers/types'

interface MonitorRequest {
  type: string
  name: string
  target: string
}

interface OnboardingRequest {
  url: string
  monitors: MonitorRequest[]
}

interface MonitorResultItem {
  id?: string
  name: string
  type: string
  target?: string
  status: string
  responseTimeMs?: number | null
  statusCode?: number | null
  errorMessage?: string | null
  error?: string
  metadata?: Record<string, unknown> | null
}

function isValidUrl(input: string): boolean {
  try {
    const urlStr = input.startsWith('http') ? input : `https://${input}`
    const parsed = new URL(urlStr)
    return parsed.hostname.includes('.')
  } catch {
    return false
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const workspaces = await getWorkspacesByOrg(user.org_id)
    const workspace = workspaces[0]
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const body = (await request.json()) as OnboardingRequest
    const { url, monitors } = body

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 })
    }

    if (!monitors || monitors.length === 0) {
      return NextResponse.json({ error: 'At least one monitor type is required' }, { status: 400 })
    }

    if (monitors.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 monitors allowed during onboarding' }, { status: 400 })
    }

    // Check plan limits
    const limitCheck = await checkMonitorLimit(user.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: `Monitor limit reached (${limitCheck.currentCount}/${limitCheck.limit}). Upgrade your plan.`,
      }, { status: 403 })
    }

    // engineering-app#55 — was a check-once-create-many off-by-one. Lite user
    // at 1/3 monitors passed the limit check above (1 < 3), then the loop
    // below created up to 4 more, ending at 5 monitors on a 3-cap plan.
    // Compute remaining headroom once and slice the request to fit.
    // Pattern lifted from bulkCreateMonitorsAction.
    const remaining = limitCheck.limit === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, limitCheck.limit - limitCheck.currentCount)
    const toCreate = monitors.slice(0, remaining)
    const skipped = monitors.length - toCreate.length

    const results: MonitorResultItem[] = []

    for (const monitorReq of toCreate) {
      // Validate monitor type
      const allowedTypes = ['http', 'ssl', 'dns', 'keyword']
      if (!allowedTypes.includes(monitorReq.type)) {
        logger.warn('Invalid monitor type in onboarding', { type: monitorReq.type })
        continue
      }

      // Create monitor
      const monitor = await createMonitor({
        org_id: user.org_id,
        workspace_id: workspace.id,
        name: monitorReq.name,
        type: monitorReq.type,
        target: monitorReq.target,
        check_interval_seconds: 300,
        severity: 'P2',
      })

      if (!monitor) {
        logger.error('Failed to create onboarding monitor', { type: monitorReq.type })
        results.push({
          name: monitorReq.name,
          type: monitorReq.type,
          status: 'error',
          error: `Failed to create ${monitorReq.type} monitor`,
        })
        continue
      }

      // Run the first check immediately
      let checkResult: CheckerResult
      try {
        checkResult = await dispatchChecker(monitor as Monitor)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Check failed'
        logger.error('Onboarding check failed', { monitorId: monitor.id, error: errMsg })
        checkResult = { status: 'down', errorMessage: errMsg }
      }

      // Write check result to DB
      await writeCheckResult({
        org_id: user.org_id,
        monitor_id: monitor.id,
        status: checkResult.status,
        response_time_ms: checkResult.responseTimeMs,
        status_code: checkResult.statusCode,
        error_message: checkResult.errorMessage,
        metadata: checkResult.metadata as Record<string, unknown> | undefined,
      })

      // Update monitor status
      const now = new Date()
      const nextCheck = new Date(now.getTime() + 300 * 1000)
      await updateMonitorStatus(monitor.id, {
        status: checkResult.status,
        last_checked_at: now.toISOString(),
        next_check_at: nextCheck.toISOString(),
      })

      results.push({
        id: monitor.id,
        name: monitorReq.name,
        type: monitorReq.type,
        target: monitorReq.target,
        status: checkResult.status,
        responseTimeMs: checkResult.responseTimeMs ?? null,
        statusCode: checkResult.statusCode ?? null,
        errorMessage: checkResult.errorMessage ?? null,
        metadata: (checkResult.metadata as Record<string, unknown>) ?? null,
      })
    }

    logger.info('Onboarding monitors created', {
      orgId: user.org_id,
      count: results.length,
      skipped,
    })

    // Send welcome email (fire-and-forget, does not block response)
    sendWelcomeEmail(user.id, user.email, user.full_name ?? 'there').catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Failed to send welcome email during onboarding', { userId: user.id, error: errMsg })
    })

    return NextResponse.json({ success: true, monitors: results, skipped })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Onboarding API error', { error: message })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
