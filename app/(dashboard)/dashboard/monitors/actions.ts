'use server'

import { redirect } from 'next/navigation'
import { createMonitor, deleteMonitor, pauseMonitor, resumeMonitor } from '@/lib/db/monitors'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { logger } from '@/lib/utils/logger'

export async function createMonitorAction(formData: FormData): Promise<{ error?: string }> {
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
