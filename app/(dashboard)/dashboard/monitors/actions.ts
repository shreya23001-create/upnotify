'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createMonitor, updateMonitor, deleteMonitor, pauseMonitor, resumeMonitor, bulkDeleteMonitors, bulkUpdateMonitorStatus, getMonitorById } from '@/lib/db/monitors'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { checkMonitorLimit } from '@/lib/utils/plan-limits'
import { logger } from '@/lib/utils/logger'
import { impersonationGuard } from '@/lib/auth/impersonation-guard'

export async function createMonitorAction(formData: FormData): Promise<{ error?: string }> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) return { error: guard.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]
  if (!workspace) return { error: 'No workspace found' }

  // Check plan limits
  const limitCheck = await checkMonitorLimit(user.org_id)
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

  // Build type-specific config
  const config: Record<string, unknown> = {}

  if (type === 'keyword') {
    config.keyword = formData.get('keyword') as string
    config.shouldExist = formData.get('shouldExist') !== 'false'
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

  const monitor = await createMonitor({
    org_id: user.org_id,
    workspace_id: workspace.id,
    name,
    type,
    target,
    check_interval_seconds: intervalStr ? parseInt(intervalStr, 10) : 300,
    severity,
    config,
  })

  if (!monitor) {
    return { error: 'Failed to create monitor' }
  }

  logger.info('Monitor created', { monitorId: monitor.id, name, type })
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
  if (type === 'keyword') { config.keyword = formData.get('keyword') as string; config.shouldExist = formData.get('shouldExist') !== 'false' }
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

export async function updateMonitorAction(monitorId: string, formData: FormData): Promise<{ error?: string }> {
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

  const config: Record<string, unknown> = {}
  const type = formData.get('type') as string

  if (type === 'keyword') {
    config.keyword = formData.get('keyword') as string
    config.shouldExist = formData.get('shouldExist') !== 'false'
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

  const monitor = await updateMonitor(monitorId, {
    name,
    target,
    check_interval_seconds: intervalStr ? parseInt(intervalStr, 10) : undefined,
    severity: severity || undefined,
    config: Object.keys(config).length > 0 ? config : undefined,
  })

  if (!monitor) return { error: 'Failed to update monitor' }

  logger.info('Monitor updated', { monitorId })
  redirect(`/dashboard/monitors/${monitorId}`)
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

  const success = await deleteMonitor(monitorId)
  if (!success) return { error: 'Failed to delete monitor' }
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

  await pauseMonitor(monitorId)
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
