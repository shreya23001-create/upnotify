// =============================================================================
// Resend webhook receiver
// Handles events for both AOE outreach emails and nurture/alert emails
//
// Events handled:
//   email.opened       → markOpened (AOE)
//   email.clicked      → markClicked (AOE)
//   email.bounced      → markBounced (AOE) + flag nurture sends
//   email.complained   → markSpamComplaint (AOE) + flag nurture sends
//   email.delivered    → ignored (no action needed)
//   email.delivery_delayed → logged only
//
// Signature verification: Svix v1 HMAC-SHA256
//   Signed content: "{svix-id}.{svix-timestamp}.{raw-body}"
//   Secret: base64-decoded RESEND_WEBHOOK_SECRET (after stripping "whsec_" prefix)
//   Replay protection: timestamp must be within 5 minutes
// =============================================================================

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger } from '@/lib/utils/logger'
import {
  markOpened,
  markClicked,
  markBounced,
  markSpamComplaint,
} from '@/lib/aoe/db/aoe-outreach-log'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Resend event shapes
// ---------------------------------------------------------------------------

interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id: string
    from?: string
    to?: string[]
    subject?: string
    [key: string]: unknown
  }
}

// ---------------------------------------------------------------------------
// Svix v1 signature verification
// ---------------------------------------------------------------------------

const REPLAY_TOLERANCE_MS = 5 * 60 * 1000 // 5 minutes

function verifyResendSignature(
  rawBody: string,
  msgId: string,
  msgTimestamp: string,
  msgSignatures: string,
  secret: string
): boolean {
  // Replay protection — reject events older than 5 minutes
  const ts = parseInt(msgTimestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() - ts * 1000) > REPLAY_TOLERANCE_MS) {
    logger.warn('Resend webhook: timestamp out of tolerance', { msgTimestamp })
    return false
  }

  // Decode secret — strip "whsec_" prefix if present, then base64-decode
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  let secretBytes: Buffer
  try {
    secretBytes = Buffer.from(rawSecret, 'base64')
  } catch {
    logger.error('Resend webhook: invalid secret encoding')
    return false
  }

  // Signed content: "{msgId}.{msgTimestamp}.{rawBody}"
  const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`

  // Compute expected signature
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  // svix-signature may contain multiple signatures: "v1,<base64> v1,<base64>"
  const signatures = msgSignatures.split(' ')
  for (const sig of signatures) {
    const parts = sig.split(',')
    if (parts.length < 2) continue
    const version = parts[0]
    const value   = parts.slice(1).join(',') // handle base64 with commas (shouldn't happen, but safe)

    if (version !== 'v1') continue

    try {
      if (crypto.timingSafeEqual(Buffer.from(value, 'base64'), Buffer.from(expected, 'base64'))) {
        return true
      }
    } catch {
      continue
    }
  }

  return false
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleEvent(event: ResendWebhookEvent): Promise<void> {
  const messageId = event.data.email_id

  switch (event.type) {
    case 'email.opened':
      await markOpened(messageId)
      break

    case 'email.clicked':
      await markClicked(messageId)
      break

    case 'email.bounced':
      await markBounced(messageId)
      logger.info('Resend webhook: bounce recorded', { messageId, to: event.data.to })
      break

    case 'email.complained':
      await markSpamComplaint(messageId)
      logger.info('Resend webhook: spam complaint recorded', { messageId, to: event.data.to })
      break

    case 'email.delivery_delayed':
      logger.warn('Resend webhook: delivery delayed', {
        messageId,
        to: event.data.to,
        subject: event.data.subject,
      })
      break

    case 'email.delivered':
      // Delivery confirmation — no action needed, quota already counted on send
      break

    default:
      logger.info('Resend webhook: unhandled event type', { type: event.type })
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  // Read raw body first (required for signature verification)
  const rawBody = await request.text()

  // Verify signature if secret is configured
  if (webhookSecret) {
    const msgId        = request.headers.get('svix-id') ?? ''
    const msgTimestamp = request.headers.get('svix-timestamp') ?? ''
    const msgSignature = request.headers.get('svix-signature') ?? ''

    if (!msgId || !msgTimestamp || !msgSignature) {
      logger.warn('Resend webhook: missing svix headers')
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 })
    }

    const valid = verifyResendSignature(rawBody, msgId, msgTimestamp, msgSignature, webhookSecret)
    if (!valid) {
      logger.warn('Resend webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else {
    // In development without a secret — log warning but allow through
    logger.warn('Resend webhook: RESEND_WEBHOOK_SECRET not set — skipping signature verification')
  }

  let event: ResendWebhookEvent
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    await handleEvent(event)
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Resend webhook: handler error', { type: event.type, error: message })
    // Return 200 so Resend doesn't retry — the error is logged
    return NextResponse.json({ ok: false, error: message })
  }
}
