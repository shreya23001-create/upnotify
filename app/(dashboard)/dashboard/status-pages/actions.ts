'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createStatusPage, updateStatusPage, deleteStatusPage, bulkDeleteStatusPages, bulkUpdateStatusPageVisibility, getStatusPageById, isSlugTaken } from '@/lib/db/status-pages'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { logger } from '@/lib/utils/logger'
import { devAuditLog } from '@/lib/db/audit'
import { impersonationGuard } from '@/lib/auth/impersonation-guard'
import { checkStatusPageLimit } from '@/lib/utils/plan-limits'

export async function createStatusPageAction(formData: FormData): Promise<{ error?: string }> {
  const guard = await impersonationGuard()
  if (guard.isBlocked) return { error: guard.error }

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

  // Reserved slugs — must not conflict with app routes under /status/
  const RESERVED_SLUGS = ['api', 'admin', 'dashboard', 'login', 'signup', 'health',
    'status', 'uptrue', 'app', 'www', 'mail', 'support', 'help', 'blog', 'pricing']
  const normSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (RESERVED_SLUGS.includes(normSlug)) {
    return { error: `"${normSlug}" is a reserved name. Please choose a different slug.` }
  }

  if (await isSlugTaken(normSlug)) {
    return { error: `The URL "uptrue.io/status/${normSlug}" is already taken. Please choose a different slug.` }
  }

  // Enforce plan limits on status pages
  const spLimit = await checkStatusPageLimit(user.org_id)
  if (!spLimit.allowed) {
    return { error: spLimit.limit === 0
      ? 'Status pages are not available on your current plan. Upgrade to unlock this feature.'
      : `Status page limit reached (${spLimit.currentCount}/${spLimit.limit}). Upgrade your plan for more.`
    }
  }

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
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'status_page.created', resourceType: 'status_page', resourceId: page.id, metadata: { slug } })
  redirect('/dashboard/status-pages')
}

export async function updateStatusPageAction(pageId: string, formData: FormData): Promise<{ error?: string }> {
  const guardUpdate = await impersonationGuard()
  if (guardUpdate.isBlocked) return { error: guardUpdate.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the status page belongs to the user's org before updating
  const existing = await getStatusPageById(pageId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Status page not found' }
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const monitorIdsStr = formData.get('monitor_ids') as string
  const isPublished = formData.get('is_published') !== 'false'

  if (!name || !slug) return { error: 'Name and slug are required' }

  const RESERVED_SLUGS_UPDATE = ['api', 'admin', 'dashboard', 'login', 'signup', 'health',
    'status', 'uptrue', 'app', 'www', 'mail', 'support', 'help', 'blog', 'pricing']
  const normSlugUpdate = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (RESERVED_SLUGS_UPDATE.includes(normSlugUpdate)) {
    return { error: `"${normSlugUpdate}" is a reserved name. Please choose a different slug.` }
  }

  if (normSlugUpdate !== existing.slug && await isSlugTaken(normSlugUpdate, pageId)) {
    return { error: `The URL "uptrue.io/status/${normSlugUpdate}" is already taken. Please choose a different slug.` }
  }

  const monitorIds = monitorIdsStr ? monitorIdsStr.split(',').filter(Boolean) : []

  const page = await updateStatusPage(pageId, {
    name,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    monitor_ids: monitorIds,
    is_published: isPublished,
  })

  if (!page) return { error: 'Failed to update status page' }

  logger.info('Status page updated', { pageId })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'status_page.updated', resourceType: 'status_page', resourceId: pageId })
  redirect('/dashboard/status-pages')
}

export async function deleteStatusPageAction(pageId: string): Promise<{ error?: string }> {
  const guardDel = await impersonationGuard()
  if (guardDel.isBlocked) return { error: guardDel.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the status page belongs to the user's org before deleting
  const existing = await getStatusPageById(pageId)
  if (!existing || existing.org_id !== user.org_id) {
    return { error: 'Status page not found' }
  }

  const success = await deleteStatusPage(pageId)
  if (!success) return { error: 'Failed to delete' }
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'status_page.deleted', resourceType: 'status_page', resourceId: pageId })
  redirect('/dashboard/status-pages')
}

export async function bulkDeleteStatusPagesAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkDel = await impersonationGuard()
  if (guardBulkDel.isBlocked) return { error: guardBulkDel.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkDeleteStatusPages(ids, user.org_id)
  if (!success) return { error: 'Failed to delete status pages' }

  logger.info('Bulk deleted status pages', { count: ids.length })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'status_page.bulk_deleted', metadata: { count: ids.length } })
  revalidatePath('/dashboard/status-pages')
  return {}
}

export async function bulkPublishStatusPagesAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkPub = await impersonationGuard()
  if (guardBulkPub.isBlocked) return { error: guardBulkPub.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateStatusPageVisibility(ids, user.org_id, true)
  if (!success) return { error: 'Failed to publish status pages' }

  logger.info('Bulk published status pages', { count: ids.length })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'status_page.bulk_published', metadata: { count: ids.length } })
  revalidatePath('/dashboard/status-pages')
  return {}
}

export async function bulkUnpublishStatusPagesAction(ids: string[]): Promise<{ error?: string }> {
  const guardBulkUnpub = await impersonationGuard()
  if (guardBulkUnpub.isBlocked) return { error: guardBulkUnpub.error }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const success = await bulkUpdateStatusPageVisibility(ids, user.org_id, false)
  if (!success) return { error: 'Failed to unpublish status pages' }

  logger.info('Bulk unpublished status pages', { count: ids.length })
  await devAuditLog({ orgId: user.org_id, userId: user.id, action: 'status_page.bulk_unpublished', metadata: { count: ids.length } })
  revalidatePath('/dashboard/status-pages')
  return {}
}
