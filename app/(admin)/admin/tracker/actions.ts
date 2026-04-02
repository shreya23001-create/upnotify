'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/db/users'
import {
  createPublicMonitor,
  updatePublicMonitor,
  deletePublicMonitor,
  togglePublicMonitor,
} from '@/lib/db/public-monitors'
import { logger } from '@/lib/utils/logger'

interface ActionResult {
  success: boolean
  error?: string
}

/** Add a new site to the public tracker */
export async function addTrackedSiteAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const domain = (formData.get('domain') as string)?.trim()
  const displayName = (formData.get('display_name') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || 'Other'

  if (!domain) return { success: false, error: 'Domain is required' }
  if (!displayName) return { success: false, error: 'Display name is required' }

  // Basic domain validation — no protocol, no spaces
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .toLowerCase()

  if (cleanDomain.includes(' ') || !cleanDomain.includes('.')) {
    return { success: false, error: 'Invalid domain format' }
  }

  const result = await createPublicMonitor({
    domain: cleanDomain,
    display_name: displayName,
    category,
  })

  if (!result) {
    return { success: false, error: 'Failed to add site. It may already exist.' }
  }

  logger.info('Admin: Public tracker site added', { domain: cleanDomain, displayName })
  revalidatePath('/admin/tracker')
  revalidatePath('/tracker')
  return { success: true }
}

/** Update an existing tracked site */
export async function updateTrackedSiteAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const id = formData.get('id') as string
  if (!id) return { success: false, error: 'Site ID is required' }

  const updates: { domain?: string; display_name?: string; category?: string } = {}

  const domain = (formData.get('domain') as string)?.trim()
  if (domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
    if (cleanDomain.includes(' ') || !cleanDomain.includes('.')) {
      return { success: false, error: 'Invalid domain format' }
    }
    updates.domain = cleanDomain
  }

  const displayName = (formData.get('display_name') as string)?.trim()
  if (displayName) updates.display_name = displayName

  const category = (formData.get('category') as string)?.trim()
  if (category) updates.category = category

  const result = await updatePublicMonitor(id, updates)
  if (!result) return { success: false, error: 'Failed to update site' }

  logger.info('Admin: Public tracker site updated', { id })
  revalidatePath('/admin/tracker')
  revalidatePath('/tracker')
  return { success: true }
}

/** Toggle a tracked site active/inactive */
export async function toggleTrackedSiteAction(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const result = await togglePublicMonitor(id, isActive)
  if (!result) return { success: false, error: 'Failed to toggle site' }

  logger.info('Admin: Public tracker site toggled', { id, isActive })
  revalidatePath('/admin/tracker')
  revalidatePath('/tracker')
  return { success: true }
}

/** Delete a tracked site */
export async function deleteTrackedSiteAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return { success: false, error: 'Unauthorised' }

  const result = await deletePublicMonitor(id)
  if (!result) return { success: false, error: 'Failed to delete site' }

  logger.info('Admin: Public tracker site deleted', { id })
  revalidatePath('/admin/tracker')
  revalidatePath('/tracker')
  return { success: true }
}
