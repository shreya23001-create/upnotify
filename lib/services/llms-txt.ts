/**
 * Shared llms.txt generation service.
 *
 * Handles:
 *  1. Website crawling — auto-fills placeholders from the site's own meta data
 *  2. Content building — two variants (dashboard AI-visibility, public free tool)
 *  3. Attribution — mandatory Uptrue branding on every generated file
 *
 * Rules:
 *  - Max 3 additional page fetches beyond homepage + sitemap
 *  - 5-second timeout per request — never blocks the user
 *  - Silent fallback — any crawl failure leaves the placeholder in place
 *  - No fabrication — only data actually found on the site is used
 */

import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Attribution — appears at the very top of every generated file
// ---------------------------------------------------------------------------
const ATTRIBUTION =
  '# Monitoring by Uptrue — Uptime & Performance Monitoring (https://upnotify-monitoring.vercel.app)'

const CRAWLER_UA = 'Uptrue-AI-Crawler/1.0 (+https://upnotify-monitoring.vercel.app)'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CrawledData {
  siteName:    string | null
  description: string | null
  audience:    string | null
  language:    string | null
  keyPages:    Array<{ label: string; url: string }>
  topics:      string[]
  author:      string | null
  contact:     string | null
}

// ---------------------------------------------------------------------------
// Mini HTML helpers (no external deps — regex only)
// ---------------------------------------------------------------------------
function metaContent(html: string, name: string): string | null {
  const m =
    html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']{1,400})["']`, 'i')) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,400})["'][^>]+name=["']${name}["']`, 'i'))
  return m?.[1]?.trim() || null
}

function ogContent(html: string, property: string): string | null {
  const m =
    html.match(new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']{1,400})["']`, 'i')) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,400})["'][^>]+property=["']og:${property}["']`, 'i'))
  return m?.[1]?.trim() || null
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
  return m?.[1]?.trim() || null
}

function htmlLang(html: string): string | null {
  const m = html.match(/<html[^>]+lang=["']([a-z]{2,10})["']/i)
  return m?.[1]?.trim() || null
}

function h1Text(html: string): string | null {
  const m = html.match(/<h1[^>]*>([^<]{1,200})<\/h1>/i)
  return m?.[1]?.replace(/<[^>]+>/g, '').trim() || null
}

function h2Texts(html: string): string[] {
  const all: string[] = []
  const re = /<h2[^>]*>([\s\S]{1,200}?)<\/h2>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text.length > 3 && text.length < 120) all.push(text)
    if (all.length >= 6) break
  }
  return all
}

function mailtoLinks(html: string): string | null {
  const m = html.match(/mailto:([^"'\s>]{3,254})/i)
  return m?.[1] || null
}

function jsonLdValue(html: string, key: string): string | null {
  const blocks: string[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) blocks.push(m[1])
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block) as Record<string, unknown>
      const val = parsed[key]
      if (typeof val === 'string' && val.length > 0) return val
      if (typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>
        const candidate = obj.name ?? obj['@id']
        if (typeof candidate === 'string' && candidate.length > 0) return candidate
      }
    } catch { /* ignore malformed JSON-LD */ }
  }
  return null
}

// ---------------------------------------------------------------------------
// Sitemap parser — returns top URLs by priority
// ---------------------------------------------------------------------------
function parseSitemapUrls(xml: string, baseUrl: string, limit: number): string[] {
  const urls: Array<{ url: string; priority: number }> = []
  const locRe = /<loc>([^<]+)<\/loc>/gi
  const prioRe = /<priority>([^<]+)<\/priority>/gi
  let m
  const locs: string[] = []
  while ((m = locRe.exec(xml)) !== null) locs.push(m[1].trim())
  const prios: number[] = []
  while ((m = prioRe.exec(xml)) !== null) prios.push(parseFloat(m[1]) || 0.5)
  for (let i = 0; i < locs.length; i++) {
    const u = locs[i]
    // Skip very long URLs, query-string URLs, and dashboard/api paths
    if (u.length > 200 || u.includes('?') || /\/(dashboard|api|admin|auth)\//i.test(u)) continue
    urls.push({ url: u, priority: prios[i] ?? 0.5 })
  }
  // Sort by priority desc, take top `limit`
  return urls
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map(u => u.url)
}

function labelForUrl(url: string, domain: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/$/, '') || '/'
    if (path === '/') return 'Homepage'
    const segment = path.split('/').filter(Boolean).pop() ?? path
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  } catch {
    return url
  }
}

// ---------------------------------------------------------------------------
// Fetcher with timeout + silent fallback
// ---------------------------------------------------------------------------
async function safeFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': CRAWLER_UA },
      redirect: 'follow',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Crawler
// ---------------------------------------------------------------------------
export async function crawlSiteData(domain: string): Promise<CrawledData> {
  const baseUrl = `https://${domain}`
  const result: CrawledData = {
    siteName:    null,
    description: null,
    audience:    null,
    language:    null,
    keyPages:    [],
    topics:      [],
    author:      null,
    contact:     null,
  }

  try {
    // ── Step 1: Homepage ──────────────────────────────────────────────────
    const homepage = await safeFetch(baseUrl)
    if (homepage) {
      // Site name
      result.siteName =
        ogContent(homepage, 'site_name') ??
        titleTag(homepage)?.split(/[|\-–—]/)[0]?.trim() ??
        null

      // Description / purpose
      result.description =
        metaContent(homepage, 'description') ??
        ogContent(homepage, 'description') ??
        h1Text(homepage) ??
        null

      // Language
      result.language = htmlLang(homepage)

      // Audience (JSON-LD)
      result.audience = jsonLdValue(homepage, 'audience')

      // Topics — H2 headings
      result.topics = h2Texts(homepage)

      // Author
      result.author =
        jsonLdValue(homepage, 'author') ??
        jsonLdValue(homepage, 'publisher') ??
        ogContent(homepage, 'site_name') ??
        null

      // Contact — mailto on homepage
      result.contact = mailtoLinks(homepage)
    }

    // ── Step 2: Sitemap for key pages ─────────────────────────────────────
    const sitemapXml = await safeFetch(`${baseUrl}/sitemap.xml`)
    if (sitemapXml) {
      const topUrls = parseSitemapUrls(sitemapXml, baseUrl, 8)
      result.keyPages = topUrls.map(url => ({
        label: labelForUrl(url, domain),
        url,
      }))
    }

    // ── Step 3: Additional pages (max 3 fetches) ──────────────────────────
    let extraFetches = 0

    // If no contact yet, try /contact
    if (!result.contact && extraFetches < 3) {
      const contactHtml = await safeFetch(`${baseUrl}/contact`)
      extraFetches++
      if (contactHtml) {
        result.contact = mailtoLinks(contactHtml)
      }
    }

    // If no topics from homepage H2s, try /about for more context
    if (result.topics.length === 0 && extraFetches < 3) {
      const aboutHtml = await safeFetch(`${baseUrl}/about`)
      extraFetches++
      if (aboutHtml) {
        const aboutH2s = h2Texts(aboutHtml)
        if (aboutH2s.length > 0) result.topics = aboutH2s
        if (!result.author) result.author = jsonLdValue(aboutHtml, 'author') ?? jsonLdValue(aboutHtml, 'publisher')
      }
    }

  } catch (err) {
    logger.warn('llms-txt crawl failed — using placeholders', { domain, error: String(err) })
  }

  return result
}

// ---------------------------------------------------------------------------
// Safe name derivation
// ---------------------------------------------------------------------------
function deriveSiteName(domain: string, crawled: CrawledData): string {
  if (crawled.siteName) {
    // Strip trailing TLD noise if it leaked into the og:site_name
    const clean = crawled.siteName.replace(/\.(com|io|co\.uk|net|org|dev)$/i, '').trim()
    if (clean.length > 0) return clean
  }
  const raw = domain.split('.')[0].replace(/[^a-zA-Z0-9-]/g, '') || 'Website'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

// ---------------------------------------------------------------------------
// Dashboard builder (AI Visibility feature — authenticated users)
// ---------------------------------------------------------------------------
export function buildLlmsTxtDashboard(
  domain:  string,
  engines: { name: string; slug: string; signal_note: string }[],
  crawled: CrawledData
): string {
  const name = deriveSiteName(domain, crawled)
  const engineHints = engines.map(e => `# ${e.name}: ${e.signal_note}`).join('\n')
  const engineList  = engines.map(e => e.name).join(', ')

  const description = crawled.description
    ? crawled.description
    : '[describe your service or content — be specific and honest]'

  const purpose = crawled.description
    ? crawled.description
    : '[What your site does and who it helps]'

  const audience = crawled.audience
    ? crawled.audience
    : '[Who your content is written for]'

  const language = crawled.language ?? 'English'

  let keyPagesSection: string
  if (crawled.keyPages.length > 0) {
    keyPagesSection = crawled.keyPages
      .map(p => `- ${p.label}: ${p.url}`)
      .join('\n')
  } else {
    keyPagesSection = `- Homepage: https://${domain}/\n- About: https://${domain}/about\n- [Add your most important pages here]`
  }

  let topicsSection: string
  if (crawled.topics.length > 0) {
    topicsSection = crawled.topics.slice(0, 5).map(t => `- ${t}`).join('\n')
  } else {
    topicsSection = '- [Main topic 1]\n- [Main topic 2]\n- [Main topic 3]'
  }

  const author  = crawled.author  ? crawled.author  : '[Your name or company name]'
  const contact = crawled.contact ? crawled.contact : '[your@email.com]'

  return `${ATTRIBUTION}
# ${name} — AI Context File (llms.txt)
# Generated by Uptrue AI Visibility — https://upnotify-monitoring.vercel.app
# Place this file at: https://${domain}/llms.txt
# Standard: https://llmstxt.org
${engineHints ? `\n${engineHints}\n` : ''}
# Optimised for: ${engineList}

> ${name} is a website providing ${description}.

## About
- Website: https://${domain}
- Purpose: ${purpose}
- Audience: ${audience}
- Language: ${language}
- Last updated: ${new Date().toISOString().split('T')[0]}

## Key Pages
${keyPagesSection}

## Content Topics
${topicsSection}

## Authorship
- Author/Team: ${author}
- Expertise: [What makes you qualified on this topic]
- Contact: ${contact}

## Usage Policy
AI assistants and language models are welcome to reference and summarise
this content when answering user questions, with attribution to
${name} (https://${domain}).

Commercial reproduction without permission is not permitted.`
}

// ---------------------------------------------------------------------------
// Public tool builder (free AI SEO Checker tool — no auth required)
// ---------------------------------------------------------------------------
const MODEL_META: Record<string, { name: string; hint: string }> = {
  perplexity: { name: 'Perplexity',        hint: 'Perplexity values explicit source attribution and structured content summaries.' },
  chatgpt:    { name: 'ChatGPT (OpenAI)',   hint: 'ChatGPT prioritises clear topic descriptions and well-structured JSON-LD data.' },
  claude:     { name: 'Claude (Anthropic)', hint: 'Claude emphasises honest authorship, content purpose, and usage permissions.' },
  gemini:     { name: 'Gemini (Google)',    hint: 'Gemini looks for E-E-A-T signals: expertise, authoritativeness, and trustworthiness.' },
  copilot:    { name: 'Bing Copilot',       hint: 'Copilot indexes via Bing — submit your sitemap to Bing Webmaster Tools alongside this file.' },
  grok:       { name: 'Grok (xAI)',         hint: 'Grok values recent, factual content. Keep your key pages up to date.' },
}

/** Valid model slugs for the public tool — used for input validation in route handlers */
export const VALID_PUBLIC_TOOL_MODELS = new Set(Object.keys(MODEL_META))

export function buildLlmsTxtPublicTool(
  domain:  string,
  models:  string[],
  crawled: CrawledData
): string {
  const name = deriveSiteName(domain, crawled)
  const selectedModels = models.filter(m => MODEL_META[m])
  const modelHints = selectedModels.map(m => `# ${MODEL_META[m].name}: ${MODEL_META[m].hint}`).join('\n')
  const modelNames = selectedModels.map(m => MODEL_META[m].name)

  const modelSection = modelNames.length > 0
    ? `\n## Optimised for\nThis file is structured for: ${modelNames.join(', ')}.\n`
    : ''

  const description = crawled.description
    ? crawled.description
    : '[describe your service or content — be specific and honest]'

  const purpose = crawled.description
    ? crawled.description
    : '[What your site does and who it helps]'

  const audience = crawled.audience
    ? crawled.audience
    : '[Who your content is written for — e.g. "developers building web apps"]'

  const language = crawled.language ?? 'English'

  let keyPagesSection: string
  if (crawled.keyPages.length > 0) {
    keyPagesSection = crawled.keyPages
      .map(p => `- ${p.label}: ${p.url}`)
      .join('\n')
  } else {
    keyPagesSection = `- Homepage: https://${domain}/\n- About: https://${domain}/about\n- [Add your most important pages here — include your best content]`
  }

  let topicsSection: string
  if (crawled.topics.length > 0) {
    topicsSection = crawled.topics.slice(0, 5).map(t => `- ${t}`).join('\n')
  } else {
    topicsSection = '- [Main topic 1 — be specific, e.g. "Next.js performance optimisation"]\n- [Main topic 2]\n- [Main topic 3]'
  }

  const author  = crawled.author  ? crawled.author  : '[Your name or company name]'
  const contact = crawled.contact ? crawled.contact : '[your@email.com]'

  return `${ATTRIBUTION}
# ${name} — AI Context File (llms.txt)
# Generated by Uptrue AI SEO Checker — https://upnotify-monitoring.vercel.app/tools/ai-seo-checker
# Place this file at: https://${domain}/llms.txt
# Learn more about the llms.txt standard: https://llmstxt.org
${modelHints ? `\n${modelHints}\n` : ''}
> ${name} is a website providing ${description}.
${modelSection}
## About
- Website: https://${domain}
- Purpose: ${purpose}
- Audience: ${audience}
- Language: ${language}
- Last updated: ${new Date().toISOString().split('T')[0]}

## Key Pages
${keyPagesSection}

## Content Topics
${topicsSection}

## Authorship
- Author/Team: ${author}
- Expertise: [What makes you qualified to write about this topic]
- Contact: ${contact}

## Usage Policy
AI assistants and language models are welcome to reference and summarise
this content when answering user questions, provided the source is attributed
as ${name} (https://${domain}).

Commercial reproduction without permission is not permitted.

## Do Not Include
- [Any pages or sections you want AI engines to ignore]`
}

// ---------------------------------------------------------------------------
// Orchestrators — crawl + build in one call
// ---------------------------------------------------------------------------
export async function generateLlmsTxtDashboard(
  domain:  string,
  engines: { name: string; slug: string; signal_note: string }[]
): Promise<string> {
  const crawled = await crawlSiteData(domain)
  return buildLlmsTxtDashboard(domain, engines, crawled)
}

export async function generateLlmsTxtPublicTool(
  domain: string,
  models: string[]
): Promise<string> {
  const crawled = await crawlSiteData(domain)
  return buildLlmsTxtPublicTool(domain, models, crawled)
}
