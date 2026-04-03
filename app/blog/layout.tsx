export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: {
    default: 'Blog',
    template: '%s | Uptrue Blog',
  },
  description:
    'Guides, tutorials, and insights on website monitoring, uptime, SSL, status pages, and infrastructure reliability. Written by the Uptrue team.',
  openGraph: {
    title: 'Uptrue Blog — Website Monitoring Guides & Insights',
    description:
      'Guides, tutorials, and insights on website monitoring, uptime, SSL, status pages, and infrastructure reliability.',
    url: 'https://uptrue.io/blog',
    siteName: 'Uptrue',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="blog-layout">
      <PublicNav />
      <main className="blog-main" style={{ paddingTop: 64 }}>{children}</main>
      <PublicFooter />
    </div>
  )
}
