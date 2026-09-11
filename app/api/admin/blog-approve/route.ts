import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAndUseToken } from '@/lib/db/blog-approval-tokens'
import { postOutageBlogToSocial } from '@/lib/services/social-poster'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { escapeHtml } from '@/lib/utils/escape-html'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// HTML response pages (opened in browser via email link)
// ---------------------------------------------------------------------------

// `colour` is only ever passed a known-safe hex literal from this file, so it
// doesn't need escaping. `heading` and `message` are interpolated into the
// HTML body and MUST be escaped — they take strings derived from blog post
// titles, which are user-controlled data from the DB and can carry HTML.
// engineering-app#61 — previously this template emitted post.title raw, which
// rendered <script> / <img onerror=> payloads in the admin's browser session.
function successPage(heading: string, message: string, colour: string): Response {
  const safeHeading = escapeHtml(heading)
  const safeMessage = escapeHtml(message)
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeHeading} — Upnotify</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border-radius:12px;padding:40px 48px;max-width:480px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;color:#111827;margin-bottom:12px}
    p{font-size:15px;color:#6b7280;line-height:1.6;margin-bottom:24px}
    a{display:inline-block;padding:10px 24px;background:${colour};color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${colour === '#16a34a' ? '✅' : '🗑️'}</div>
    <h1>${safeHeading}</h1>
    <p>${safeMessage}</p>
    <a href="https://upnotify-monitoring.vercel.app/admin/blog">View Blog Admin</a>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}

function errorPage(message: string): Response {
  // engineering-app#61 — escape any caller-supplied message string to keep
  // the error template safe for blog-derived inputs (post.title leaks into
  // the failure paths above).
  const safeMessage = escapeHtml(message)
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Error — Upnotify</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border-radius:12px;padding:40px 48px;max-width:480px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;color:#111827;margin-bottom:12px}
    p{font-size:15px;color:#6b7280;line-height:1.6}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Something went wrong</h1>
    <p>${safeMessage}</p>
  </div>
</body>
</html>`,
    { status: 400, headers: { 'Content-Type': 'text/html' } }
  )
}

// ---------------------------------------------------------------------------
// GET /api/admin/blog-approve?token=xxx
// Called when admin clicks Approve or Reject in the email.
// No session auth — secured by single-use cryptographic token.
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response | NextResponse> {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return errorPage('No token provided. Please use the link from the approval email.')
  }

  // Validate token and mark as used (atomic — second click will fail)
  const result = await validateAndUseToken(token)

  if (!result) {
    return errorPage(
      'This link has already been used or has expired. Each approval link can only be used once.'
    )
  }

  const { action, blogPostId } = result
  const supabase = createAdminClient()

  if (action === 'reject') {
    // Delete the draft
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', blogPostId)

    if (error) {
      logger.error('Failed to delete rejected blog post', { blogPostId, error: error.message })
      return errorPage('Failed to delete the draft. Please delete it manually from the blog admin.')
    }

    logger.info('Auto-generated blog post rejected and deleted', { blogPostId })
    return successPage(
      'Blog post rejected',
      'The draft has been deleted. No post was published.',
      '#dc2626'
    )
  }

  // Approve: fetch the post, publish it, post to social
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content')
    .eq('id', blogPostId)
    .single()

  if (fetchError || !post) {
    logger.error('Blog post not found for approval', { blogPostId })
    return errorPage('Blog post not found. It may have already been deleted.')
  }

  // Publish
  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ status: 'published', published_at: now })
    .eq('id', blogPostId)

  if (updateError) {
    logger.error('Failed to publish blog post', { blogPostId, error: updateError.message })
    return errorPage('Failed to publish the post. Please publish it manually from the blog admin.')
  }

  logger.info('Auto-generated blog post approved and published', { blogPostId, slug: post.slug })

  // Post to social (fire-and-forget — don't block the response)
  const { app } = getConfig()
  const blogUrl = `${app.url}/blog/${post.slug}`

  // Extract site name from title (format: "Is [Site] Down? ...")
  const siteMatch = post.title.match(/^Is (.+?) Down\?/)
  const siteDisplayName = siteMatch?.[1] ?? post.title

  const content = post.content as { body?: string } | null
  const excerpt = (post.excerpt as string | null) ??
    content?.body?.slice(0, 160) ?? post.title

  postOutageBlogToSocial({
    siteDisplayName,
    blogTitle: post.title,
    blogUrl,
    excerpt,
  }).then(({ x, linkedin }) => {
    logger.info('Social post results', {
      blogPostId,
      x: x.success ? 'ok' : x.error,
      linkedin: linkedin.success ? 'ok' : linkedin.error,
    })
  }).catch(err => {
    logger.error('Social posting exception', { blogPostId, error: err instanceof Error ? err.message : 'Unknown' })
  })

  return successPage(
    'Blog post published!',
    `"${post.title}" is now live. It has been posted to X and LinkedIn.`,
    '#16a34a'
  )
}
