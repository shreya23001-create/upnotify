import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { PageSection, SectionContent, SectionTheme, CmsTheme, CmsThemeSettings } from '@/lib/types/cms'

// The Supabase generated types are behind the 00068 migration (which added
// section_type, theme, updated_by to page_sections and created cms_theme).
// Until types are regenerated we cast through `unknown` at each return site.

// ─── Landing Page sections (public) ──────────────────────────────────────────

/** Fetch all visible landing sections ordered by sort_order. Used by the public page. */
export async function getLandingSections(): Promise<PageSection[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page', 'landing')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('Failed to fetch landing sections', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as PageSection[]
}

/** Fetch a single section by key. Checks 'global' page first, then 'landing'. */
export async function getLandingSection(sectionKey: string): Promise<PageSection | null> {
  const supabase = createAdminClient()
  // Try global page first (nav, footer), then landing
  for (const page of ['global', 'landing']) {
    const { data, error } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page', page)
      .eq('section_key', sectionKey)
      .single()
    if (!error && data) return data as unknown as PageSection
    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch section', { sectionKey, page, error: error.message })
    }
  }
  return null
}

/** Fetch a single section by key for a specific page. */
export async function getSection(page: string, sectionKey: string): Promise<PageSection | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page', page)
    .eq('section_key', sectionKey)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.error('Failed to fetch section', { page, sectionKey, error: error.message })
    }
    return null
  }
  return data as unknown as PageSection
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

/** Fetch ALL sections (visible + hidden) for the admin panel — landing + global pages. */
export async function getAllLandingSections(): Promise<PageSection[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('page_sections')
    .select('*')
    .in('page', ['landing', 'global'])
    .order('page',       { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('Admin: Failed to fetch all sections', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as PageSection[]
}

/** Update a section's content + optional theme. */
export async function updateSection(
  id: string,
  updates: {
    content?:    SectionContent
    theme?:      SectionTheme | null
    is_visible?: boolean
    sort_order?: number
  },
  updatedBy?: string
): Promise<PageSection | null> {
  const supabase = createAdminClient()

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.content    !== undefined) payload.content    = updates.content
  if (updates.theme      !== undefined) payload.theme      = updates.theme
  if (updates.is_visible !== undefined) payload.is_visible = updates.is_visible
  if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order
  if (updatedBy)                        payload.updated_by = updatedBy

  const { data, error } = await supabase
    .from('page_sections')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(payload as any)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Admin: Failed to update section', { id, error: error.message })
    return null
  }
  return data as unknown as PageSection
}

/** Toggle visibility of a section. */
export async function toggleSectionVisibility(
  id: string,
  isVisible: boolean,
  updatedBy?: string
): Promise<boolean> {
  const result = await updateSection(id, { is_visible: isVisible }, updatedBy)
  return result !== null
}

/** Create a new custom section. */
export async function createSection(
  sectionKey: string,
  sectionType: string,
  content: SectionContent,
  sortOrder: number,
  createdBy?: string,
  page = 'landing'
): Promise<PageSection | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('page_sections')
    .insert({
      page,
      section_key:  sectionKey,
      section_type: sectionType,
      content,
      sort_order:   sortOrder,
      is_visible:   false,
    })
    .select()
    .single()

  if (error) {
    logger.error('Admin: Failed to create section', { sectionKey, error: error.message })
    return null
  }
  return data as unknown as PageSection
}

/** Delete a section by id. Only custom sections should be deleted; core sections should be hidden. */
export async function deleteSection(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('page_sections')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Admin: Failed to delete section', { id, error: error.message })
    return false
  }
  return true
}

/** Bulk reorder: accepts array of { id, sort_order } pairs. */
export async function reorderSections(
  orders: Array<{ id: string; sort_order: number }>
): Promise<boolean> {
  const supabase = createAdminClient()

  const updates = orders.map(({ id, sort_order }) =>
    supabase
      .from('page_sections')
      .update({ sort_order })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.filter(r => r.error)

  if (failed.length > 0) {
    logger.error('Admin: Some section reorders failed', { count: failed.length })
    return false
  }
  return true
}

// ─── Global CMS Theme ─────────────────────────────────────────────────────────
// cms_theme table was added in migration 00068 — not yet in generated types.
// We use createAdminClient().from() with `as any` to bypass the type union.

/** Get the global brand theme. */
export async function getCmsTheme(): Promise<CmsTheme | null> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('cms_theme')
    .select('*')
    .eq('key', 'global')
    .single()

  if (error) {
    if ((error as { code?: string }).code !== 'PGRST116') {
      logger.error('Failed to fetch CMS theme', { error: (error as Error).message })
    }
    return null
  }
  return data as CmsTheme
}

/** Update the global brand theme. */
export async function updateCmsTheme(
  settings: CmsThemeSettings,
  updatedBy?: string
): Promise<CmsTheme | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('cms_theme')
    .upsert(
      {
        key:        'global',
        settings,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy ?? null,
      },
      { onConflict: 'key' }
    )
    .select()
    .single()

  if (error) {
    logger.error('Admin: Failed to update CMS theme', { error: (error as Error).message })
    return null
  }
  return data as CmsTheme
}
