'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAlertChannel, updateAlertChannel, deleteAlertChannel, toggleAlertChannel, bulkDeleteAlertChannels, bulkUpdateAlertChannelStatus } from '@/lib/db/alerts'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { logger } from '@/lib/utils/logger'

export async function createAlertChannelAction(formData: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]

  const name = formData.get('name') as string
  const type = formData.get('type') as string

  if (!name || !type) return { error: 'Name and type are required' }

  const config: Record<string, unknown> = {}

  if (type === 'email') {
    config.email = formData.get('email') as string
    if (!config.email) return { error: 'Email address is required' }
  }

  if (type === 'slack') {
    config.slackWebhookUrl = formData.get('slackWebhookUrl') as string
    config.slackChannel = formData.get('slackChannel') as string
    if (!config.slackWebhookUrl) return { error: 'Slack webhook URL is required' }
  }

  if (type === 'teams') {
    config.teamsWebhookUrl = formData.get('teamsWebhookUrl') as string
    if (!config.teamsWebhookUrl) return { error: 'Teams webhook URL is required' }
  }

  if (type === 'webhook') {
    config.webhookUrl = formData.get('webhookUrl') as string
    config.webhookSecret = formData.get('webhookSecret') as string
    if (!config.webhookUrl) return { error: 'Webhook URL is required' }
  }

  const severityStr = formData.get('severity_filter') as string
  const severityFilter = severityStr ? severityStr.split(',') : ['P1', 'P2', 'P3', 'P4']

  const channel = await createAlertChannel({
    org_id: user.org_id,
    workspace_id: workspace?.id,
    type,
    name,
    config,
    severity_filter: severityFilter,
  })

  if (!channel) return { error: 'Failed to create alert channel' }

  logger.info('Alert channel created', { channelId: channel.id, type, name })
  redirect('/dashboard/alerts')
}

export async function updateAlertChannelAction(channelId: string, formData: FormData): Promise<{ error?: string }> {
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
  }
  if (type === 'teams') {
    config.teamsWebhookUrl = formData.get('teamsWebhookUrl') as string
  }
  if (type === 'webhook') {
    config.webhookUrl = formData.get('webhookUrl') as string
    config.webhookSecret = formData.get('webhookSecret') as string
  }

  const severityStr = formData.get('severity_filter') as string
  const severityFilter = severityStr ? severityStr.split(',') : ['P1', 'P2', 'P3', 'P4']

  const channel = await updateAlertChannel(channelId, { name, config, severity_filter: severityFilter })
  if (!channel) return { error: 'Failed to update alert channel' }

  logger.info('Alert channel updated', { channelId })
  redirect('/dashboard/alerts')
}

export async function deleteAlertChannelAction(channelId: string): Promise<{ error?: string }> {
  const success = await deleteAlertChannel(channelId)
  if (!success) return { error: 'Failed to delete alert channel' }
  redirect('/dashboard/alerts')
}

export async function toggleAlertChannelAction(channelId: string, enabled: boolean): Promise<void> {
  await toggleAlertChannel(channelId, enabled)
  redirect('/dashboard/alerts')
}

export async function bulkDeleteAlertChannelsAction(ids: string[]): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkDeleteAlertChannels(ids, user.org_id)
  if (!success) return { error: 'Failed to delete alert channels' }

  logger.info('Bulk deleted alert channels', { count: ids.length })
  revalidatePath('/dashboard/alerts')
  return {}
}

export async function bulkEnableAlertChannelsAction(ids: string[]): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateAlertChannelStatus(ids, user.org_id, true)
  if (!success) return { error: 'Failed to enable alert channels' }

  logger.info('Bulk enabled alert channels', { count: ids.length })
  revalidatePath('/dashboard/alerts')
  return {}
}

export async function bulkDisableAlertChannelsAction(ids: string[]): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateAlertChannelStatus(ids, user.org_id, false)
  if (!success) return { error: 'Failed to disable alert channels' }

  logger.info('Bulk disabled alert channels', { count: ids.length })
  revalidatePath('/dashboard/alerts')
  return {}
}
