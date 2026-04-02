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
  const periodStart = formData.get('period_start') as string
  const periodEnd = formData.get('period_end') as string

  if (!periodStart || !periodEnd) return { error: 'Period start and end are required' }

  const report = await generateReport(
    user.org_id,
    workspace.id,
    new Date(periodStart).toISOString(),
    new Date(periodEnd).toISOString(),
    type as 'monthly' | 'custom' | 'on_demand'
  )

  if (!report) return { error: 'Failed to generate report. Make sure you have monitors with check data.' }

  logger.info('Report generated via UI', { reportId: report.id })
  redirect(`/dashboard/reports/${report.id}`)
}

export async function deleteReportAction(reportId: string): Promise<{ error?: string }> {
  const guardDel = await impersonationGuard()
  if (guardDel.isBlocked) return { error: guardDel.error }

  const success = await deleteReport(reportId)
  if (!success) return { error: 'Failed to delete report' }
  redirect('/dashboard/reports')
}
