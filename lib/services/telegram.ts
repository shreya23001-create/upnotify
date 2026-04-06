import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

interface TelegramResult {
  success: boolean
  error?: string
}

/**
 * Sends a message to the configured Telegram chat via Bot API.
 * Uses MarkdownV2 format for formatting.
 * Never throws — always returns a result.
 */
async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const config = getServerConfig()
  const { botToken, chatId } = config.telegram

  if (!botToken || !chatId) {
    logger.warn('Telegram not configured — skipping notification')
    return { success: false, error: 'Telegram credentials not configured' }
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    clearTimeout(timeout)

    const data = await res.json() as { ok: boolean; description?: string }

    if (!data.ok) {
      logger.error('Telegram message failed', { error: data.description })
      return { success: false, error: data.description ?? 'Unknown Telegram error' }
    }

    logger.info('Telegram message sent')
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Telegram send exception', { error: msg })
    return { success: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Monitor alert notification (user-facing)
// ---------------------------------------------------------------------------

interface MonitorAlertTelegramParams {
  chatId: string           // User's personal Telegram Chat ID
  monitorName: string
  monitorTarget: string
  isResolved: boolean
  severity?: string
  downtimeDuration?: string  // e.g. "4 minutes 22 seconds" — only on recovery
  monitorUrl: string
}

/**
 * Sends a monitor down/recovery alert to a user's Telegram chat.
 * Uses the Uptrue bot token but the user's own chat ID.
 */
export async function sendTelegramAlert(params: MonitorAlertTelegramParams): Promise<TelegramResult> {
  const config = getServerConfig()
  const { botToken } = config.telegram

  if (!botToken) {
    logger.warn('Telegram bot token not configured — skipping alert')
    return { success: false, error: 'Telegram bot token not configured' }
  }

  const icon = params.isResolved ? '✅' : '🔴'
  const status = params.isResolved ? 'Recovered' : 'Down'

  const lines = [
    `${icon} <b>${escapeHtml(status)}: ${escapeHtml(params.monitorName)}</b>`,
    ``,
    `<b>Target:</b> ${escapeHtml(params.monitorTarget)}`,
  ]

  if (!params.isResolved && params.severity) {
    lines.push(`<b>Severity:</b> ${escapeHtml(params.severity)}`)
  }

  if (params.isResolved && params.downtimeDuration) {
    lines.push(`<b>Downtime:</b> ${escapeHtml(params.downtimeDuration)}`)
  }

  lines.push(``)
  lines.push(`<a href="${params.monitorUrl}">View Monitor →</a>`)

  const text = lines.join('\n')

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: params.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    clearTimeout(timeout)

    const data = await res.json() as { ok: boolean; description?: string }

    if (!data.ok) {
      logger.error('Telegram alert failed', { chatId: params.chatId, error: data.description })
      return { success: false, error: data.description ?? 'Unknown Telegram error' }
    }

    logger.info('Telegram alert sent', { chatId: params.chatId, monitor: params.monitorName })
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Telegram alert exception', { error: msg })
    return { success: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Blog approval notification
// ---------------------------------------------------------------------------

interface BlogApprovalTelegramParams {
  blogTitle: string
  siteDisplayName: string
  excerpt: string
  sourcesCount: number
  hasOfficialStatus: boolean
  approveUrl: string
  rejectUrl: string
}

/**
 * Sends a blog approval request to Telegram with approve/reject links.
 */
export async function sendBlogApprovalTelegram(params: BlogApprovalTelegramParams): Promise<TelegramResult> {
  const sourcesInfo = params.sourcesCount > 0
    ? `📊 <b>Sources:</b> ${params.sourcesCount} found${params.hasOfficialStatus ? ' (incl. official status page)' : ''}\n`
    : ''

  const text = [
    `📝 <b>Blog ready for approval</b>`,
    ``,
    `<b>${escapeHtml(params.blogTitle)}</b>`,
    ``,
    `<i>${escapeHtml(params.excerpt)}</i>`,
    ``,
    sourcesInfo,
    `✅ <a href="${params.approveUrl}">Approve &amp; Publish</a>`,
    `❌ <a href="${params.rejectUrl}">Reject</a>`,
    ``,
    `<i>Links expire in 7 days.</i>`,
  ].join('\n')

  return sendTelegramMessage(text)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
