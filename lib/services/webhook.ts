import crypto from 'crypto'
import { logger } from '@/lib/utils/logger'

interface WebhookParams {
  url: string
  payload: Record<string, unknown>
  secret?: string
}

export async function sendWebhookAlert(params: WebhookParams): Promise<{ success: boolean; error?: string }> {
  try {
    const body = JSON.stringify(params.payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Uptrue-Webhook/1.0',
    }

    if (params.secret) {
      const signature = crypto.createHmac('sha256', params.secret).update(body).digest('hex')
      headers['X-Uptrue-Signature'] = `sha256=${signature}`
    }

    const response = await fetch(params.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Webhook alert failed', { url: params.url, status: response.status, error })
      return { success: false, error: `Webhook returned ${response.status}` }
    }

    logger.info('Webhook alert sent', { url: params.url })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Webhook alert exception', { error: message })
    return { success: false, error: message }
  }
}
