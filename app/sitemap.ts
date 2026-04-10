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
    {
      url: 'https://uptrue.io/refund-policy',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://uptrue.io/gdpr',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://uptrue.io/ai-disclaimer',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://uptrue.io/sla',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://uptrue.io/subprocessors',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.2,
    },
    {
      url: 'https://uptrue.io/security',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: 'https://uptrue.io/about',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://uptrue.io/contact',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://uptrue.io/leaderboard',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: 'https://uptrue.io/tools',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/tools/ssl-checker',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/tools/uptime-calculator',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/score',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/credits',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://uptrue.io/referrals',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://uptrue.io/blog',
      lastModified: new Date('2026-05-01'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/website-monitoring-guide',
      lastModified: new Date('2026-04-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/public-status-page-guide',
      lastModified: new Date('2026-04-05'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/uptime-monitoring-agencies',
      lastModified: new Date('2026-04-09'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://uptrue.io/blog/ssl-certificate-monitoring',
      lastModified: new Date('2026-04-14'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/competitor-analysis-ecommerce',
      lastModified: new Date('2026-04-18'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-database-connection-error',
      lastModified: new Date('2026-04-22'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-contact-form-not-sending',
      lastModified: new Date('2026-04-23'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-white-screen-of-death',
      lastModified: new Date('2026-04-24'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-critical-error',
      lastModified: new Date('2026-04-26'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-too-many-redirects',
      lastModified: new Date('2026-04-27'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-php-memory-exhausted',
      lastModified: new Date('2026-04-28'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-redirect-loop',
      lastModified: new Date('2026-04-29'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-recovery-mode',
      lastModified: new Date('2026-04-30'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wp-mail-smtp-not-working',
      lastModified: new Date('2026-05-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-403-forbidden',
      lastModified: new Date('2026-05-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-japanese-keyword-hack',
      lastModified: new Date('2026-05-03'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-malware-redirect',
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-504-gateway-timeout',
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-pharma-hack',
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-cron-not-working',
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/elementor-not-loading',
      lastModified: new Date('2026-05-08'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-htaccess-error',
      lastModified: new Date('2026-05-09'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-permalinks-not-working',
      lastModified: new Date('2026-05-10'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wp-rocket-cache-issues',
      lastModified: new Date('2026-05-11'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-site-hacked',
      lastModified: new Date('2026-05-12'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/updraftplus-backup-failed',
      lastModified: new Date('2026-05-13'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-slow-ttfb',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-javascript-errors',
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/gravity-forms-not-working',
      lastModified: new Date('2026-05-16'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordfence-blocking-traffic',
      lastModified: new Date('2026-05-17'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-brute-force-attack',
      lastModified: new Date('2026-05-18'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/yoast-seo-sitemap-404',
      lastModified: new Date('2026-05-19'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-ssl-expired',
      lastModified: new Date('2026-05-20'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-shared-hosting-slow',
      lastModified: new Date('2026-05-21'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-auto-update-broke-site',
      lastModified: new Date('2026-05-22'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-mixed-content',
      lastModified: new Date('2026-05-23'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-xmlrpc-attack',
      lastModified: new Date('2026-05-24'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://uptrue.io/blog/wordpress-core-web-vitals',
      lastModified: new Date('2026-05-25'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Dynamic pages from database
  const dynamicPages: MetadataRoute.Sitemap = []

  try {
    const supabase = createAdminClient()

    // Published status pages
    const { data: statusData, error: statusError } = await supabase
      .from('status_pages')
      .select('slug, updated_at')
      .eq('is_published', true)

    if (statusError) {
      logger.error('Sitemap: failed to fetch status pages', { error: statusError.message })
    } else if (statusData) {
      dynamicPages.push(
        ...(statusData as StatusPageRow[]).map((page) => ({
          url: `https://uptrue.io/status/${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
          changeFrequency: 'hourly' as const,
          priority: 0.7,
        }))
      )
    }

    // Published blog posts (dynamic — auto-generated outage posts etc.)
    const { data: blogData, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')

    if (blogError) {
      logger.error('Sitemap: failed to fetch blog posts', { error: blogError.message })
    } else if (blogData) {
      dynamicPages.push(
        ...(blogData as { slug: string; updated_at: string | null }[]).map((post) => ({
          url: `https://uptrue.io/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      )
    }

    // Active public tracker sites
    const { data: trackerData, error: trackerError } = await supabase
      .from('public_monitors')
      .select('domain, updated_at')
      .eq('is_active', true)

    if (trackerError) {
      logger.error('Sitemap: failed to fetch tracker sites', { error: trackerError.message })
    } else if (trackerData) {
      dynamicPages.push(
        ...(trackerData as { domain: string; updated_at: string | null }[]).map((site) => ({
          url: `https://uptrue.io/tracker/${site.domain}`,
          lastModified: site.updated_at ? new Date(site.updated_at) : new Date(),
          changeFrequency: 'hourly' as const,
          priority: 0.6,
        }))
      )
    }
  } catch (err) {
    logger.error('Sitemap: unexpected error', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  return [...staticPages, ...dynamicPages]
}
