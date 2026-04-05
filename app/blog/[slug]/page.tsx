import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const revalidate = 300 // ISR: revalidate every 5 minutes

interface BlogContent {
  body?: string
  type?: string
  midCta?: { heading: string; buttonLabel: string; buttonUrl: string }
  endCta?: { heading: string; buttonLabel: string; buttonUrl: string }
}

async function getPost(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: post.seo_title || `${post.title} | Uptrue`,
    description: post.seo_description || post.excerpt || '',
    alternates: { canonical: `https://uptrue.io/blog/${post.slug}` },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || '',
      url: `https://uptrue.io/blog/${post.slug}`,
      type: 'article',
      ...(post.og_image_url ? { images: [{ url: post.og_image_url }] } : {}),
    },
  }
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export default async function DynamicBlogPost({ params }: { params: Promise<{ slug: string }> }): Promise<React.ReactElement> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const content = post.content as BlogContent | null
  const body = content?.body || ''
  const isStatic = content?.type === 'static'

  // If content is static (lives in .tsx file), let Next.js fall through to the static route
  if (isStatic || !body) notFound()

  const midCta = content?.midCta
  const endCta = content?.endCta
  const publishedDate = post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <>
      <PublicNav />
      <article className="blog-article">
        <div className="blog-article-container">
          <header className="blog-article-header">
            {post.category && (
              <span className="blog-article-category">{post.category}</span>
            )}
            <h1 className="blog-article-title">{post.title}</h1>
            {post.excerpt && (
              <p className="blog-article-excerpt">{post.excerpt}</p>
            )}
            <div className="blog-article-meta">
              {publishedDate && <span>{publishedDate}</span>}
              <span>{'\u00B7'}</span>
              <span>Uptrue Team</span>
            </div>
          </header>

          {midCta && (
            <div className="blog-cta-box">
              <h3>{midCta.heading}</h3>
              <Link href={midCta.buttonUrl} className="btn btn-primary">{midCta.buttonLabel}</Link>
            </div>
          )}

          <div
            className="blog-article-body"
            dangerouslySetInnerHTML={{ __html: `<p>${markdownToHtml(body)}</p>` }}
          />

          {endCta && (
            <div className="blog-cta-box blog-cta-box-end">
              <h3>{endCta.heading}</h3>
              <Link href={endCta.buttonUrl} className="btn btn-primary btn-lg">{endCta.buttonLabel}</Link>
            </div>
          )}
        </div>
      </article>
      <PublicFooter />
    </>
  )
}
