export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'

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
      
      <main className="blog-main" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>{children}</main>
      
    </div>
  )
}
