import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/db/api-keys'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMonitor } from '@/lib/db/monitors'
import { checkMonitorLimit, getPlanLimits, hasGrandfatheredBaseSubscription, checkWebsiteSubscriptionActive } from '@/lib/utils/plan-limits'
import { targetToWebsiteDomain } from '@/lib/utils/validate-domain'
import { writeAuditLog } from '@/lib/db/audit'
import { logger } from '@/lib/utils/logger'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'

export const dynamic = 'force-dynamic'

const VALID_TYPES = MONITOR_TYPES.map(t => t.type)
const VALID_SEVERITIES = ['P1', 'P2', 'P3', 'P4']

// Private IP ranges — SSRF protection (mirrors actions.ts)
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^169\.254\./,
  /^metadata\./i,
]

const URL_TARGET_TYPES = ['http', 'https', 'keyword', 'api', 'ssl', 'domain', 'robots-txt',
  'security-headers', 'response-time', 'sitemap', 'redirect-chain', 'page-size', 'cookie-consent']

function isSafeTarget(target: string, type: string): { safe: boolean; error?: string } {
  if (!URL_TARGET_TYPES.includes(type)) return { safe: true }
  const testUrl = target.includes('://') ? target : `https://${target}`
  let parsed: URL
  try {
    parsed = new URL(testUrl)
  } catch {
    return { safe: false, error: 'Invalid URL — must be a valid http(s) address' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, error: 'Only http:// and https:// URLs are supported' }
  }
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(parsed.hostname)) {
      return { safe: false, error: 'Monitor target URL is not permitted' }
    }
  }
  if (!parsed.hostname.includes('.')) {
    return { safe: false, error: 'Please enter a valid URL (e.g. https://example.com)' }
  }
  return { safe: true }
}

function normaliseTarget(target: string, type: string): string {
  if (!URL_TARGET_TYPES.includes(type)) return target
  if (target && !target.includes('://')) return `https://${target}`
  return target
}

/**
 * GET /api/v1/monitors
 * List all monitors for the authenticated org.
 * Requires: Authorization: Bearer <api-key>
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const rawKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!rawKey) return NextResponse.json({ error: 'Missing API key. Use Authorization: Bearer <key>' }, { status: 401 })

  const apiKey = await validateApiKey(rawKey)
  if (!apiKey) return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: monitors, error } = await supabase
    .from('monitors')
    .select('id, name, type, target, status, check_interval_seconds, severity, created_at, last_checked_at')
    .eq('org_id', apiKey.org_id)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('GET /api/v1/monitors failed', { orgId: apiKey.org_id, error: error.message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ monitors: monitors ?? [], count: monitors?.length ?? 0 })
}

/**
 * POST /api/v1/monitors
 * Create a new monitor.
 * Requires: Authorization: Bearer <api-key>
 * Body: { name, type, target, check_interval_seconds?, severity? }
 *
 * Enforces:
 * - API access plan gate (hasApiAccess) — Free plan: 403
 * - Monitor count limit (checkMonitorLimit) — over limit: 403
 * - SSRF protection on target URL
 */
export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const rawKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!rawKey) return NextResponse.json({ error: 'Missing API key. Use Authorization: Bearer <key>' }, { status: 401 })

  const apiKey = await validateApiKey(rawKey)
  if (!apiKey) return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })

  const { org_id: orgId } = apiKey

  // Plan gate: API access is a paid feature
  const planLimits = await getPlanLimits(orgId)
  if (!planLimits.hasApiAccess) {
    return NextResponse.json(
      { error: 'API access is not available on your current plan. Upgrade to use the REST API.' },
      { status: 403 }
    )
  }

  // Grandfathered orgs (existing Pre Plan/Pro Plan subscribers) keep the old
  // org-wide monitor-count limit. hasApiAccess is false in the newer
  // per-website ₹149/year model, so in practice only grandfathered orgs
  // reach this far — checked explicitly anyway for correctness.
  const isGrandfathered = await hasGrandfatheredBaseSubscription(orgId)
  if (isGrandfathered) {
    const limitCheck = await checkMonitorLimit(orgId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Monitor limit reached (${limitCheck.currentCount}/${limitCheck.limit}). Upgrade your plan to add more monitors.` },
        { status: 403 }
      )
    }
  }

  // Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const { name, type, target, check_interval_seconds, severity } = body as {
    name?: unknown; type?: unknown; target?: unknown
    check_interval_seconds?: unknown; severity?: unknown
  }

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!type || typeof type !== 'string' || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }
  if (!target || typeof target !== 'string' || target.trim().length === 0) {
    return NextResponse.json({ error: 'target is required' }, { status: 400 })
  }

  // Validate interval
  const interval = check_interval_seconds !== undefined ? Number(check_interval_seconds) : planLimits.checkIntervalSeconds
  if (isNaN(interval) || interval < planLimits.checkIntervalSeconds) {
    return NextResponse.json(
      { error: `check_interval_seconds must be >= ${planLimits.checkIntervalSeconds} for your plan` },
      { status: 400 }
    )
  }

  // Validate severity
  const sev = severity !== undefined ? String(severity) : 'P2'
  if (!VALID_SEVERITIES.includes(sev)) {
    return NextResponse.json({ error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` }, { status: 400 })
  }

  // SSRF validation
  const normalisedTarget = normaliseTarget(target.trim(), type)
  const safetyCheck = isSafeTarget(normalisedTarget, type)
  if (!safetyCheck.safe) {
    return NextResponse.json({ error: safetyCheck.error }, { status: 400 })
  }

  const targetDomain = targetToWebsiteDomain(normalisedTarget)

  if (!isGrandfathered) {
    const websiteActive = await checkWebsiteSubscriptionActive(orgId, targetDomain)
    if (!websiteActive) {
      return NextResponse.json(
        { error: `This website isn't paid for yet. Add a ₹149/year plan for ${targetDomain} to start monitoring it.` },
        { status: 403 }
      )
    }
  }

  // Get workspace (use first workspace for the org)
  const supabase = createAdminClient()
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', orgId)
    .limit(1)

  const workspace = workspaces?.[0]
  if (!workspace) {
    return NextResponse.json({ error: 'No workspace found for this organisation' }, { status: 500 })
  }

  // Create the monitor
  const monitor = await createMonitor({
    org_id: orgId,
    workspace_id: workspace.id,
    name: name.trim(),
    type,
    target: normalisedTarget,
    target_domain: targetDomain,
    check_interval_seconds: interval,
    severity: sev,
  })

  if (!monitor) {
    return NextResponse.json({ error: 'Failed to create monitor' }, { status: 500 })
  }

  await writeAuditLog({
    orgId,
    userId: null,
    action: 'monitor.created_via_api',
    resourceType: 'monitor',
    resourceId: monitor.id,
    metadata: { name: monitor.name, type: monitor.type, apiKeyId: apiKey.id },
  })

  logger.info('Monitor created via REST API', { orgId, monitorId: monitor.id, name: monitor.name })

  return NextResponse.json({ monitor }, { status: 201 })
}
