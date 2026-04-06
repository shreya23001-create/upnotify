// =============================================================================
// AOE — Automated Outreach Engine
// Public endpoint: /api/v1/outreach/unsubscribe
// Called from the unsubscribe link in every AOE outreach email
// Validates HMAC signature, marks opted out, returns confirmation page
// =============================================================================

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { markOptedOut } from '@/lib/aoe/db/aoe-outreach-log'
import { markSiteOptedOut } from '@/lib/aoe/db/aoe-site-discovery'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { AOE_CONFIG } from '@/lib/aoe/config'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// HMAC signature validation
// ---------------------------------------------------------------------------

function validateSignature(messageId: string, sig: string): boolean {
  const secret = process.env.AOE_UNSUBSCRIBE_SECRET
  if (!secret) {
    logger.error('AOE: AOE_UNSUBSCRIBE_SECRET not set')
    return false
  }
  const expected = crypto.createHmac('sha256', secret).update(messageId).digest('hex')
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Confirmation HTML page
// ---------------------------------------------------------------------------

function confirmationPage(success: boolean): string {
  const { product } = AOE_CONFIG
  const message = success
    ? "You've been unsubscribed. You won't receive any more outreach emails from us."
    : "This unsubscribe link is invalid or has already been used."

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed — ${product.name}</title>
<style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 480px; margin: 80px auto; background: #fff; border-radius: 8px; padding: 40px 36px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); text-align: center; }
  .icon { font-size: 40px; margin-bottom: 16px; }
  h1 { font-size: 20px; color: #111827; margin: 0 0 12px; }
  p { font-size: 15px; color: #6b7280; line-height: 1.6; margin: 0 0 24px; }
  a { color: #3b82f6; text-decoration: none; font-size: 14px; }
</style>
</head>
<body>
<div class="container">
  <div class="icon">${success ? '✓' : '✗'}</div>
  <h1>${success ? 'Unsubscribed' : 'Invalid link'}</h1>
  <p>${message}</p>
  <a href="${product.signupUrl.replace('/signup', '')}">Visit ${product.name}</a>
</div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('id')
  const sig       = searchParams.get('sig')

  if (!messageId || !sig) {
    return new NextResponse(confirmationPage(false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!validateSignature(messageId, sig)) {
    logger.warn('AOE: invalid unsubscribe signature', { messageId })
    return new NextResponse(confirmationPage(false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Look up the domain from the outreach log
  const supabase = createAdminClient()
  const { data: logEntry } = await supabase
    .from('aoe_outreach_log')
    .select('domain, opted_out')
    .eq('resend_message_id', messageId)
    .single()

  if (!logEntry) {
    // Message ID not found — could be already cleaned up or invalid
    logger.warn('AOE: unsubscribe — message ID not found', { messageId })
    return new NextResponse(confirmationPage(false), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (logEntry.opted_out) {
    // Already opted out — show success (idempotent)
    return new NextResponse(confirmationPage(true), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Mark opted out in outreach log + discovery table
  const [logResult] = await Promise.all([
    markOptedOut(messageId),
    markSiteOptedOut(logEntry.domain),
  ])

  if (!logResult) {
    logger.error('AOE: failed to mark opted out', { messageId, domain: logEntry.domain })
    return new NextResponse(confirmationPage(false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  logger.info('AOE: domain unsubscribed', { domain: logEntry.domain, messageId })

  return new NextResponse(confirmationPage(true), {
    headers: { 'Content-Type': 'text/html' },
  })
}
