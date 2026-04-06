import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfig, getServerConfig } from '@/lib/utils/config'
import { researchOutage } from '@/lib/services/outage-researcher'
import { generateOutageBlogPost } from '@/lib/services/blog-generator'
import { sendBlogApprovalEmail } from '@/lib/services/email'
import { sendBlogApprovalTelegram } from '@/lib/services/telegram'
import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/admin/test-blog-pipeline
 *
 * Admin-only. Runs the full blog pipeline against a fake incident:
 *   1. Researches the site from live sources
 *   2. Generates a blog post draft via Claude
 *   3. Sends approval email to admin
 *
 * Body (optional):
 *   siteName  — display name (default: "GitHub")
 *   domain    — domain to research (default: "github.com")
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const config = getConfig()

  if (!user || !config.admin.emails.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as { siteName?: string; domain?: string }
  const siteName = body.siteName ?? 'GitHub'
  const domain = body.domain ?? 'github.com'

  // Step 0: Verify Claude API key works
  const serverConfig = getServerConfig()
  if (!serverConfig.anthropic.apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in environment' }, { status: 500 })
  }
  try {
    const testClient = new Anthropic({ apiKey: serverConfig.anthropic.apiKey })
    await testClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    })
  } catch (err) {
    return NextResponse.json({
      error: 'Claude API call failed',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }

  // Use a unique fake incident ID so dedup doesn't block re-runs
  const fakeIncidentId = `test-${Date.now()}`

  // Step 1: Research
  const research = await researchOutage(siteName, domain)

  // Step 2: Generate draft
  const draft = await generateOutageBlogPost({
    siteDisplayName: siteName,
    siteDomain: domain,
    siteCategory: 'test',
    errorMessage: 'Simulated outage — test run',
    statusCode: 503,
    startedAt: new Date().toISOString(),
    incidentId: fakeIncidentId,
    research,
  })

  if (!draft) {
    return NextResponse.json({ error: 'Blog generation failed — check server logs' }, { status: 500 })
  }

  // Step 3: Send approval email
  const { app, admin } = config
  const adminEmail = admin.emails[0]
  const approveUrl = `${app.url}/api/admin/blog-approve?token=${draft.approveToken}`
  const rejectUrl = `${app.url}/api/admin/blog-approve?token=${draft.rejectToken}`

  await Promise.allSettled([
    sendBlogApprovalEmail({
      to: adminEmail,
      blogTitle: draft.title,
      blogSlug: draft.slug,
      siteDisplayName: siteName,
      excerpt: draft.excerpt,
      bodyMarkdown: draft.bodyMarkdown,
      sourcesCount: draft.sourcesCount,
      approveUrl,
      rejectUrl,
    }),
    sendBlogApprovalTelegram({
      blogTitle: draft.title,
      siteDisplayName: siteName,
      excerpt: draft.excerpt,
      sourcesCount: draft.sourcesCount,
      hasOfficialStatus: !!research.officialStatus,
      approveUrl,
      rejectUrl,
    }),
  ])

  return NextResponse.json({
    ok: true,
    blogPostId: draft.blogPostId,
    title: draft.title,
    slug: draft.slug,
    sourcesFound: research.articles.length,
    hasOfficialStatus: !!research.officialStatus,
    approvalEmailSentTo: adminEmail,
  })
}
