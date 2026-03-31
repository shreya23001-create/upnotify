import { logger } from '@/lib/utils/logger'

interface EmailParams {
  to: string
  subject: string
  body: string
}

export async function sendAlertEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  // TODO: Replace with Resend SDK when configured
  // import { Resend } from 'resend'
  // const resend = new Resend(getConfig().resend.apiKey)

  logger.info('Alert email sent (scaffolded)', { to: params.to, subject: params.subject })

  // For now, log and return success
  // In production, this will use Resend to actually send
  return { success: true }
}
