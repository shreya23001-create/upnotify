import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getConfig } from '@/lib/utils/config'
import { sendAlertEmail } from './email'
import { sendSlackAlert } from './slack'
import { sendWebhookAlert } from './webhook'
import { sendUserMessage } from '@/lib/db/user-messages'
import type { Incident, Monitor, AlertChannel } from '@/lib/types'

interface AlertChannelConfig {
  email?: string
  webhookUrl?: string
  slackWebhookUrl?: string
  slackChannel?: string
  webhookSecret?: string
  teamsWebhookUrl?: string
}

interface KeywordMonitorConfig {
  positiveKeywords?: string[]
  negativeKeywords?: string[]
  keyword?: string
  shouldExist?: boolean
}

/**
 * Builds keyword-specific context for alert messages.
 * Returns a string like: "Missing: 'Place Order', 'Secure Payment'. Found: 'error'"
 * Returns empty string for non-keyword monitors.
 */
function buildKeywordAlertContext(monitor: Monitor): string {
  if (monitor.type !== 'keyword') return ''

  const monitorConfig = monitor.config as KeywordMonitorConfig | undefined
  if (!monitorConfig) return ''

  const parts: string[] = []

  // Resolve positive keywords (backward compat)
  let positiveKeywords: string[] = []
  if (Array.isArray(monitorConfig.positiveKeywords) && monitorConfig.positiveKeywords.length > 0) {
    positiveKeywords = monitorConfig.positiveKeywords
  } else if (monitorConfig.keyword && monitorConfig.shouldExist !== false) {
    positiveKeywords = [monitorConfig.keyword]
  }

  // Resolve negative keywords (backward compat)
  let negativeKeywords: string[] = []
  if (Array.isArray(monitorConfig.negativeKeywords) && monitorConfig.negativeKeywords.length > 0) {
    negativeKeywords = monitorConfig.negativeKeywords
  } else if (monitorConfig.keyword && monitorConfig.shouldExist === false) {
    negativeKeywords = [monitorConfig.keyword]
  }

  if (positiveKeywords.length > 0) {
    parts.push(`Watching for: ${positiveKeywords.map(k => `'${k}'`).join(', ')}`)
  }
  if (negativeKeywords.length > 0) {
    parts.push(`Blocking: ${negativeKeywords.map(k => `'${k}'`).join(', ')}`)
  }

  return parts.join('. ')
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

  // Build keyword-specific context for the alert message
  const keywordContext = buildKeywordAlertContext(monitor)

  // Dispatch to each channel in parallel
  const results = await Promise.allSettled(
    matchingChannels.map(async (channel: AlertChannel) => {
      const channelConfig = channel.config as unknown as AlertChannelConfig
      let success = false
      let errorMessage: string | undefined

      const isResolved = incident.status === 'resolved'
      const alertMessage = `${isResolved ? 'Recovered' : 'Alert'}: ${monitor.name} is ${isResolved ? 'back up' : 'down'}!\n` +
        `Severity: ${incident.severity}\n` +
        `Status: ${incident.status}\n` +
        `Target: ${monitor.target}\n` +
        (keywordContext ? `${keywordContext}\n` : '') +
        `Time: ${new Date().toISOString()}\n` +
        `Details: ${monitorUrl}`

      try {
        switch (channel.type) {
          case 'email': {
            const result = await sendAlertEmail({
              to: channelConfig.email || '',
              subject: `[${incident.severity}] ${monitor.name} is ${isResolved ? 'up' : 'down'}`,
              body: alertMessage,
            })
            success = result.success
            errorMessage = result.error
            break
          }

          case 'slack': {
            const result = await sendSlackAlert({
              webhookUrl: channelConfig.slackWebhookUrl || '',
              text: alertMessage,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*${isResolved ? 'Recovered' : 'Down'}* — *${monitor.name}* is *${isResolved ? 'back up' : 'down'}*`,
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
                summary: `${monitor.name} is ${isResolved ? 'up' : 'down'}`,
                themeColor: isResolved ? '00FF00' : 'FF0000',
                title: `${isResolved ? 'Recovered' : 'Down'} — ${monitor.name} is ${isResolved ? 'back up' : 'down'}`,
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
        title: isResolved
          ? `Recovered: ${monitor.name} is back up`
          : `Down: ${monitor.name} is not responding`,
        body: isResolved
          ? `${monitor.name} (${monitor.target}) has recovered and is back online.`
          : `${monitor.name} (${monitor.target}) is down. Severity: ${incident.severity}. Check your dashboard for details.`,
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
