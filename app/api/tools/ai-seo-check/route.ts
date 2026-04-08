import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Rate limiter — 10 checks per IP per hour
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

// ---------------------------------------------------------------------------
// SSRF protection — block private/internal IP ranges
// ---------------------------------------------------------------------------
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    const host = parsed.hostname.toLowerCase()
    // Block localhost, private ranges, metadata endpoints
    const blocked = [
      'localhost', '127.', '0.0.0.0', '::1',
      '10.', '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.',
      '172.24.', '172.25.', '172.26.', '172.27.',
      '172.28.', '172.29.', '172.30.', '172.31.',
      '192.168.', '169.254.',
      'metadata.google', 'metadata.aws',
    ]
    return !blocked.some(b => host === b || host.startsWith(b))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// HTML parsing helpers (regex-based — no external dependencies)
// ---------------------------------------------------------------------------
function extractMeta(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'))
  return m?.[1] ?? ''
}

function extractOg(html: string, property: string): string {
  const m = html.match(new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'))
  return m?.[1] ?? ''
}

function hasTag(html: string, tag: string): boolean {
  return new RegExp(`<${tag}[\\s>]`, 'i').test(html)
}

function countMatches(html: string, pattern: RegExp): number {
  return (html.match(pattern) ?? []).length
}

function extractJsonLd(html: string): string[] {
  const matches: string[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) matches.push(m[1])
  return matches
}

function hasSchemaType(jsonLdBlocks: string[], type: string): boolean {
  return jsonLdBlocks.some(b => b.includes(`"${type}"`))
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 2).length
}

function hasQuestionHeadings(html: string): boolean {
  const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) ?? []
  return headings.some(h => /\b(what|how|why|when|where|who|which|can|does|is|are)\b/i.test(h))
}

function hasDateSignal(html: string): boolean {
  return /(<time[^>]*datetime|datePublished|dateModified|article:published_time)/i.test(html)
}

function hasAuthorSignal(html: string): boolean {
  return /(author|byline|written by|by\s+[A-Z])/i.test(html)
    || /"author"\s*:/i.test(html)
    || /<meta[^>]+name=["']author["']/i.test(html)
}

function hasLinkTo(html: string, patterns: string[]): boolean {
  return patterns.some(p => new RegExp(`href=["'][^"']*${p}[^"']*["']`, 'i').test(html))
}

function hasExternalAuthoritativeLinks(html: string): boolean {
  return /(href=["']https?:\/\/(www\.)?(wikipedia\.org|gov\.|edu\.|bbc\.com|reuters\.com|ft\.com|theguardian\.com))/i.test(html)
}

function hasSocialLinks(html: string): boolean {
  return /(twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com)/i.test(html)
}

// ---------------------------------------------------------------------------
// robots.txt parser
// ---------------------------------------------------------------------------
interface RobotsResult {
  allowed:  string[]  // bot names that are explicitly allowed
  blocked:  string[]  // bot names that are explicitly blocked
  hasFile:  boolean
}

const AI_BOTS = [
  { slug: 'chatgpt',    name: 'ChatGPT',        tokens: ['GPTBot'] },
  { slug: 'oai-search', name: 'ChatGPT Browse',  tokens: ['OAI-SearchBot'] },
  { slug: 'claude',     name: 'Claude',          tokens: ['ClaudeBot', 'anthropic-ai'] },
  { slug: 'perplexity', name: 'Perplexity',      tokens: ['PerplexityBot'] },
  { slug: 'gemini',     name: 'Google AI',       tokens: ['Google-Extended'] },
  { slug: 'copilot',    name: 'Bing Copilot',    tokens: ['Bingbot'] },
]

async function fetchRobots(baseUrl: string): Promise<RobotsResult> {
  const result: RobotsResult = { allowed: [], blocked: [], hasFile: false }
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'UptrueSEOChecker/1.0 (+https://uptrue.io/tools/ai-seo-checker)' },
    })
    if (!res.ok) return result

    result.hasFile = true
    const text = await res.text()
    const lines = text.split('\n').map(l => l.trim().toLowerCase())

    let currentAgentIsAll = false
    let currentAgentIsTarget = false
    const disallowedForAll = new Set<string>()
    const disallowedForTarget = new Set<string>()

    for (const line of lines) {
      if (line.startsWith('user-agent:')) {
        const agent = line.replace('user-agent:', '').trim()
        currentAgentIsAll = agent === '*'
        currentAgentIsTarget = AI_BOTS.some(b =>
          b.tokens.some(t => agent === t.toLowerCase())
        )
      }
      if (line.startsWith('disallow:')) {
        const path = line.replace('disallow:', '').trim()
        if (path === '/' || path === '') {
          if (currentAgentIsAll) AI_BOTS.forEach(b => disallowedForAll.add(b.slug))
          if (currentAgentIsTarget) {
            AI_BOTS.filter(b => b.tokens.some(t =>
              lines.some(l => l === `user-agent: ${t.toLowerCase()}`)
            )).forEach(b => disallowedForTarget.add(b.slug))
          }
        }
      }
    }

    // Check each bot specifically
    for (const bot of AI_BOTS) {
      const isExplicitlyBlocked = bot.tokens.some(token => {
        const tokenLower = token.toLowerCase()
        const agentLine = lines.findIndex(l => l === `user-agent: ${tokenLower}`)
        if (agentLine === -1) return false
        for (let i = agentLine + 1; i < lines.length; i++) {
          if (lines[i].startsWith('user-agent:')) break
          if (lines[i] === 'disallow: /') return true
        }
        return false
      })

      const isBlockedByWildcard = disallowedForAll.has(bot.slug)

      if (!isExplicitlyBlocked && !isBlockedByWildcard) {
        result.allowed.push(bot.slug)
      } else {
        result.blocked.push(bot.slug)
      }
    }
  } catch {
    // robots.txt fetch failed — treat as no file
  }
  return result
}

// ---------------------------------------------------------------------------
// Main checker
// ---------------------------------------------------------------------------
export interface CheckResult {
  id:       string
  label:    string
  passed:   boolean
  points:   number
  category: string
  fix:      string
}

export interface CategoryScore {
  name:   string
  score:  number
  max:    number
}

export interface AiSeoCheckResult {
  domain:         string
  finalUrl:       string
  score:          number
  responseTimeMs: number
  pageSizeKb:     number
  categories:     CategoryScore[]
  checks:         CheckResult[]
  crawlers:       { slug: string; name: string; allowed: boolean; note: string }[]
  scannedAt:      string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again in an hour.' }, { status: 429 })
  }

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const rawUrl = (body.url ?? '').trim()
  const urlWithProtocol = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

  if (!isSafeUrl(urlWithProtocol)) {
    return NextResponse.json({ error: 'Please enter a valid public website URL.' }, { status: 400 })
  }

  const parsed   = new URL(urlWithProtocol)
  const baseUrl  = `${parsed.protocol}//${parsed.hostname}`
  const domain   = parsed.hostname

  try {
    // -----------------------------------------------------------------------
    // Fetch robots.txt and main page in parallel
    // -----------------------------------------------------------------------
    const fetchStart = Date.now()
    const [robotsResult, pageRes] = await Promise.all([
      fetchRobots(baseUrl),
      fetch(urlWithProtocol, {
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
        headers: { 'User-Agent': 'UptrueSEOChecker/1.0 (+https://uptrue.io/tools/ai-seo-checker)' },
      }).catch(() => null),
    ])
    const responseTimeMs = Date.now() - fetchStart

    if (!pageRes) {
      return NextResponse.json({ error: 'Could not reach that URL. Please check it is publicly accessible.' }, { status: 422 })
    }

    const finalUrl    = pageRes.url
    const contentType = pageRes.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'URL does not return an HTML page.' }, { status: 422 })
    }

    const html        = await pageRes.text()
    const pageSizeKb  = Math.round(Buffer.byteLength(html, 'utf8') / 1024)
    const plainText   = stripHtml(html)
    const wordCount   = countWords(plainText)
    const jsonLdBlocks = extractJsonLd(html)

    // Check llms.txt
    let hasLlmsTxt = false
    try {
      const llmsRes = await fetch(`${baseUrl}/llms.txt`, {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'UptrueSEOChecker/1.0' },
      })
      hasLlmsTxt = llmsRes.ok
    } catch { /* not found */ }

    // -----------------------------------------------------------------------
    // Build checks
    // -----------------------------------------------------------------------
    const checks: CheckResult[] = []

    // --- CATEGORY 1: AI Crawler Access (20 pts) ---
    const crawlerAllowedCount = robotsResult.allowed.length
    checks.push({
      id: 'robots_accessible', category: 'AI Crawler Access',
      label: 'robots.txt accessible',
      passed: robotsResult.hasFile, points: 2,
      fix: 'Create a robots.txt file at the root of your domain.',
    })
    checks.push({
      id: 'chatgpt_allowed', category: 'AI Crawler Access',
      label: 'GPTBot (ChatGPT) allowed',
      passed: robotsResult.allowed.includes('chatgpt'), points: 4,
      fix: 'Remove Disallow rules for GPTBot in your robots.txt.',
    })
    checks.push({
      id: 'claude_allowed', category: 'AI Crawler Access',
      label: 'ClaudeBot (Anthropic) allowed',
      passed: robotsResult.allowed.includes('claude'), points: 3,
      fix: 'Remove Disallow rules for ClaudeBot in your robots.txt.',
    })
    checks.push({
      id: 'perplexity_allowed', category: 'AI Crawler Access',
      label: 'PerplexityBot allowed',
      passed: robotsResult.allowed.includes('perplexity'), points: 4,
      fix: 'Remove Disallow rules for PerplexityBot in your robots.txt.',
    })
    checks.push({
      id: 'gemini_allowed', category: 'AI Crawler Access',
      label: 'Google-Extended (Gemini) allowed',
      passed: robotsResult.allowed.includes('gemini'), points: 4,
      fix: 'Remove Disallow rules for Google-Extended in your robots.txt.',
    })
    checks.push({
      id: 'llms_txt', category: 'AI Crawler Access',
      label: 'llms.txt file present',
      passed: hasLlmsTxt, points: 3,
      fix: `Create a /llms.txt file at https://${domain}/llms.txt. Sign up free to generate one tailored to your site.`,
    })

    // --- CATEGORY 2: AI Content Structure (25 pts) ---
    checks.push({
      id: 'word_count', category: 'AI Content Structure',
      label: `Sufficient content (${wordCount} words)`,
      passed: wordCount >= 300, points: 5,
      fix: 'Add more content — pages under 300 words are too thin for AI engines to confidently cite.',
    })
    checks.push({
      id: 'question_headings', category: 'AI Content Structure',
      label: 'Question-style headings (What / How / Why)',
      passed: hasQuestionHeadings(html), points: 5,
      fix: 'Add headings that answer questions directly (e.g. "What is X?", "How does Y work?"). AI engines use these to extract answers.',
    })
    checks.push({
      id: 'faq_section', category: 'AI Content Structure',
      label: 'FAQ section or FAQPage schema',
      passed: hasSchemaType(jsonLdBlocks, 'FAQPage') || /\bfaq\b/i.test(html), points: 5,
      fix: 'Add an FAQ section to your page. AI assistants frequently cite FAQs verbatim when answering user questions.',
    })
    checks.push({
      id: 'lists', category: 'AI Content Structure',
      label: 'Lists and bullet points present',
      passed: countMatches(html, /<li[>\s]/gi) >= 3, points: 5,
      fix: 'Use bullet lists and numbered lists. They are easier for AI engines to extract and summarise.',
    })
    checks.push({
      id: 'date_signal', category: 'AI Content Structure',
      label: 'Content freshness date present',
      passed: hasDateSignal(html), points: 5,
      fix: 'Add a published/updated date using <time datetime="..."> or datePublished JSON-LD. AI engines prefer recent, dated content.',
    })

    // --- CATEGORY 3: Trust & Authority (25 pts) ---
    checks.push({
      id: 'author_signal', category: 'Trust & Authority',
      label: 'Author or E-E-A-T signals present',
      passed: hasAuthorSignal(html), points: 6,
      fix: 'Add a visible author name, bio, or "Written by" attribution. AI engines weight content from identified authors more highly.',
    })
    checks.push({
      id: 'about_page', category: 'Trust & Authority',
      label: 'About page linked',
      passed: hasLinkTo(html, ['/about', '/about-us', 'about.html']), points: 5,
      fix: 'Link to an About page from your main navigation. It signals legitimacy to AI engines.',
    })
    checks.push({
      id: 'contact_page', category: 'Trust & Authority',
      label: 'Contact page linked',
      passed: hasLinkTo(html, ['/contact', '/contact-us', 'contact.html']), points: 4,
      fix: 'Add a contact page. AI engines treat contactable sites as more trustworthy.',
    })
    checks.push({
      id: 'privacy_policy', category: 'Trust & Authority',
      label: 'Privacy policy linked',
      passed: hasLinkTo(html, ['/privacy', '/privacy-policy', 'privacy.html']), points: 4,
      fix: 'Add a privacy policy page — required for GDPR compliance and a trust signal for AI engines.',
    })
    checks.push({
      id: 'external_auth_links', category: 'Trust & Authority',
      label: 'Links to authoritative external sources',
      passed: hasExternalAuthoritativeLinks(html), points: 3,
      fix: 'Link out to reputable sources (Wikipedia, government sites, major publications). AI engines use external citations as a credibility signal.',
    })
    checks.push({
      id: 'social_links', category: 'Trust & Authority',
      label: 'Social media presence linked',
      passed: hasSocialLinks(html), points: 3,
      fix: 'Add links to your social media profiles. Consistent web presence signals legitimacy.',
    })

    // --- CATEGORY 4: Schema & Technical (30 pts) ---
    checks.push({
      id: 'json_ld', category: 'Schema & Technical',
      label: 'JSON-LD structured data present',
      passed: jsonLdBlocks.length > 0, points: 6,
      fix: 'Add JSON-LD structured data to your page. This is the primary way AI engines extract verified facts about your content.',
    })
    checks.push({
      id: 'schema_website', category: 'Schema & Technical',
      label: 'WebSite or Organization schema',
      passed: hasSchemaType(jsonLdBlocks, 'WebSite') || hasSchemaType(jsonLdBlocks, 'Organization'), points: 5,
      fix: 'Add WebSite and Organization JSON-LD schema to your homepage. This tells AI engines who you are.',
    })
    checks.push({
      id: 'schema_article', category: 'Schema & Technical',
      label: 'Article or BlogPosting schema',
      passed: hasSchemaType(jsonLdBlocks, 'Article') || hasSchemaType(jsonLdBlocks, 'BlogPosting'), points: 4,
      fix: 'Add Article or BlogPosting JSON-LD to content pages. AI engines use this to verify authorship and publication date.',
    })
    checks.push({
      id: 'meta_description', category: 'Schema & Technical',
      label: 'Meta description present',
      passed: extractMeta(html, 'description').length > 0, points: 3,
      fix: 'Add a meta description tag. AI engines use this as a concise summary of the page.',
    })
    checks.push({
      id: 'open_graph', category: 'Schema & Technical',
      label: 'Open Graph tags (og:title, og:description)',
      passed: extractOg(html, 'title').length > 0 && extractOg(html, 'description').length > 0, points: 3,
      fix: 'Add Open Graph meta tags. These help AI engines understand the page\'s title and summary.',
    })
    checks.push({
      id: 'canonical', category: 'Schema & Technical',
      label: 'Canonical URL set',
      passed: /<link[^>]+rel=["']canonical["']/i.test(html), points: 2,
      fix: 'Add a <link rel="canonical"> tag to prevent AI engines indexing duplicate content.',
    })
    checks.push({
      id: 'viewport', category: 'Schema & Technical',
      label: 'Mobile viewport configured',
      passed: /<meta[^>]+name=["']viewport["']/i.test(html), points: 2,
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">. AI crawlers use mobile-first indexing.',
    })
    checks.push({
      id: 'lang_attr', category: 'Schema & Technical',
      label: 'Language declared (html lang attribute)',
      passed: /<html[^>]+lang=["']/i.test(html), points: 2,
      fix: 'Add a lang attribute to your <html> tag (e.g. <html lang="en">). AI engines use this to determine the language of your content.',
    })
    checks.push({
      id: 'response_time', category: 'Schema & Technical',
      label: `Page response time (${responseTimeMs}ms)`,
      passed: responseTimeMs < 3000, points: 2,
      fix: 'Your page takes over 3 seconds to load. Slow pages are crawled less frequently by AI engines.',
    })
    checks.push({
      id: 'h1_present', category: 'Schema & Technical',
      label: 'H1 heading present',
      passed: hasTag(html, 'h1'), points: 1,
      fix: 'Add a single H1 heading to your page. AI engines use it as the primary topic signal.',
    })

    // -----------------------------------------------------------------------
    // Calculate scores per category
    // -----------------------------------------------------------------------
    const categoryNames = ['AI Crawler Access', 'AI Content Structure', 'Trust & Authority', 'Schema & Technical']
    const categories: CategoryScore[] = categoryNames.map(name => {
      const catChecks = checks.filter(c => c.category === name)
      return {
        name,
        score: catChecks.filter(c => c.passed).reduce((s, c) => s + c.points, 0),
        max:   catChecks.reduce((s, c) => s + c.points, 0),
      }
    })
    const score = categories.reduce((s, c) => s + c.score, 0)

    // -----------------------------------------------------------------------
    // Crawler summary
    // -----------------------------------------------------------------------
    const crawlers = AI_BOTS.map(bot => ({
      slug:    bot.slug,
      name:    bot.name,
      allowed: robotsResult.allowed.includes(bot.slug),
      note:    robotsResult.allowed.includes(bot.slug) ? 'Allowed' : 'Blocked or not specified',
    }))

    const result: AiSeoCheckResult = {
      domain,
      finalUrl,
      score,
      responseTimeMs,
      pageSizeKb,
      categories,
      checks,
      crawlers,
      scannedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)

  } catch (error) {
    logger.error('ai-seo-check failed', { error: String(error), url: urlWithProtocol })
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}
