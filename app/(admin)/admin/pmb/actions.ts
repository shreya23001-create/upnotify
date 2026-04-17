'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  updateMonitorPmbSettings,
  updatePmbCategory,
  approvePmbRun,
  approvePmbRunsForDate,
  discardPmbRun,
  retryPmbRun,
  retryFailedRunsForDate,
} from '@/lib/db/pmb'

async function getAdminEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (!adminEmails.includes(user.email.toLowerCase())) return null
  return user.email
}

// ── Monitor settings ──────────────────────────────────────────────────────────

export async function togglePmbMonitorAction(id: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await updateMonitorPmbSettings(id, { pmb_enabled: enabled })
  if (!ok) return { success: false, error: 'Failed to update monitor' }

  logger.info('PMB: monitor toggled', { id, enabled, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function updateMonitorPmbAction(
  id: string,
  data: { pmb_category: string | null; pmb_keywords: string[]; status_page_url: string | null }
): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await updateMonitorPmbSettings(id, data)
  if (!ok) return { success: false, error: 'Failed to update monitor' }

  logger.info('PMB: monitor settings updated', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

// ── Category keywords ─────────────────────────────────────────────────────────

export async function updateCategoryKeywordsAction(
  slug: string,
  keywords: string[]
): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await updatePmbCategory(slug, { default_keywords: keywords })
  if (!ok) return { success: false, error: 'Failed to update category' }

  logger.info('PMB: category keywords updated', { slug, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

// ── Queue approval ────────────────────────────────────────────────────────────

export async function approvePmbRunAction(id: number): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await approvePmbRun(id, email)
  if (!ok) return { success: false, error: 'Failed to approve post' }

  logger.info('PMB: run approved', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function approveTodaysBatchAction(date: string): Promise<{ success: boolean; count: number; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, count: 0, error: 'Unauthorised' }

  const count = await approvePmbRunsForDate(date, email)
  logger.info('PMB: bulk approved today batch', { date, count, by: email })
  revalidatePath('/admin/pmb')
  return { success: true, count }
}

export async function discardPmbRunAction(id: number): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await discardPmbRun(id)
  if (!ok) return { success: false, error: 'Failed to discard post' }

  logger.info('PMB: run discarded', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function retryPmbRunAction(id: number): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await retryPmbRun(id)
  if (!ok) return { success: false, error: 'Failed to retry post' }

  logger.info('PMB: run retried', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function retryFailedTodayAction(date: string): Promise<{ success: boolean; count: number; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, count: 0, error: 'Unauthorised' }

  const count = await retryFailedRunsForDate(date)
  logger.info('PMB: bulk retry failed', { date, count, by: email })
  revalidatePath('/admin/pmb')
  return { success: true, count }
}
