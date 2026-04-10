import { sendEmail } from '@/lib/services/email'
import { sendBlogApprovalTelegram } from '@/lib/services/telegram'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import type { SupportTicket } from '@/lib/db/support'

// ---------------------------------------------------------------------------
// Admin alert — new ticket raised
// ---------------------------------------------------------------------------

export async function alertAdminNewTicket(ticket: SupportTicket, userEmail: string): Promise<void> {
  const config = getServerConfig()
  const adminEmail = config.admin.emails[0] ?? process.env.ADMIN_EMAILS?.split(',')[0]?.trim()
  const dashboardUrl = `${config.app.url}/admin/support/${ticket.id}`

  const priorityLabel = ticket.priority.toUpperCase()
  const categoryLabel = ticket.category.replace(/_/g, ' ')

  // Email alert
  if (adminEmail) {
    await sendEmail(
      adminEmail,
      `[Support] New ${priorityLabel} ticket: ${ticket.subject}`,
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;color:#111;">
        <h2 style="margin:0 0 16px;">New Support Ticket</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:6px 12px 6px 0;color:#666;width:120px;">Subject</td><td style="padding:6px 0;font-weight:600;">${escHtml(ticket.subject)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#666;">Category</td><td style="padding:6px 0;">${escHtml(categoryLabel)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#666;">Priority</td><td style="padding:6px 0;">${priorityLabel}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#666;">From</td><td style="padding:6px 0;">${escHtml(userEmail)}</td></tr>
        </table>
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">View Ticket →</a>
      </body></html>`
    ).catch(err => logger.warn('Support ticket email alert failed', { error: String(err) }))
  }

  // Telegram alert
  const { botToken, chatId } = config.telegram
  if (botToken && chatId) {
    const text = [
      `🎫 <b>New Support Ticket</b>`,
      ``,
      `<b>${escHtml(ticket.subject)}</b>`,
      `Category: ${escHtml(categoryLabel)} · Priority: ${priorityLabel}`,
      `From: ${escHtml(userEmail)}`,
    ].join('\n')

    await sendBlogApprovalTelegram({
      blogTitle:        ticket.subject,
      siteDisplayName:  userEmail,
      excerpt:          `Category: ${categoryLabel} · Priority: ${priorityLabel}`,
      sourcesCount:     0,
      hasOfficialStatus: false,
      approveUrl:       dashboardUrl,
      rejectUrl:        dashboardUrl,
    }).catch(err => logger.warn('Support ticket Telegram alert failed', { error: String(err) }))

    // Direct message (simpler)
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🎫 View Ticket', url: dashboardUrl }]],
        },
      }),
    }).catch(err => logger.warn('Telegram direct message failed', { error: String(err) }))
  }
}

// ---------------------------------------------------------------------------
// Webhook dispatch — fires when external tool is configured via env vars
// Ready for integration: set SUPPORT_WEBHOOK_URL + SUPPORT_WEBHOOK_SECRET
// ---------------------------------------------------------------------------

export type SupportWebhookEvent =
  | 'ticket.created'
  | 'ticket.message_added'
  | 'ticket.status_changed'
  | 'ticket.closed'

export async function dispatchSupportWebhook(
  event: SupportWebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const webhookUrl = process.env.SUPPORT_WEBHOOK_URL
  if (!webhookUrl) return // Not configured — skip silently

  const secret = process.env.SUPPORT_WEBHOOK_SECRET
  const body = JSON.stringify({
    event,
    ...payload,
    timestamp: new Date().toISOString(),
  })

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (secret) {
    const crypto = await import('crypto')
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
    headers['X-Uptrue-Signature'] = `sha256=${sig}`
  }

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers,
      body,
      signal:  AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      logger.warn('Support webhook returned non-2xx', { event, status: res.status })
    }
  } catch (err) {
    logger.warn('Support webhook dispatch failed', {
      event,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
