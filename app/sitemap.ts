import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

interface StatusPageRow {
  slug: string
  updated_at: string | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://uptrue.io',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://uptrue.io/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://uptrue.io/signup',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://uptrue.io/terms',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://uptrue.io/privacy',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://uptrue.io/cookies',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://uptrue.io/dpa',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://uptrue.io/acceptable-use',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  let statusPages: MetadataRoute.Sitemap = []

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('status_pages')
      .select('slug, updated_at')
      .eq('is_published', true)

    if (error) {
      logger.error('Sitemap: failed to fetch public status pages', { error: error.message })
    } else if (data) {
      statusPages = (data as StatusPageRow[]).map((page) => ({
        url: `https://uptrue.io/status/${page.slug}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.7,
      }))
    }
  } catch (err) {
    logger.error('Sitemap: unexpected error fetching status pages', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  return [...staticPages, ...statusPages]
}
