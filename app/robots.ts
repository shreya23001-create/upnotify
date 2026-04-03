import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'

  // Block ALL crawlers on dev/preview — only production should be indexed
  if (!isProduction) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    }
  }

  // Production: allow public pages, block dashboard/admin/API
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/settings/',
          '/admin/',
          '/invite/',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://uptrue.io/sitemap.xml',
  }
}
