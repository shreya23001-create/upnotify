import type { Metadata } from 'next'

// engineering-app#69 — removed `export const dynamic = 'force-dynamic'`.
// Blog content is cache-friendly; individual pages set their own ISR window
// (e.g. blog/[slug] has `revalidate = 300`; blog/page.tsx caches the index).

export const metadata: Metadata = {
  title: {
    default: 'Blog',
    template: '%s',
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
  // No <main> here — the (public)/layout.tsx already wraps everything in
  // <main id="main-content"> (engineering-app#75). Using <div> avoids the
  // nested-landmark a11y regression.
  return (
    <div className="blog-layout">
      <div className="blog-main" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>{children}</div>
    </div>
  )
}
