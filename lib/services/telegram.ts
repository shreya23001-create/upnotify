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
interface TelegramMessageOptions {
  text: string
  inlineKeyboard?: Array<Array<{ text: string; url: string }>>
}

async function sendTelegramMessage(
  chatId: string,
  options: TelegramMessageOptions,
  botToken: string
): Promise<TelegramResult> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: options.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }

  if (options.inlineKeyboard) {
    payload.reply_markup = { inline_keyboard: options.inlineKeyboard }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    clearTimeout(timeout)

    const data = await res.json() as { ok: boolean; description?: string }

    if (!data.ok) {
      const sanitizedChatId = String(chatId).slice(-4).padStart(String(chatId).length, '*')
      logger.error('Telegram message failed', { error: data.description, chatId: sanitizedChatId, statusCode: res.status })
      return { success: false, error: data.description ?? 'Unknown Telegram error' }
    }

    logger.info('Telegram message sent', { chatId })
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

  const chatId = params.chatId?.trim() ?? ''
  if (!chatId) {
    logger.warn('Telegram chat ID missing or empty — skipping alert', { monitorName: params.monitorName })
    return { success: false, error: 'Telegram chat ID not configured' }
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

  return sendTelegramMessage(chatId, {
    text: lines.join('\n'),
    inlineKeyboard: [[{ text: '👁 View Monitor', url: params.monitorUrl }]],
  }, botToken)
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
 * Sends a blog approval request to Telegram with inline keyboard buttons for Approve / Reject.
 * URL-type inline keyboard buttons open the approval endpoint in the browser when tapped —
 * no webhook/callback_query handler required.
 */
export async function sendBlogApprovalTelegram(params: BlogApprovalTelegramParams): Promise<TelegramResult> {
  const config = getServerConfig()
  const { botToken, chatId: configChatId } = config.telegram

  if (!botToken || !configChatId) {
    logger.warn('Telegram not configured — skipping blog approval notification')
    return { success: false, error: 'Telegram credentials not configured' }
  }

  const chatId = configChatId.trim()
  if (!chatId) {
    logger.warn('Telegram chat ID is empty after trimming — skipping blog approval notification')
    return { success: false, error: 'Telegram chat ID not configured' }
  }

  const sourcesLine = params.sourcesCount > 0
    ? `📊 <b>Sources:</b> ${params.sourcesCount} found${params.hasOfficialStatus ? ' (incl. official status page)' : ''}`
    : ''

  const lines = [
    `📝 <b>Blog ready for approval</b>`,
    ``,
    `<b>${escapeHtml(params.blogTitle)}</b>`,
    `<i>${escapeHtml(params.siteDisplayName)}</i>`,
    ``,
    `<i>${escapeHtml(params.excerpt)}</i>`,
  ]

  if (sourcesLine) lines.push(``, sourcesLine)

  lines.push(``, `<i>Tap a button below — links expire in 7 days.</i>`)

  return sendTelegramMessage(chatId, {
    text: lines.join('\n'),
    inlineKeyboard: [
      [
        { text: '✅ Approve & Publish', url: params.approveUrl },
        { text: '❌ Reject',            url: params.rejectUrl  },
      ],
    ],
  }, botToken)
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
