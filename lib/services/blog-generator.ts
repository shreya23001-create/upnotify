import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OutageContext {
  siteDisplayName: string   // e.g. "GitHub"
  siteDomain: string        // e.g. "github.com"
  siteCategory: string      // e.g. "developer-tools"
  errorMessage: string      // e.g. "Timeout after 15000ms"
  statusCode: number | null // e.g. 503
  startedAt: string         // ISO timestamp
  incidentId: string        // public_incidents.id
}

interface GeneratedBlogDraft {
  blogPostId: string
  title: string
  slug: string
  excerpt: string
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function dateSlug(): string {
  const d = new Date()
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  return `${d.getFullYear()}-${months[d.getMonth()]}-${String(d.getDate()).padStart(2, '0')}`
}

function formatReadableDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

// ---------------------------------------------------------------------------
// Check for duplicate (prevent re-generating for same incident)
// ---------------------------------------------------------------------------

async function blogExistsForIncident(incidentId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('source_public_incident_id', incidentId)

  return (count ?? 0) > 0
}

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

/**
 * Generates an outage blog post draft using Claude, saves it as pending_approval,
 * creates approval tokens, and returns them for the admin email.
 * Safe to call multiple times — deduplicates by incident ID.
 */
export async function generateOutageBlogPost(ctx: OutageContext): Promise<GeneratedBlogDraft | null> {
  // Deduplicate: only one blog post per incident
  const exists = await blogExistsForIncident(ctx.incidentId)
  if (exists) {
    logger.info('Blog post already exists for incident — skipping', { incidentId: ctx.incidentId })
    return null
  }

  const config = getServerConfig()
  if (!config.anthropic.apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set — skipping outage blog generation')
    return null
  }

  const client = new Anthropic({ apiKey: config.anthropic.apiKey })
  const detectedAt = formatReadableDate(ctx.startedAt)
  const errorDetail = ctx.statusCode
    ? `HTTP ${ctx.statusCode} — ${ctx.errorMessage}`
    : ctx.errorMessage

  const prompt = `You are a technical writer for Uptrue, an uptime monitoring platform.
Write a blog post in the format of "Is [Site] Down?" that will rank on Google when people search for current outages.

Site: ${ctx.siteDisplayName} (${ctx.siteDomain})
Outage detected at: ${detectedAt}
Error: ${errorDetail}

Write the post in Markdown. The post must:
1. Open with a clear statement that Uptrue detected an outage for ${ctx.siteDisplayName}
2. Give readers a way to check if they are affected (check their own connection, try incognito, etc.)
3. Include a "What We Know So Far" section with the incident details
4. Include a "What to Do While [Site] Is Down" section with practical workarounds
5. Include a "Monitor [Site] for Free" section with a call to action to sign up at https://uptrue.io
6. Close with a note that Uptrue will update the post as the situation develops
7. Be between 400–600 words
8. Use a human, helpful tone — not robotic
9. Do NOT include a title at the top (it is added separately)

Also provide:
- EXCERPT: One sentence (max 160 chars) summarising the post for Google
- SEO_TITLE: (max 60 chars) e.g. "Is GitHub Down? ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} Outage"
- SEO_DESCRIPTION: (max 160 chars) for the meta description

Format your response EXACTLY like this:
---BODY---
[markdown body here]
---EXCERPT---
[excerpt here]
---SEO_TITLE---
[seo title here]
---SEO_DESCRIPTION---
[seo description here]`

  let body = ''
  let excerpt = ''
  let seoTitle = ''
  let seoDescription = ''

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.find(b => b.type === 'text')?.text ?? ''

    body = text.match(/---BODY---\n([\s\S]*?)---EXCERPT---/)?.[1]?.trim() ?? ''
    excerpt = text.match(/---EXCERPT---\n([\s\S]*?)---SEO_TITLE---/)?.[1]?.trim() ?? ''
    seoTitle = text.match(/---SEO_TITLE---\n([\s\S]*?)---SEO_DESCRIPTION---/)?.[1]?.trim() ?? ''
    seoDescription = text.match(/---SEO_DESCRIPTION---\n([\s\S]*?)$/)?.[1]?.trim() ?? ''

    if (!body) {
      logger.error('Blog generator returned empty body', { incidentId: ctx.incidentId })
      return null
    }
  } catch (error) {
    logger.error('Blog generation failed', {
      incidentId: ctx.incidentId,
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return null
  }

  // Build slug — unique by site + date
  const baseSlug = `is-${toSlug(ctx.siteDisplayName)}-down-${dateSlug()}`
  let slug = baseSlug
  const supabase = createAdminClient()

  // Ensure slug uniqueness (unlikely collision but safe)
  const { count: slugCount } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)

  if ((slugCount ?? 0) > 0) {
    slug = `${baseSlug}-${Date.now()}`
  }

  const title = seoTitle || `Is ${ctx.siteDisplayName} Down? ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} Outage`

  const content = {
    body,
    midCta: {
      heading: `Is ${ctx.siteDisplayName} affecting your work?`,
      buttonLabel: 'Monitor Your Sites Free',
      buttonUrl: 'https://uptrue.io',
    },
    endCta: {
      heading: 'Never be caught off guard by downtime again',
      buttonLabel: 'Start Free Monitoring',
      buttonUrl: 'https://uptrue.io',
    },
  }

  const postExcerpt = excerpt || `${ctx.siteDisplayName} is experiencing an outage. Uptrue detected the issue at ${detectedAt}.`

  // Auto-publish immediately — no approval step
  const { data: post, error: insertError } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      excerpt: postExcerpt,
      category: 'outage',
      tags: ['outage', ctx.siteDisplayName.toLowerCase(), 'downtime', 'is-it-down'],
      status: 'published',
      published_at: new Date().toISOString(),
      seo_title: seoTitle || title,
      seo_description: seoDescription || excerpt,
      auto_generated: true,
      source_public_incident_id: ctx.incidentId,
    })
    .select('id, title, slug')
    .single()

  if (insertError || !post) {
    logger.error('Failed to save auto-generated blog post', {
      incidentId: ctx.incidentId,
      error: insertError?.message,
    })
    return null
  }

  logger.info('Auto-generated blog post published', { id: post.id, slug: post.slug })

  return {
    blogPostId: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: postExcerpt,
  }
}
