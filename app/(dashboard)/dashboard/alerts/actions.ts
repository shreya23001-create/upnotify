'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { createAlertChannel, updateAlertChannel, deleteAlertChannel, toggleAlertChannel, bulkDeleteAlertChannels, bulkUpdateAlertChannelStatus, getAlertChannelById, countAlertsForChannel, countAlertsForChannels } from '@/lib/db/alerts'
import { checkAlertChannelAccess } from '@/lib/utils/plan-limits'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { logger } from '@/lib/utils/logger'
import { devAuditLog } from '@/lib/db/audit'
import { impersonationGuard } from '@/lib/auth/impersonation-guard'

function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export async function createAlertChannelAction(formData: FormData): Promise<{ error?: string }> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) return { error: guard.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]

  const name = formData.get('name') as string
  const type = formData.get('type') as string

  if (!name || !type) return { error: 'Name and type are required' }

  // Enforce plan limits on alert channel type
  const channelAllowed = await checkAlertChannelAccess(user.org_id, type)
  if (!channelAllowed) {
    const typeLabel = type === 'slack' ? 'Slack' : type === 'teams' ? 'Teams' : type === 'webhook' ? 'Webhook' : type
    return { error: `${typeLabel} alerts are not available on your current plan. Upgrade to unlock this feature.` }
  }

  const config: Record<string, unknown> = {}

  if (type === 'email') {
    config.email = formData.get('email') as string
    if (!config.email) return { error: 'Email address is required' }
  }

  if (type === 'slack') {
    config.slackWebhookUrl = formData.get('slackWebhookUrl') as string
    config.slackChannel = formData.get('slackChannel') as string
    if (!config.slackWebhookUrl) return { error: 'Slack webhook URL is required' }
    if (!isValidWebhookUrl(config.slackWebhookUrl as string)) return { error: 'Slack webhook URL must be a valid https:// URL' }
  }

  if (type === 'teams') {
    config.teamsWebhookUrl = formData.get('teamsWebhookUrl') as string
    if (!config.teamsWebhookUrl) return { error: 'Teams webhook URL is required' }
    if (!isValidWebhookUrl(config.teamsWebhookUrl as string)) return { error: 'Teams webhook URL must be a valid https:// URL' }
  }

  if (type === 'webhook') {
    config.webhookUrl = formData.get('webhookUrl') as string
    const providedSecret = (formData.get('webhookSecret') as string | null)?.trim()
    // Always ensure a secret exists — auto-generate if the user left it blank
    config.webhookSecret = providedSecret || randomBytes(32).toString('hex')
    if (!config.webhookUrl) return { error: 'Webhook URL is required' }
    if (!isValidWebhookUrl(config.webhookUrl as string)) return { error: 'Webhook URL must be a valid http:// or https:// URL' }
  }

  if (type === 'telegram') {
    config.telegramChatId = formData.get('telegramChatId') as string
    if (!config.telegramChatId) return { error: 'Telegram Chat ID is required' }
  }

  const severityStr = formData.get('severity_filter') as string
  const severityFilter = severityStr ? severityStr.split(',') : ['P1', 'P2', 'P3', 'P4']

  const monitorIdsStr = formData.get('monitor_ids') as string | null
  const monitorIds = monitorIdsStr ? monitorIdsStr.split(',').filter(Boolean) : []

  const channel = await createAlertChannel({
    org_id: user.org_id,
    workspace_id: workspace?.id,
    type,
    name,
    config,
    severity_filter: severityFilter,
    monitor_ids: monitorIds,
  })

  if (!channel) return { error: 'Failed to create alert channel' }

  logger.info('Alert channel created', { channelId: channel.id, type, name })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'alert_channel.created', resourceType: 'alert_channel', resourceId: channel.id, metadata: { type, name } })
  redirect('/dashboard/alerts')
}

export async function updateAlertChannelAction(channelId: string, formData: FormData): Promise<{ error?: string }> {
  const guardUpdate = await impersonationGuard()
  if (guardUpdate.isBlocked) return { error: guardUpdate.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the alert channel belongs to the user's org before updating
  const existing = await getAlertChannelById(channelId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Alert channel not found' }
  }

  const name = formData.get('name') as string
  const type = formData.get('type') as string

  if (!name) return { error: 'Name is required' }

  const config: Record<string, unknown> = {}

  if (type === 'email') {
    config.email = formData.get('email') as string
  }
  if (type === 'slack') {
    config.slackWebhookUrl = formData.get('slackWebhookUrl') as string
    config.slackChannel = formData.get('slackChannel') as string
    if (config.slackWebhookUrl && !isValidWebhookUrl(config.slackWebhookUrl as string)) return { error: 'Slack webhook URL must be a valid https:// URL' }
  }
  if (type === 'teams') {
    config.teamsWebhookUrl = formData.get('teamsWebhookUrl') as string
    if (config.teamsWebhookUrl && !isValidWebhookUrl(config.teamsWebhookUrl as string)) return { error: 'Teams webhook URL must be a valid https:// URL' }
  }
  if (type === 'webhook') {
    config.webhookUrl = formData.get('webhookUrl') as string
    const existingConfig = (existing.config as Record<string, unknown> | null) ?? {}
    const updatedSecret = (formData.get('webhookSecret') as string | null)?.trim()
    // Preserve existing secret if user left field blank; auto-generate if never set
    config.webhookSecret = updatedSecret || (existingConfig.webhookSecret as string) || randomBytes(32).toString('hex')
    if (config.webhookUrl && !isValidWebhookUrl(config.webhookUrl as string)) return { error: 'Webhook URL must be a valid http:// or https:// URL' }
  }

  if (type === 'telegram') {
    config.telegramChatId = formData.get('telegramChatId') as string
  }

  const severityStr = formData.get('severity_filter') as string
  const severityFilter = severityStr ? severityStr.split(',') : ['P1', 'P2', 'P3', 'P4']

  const monitorIdsStr = formData.get('monitor_ids') as string | null
  const monitorIds = monitorIdsStr ? monitorIdsStr.split(',').filter(Boolean) : []

  const channel = await updateAlertChannel(channelId, { name, config, severity_filter: severityFilter, monitor_ids: monitorIds })
  if (!channel) return { error: 'Failed to update alert channel' }

  logger.info('Alert channel updated', { channelId })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'alert_channel.updated', resourceType: 'alert_channel', resourceId: channelId })
  redirect('/dashboard/alerts')
}

export async function deleteAlertChannelAction(channelId: string): Promise<{ error?: string; success?: boolean }> {
  const guardDel = await impersonationGuard()
  if (guardDel.isBlocked) return { error: guardDel.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the alert channel belongs to the user's org before deleting
  const existing = await getAlertChannelById(channelId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Alert channel not found' }
  }

  // engineering-app#53 — refuse delete when the channel has historical
  // delivered alerts. The FK on `alerts.channel_id` cascades, so deleting
  // would silently wipe the incident audit trail. Disable instead preserves
  // the record and is the right action for "I want this channel off but
  // keep history".
  const alertCount = await countAlertsForChannel(channelId)
  if (alertCount > 0) {
    return {
      error: `Cannot delete — "${existing.name}" has delivered ${alertCount} alert${alertCount === 1 ? '' : 's'}. Disable it instead to keep the audit trail. Contact support if you need to remove the records too.`,
    }
  }
  if (alertCount < 0) {
    return { error: 'Could not verify channel history. Please try again.' }
  }

  const success = await deleteAlertChannel(channelId)
  if (!success) return { error: 'Failed to delete alert channel' }
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'alert_channel.deleted', resourceType: 'alert_channel', resourceId: channelId })
  revalidatePath('/dashboard/alerts')
  return { success: true }
}

export async function toggleAlertChannelAction(channelId: string, enabled: boolean): Promise<{ error?: string } | void> {
  const guardToggle = await impersonationGuard()
  if (guardToggle.isBlocked) return { error: guardToggle.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the alert channel belongs to the user's org before toggling
  const existing = await getAlertChannelById(channelId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Alert channel not found' }
  }

  await toggleAlertChannel(channelId, enabled)
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: `alert_channel.${enabled ? 'enabled' : 'disabled'}`, resourceType: 'alert_channel', resourceId: channelId })
  redirect('/dashboard/alerts')
}

export async function bulkDeleteAlertChannelsAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkDel = await impersonationGuard()
  if (guardBulkDel.isBlocked) return { error: guardBulkDel.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // engineering-app#53 — same guard as single-delete. If ANY selected
  // channel has delivered alerts, refuse the whole batch and name the
  // first offender so the user can de-select or disable instead.
  const counts = await countAlertsForChannels(ids)
  const linked = Object.entries(counts).filter(([, n]) => n > 0)
  const failed = Object.entries(counts).filter(([, n]) => n < 0)
  if (failed.length > 0) {
    return { error: 'Could not verify channel history. Please try again.' }
  }
  if (linked.length > 0) {
    const totalAlerts = linked.reduce((sum, [, n]) => sum + n, 0)
    return {
      error: `Cannot delete — ${linked.length} of ${ids.length} selected channel${linked.length === 1 ? '' : 's'} have delivered ${totalAlerts} alert${totalAlerts === 1 ? '' : 's'}. Disable them instead to keep the audit trail, or remove just the channels with no history.`,
    }
  }

  const success = await bulkDeleteAlertChannels(ids, user.org_id)
  if (!success) return { error: 'Failed to delete alert channels' }

  logger.info('Bulk deleted alert channels', { count: ids.length })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'alert_channel.bulk_deleted', metadata: { count: ids.length } })
  revalidatePath('/dashboard/alerts')
  return {}
}

export async function bulkEnableAlertChannelsAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkEn = await impersonationGuard()
  if (guardBulkEn.isBlocked) return { error: guardBulkEn.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateAlertChannelStatus(ids, user.org_id, true)
  if (!success) return { error: 'Failed to enable alert channels' }

  logger.info('Bulk enabled alert channels', { count: ids.length })
  revalidatePath('/dashboard/alerts')
  return {}
}

export async function bulkDisableAlertChannelsAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkDis = await impersonationGuard()
  if (guardBulkDis.isBlocked) return { error: guardBulkDis.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateAlertChannelStatus(ids, user.org_id, false)
  if (!success) return { error: 'Failed to disable alert channels' }

  logger.info('Bulk disabled alert channels', { count: ids.length })
  revalidatePath('/dashboard/alerts')
  return {}
}
