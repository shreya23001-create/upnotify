'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createStatusPage, updateStatusPage, deleteStatusPage, bulkDeleteStatusPages, bulkUpdateStatusPageVisibility } from '@/lib/db/status-pages'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { logger } from '@/lib/utils/logger'

export async function createStatusPageAction(formData: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const workspace = workspaces[0]
  if (!workspace) return { error: 'No workspace found' }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const monitorIdsStr = formData.get('monitor_ids') as string
  const isPublished = formData.get('is_published') !== 'false'

  if (!name || !slug) return { error: 'Name and slug are required' }

  const monitorIds = monitorIdsStr ? monitorIdsStr.split(',').filter(Boolean) : []

  const page = await createStatusPage({
    org_id: user.org_id,
    workspace_id: workspace.id,
    name,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    monitor_ids: monitorIds,
    is_published: isPublished,
  })

  if (!page) return { error: 'Failed to create status page' }

  logger.info('Status page created', { pageId: page.id, slug })
  redirect('/dashboard/status-pages')
}

export async function updateStatusPageAction(pageId: string, formData: FormData): Promise<{ error?: string }> {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const monitorIdsStr = formData.get('monitor_ids') as string
  const isPublished = formData.get('is_published') !== 'false'

  if (!name || !slug) return { error: 'Name and slug are required' }

  const monitorIds = monitorIdsStr ? monitorIdsStr.split(',').filter(Boolean) : []

  const page = await updateStatusPage(pageId, {
    name,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    monitor_ids: monitorIds,
    is_published: isPublished,
  })

  if (!page) return { error: 'Failed to update status page' }

  logger.info('Status page updated', { pageId })
  redirect('/dashboard/status-pages')
}

export async function deleteStatusPageAction(pageId: string): Promise<{ error?: string }> {
  const success = await deleteStatusPage(pageId)
  if (!success) return { error: 'Failed to delete' }
  redirect('/dashboard/status-pages')
}

export async function bulkDeleteStatusPagesAction(ids: string[]): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkDeleteStatusPages(ids, user.org_id)
  if (!success) return { error: 'Failed to delete status pages' }

  logger.info('Bulk deleted status pages', { count: ids.length })
  revalidatePath('/dashboard/status-pages')
  return {}
}

export async function bulkPublishStatusPagesAction(ids: string[]): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateStatusPageVisibility(ids, user.org_id, true)
  if (!success) return { error: 'Failed to publish status pages' }

  logger.info('Bulk published status pages', { count: ids.length })
  revalidatePath('/dashboard/status-pages')
  return {}
}

export async function bulkUnpublishStatusPagesAction(ids: string[]): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateStatusPageVisibility(ids, user.org_id, false)
  if (!success) return { error: 'Failed to unpublish status pages' }

  logger.info('Bulk unpublished status pages', { count: ids.length })
  revalidatePath('/dashboard/status-pages')
  return {}
}
