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
