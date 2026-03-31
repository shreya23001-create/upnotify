import { logger } from '@/lib/utils/logger'

interface SlackParams {
  webhookUrl: string
  text: string
  blocks?: Array<Record<string, unknown>>
}

export async function sendSlackAlert(params: SlackParams): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text,
        ...(params.blocks && { blocks: params.blocks }),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Slack alert failed', { error, status: response.status })
      return { success: false, error: `Slack returned ${response.status}: ${error}` }
    }

    logger.info('Slack alert sent', { webhookUrl: params.webhookUrl.slice(0, 40) + '...' })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Slack alert exception', { error: message })
    return { success: false, error: message }
  }
}
