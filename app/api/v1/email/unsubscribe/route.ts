import { NextRequest, NextResponse } from 'next/server'
import { updateEmailPreferences } from '@/lib/db/email-nurture'
import { logger } from '@/lib/utils/logger'
import { getServerConfig } from '@/lib/utils/config'
import { checkRateLimit, PUBLIC_UNSUBSCRIBE_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

/**
 * Decode the unsubscribe token to get user ID.
 * Token is base64url-encoded user UUID.
 */
function decodeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(decoded)) {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

/**
 * GET /api/v1/email/unsubscribe?token=xxx
 *
 * Token-based unsubscribe — no login required.
 * Sets all email preference categories to false.
 * Returns an HTML confirmation page.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit(request, PUBLIC_UNSUBSCRIBE_RATE_LIMIT, 'email-unsubscribe')
  if (!rate.allowed) {
    return new NextResponse(renderPage('Slow down', 'Too many requests. Please wait a minute and try again.', true), {
      status: 429,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) },
    })
  }

  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(renderPage('Invalid Link', 'This unsubscribe link is invalid or has expired.', true), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const userId = decodeToken(token)

  if (!userId) {
    return new NextResponse(renderPage('Invalid Link', 'This unsubscribe link is invalid or has expired.', true), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const updated = await updateEmailPreferences(userId, {
      product_updates: false,
      usage_digests: false,
      upgrade_tips: false,
    })

    if (!updated) {
      logger.warn('Unsubscribe failed: user not found', { userId })
      return new NextResponse(
        renderPage('Something Went Wrong', 'We could not process your unsubscribe request. Please try again or contact support.', true),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    logger.info('User unsubscribed from all emails', { userId })

    const config = getServerConfig()
    const appUrl = config.app.url

    return new NextResponse(
      renderPage(
        'Unsubscribed',
        `You've been unsubscribed from all Uptrue marketing emails. You will still receive critical alert notifications for your monitors.<br><br>You can re-enable emails anytime from your <a href="${escapeHtml(appUrl)}/dashboard/settings" style="color:#3b82f6;text-decoration:underline;">account settings</a>.`,
        false
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Unsubscribe error', { userId, error: message })
    return new NextResponse(
      renderPage('Something Went Wrong', 'We could not process your request. Please try again later.', true),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

// ---------------------------------------------------------------------------
// HTML page renderer
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderPage(title: string, message: string, isError: boolean): string {
  const iconColor = isError ? '#dc2626' : '#16a34a'
  const icon = isError ? '&#10007;' : '&#10003;'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} - Uptrue</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:480px;width:100%;margin:24px;padding:40px;background-color:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;">
  <div style="width:48px;height:48px;border-radius:50%;background-color:${iconColor};color:#ffffff;font-size:24px;line-height:48px;margin:0 auto 20px;font-weight:700;">${icon}</div>
  <h1 style="margin:0 0 12px;font-size:22px;color:#111827;font-weight:700;">${escapeHtml(title)}</h1>
  <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">${message}</p>
</div>
</body>
</html>`
}
