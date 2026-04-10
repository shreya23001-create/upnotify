import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelById } from '@/lib/db/alerts'
import { sendAlertEmail } from '@/lib/services/email'
import { sendSlackAlert } from '@/lib/services/slack'
import { sendWebhookAlert } from '@/lib/services/webhook'
import { sendTelegramAlert } from '@/lib/services/telegram'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

interface AlertChannelConfig {
  email?: string
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

    const channelConfig = channel.config as unknown as AlertChannelConfig
    const testMessage = `This is a test alert from Uptrue.\n` +
      `Channel: ${channel.name}\n` +
      `Type: ${channel.type}\n` +
      `Time: ${new Date().toISOString()}\n` +
      `If you received this, your alert channel is working correctly.`

    let result: { success: boolean; error?: string }

    switch (channel.type) {
      case 'email':
        result = await sendAlertEmail({
          to: channelConfig.email || '',
          subject: '[Test] Uptrue Alert Channel Test',
          body: testMessage,
        })
        break

      case 'slack':
        result = await sendSlackAlert({
          webhookUrl: channelConfig.slackWebhookUrl || '',
          text: testMessage,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Test Alert* — This is a test notification from Uptrue.',
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
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            summary: 'Test Alert from Uptrue',
            themeColor: '3b82f6',
            title: 'Test Alert — Uptrue',
            text: 'This is a test notification. If you received this, your Teams integration is working correctly.',
          },
        })
        break

      case 'webhook':
        result = await sendWebhookAlert({
          url: channelConfig.webhookUrl || '',
          secret: channelConfig.webhookSecret,
          payload: {
            event: 'test',
            message: 'This is a test alert from Uptrue.',
            channel: { id: channel.id, name: channel.name, type: channel.type },
            timestamp: new Date().toISOString(),
          },
        })
        break

      case 'telegram':
        result = await sendTelegramAlert({
          chatId: channelConfig.telegramChatId || '',
          monitorName: 'Test Monitor',
          monitorTarget: 'uptrue.io',
          isResolved: false,
          severity: 'P2',
          monitorUrl: 'https://uptrue.io/dashboard/alerts',
        })
        break

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
