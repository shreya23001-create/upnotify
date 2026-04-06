// =============================================================================
// AOE — Automated Outreach Engine
// Service: email-sender — AOE-specific Resend sender
// Returns message ID for open/click/bounce webhook tracking
// =============================================================================

import { Resend } from 'resend'
import { logger } from '@/lib/utils/logger'
import { AOE_CONFIG } from '../config'

export interface AoeSendResult {
  success: boolean
  messageId: string | null
  error?: string
}

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    logger.warn('AOE: RESEND_API_KEY not set — emails will not be sent')
    return null
  }
  _resend = new Resend(key)
  return _resend
}

export async function sendAoeEmail(params: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<AoeSendResult> {
  const resend = getResend()

  if (!resend) {
    return { success: false, messageId: null, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${AOE_CONFIG.sending.fromName} <${AOE_CONFIG.sending.fromEmail}>`,
      to: [params.to],
      replyTo: params.replyTo ?? AOE_CONFIG.sending.fromEmail,
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      logger.error('AOE: Resend API error', { to: params.to, error: error.message })
      return { success: false, messageId: null, error: error.message }
    }

    return { success: true, messageId: data?.id ?? null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('AOE: email send exception', { to: params.to, error: message })
    return { success: false, messageId: null, error: message }
  }
}
