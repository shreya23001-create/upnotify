'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createMonitor, updateMonitor, deleteMonitor, pauseMonitor, resumeMonitor, bulkDeleteMonitors, bulkUpdateMonitorStatus, getMonitorById } from '@/lib/db/monitors'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { checkMonitorLimit, getPlanLimits } from '@/lib/utils/plan-limits'
import { logger } from '@/lib/utils/logger'
import { devAuditLog } from '@/lib/db/audit'
import { impersonationGuard } from '@/lib/auth/impersonation-guard'
import { resolveIncident, getOpenIncidentForMonitor } from '@/lib/db/incidents'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'

// Types that require a URL target (need SSRF + protocol validation)
const URL_TARGET_TYPES = ['http', 'https', 'keyword', 'api', 'ssl', 'domain']

// Private IP ranges that must never be monitored (SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^169\.254\./,       // link-local
  /^metadata\./i,      // cloud metadata endpoints
]

function isSafeMonitorTarget(target: string, type: string): { safe: boolean; error?: string } {
  if (!URL_TARGET_TYPES.includes(type)) return { safe: true }

  // Auto-detect missing protocol — will be normalised below, just validate shape
  const testUrl = target.includes('://') ? target : `https://${target}`

  let parsed: URL
  try {
    parsed = new URL(testUrl)
  } catch {
    return { safe: false, error: 'Please enter a valid URL (e.g. https://example.com)' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, error: 'Only http:// and https:// URLs are supported' }
  }

  const hostname = parsed.hostname

  // Reject bare hostnames with no TLD (e.g. "notaurl", "localhost" without dot)
  if (!hostname.includes('.')) {
    return { safe: false, error: 'Please enter a valid URL (e.g. https://example.com)' }
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { safe: false, error: 'Monitor target URL is not permitted' }
    }
  }

  return { safe: true }
}

/** Normalise monitor target: prepend https:// if no protocol present */
function normaliseTarget(target: string, type: string): string {
  if (!URL_TARGET_TYPES.includes(type)) return target
  if (target && !target.includes('://')) return `https://${target}`
  return target
}

export async function createMonitorAction(formData: FormData): Promise<{ error?: string }> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) return { error: guard.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]
  if (!workspace) return { error: 'No workspace found' }

  // Check plan limits
  const [limitCheck, planLimits] = await Promise.all([
    checkMonitorLimit(user.org_id),
    getPlanLimits(user.org_id),
  ])
  if (!limitCheck.allowed) {
    return { error: `Monitor limit reached (${limitCheck.currentCount}/${limitCheck.limit}). Upgrade your plan to add more monitors.` }
  }

  // Free plan users can create monitors directly (within their plan limit)
  // No per-monitor charge — the old usage-based billing model has been removed

  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const target = formData.get('target') as string
  const intervalStr = formData.get('check_interval_seconds') as string
  const severity = formData.get('severity') as string || 'P2'

  if (!name || !type || !target) {
    return { error: 'Name, type, and target are required' }
  }

  // Normalise target (auto-prepend https:// if missing)
  const normalisedTarget = normaliseTarget(target, type)

  // SSRF + URL safety validation
  const safetyCheck = isSafeMonitorTarget(normalisedTarget, type)
  if (!safetyCheck.safe) return { error: safetyCheck.error }

  // Build type-specific config
  const config: Record<string, unknown> = {}

  if (type === 'keyword') {
    const positiveStr = formData.get('positiveKeywords') as string
    const negativeStr = formData.get('negativeKeywords') as string
    try {
      config.positiveKeywords = positiveStr ? JSON.parse(positiveStr) : []
    } catch {
      config.positiveKeywords = []
    }
    try {
      config.negativeKeywords = negativeStr ? JSON.parse(negativeStr) : []
    } catch {
      config.negativeKeywords = []
    }
    // Validate that at least one keyword is provided
    const posArr = config.positiveKeywords as string[]
    const negArr = config.negativeKeywords as string[]
    if (posArr.length === 0 && negArr.length === 0) {
      return { error: 'Please add at least one positive or negative keyword' }
    }
  }

  if (type === 'port') {
    config.port = parseInt(formData.get('port') as string || '80', 10)
  }

  if (type === 'heartbeat') {
    config.expectedIntervalSeconds = parseInt(formData.get('expectedInterval') as string || '300', 10)
  }

  if (type === 'api') {
    config.method = formData.get('method') as string || 'GET'
    const headersStr = formData.get('headers') as string
    if (headersStr) {
      try { config.headers = JSON.parse(headersStr) } catch { /* ignore */ }
    }
    config.body = formData.get('body') as string || undefined
  }

  // Enforce plan minimum check interval
  const requestedInterval = intervalStr ? parseInt(intervalStr, 10) : planLimits.checkIntervalSeconds
  const minInterval = planLimits.checkIntervalSeconds
  if (requestedInterval < minInterval) {
    return { error: `Your plan requires a minimum check interval of ${minInterval >= 60 ? `${minInterval / 60} minute${minInterval > 60 ? 's' : ''}` : `${minInterval} seconds`}. Upgrade to check more frequently.` }
  }

  const monitor = await createMonitor({
    org_id: user.org_id,
    workspace_id: workspace.id,
    name,
    type,
    target: normalisedTarget,
    check_interval_seconds: requestedInterval,
    severity,
    config,
  })

  if (!monitor) {
    return { error: 'Failed to create monitor' }
  }

  logger.info('Monitor created', { monitorId: monitor.id, name, type })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'monitor.created', resourceType: 'monitor', resourceId: monitor.id, metadata: { name, type } })
  if (type === 'wordpress') {
    redirect(`/dashboard/monitors/${monitor.id}/wordpress`)
  }
  redirect('/dashboard/monitors')
}

export async function createMonitorAfterPaymentAction(formData: FormData): Promise<{ error?: string }> {
  const guard2 = await impersonationGuard()
  if (guard2.isBlocked) return { error: guard2.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]
  if (!workspace) return { error: 'No workspace found' }

  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const target = formData.get('target') as string
  const intervalStr = formData.get('check_interval_seconds') as string
  const severity = formData.get('severity') as string || 'P2'

  if (!name || !type || !target) return { error: 'Missing monitor data' }

  const config: Record<string, unknown> = {}
  if (type === 'keyword') {
    const positiveStr = formData.get('positiveKeywords') as string
    const negativeStr = formData.get('negativeKeywords') as string
    try { config.positiveKeywords = positiveStr ? JSON.parse(positiveStr) : [] } catch { config.positiveKeywords = [] }
    try { config.negativeKeywords = negativeStr ? JSON.parse(negativeStr) : [] } catch { config.negativeKeywords = [] }
  }
  if (type === 'port') { config.port = parseInt(formData.get('port') as string || '80', 10) }
  if (type === 'heartbeat') { config.expectedIntervalSeconds = parseInt(formData.get('expectedInterval') as string || '300', 10) }
  if (type === 'api') { config.method = formData.get('method') as string || 'GET' }

  const monitor = await createMonitor({
    org_id: user.org_id, workspace_id: workspace.id, name, type, target,
    check_interval_seconds: intervalStr ? parseInt(intervalStr, 10) : 300, severity, config,
  })

  if (!monitor) return { error: 'Failed to create monitor' }
  logger.info('Monitor created after payment', { monitorId: monitor.id, name, type })
  redirect('/dashboard/monitors')
}

export async function updateMonitorAction(monitorId: string, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const guardUpdate = await impersonationGuard()
  if (guardUpdate.isBlocked) return { error: guardUpdate.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the monitor belongs to the user's org before updating
  const existing = await getMonitorById(monitorId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Monitor not found' }
  }

  const name = formData.get('name') as string
  const target = formData.get('target') as string
  const intervalStr = formData.get('check_interval_seconds') as string
  const severity = formData.get('severity') as string

  if (!name || !target) return { error: 'Name and target are required' }

  const type = formData.get('type') as string

  // Normalise + validate target URL
  const normalisedUpdateTarget = normaliseTarget(target, type)
  const updateSafetyCheck = isSafeMonitorTarget(normalisedUpdateTarget, type)
  if (!updateSafetyCheck.safe) return { error: updateSafetyCheck.error }

  const config: Record<string, unknown> = {}

  if (type === 'keyword') {
    const positiveStr = formData.get('positiveKeywords') as string
    const negativeStr = formData.get('negativeKeywords') as string
    try {
      config.positiveKeywords = positiveStr ? JSON.parse(positiveStr) : []
    } catch {
      config.positiveKeywords = []
    }
    try {
      config.negativeKeywords = negativeStr ? JSON.parse(negativeStr) : []
    } catch {
      config.negativeKeywords = []
    }
    const posArr = config.positiveKeywords as string[]
    const negArr = config.negativeKeywords as string[]
    if (posArr.length === 0 && negArr.length === 0) {
      return { error: 'Please add at least one positive or negative keyword' }
    }
  }
  if (type === 'port') {
    config.port = parseInt(formData.get('port') as string || '80', 10)
  }
  if (type === 'heartbeat') {
    config.expectedIntervalSeconds = parseInt(formData.get('expectedInterval') as string || '300', 10)
  }
  if (type === 'api') {
    config.method = formData.get('method') as string || 'GET'
    const headersStr = formData.get('headers') as string
    if (headersStr) {
      try { config.headers = JSON.parse(headersStr) } catch { /* ignore */ }
    }
    config.body = formData.get('body') as string || undefined
  }

  // Enforce plan minimum check interval on update too
  let updateInterval: number | undefined
  if (intervalStr) {
    const planLimitsForUpdate = await getPlanLimits(user.org_id)
    const requested = parseInt(intervalStr, 10)
    const minInt = planLimitsForUpdate.checkIntervalSeconds
    if (requested < minInt) {
      return { error: `Your plan requires a minimum check interval of ${minInt >= 60 ? `${minInt / 60} minute${minInt > 60 ? 's' : ''}` : `${minInt} seconds`}. Upgrade to check more frequently.` }
    }
    updateInterval = requested
  }

  const monitor = await updateMonitor(monitorId, {
    name,
    target: normalisedUpdateTarget,
    check_interval_seconds: updateInterval,
    severity: severity || undefined,
    config: Object.keys(config).length > 0 ? config : undefined,
  })

  if (!monitor) return { error: 'Failed to update monitor' }

  logger.info('Monitor updated', { monitorId })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'monitor.updated', resourceType: 'monitor', resourceId: monitorId, metadata: { name } })
  revalidatePath('/dashboard/monitors')
  return { success: true }
}

export async function deleteMonitorAction(monitorId: string): Promise<{ error?: string }> {
  const guardDelete = await impersonationGuard()
  if (guardDelete.isBlocked) return { error: guardDelete.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the monitor belongs to the user's org before deleting
  const existing = await getMonitorById(monitorId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Monitor not found' }
  }

  // Resolve any open incident before deleting — prevents orphaned incidents
  const openIncident = await getOpenIncidentForMonitor(monitorId)
  if (openIncident) {
    await resolveIncident(monitorId)
    logger.info('Auto-resolved open incident before monitor delete', { monitorId, incidentId: openIncident.id })
  }

  const success = await deleteMonitor(monitorId)
  if (!success) return { error: 'Failed to delete monitor' }
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'monitor.deleted', resourceType: 'monitor', resourceId: monitorId })
  redirect('/dashboard/monitors')
}

export async function pauseMonitorAction(monitorId: string): Promise<{ error?: string } | void> {
  const guardPause = await impersonationGuard()
  if (guardPause.isBlocked) return { error: guardPause.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the monitor belongs to the user's org before pausing
  const existing = await getMonitorById(monitorId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Monitor not found' }
  }

  // Resolve any open incident when pausing — checks will stop so incident can't auto-recover
  const openIncidentOnPause = await getOpenIncidentForMonitor(monitorId)
  if (openIncidentOnPause) {
    await resolveIncident(monitorId)
    logger.info('Auto-resolved open incident on monitor pause', { monitorId, incidentId: openIncidentOnPause.id })
  }

  await pauseMonitor(monitorId)
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'monitor.paused', resourceType: 'monitor', resourceId: monitorId })
  redirect(`/dashboard/monitors/${monitorId}`)
}

export async function resumeMonitorAction(monitorId: string): Promise<{ error?: string } | void> {
  const guardResume = await impersonationGuard()
  if (guardResume.isBlocked) return { error: guardResume.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the monitor belongs to the user's org before resuming
  const existing = await getMonitorById(monitorId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Monitor not found' }
  }

  await resumeMonitor(monitorId)
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'monitor.resumed', resourceType: 'monitor', resourceId: monitorId })
  redirect(`/dashboard/monitors/${monitorId}`)
}

export async function bulkDeleteMonitorsAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkDel = await impersonationGuard()
  if (guardBulkDel.isBlocked) return { error: guardBulkDel.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkDeleteMonitors(ids, user.org_id)
  if (!success) return { error: 'Failed to delete monitors' }

  logger.info('Bulk deleted monitors', { count: ids.length })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'monitor.bulk_deleted', metadata: { count: ids.length } })
  revalidatePath('/dashboard/monitors')
  return {}
}

export async function bulkPauseMonitorsAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkPause = await impersonationGuard()
  if (guardBulkPause.isBlocked) return { error: guardBulkPause.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateMonitorStatus(ids, user.org_id, true)
  if (!success) return { error: 'Failed to pause monitors' }

  logger.info('Bulk paused monitors', { count: ids.length })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'monitor.bulk_paused', metadata: { count: ids.length } })
  revalidatePath('/dashboard/monitors')
  return {}
}

export async function bulkResumeMonitorsAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkResume = await impersonationGuard()
  if (guardBulkResume.isBlocked) return { error: guardBulkResume.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateMonitorStatus(ids, user.org_id, false)
  if (!success) return { error: 'Failed to resume monitors' }

  logger.info('Bulk resumed monitors', { count: ids.length })
  revalidatePath('/dashboard/monitors')
  return {}
}

export interface BulkCreateItem {
  type: string
  name: string
  target: string
}

export interface BulkCreateResult {
  created: number
  skipped: number
  error?: string
}

export async function bulkCreateMonitorsAction(items: BulkCreateItem[]): Promise<BulkCreateResult> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) return { created: 0, skipped: 0, error: guard.error }

  const user = await getCurrentUser()
  if (!user) return { created: 0, skipped: 0, error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]
  if (!workspace) return { created: 0, skipped: 0, error: 'No workspace found' }

  const [limitCheck, planLimits] = await Promise.all([
    checkMonitorLimit(user.org_id),
    getPlanLimits(user.org_id),
  ])

  if (!limitCheck.allowed) {
    return { created: 0, skipped: items.length, error: `Monitor limit reached (${limitCheck.currentCount}/${limitCheck.limit}). Upgrade your plan to add more monitors.` }
  }

  const remaining = limitCheck.limit === null ? Infinity : limitCheck.limit - limitCheck.currentCount
  const toCreate = items.slice(0, remaining)
  const skipped = items.length - toCreate.length

  let created = 0
  for (const item of toCreate) {
    const normalisedTarget = normaliseTarget(item.target, item.type)
    const safetyCheck = isSafeMonitorTarget(normalisedTarget, item.type)
    if (!safetyCheck.safe) continue

    const monitor = await createMonitor({
      org_id: user.org_id,
      workspace_id: workspace.id,
      name: item.name,
      type: item.type,
      target: normalisedTarget,
      check_interval_seconds: Math.max(
        MONITOR_TYPES.find(t => t.type === item.type)?.defaultInterval ?? planLimits.checkIntervalSeconds,
        planLimits.checkIntervalSeconds
      ),
      severity: 'P2',
      config: {},
    })

    if (monitor) {
      created++
      logger.info('Bulk scan monitor created', { monitorId: monitor.id, type: item.type })
    }
  }

  await devAuditLog({
    orgId: user.org_id,
    userId: user.id,
    action: 'monitor.bulk_created',
    metadata: { created, skipped, source: 'scan' },
  })

  revalidatePath('/dashboard/monitors')
  return { created, skipped }
}
