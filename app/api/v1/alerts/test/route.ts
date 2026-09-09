import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelById } from '@/lib/db/alerts'
import { getMonitorById, getMonitorsByOrgId } from '@/lib/db/monitors'
import { sendAlertEmail } from '@/lib/services/email'
import { sendSlackAlert } from '@/lib/services/slack'
import { sendWebhookAlert } from '@/lib/services/webhook'
import { sendTelegramAlert } from '@/lib/services/telegram'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'
import { getConfig } from '@/lib/utils/config'

export const dynamic = 'force-dynamic'

interface AlertChannelConfig {
  email?: string
  emails?: string[]
  webhookUrl?: string
  slackWebhookUrl?: string
  slackChannel?: string
  webhookSecret?: string
  teamsWebhookUrl?: string
  telegramChatId?: string
}

interface TestAlertRequestBody {
  channelId: string
}

/**
 * POST /api/v1/alerts/test — Send a test notification through an alert channel.
 * Lets users verify that their alert channel is configured correctly.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'alert-test')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = (await request.json()) as TestAlertRequestBody
    const { channelId } = body

    if (!channelId || typeof channelId !== 'string') {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const channel = await getAlertChannelById(channelId)
    if (!channel) {
      return NextResponse.json({ error: 'Alert channel not found' }, { status: 404 })
    }

    // Verify the channel belongs to the user's org
    if (channel.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Alert channel not found' }, { status: 404 })
    }

    // Use a real monitor for realistic test content — prefer one this
    // channel is actually scoped to, otherwise fall back to any monitor
    // in the org. If the org has no monitors yet, fall back to placeholders.
    // The test message mirrors the monitor's real current status so it
    // doesn't falsely claim a healthy site is "down" — see engineering-app
    // report: test alerts confused users when they said "Down" for an
    // up monitor.
    const monitorIds = channel.monitor_ids as string[] | null
    let sampleMonitor: { id: string; name: string; target: string; status: string } | null = null
    if (monitorIds && monitorIds.length > 0) {
      const monitor = await getMonitorById(monitorIds[0])
      if (monitor) sampleMonitor = { id: monitor.id, name: monitor.name, target: monitor.target, status: monitor.status }
    }
    if (!sampleMonitor) {
      const orgMonitors = await getMonitorsByOrgId(user.org_id)
      if (orgMonitors.length > 0) {
        const first = await getMonitorById(orgMonitors[0].id)
        if (first) sampleMonitor = { id: first.id, name: first.name, target: first.target, status: first.status }
      }
    }
    // Only claim "Down" when the monitor is confirmed down. Anything else
    // (up, unknown/never-checked, degraded) shows as the healthy/test-passed
    // branch — a confusing false "Down" is worse than an optimistic default.
    const sampleIsUp = sampleMonitor ? sampleMonitor.status !== 'down' : true

    const channelConfig = channel.config as unknown as AlertChannelConfig
    const testMessage = `This is a test alert from Upnotify.\n` +
      `Channel: ${channel.name}\n` +
      `Type: ${channel.type}\n` +
      `Time: ${new Date().toISOString()}\n` +
      `If you received this, your alert channel is working correctly.`

    let result: { success: boolean; error?: string }

    switch (channel.type) {
      case 'email': {
        const recipients = [channelConfig.email, ...(channelConfig.emails ?? [])].filter((e): e is string => Boolean(e?.trim()))
        result = await sendAlertEmail({
          to: recipients.length > 0 ? Array.from(new Set(recipients)) : '',
          subject: '[Test] Upnotify Alert Channel Test',
          body: testMessage,
        })
        break
      }

      case 'slack':
        result = await sendSlackAlert({
          webhookUrl: channelConfig.slackWebhookUrl || '',
          text: testMessage,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Test Alert* — This is a test notification from Upnotify.',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Channel:* ${channel.name}` },
                { type: 'mrkdwn', text: `*Time:* ${new Date().toISOString()}` },
              ],
            },
            {
              type: 'context',
              elements: [
                { type: 'mrkdwn', text: 'If you received this, your Slack integration is working correctly.' },
              ],
            },
          ],
        })
        break

      case 'teams':
        result = await sendWebhookAlert({
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
                    text: 'Test Alert — Upnotify',
                    weight: 'Bolder',
                    size: 'Medium',
                    color: 'Accent',
                    wrap: true,
                  },
                  {
                    type: 'TextBlock',
                    text: 'This is a test notification. If you received this, your Teams integration is working correctly.',
                    wrap: true,
                    spacing: 'Small',
                  },
                  {
                    type: 'FactSet',
                    spacing: 'Medium',
                    facts: [
                      { title: 'Channel', value: channel.name },
                      { title: 'Time', value: new Date().toISOString() },
                    ],
                  },
                ],
              },
            }],
          },
        })
        break

      case 'webhook':
        result = await sendWebhookAlert({
          url: channelConfig.webhookUrl || '',
          secret: channelConfig.webhookSecret,
          payload: {
            event: 'test',
            message: 'This is a test alert from Upnotify.',
            channel: { id: channel.id, name: channel.name, type: channel.type },
            timestamp: new Date().toISOString(),
          },
        })
        break

      case 'telegram': {
        const config = getConfig()
        const monitorUrl = sampleMonitor
          ? `${config.app.url}/dashboard/monitors/${sampleMonitor.id}`
          : `${config.app.url}/dashboard/alerts`
        result = await sendTelegramAlert({
          chatId: channelConfig.telegramChatId || '',
          monitorName: sampleMonitor?.name ?? 'Test Monitor',
          monitorTarget: sampleMonitor?.target ?? 'example.com',
          isResolved: sampleIsUp,
          isTest: true,
          severity: 'P2',
          monitorUrl,
        })
        break
      }

      default:
        result = { success: false, error: `Unsupported channel type: ${channel.type}` }
    }

    if (!result.success) {
      logger.warn('Test alert failed', { channelId, type: channel.type, error: result.error })
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test alert. Check your channel configuration.',
      }, { status: 400 })
    }

    logger.info('Test alert sent', { channelId, type: channel.type, userId: user.id })
    return NextResponse.json({ success: true, message: 'Test alert sent successfully.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Test alert API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
