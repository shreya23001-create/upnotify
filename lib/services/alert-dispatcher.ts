import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getConfig } from '@/lib/utils/config'
import { getAlertCopy } from '@/lib/utils/alert-copy'
import { sendAlertEmail } from './email'
import { sendSlackAlert } from './slack'
import { sendWebhookAlert } from './webhook'
import { sendTelegramAlert } from './telegram'
import { sendUserMessage } from '@/lib/db/user-messages'
import type { Incident, Monitor, AlertChannel } from '@/lib/types'

interface AlertChannelConfig {
  email?: string
  webhookUrl?: string
  slackWebhookUrl?: string
  slackChannel?: string
  webhookSecret?: string
  teamsWebhookUrl?: string
  telegramChatId?: string
}


export async function dispatchAlerts(incident: Incident, monitor: Monitor): Promise<void> {
  const supabase = createAdminClient()

  // Get all enabled alert channels for this org
  const { data: channels, error } = await supabase
    .from('alert_channels')
    .select('*')
    .eq('org_id', incident.org_id)
    .eq('is_enabled', true)

  if (error || !channels) {
    logger.error('Failed to fetch alert channels', { error: error?.message })
    return
  }

  // Filter channels by severity
  const matchingChannels = channels.filter((ch: AlertChannel) => {
    const severityFilter = ch.severity_filter as string[]
    return severityFilter.includes(incident.severity)
  })

  if (matchingChannels.length === 0) {
    logger.info('No matching alert channels for severity', { severity: incident.severity, orgId: incident.org_id })
    return
  }

  const config = getConfig()
  const monitorUrl = `${config.app.url}/dashboard/monitors/${monitor.id}`

  const isResolved = incident.status === 'resolved'
  const metadata = (incident as Record<string, unknown>).metadata as Record<string, unknown> | undefined ?? {}
  const copy = getAlertCopy(monitor, incident, {
    variant: isResolved ? 'recovery' : 'alert',
    metadata,
  })

  // Dispatch to each channel in parallel
  const results = await Promise.allSettled(
    matchingChannels.map(async (channel: AlertChannel) => {
      const channelConfig = channel.config as unknown as AlertChannelConfig
      let success = false
      let errorMessage: string | undefined

      try {
        switch (channel.type) {
          case 'email': {
            const result = await sendAlertEmail({
              to: channelConfig.email || '',
              subject: copy.subject,
              body: `${copy.headline}\n\n${copy.detail}\n\nView monitor: ${monitorUrl}`,
            })
            success = result.success
            errorMessage = result.error
            break
          }

          case 'slack': {
            const result = await sendSlackAlert({
              webhookUrl: channelConfig.slackWebhookUrl || '',
              text: copy.shortText,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*${copy.headline}*\n${copy.detail}`,
                  },
                },
                {
                  type: 'section',
                  fields: [
                    { type: 'mrkdwn', text: `*Severity:* ${incident.severity}` },
                    { type: 'mrkdwn', text: `*Target:* ${monitor.target}` },
                    { type: 'mrkdwn', text: `*Status:* ${incident.status}` },
                    { type: 'mrkdwn', text: `*Time:* ${new Date().toISOString()}` },
                  ],
                },
                {
                  type: 'actions',
                  elements: [
                    {
                      type: 'button',
                      text: { type: 'plain_text', text: 'View Monitor' },
                      url: monitorUrl,
                    },
                  ],
                },
              ],
            })
            success = result.success
            errorMessage = result.error
            break
          }

          case 'teams': {
            const result = await sendWebhookAlert({
              url: channelConfig.teamsWebhookUrl || '',
              payload: {
                '@type': 'MessageCard',
                '@context': 'http://schema.org/extensions',
                summary: copy.subject,
                themeColor: isResolved ? '00FF00' : 'FF0000',
                title: copy.headline,
                text: copy.detail,
                sections: [{
                  facts: [
                    { name: 'Severity', value: incident.severity },
                    { name: 'Target', value: monitor.target },
                    { name: 'Status', value: incident.status },
                  ],
                }],
                potentialAction: [{
                  '@type': 'OpenUri',
                  name: 'View Monitor',
                  targets: [{ os: 'default', uri: monitorUrl }],
                }],
              },
            })
            success = result.success
            errorMessage = result.error
            break
          }

          case 'webhook': {
            const result = await sendWebhookAlert({
              url: channelConfig.webhookUrl || '',
              secret: channelConfig.webhookSecret,
              payload: {
                event: isResolved ? 'incident.resolved' : 'incident.created',
                incident: {
                  id: incident.id,
                  title: incident.title,
                  status: incident.status,
                  severity: incident.severity,
                  started_at: incident.started_at,
                  resolved_at: incident.resolved_at,
                },
                monitor: {
                  id: monitor.id,
                  name: monitor.name,
                  type: monitor.type,
                  target: monitor.target,
                },
                timestamp: new Date().toISOString(),
              },
            })
            success = result.success
            errorMessage = result.error
            break
          }

          case 'telegram': {
            const result = await sendTelegramAlert({
              chatId: channelConfig.telegramChatId || '',
              monitorName: monitor.name,
              monitorTarget: monitor.target,
              isResolved,
              severity: incident.severity,
              monitorUrl,
            })
            success = result.success
            errorMessage = result.error
            break
          }

          default:
            logger.warn('Unsupported alert channel type', { type: channel.type })
            errorMessage = `Unsupported channel type: ${channel.type}`
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unknown dispatch error'
        logger.error('Alert dispatch exception', { channelId: channel.id, error: errorMessage })
      }

      // Record the alert in DB
      await supabase.from('alerts').insert({
        org_id: incident.org_id,
        incident_id: incident.id,
        channel_id: channel.id,
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        error_message: errorMessage || null,
      })

      logger.info('Alert dispatched', { channelId: channel.id, type: channel.type, success })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  logger.info('Alert dispatch complete', { total: results.length, sent, failed, incidentId: incident.id })

  // Consequence: send in-app message to org owner (always, regardless of channels)
  try {
    const isResolved = incident.status === 'resolved'
    const { data: owner } = await supabase
      .from('users')
      .select('id')
      .eq('org_id', incident.org_id)
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (owner) {
      await sendUserMessage({
        userId: owner.id,
        orgId: incident.org_id,
        title: copy.headline,
        body: copy.detail,
        type: isResolved ? 'success' : 'error',
        category: 'system',
        actionUrl: `/dashboard/monitors/${monitor.id}`,
        actionLabel: 'View Monitor',
      })
    }
  } catch {
    // Don't fail the alert flow if in-app message fails
  }
}

export async function dispatchRecoveryAlerts(incident: Incident, monitor: Monitor): Promise<void> {
  // Reuse the same dispatcher — the message formatting handles resolved state
  await dispatchAlerts(incident, monitor)
}
