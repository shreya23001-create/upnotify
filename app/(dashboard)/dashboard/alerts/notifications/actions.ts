'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/db/users'
import { updateOrgAlertSettings, type AlertMode, type SeverityFloor } from '@/lib/db/alert-settings'
import { devAuditLog } from '@/lib/db/audit'
import { impersonationGuard } from '@/lib/auth/impersonation-guard'

const VALID_WINDOWS = new Set([5, 10, 30, 60])
const VALID_FLOORS: ReadonlyArray<SeverityFloor> = ['critical', 'warning', 'all']
const VALID_MODES: ReadonlyArray<AlertMode> = ['off', 'smart']

function asMode(v: FormDataEntryValue | null): AlertMode {
  return VALID_MODES.includes(v as AlertMode) ? (v as AlertMode) : 'off'
}
function asFloor(v: FormDataEntryValue | null): SeverityFloor {
  return VALID_FLOORS.includes(v as SeverityFloor) ? (v as SeverityFloor) : 'critical'
}
function asWindow(v: FormDataEntryValue | null): 5 | 10 | 30 | 60 {
  const n = Number(v)
  return VALID_WINDOWS.has(n) ? (n as 5 | 10 | 30 | 60) : 30
}

export async function saveNotificationSettingsAction(formData: FormData): Promise<void> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) redirect('/dashboard/alerts/notifications?error=' + encodeURIComponent(guard.error ?? 'blocked'))

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const mode = asMode(formData.get('mode'))
  const digest_window_minutes = asWindow(formData.get('digest_window_minutes'))
  const instant_severity_floor = asFloor(formData.get('instant_severity_floor'))

  const result = await updateOrgAlertSettings(user.org_id, {
    mode,
    digest_window_minutes,
    instant_severity_floor,
  })

  if (!result.success) {
    redirect('/dashboard/alerts/notifications?error=' + encodeURIComponent(result.error ?? 'save_failed'))
  }

  await devAuditLog({
    orgId: user.org_id,
    userId: user.id,
    action: 'alert_settings.updated',
    resourceType: 'org_alert_settings',
    resourceId: user.org_id,
    metadata: { mode, digest_window_minutes, instant_severity_floor },
  })

  revalidatePath('/dashboard/alerts/notifications')
  redirect('/dashboard/alerts/notifications?saved=1')
}
