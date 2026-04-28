'use server'

import { getCurrentUser } from '@/lib/db/users'
import { createMonitor } from '@/lib/db/monitors'
import { createWpMonitor, generateWpToken } from '@/lib/db/wp-monitors'
import { checkWpMonitorLimit } from '@/lib/utils/plan-limits'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'

export async function createWordPressMonitorAction(formData: FormData): Promise<{
  monitorId?: string
  token?: string
  error?: string
}> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const limitCheck = await checkWpMonitorLimit(user.org_id)
  if (!limitCheck.allowed) {
    return {
      error: `You've used ${limitCheck.currentCount}/${limitCheck.limit} WordPress monitors on your plan. Upgrade to add more.`,
    }
  }

  const name = (formData.get('name') as string)?.trim()
  const siteUrl = (formData.get('site_url') as string)?.trim()

  if (!name) return { error: 'Monitor name is required' }
  if (!siteUrl) return { error: 'Site URL is required' }

  const normalizedUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]
  if (!workspace) return { error: 'No workspace found' }

  const monitor = await createMonitor({
    org_id: user.org_id,
    workspace_id: workspace.id,
    name,
    type: 'wordpress',
    target: normalizedUrl,
    check_interval_seconds: 7200,
    config: { site_url: normalizedUrl },
  })

  if (!monitor) return { error: 'Failed to create monitor. Please try again.' }

  const token = generateWpToken()

  const wpMonitor = await createWpMonitor({
    monitor_id: monitor.id,
    org_id: user.org_id,
    site_url: normalizedUrl,
    api_token: token,
    check_interval_minutes: 120,
  })

  if (!wpMonitor) return { error: 'Failed to create WordPress monitor record. Please try again.' }

  return { monitorId: monitor.id, token }
}
