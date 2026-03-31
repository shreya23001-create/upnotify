'use server'

import { redirect } from 'next/navigation'
import { createMonitor, updateMonitor, deleteMonitor, pauseMonitor, resumeMonitor } from '@/lib/db/monitors'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { checkMonitorLimit } from '@/lib/utils/plan-limits'
import { createMonitorChargeSession } from '@/lib/services/stripe'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

export async function createMonitorAction(formData: FormData): Promise<{ error?: string; checkoutUrl?: string; nudge?: boolean }> {
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

  // Check if on usage-based plan (no active subscription) — charge £1 via Stripe Checkout
  const subWithPlan = await getSubscriptionWithPlan(user.org_id)
  if (!subWithPlan) {
    // Usage-based plan — redirect to Stripe Checkout for £1 charge
    try {
      const config = getConfig()
      const checkoutUrl = await createMonitorChargeSession(
        user.org_id, user.email, workspace.name, config.app.url
      )
      // Store form data in session/cookie so we can create the monitor after payment
      // For now, return the checkout URL — the form will store data in localStorage
      return { checkoutUrl, nudge: limitCheck.shouldNudge }
    } catch (error) {
      logger.error('Failed to create checkout for monitor', { error: error instanceof Error ? error.message : 'Unknown' })
      return { error: 'Failed to initiate payment. Please try again.' }
    }
  }

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
  const success = await deleteMonitor(monitorId)
  if (!success) return { error: 'Failed to delete monitor' }
  redirect('/dashboard/monitors')
}

export async function pauseMonitorAction(monitorId: string): Promise<void> {
  await pauseMonitor(monitorId)
  redirect(`/dashboard/monitors/${monitorId}`)
}

export async function resumeMonitorAction(monitorId: string): Promise<void> {
  await resumeMonitor(monitorId)
  redirect(`/dashboard/monitors/${monitorId}`)
}
