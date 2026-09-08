import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getConfig } from '@/lib/utils/config'
import { getAlertCopy } from '@/lib/utils/alert-copy'
import { sendAlertEmail } from './email'
import { sendSlackAlert } from './slack'
import { sendWebhookAlert } from './webhook'
import { sendTelegramAlert } from './telegram'
import { sendUserMessage } from '@/lib/db/user-messages'
import { getOrgAlertSettings, severityAtOrAboveFloor, type OrgAlertSettings } from '@/lib/db/alert-settings'
import { hasPendingEventsForOrg, bufferEvent } from '@/lib/db/alert-buffer'
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

  // Filter channels by severity, then by monitor scope (empty/null monitor_ids = all monitors)
  const matchingChannels = channels.filter((ch: AlertChannel) => {
    const severityFilter = ch.severity_filter as string[]
    if (!severityFilter.includes(incident.severity)) return false

    const monitorIds = ch.monitor_ids as string[] | null
    if (monitorIds && monitorIds.length > 0 && !monitorIds.includes(monitor.id)) return false

    return true
  })

  if (matchingChannels.length === 0) {
    logger.info('No matching alert channels for severity/monitor scope', { severity: incident.severity, monitorId: monitor.id, orgId: incident.org_id })
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

  // Smart Digest routing — applies to EMAIL channels only. Slack/Webhook/
  // Telegram/Teams keep per-event behaviour because they have native
  // threading/batching and the email-storm problem doesn't apply.
  const orgSettings = await getOrgAlertSettings(incident.org_id)
  const emailRouting = await routeEmailEvent(orgSettings, incident.severity, incident.org_id)

  // Dispatch to each channel in parallel
  const results = await Promise.allSettled(
    matchingChannels.map(async (channel: AlertChannel) => {
      const channelConfig = channel.config as unknown as AlertChannelConfig
      let success = false
      let errorMessage: string | undefined

      try {
        switch (channel.type) {
          case 'email': {
            // Smart Digest decides whether this email goes out instantly,
            // gets buffered for the digest, or both. See routeEmailEvent.
            if (emailRouting.sendInstant) {
              const result = await sendAlertEmail({
                to: channelConfig.email || '',
                subject: copy.subject,
                body: `${copy.headline}\n\n${copy.detail}\n\nView monitor: ${monitorUrl}`,
              })
              success = result.success
              errorMessage = result.error
            } else {
              // Buffered for digest — record as 'sent' (it WILL be sent in
              // the digest); errorMessage stays empty.
              success = true
            }

            if (emailRouting.alsoBuffer) {
              await bufferEvent({
                org_id: incident.org_id,
                monitor_id: monitor.id,
                incident_id: incident.id,
                event_type: isResolved ? 'recovery' : 'open',
                severity: incident.severity,
                subject: copy.subject,
                headline: copy.headline,
                detail: copy.detail,
                monitor_name: monitor.name,
                monitor_target: monitor.target,
                monitor_type: monitor.type,
                metadata,
                instant_sent_at: emailRouting.sendInstant ? new Date().toISOString() : null,
              })
            }
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
            const teamsColor = isResolved ? 'Good' : (incident.severity === 'P1' ? 'Attention' : 'Warning')
            const result = await sendWebhookAlert({
              url: channelConfig.teamsWebhookUrl || '',
              payload: {
                type: 'message',
                attachments: [{
                  contentType: 'application/vnd.microsoft.card.adaptive',
                  content: {
                    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                    type: 'AdaptiveCard',
                    version: '1.4',
                    body: [
                      {
                        type: 'TextBlock',
                        text: copy.headline,
                        weight: 'Bolder',
                        size: 'Medium',
                        color: teamsColor,
                        wrap: true,
                      },
                      {
                        type: 'TextBlock',
                        text: copy.detail,
                        wrap: true,
                        spacing: 'Small',
                      },
                      {
                        type: 'FactSet',
                        spacing: 'Medium',
                        facts: [
                          { title: 'Severity', value: incident.severity },
                          { title: 'Target', value: monitor.target },
                          { title: 'Status', value: incident.status },
                        ],
                      },
                    ],
                    actions: [{
                      type: 'Action.OpenUrl',
                      title: 'View Monitor',
                      url: monitorUrl,
                    }],
                  },
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

// ---------------------------------------------------------------------------
// Smart Digest routing
// ---------------------------------------------------------------------------

/**
 * Decide how this incident's email should be delivered:
 *   - sendInstant=true,  alsoBuffer=false → today's per-event behaviour (mode=off)
 *   - sendInstant=true,  alsoBuffer=true  → bypasses buffer (critical floor) but
 *                                            also queues for the digest so it
 *                                            still appears in the timeline
 *   - sendInstant=true,  alsoBuffer=true  → first event in this org's window —
 *                                            sends instant + queues for digest
 *   - sendInstant=false, alsoBuffer=true  → mid-window event — queue only,
 *                                            digest will roll it up at flush
 */
async function routeEmailEvent(
  settings: OrgAlertSettings,
  severity: string,
  orgId: string
): Promise<{ sendInstant: boolean; alsoBuffer: boolean }> {
  // Mode and severity-floor decisions are pure — no DB needed.
  if (settings.mode === 'off') {
    return decideEmailRouting(settings, severity, false)
  }
  if (severityAtOrAboveFloor(severity, settings.instant_severity_floor)) {
    return decideEmailRouting(settings, severity, false)
  }
  // Only the "first in window?" branch needs a DB lookup.
  const hasPending = await hasPendingEventsForOrg(orgId)
  return decideEmailRouting(settings, severity, hasPending)
}

/**
 * Pure routing decision — DB-free for unit testing.
 *
 *   off mode:                    sendInstant=true,  alsoBuffer=false (legacy behaviour)
 *   smart, at/above floor:       sendInstant=true,  alsoBuffer=true  (still in digest for full story)
 *   smart, below floor, no pending: sendInstant=true,  alsoBuffer=true  (first event opens window)
 *   smart, below floor, pending: sendInstant=false, alsoBuffer=true  (mid-window — quiet collection)
 */
export function decideEmailRouting(
  settings: OrgAlertSettings,
  severity: string,
  hasPendingEvents: boolean
): { sendInstant: boolean; alsoBuffer: boolean } {
  if (settings.mode === 'off') {
    return { sendInstant: true, alsoBuffer: false }
  }
  if (severityAtOrAboveFloor(severity, settings.instant_severity_floor)) {
    return { sendInstant: true, alsoBuffer: true }
  }
  if (!hasPendingEvents) {
    return { sendInstant: true, alsoBuffer: true }
  }
  return { sendInstant: false, alsoBuffer: true }
}
