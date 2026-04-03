'use server'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { deleteReport } from '@/lib/db/reports'
import { generateReport } from '@/lib/services/reports'
import { logger } from '@/lib/utils/logger'
import { impersonationGuard } from '@/lib/auth/impersonation-guard'

export async function generateReportAction(formData: FormData): Promise<{ error?: string }> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) return { error: guard.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]
  if (!workspace) return { error: 'No workspace found' }

  const type = (formData.get('type') as string) || 'on_demand'
  const reportType = (formData.get('report_type') as string) || 'uptime'
  const periodStart = formData.get('period_start') as string
  const periodEnd = formData.get('period_end') as string
  const delivery = (formData.get('delivery') as string) || 'dashboard'
  const deliveryEmails = (formData.get('delivery_emails') as string) || ''
  const deliveryWebhook = (formData.get('delivery_webhook') as string) || ''

  if (!periodStart || !periodEnd) return { error: 'Period start and end are required' }

  const report = await generateReport(
    user.org_id,
    workspace.id,
    new Date(periodStart).toISOString(),
    new Date(periodEnd).toISOString(),
    type as 'monthly' | 'custom' | 'on_demand',
    reportType as 'uptime' | 'performance' | 'incident' | 'sla'
  )

  if (!report) return { error: 'Failed to generate report. Make sure you have monitors with check data.' }

  // Handle delivery
  if (delivery === 'email' && deliveryEmails.trim()) {
    const emails = deliveryEmails.split(',').map(e => e.trim()).filter(Boolean)
    if (emails.length > 0) {
      try {
        const { sendEmail } = await import('@/lib/services/email')
        for (const email of emails) {
          await sendEmail(
            email,
            `Uptrue ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${periodStart} to ${periodEnd}`,
            `Your ${reportType} report is ready. View it at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://uptrue.io'}/dashboard/reports/${report.id}`
          )
        }
        logger.info('Report delivered via email', { reportId: report.id, recipients: emails.length })
      } catch (err) {
        logger.error('Failed to email report', { error: err instanceof Error ? err.message : 'Unknown' })
      }
    }
  } else if (delivery === 'webhook' && deliveryWebhook.trim()) {
    try {
      const payload = {
        event: 'report.generated',
        reportId: report.id,
        reportType,
        periodStart,
        periodEnd,
        orgId: user.org_id,
        generatedAt: new Date().toISOString(),
        viewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uptrue.io'}/dashboard/reports/${report.id}`,
      }
      await fetch(deliveryWebhook.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      logger.info('Report delivered via webhook', { reportId: report.id, webhook: deliveryWebhook })
    } catch (err) {
      logger.error('Failed to send report webhook', { error: err instanceof Error ? err.message : 'Unknown' })
    }
  }

  logger.info('Report generated via UI', { reportId: report.id, delivery })
  redirect(`/dashboard/reports/${report.id}`)
}

export async function deleteReportAction(reportId: string): Promise<{ error?: string }> {
  const guardDel = await impersonationGuard()
  if (guardDel.isBlocked) return { error: guardDel.error }

  const success = await deleteReport(reportId)
  if (!success) return { error: 'Failed to delete report' }
  redirect('/dashboard/reports')
}
