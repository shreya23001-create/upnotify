import { getPublishedBlogPosts } from '@/lib/db/blog-posts'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // re-generate every hour

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(): Promise<Response> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://upnotify-monitoring.vercel.app').trim()
  const posts = await getPublishedBlogPosts()

  const items = posts.map(post => {
    const url = `${appUrl}/blog/${post.slug}`
    const pubDate = post.published_at
      ? new Date(post.published_at).toUTCString()
      : new Date(post.created_at).toUTCString()
    const excerpt = post.excerpt ? escapeXml(post.excerpt) : ''
    const category = post.category ? `<category>${escapeXml(post.category)}</category>` : ''
    const tags = (post.tags ?? []).map(t => `<category>${escapeXml(t)}</category>`).join('')

    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${excerpt}</description>
      ${category}
      ${tags}
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Upnotify Blog</title>
    <link>${appUrl}/blog</link>
    <description>Uptime monitoring insights, LLM launch coverage, and web infrastructure intelligence from Upnotify.</description>
    <language>en-gb</language>
    <managingEditor>info@upnotify.com (Upnotify)</managingEditor>
    <webMaster>info@upnotify.com (Upnotify)</webMaster>
    <atom:link href="${appUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${appUrl}/logo.png</url>
      <title>Upnotify Blog</title>
      <link>${appUrl}/blog</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
