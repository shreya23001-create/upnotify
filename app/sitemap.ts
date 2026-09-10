import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
import { logger } from '@/lib/utils/logger'
import { getAllSlugs } from '@/lib/constants/monitor-types'

interface StatusPageRow {
  slug: string
  updated_at: string | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://upnotify-monitoring.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/signup',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/terms',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/privacy',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/cookies',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/dpa',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/acceptable-use',
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/refund-policy',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/gdpr',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/ai-disclaimer',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/sla',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/subprocessors',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.2,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/security',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/about',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/contact',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/leaderboard',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/tools',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/tools/ssl-checker',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/tools/uptime-calculator',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/tools/uptime',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/tools/security',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/tools/dns',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/tools/ai-seo',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/score',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/free-uptime-monitoring',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/integrations',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/integrations/slack',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/integrations/teams',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/integrations/telegram',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/integrations/webhook',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/credits',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/referrals',
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog',
      lastModified: new Date('2026-05-01'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/website-monitoring-guide',
      lastModified: new Date('2026-04-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/public-status-page-guide',
      lastModified: new Date('2026-04-05'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/uptime-monitoring-agencies',
      lastModified: new Date('2026-04-09'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/ssl-certificate-monitoring',
      lastModified: new Date('2026-04-14'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/competitor-analysis-ecommerce',
      lastModified: new Date('2026-04-18'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-database-connection-error',
      lastModified: new Date('2026-04-22'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-contact-form-not-sending',
      lastModified: new Date('2026-04-23'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-white-screen-of-death',
      lastModified: new Date('2026-04-24'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-critical-error',
      lastModified: new Date('2026-04-26'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-too-many-redirects',
      lastModified: new Date('2026-04-27'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-php-memory-exhausted',
      lastModified: new Date('2026-04-28'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-redirect-loop',
      lastModified: new Date('2026-04-29'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-recovery-mode',
      lastModified: new Date('2026-04-30'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wp-mail-smtp-not-working',
      lastModified: new Date('2026-05-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-403-forbidden',
      lastModified: new Date('2026-05-02'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-japanese-keyword-hack',
      lastModified: new Date('2026-05-03'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-malware-redirect',
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-504-gateway-timeout',
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-pharma-hack',
      lastModified: new Date('2026-05-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-cron-not-working',
      lastModified: new Date('2026-05-07'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/elementor-not-loading',
      lastModified: new Date('2026-05-08'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-htaccess-error',
      lastModified: new Date('2026-05-09'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-permalinks-not-working',
      lastModified: new Date('2026-05-10'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wp-rocket-cache-issues',
      lastModified: new Date('2026-05-11'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-site-hacked',
      lastModified: new Date('2026-05-12'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/updraftplus-backup-failed',
      lastModified: new Date('2026-05-13'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-slow-ttfb',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-javascript-errors',
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/gravity-forms-not-working',
      lastModified: new Date('2026-05-16'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordfence-blocking-traffic',
      lastModified: new Date('2026-05-17'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-brute-force-attack',
      lastModified: new Date('2026-05-18'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/yoast-seo-sitemap-404',
      lastModified: new Date('2026-05-19'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-ssl-expired',
      lastModified: new Date('2026-05-20'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-shared-hosting-slow',
      lastModified: new Date('2026-05-21'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-auto-update-broke-site',
      lastModified: new Date('2026-05-22'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-mixed-content',
      lastModified: new Date('2026-05-23'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-xmlrpc-attack',
      lastModified: new Date('2026-05-24'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-core-web-vitals',
      lastModified: new Date('2026-05-25'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Monitor type landing pages — static, one per monitor type
  // Plus 5 industry-specific landings (D4-B): SaaS, e-commerce, fintech,
  // API, banking. These sit IN /monitoring/* but are NOT real monitor types
  // — they are SEO-only landings backed by their own static page.tsx files
  // and rendered through the IndustryLandingPage shared template.
  const industrySlugs = [
    'saas-uptime-monitoring',
    'ecommerce-uptime-monitoring',
    'fintech-uptime-monitoring',
    'api-uptime-monitoring',
    'banking-uptime-monitoring',
  ]
  const monitoringPages: MetadataRoute.Sitemap = [
    {
      url: 'https://upnotify-monitoring.vercel.app/monitoring',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...getAllSlugs().map(slug => ({
      url: `https://upnotify-monitoring.vercel.app/monitoring/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...industrySlugs.map(slug => ({
      url: `https://upnotify-monitoring.vercel.app/monitoring/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
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
          url: `https://upnotify-monitoring.vercel.app/status/${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
          changeFrequency: 'hourly' as const,
          priority: 0.7,
        }))
      )
    }

    // Published blog posts (dynamic — auto-generated outage posts etc.).
    // Excludes posts flagged noindex=true (Tier 3 permutation posts) so
    // Search Console stops surfacing them. The blog [slug] page also
    // emits robots:noindex,nofollow on those posts (see generateMetadata).
    //
    // NB: cast via `unknown` because the generated Database types do not yet
    // know about the noindex column (added in migration 00095). Regenerate
    // types after the migration is applied to remove the cast.
    const { data: blogData, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, noindex')
      .eq('status', 'published')
      .or('noindex.is.null,noindex.eq.false')

    if (blogError) {
      logger.error('Sitemap: failed to fetch blog posts', { error: blogError.message })
    } else if (blogData) {
      const rows = blogData as unknown as { slug: string; updated_at: string | null; noindex: boolean | null }[]
      dynamicPages.push(
        ...rows.map((post) => ({
          url: `https://upnotify-monitoring.vercel.app/blog/${post.slug}`,
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
          url: `https://upnotify-monitoring.vercel.app/tracker/${site.domain}`,
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

  return [...staticPages, ...monitoringPages, ...dynamicPages]
}
