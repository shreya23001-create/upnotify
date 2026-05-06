import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/db/users'
import { canWriteAdminModule } from '@/lib/db/admin-roles'
import { logger } from '@/lib/utils/logger'

// blog_posts columns from migration 00101 not yet in generated database.types.ts
function getRawClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

export const dynamic = 'force-dynamic'

const VALID_OUTCOMES = ['approved', 'rejected', 'needs_changes'] as const
type LegalOutcome = typeof VALID_OUTCOMES[number]

// GET /api/admin/legal-review?id=<postId>&action=<outcome>&reviewer=<email>
// Called from the legal-review admin page form buttons.
export async function GET(request: Request): Promise<Response | NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isSuperAdmin = !!user.is_super_admin
  const canWrite = await canWriteAdminModule(user.email, isSuperAdmin, 'blog')
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action') as LegalOutcome | null

  if (!id || !action || !(VALID_OUTCOMES as readonly string[]).includes(action)) {
    return NextResponse.json({ error: 'Missing or invalid id/action' }, { status: 400 })
  }

  const supabase = getRawClient()

  if (action === 'rejected') {
    const { error } = await supabase
      .from('blog_posts')
      .update({
        legal_review_outcome: 'rejected',
        legal_review_by: user.email,
        legal_reviewed_at: new Date().toISOString(),
        status: 'draft',
      })
      .eq('id', id)

    if (error) {
      logger.error('legal-review: reject update failed', { id, error: error.message })
      return new Response(htmlPage('Error', 'Failed to reject the post. Please try again.', '#dc2626'), {
        headers: { 'Content-Type': 'text/html' },
        status: 500,
      })
    }

    logger.info('legal-review: post rejected', { id, reviewer: user.email })
    return new Response(htmlPage('Post rejected', 'The draft has been marked as rejected. No changes will be published.', '#dc2626'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (action === 'needs_changes') {
    const { error } = await supabase
      .from('blog_posts')
      .update({
        legal_review_outcome: 'needs_changes',
        legal_review_by: user.email,
        legal_reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logger.error('legal-review: needs_changes update failed', { id, error: error.message })
      return new Response(htmlPage('Error', 'Failed to update the post. Please try again.', '#d97706'), {
        headers: { 'Content-Type': 'text/html' },
        status: 500,
      })
    }

    logger.info('legal-review: post needs changes', { id, reviewer: user.email })
    return new Response(htmlPage('Changes requested', 'The post has been marked as needing changes. It will not publish until re-reviewed and approved.', '#d97706'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // action === 'approved' — publish the post
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('blog_posts')
    .update({
      legal_review_outcome: 'approved',
      legal_review_by: user.email,
      legal_reviewed_at: now,
      status: 'published',
      published_at: now,
    })
    .eq('id', id)
    .eq('post_type', 'commercial')

  if (error) {
    logger.error('legal-review: approve+publish failed', { id, error: error.message })
    return new Response(htmlPage('Error', 'Failed to publish the post. Please try again.', '#dc2626'), {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    })
  }

  logger.info('legal-review: post approved and published', { id, reviewer: user.email })
  return new Response(htmlPage('Post approved and published', 'The comparison page is now live.', '#16a34a'), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function htmlPage(heading: string, message: string, colour: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${heading} — Uptrue Legal Review</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border-radius:12px;padding:40px 48px;max-width:480px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center}
    h1{font-size:22px;color:#111827;margin-bottom:12px}
    p{font-size:15px;color:#6b7280;line-height:1.6;margin-bottom:24px}
    a{display:inline-block;padding:10px 24px;background:${colour};color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500}
  </style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    <p>${message}</p>
    <a href="/admin/legal-review">Back to Legal Review Queue</a>
  </div>
</body>
</html>`
}
