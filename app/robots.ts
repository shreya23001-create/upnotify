import type { MetadataRoute } from 'next'

// AI / archival crawlers we explicitly welcome on public pages.
// A specific User-agent record overrides `*` for that bot, so an explicit
// stanza per bot signals intent, makes the policy auditable, and protects
// against future tooling that only inspects per-bot rules. See /llms.txt
// for a structured summary optimised for LLMs.
const WELCOMED_AI_BOTS = [
  'GPTBot',          // OpenAI training crawler
  'OAI-SearchBot',   // OpenAI search crawler
  'ChatGPT-User',    // ChatGPT live web fetches
  'ClaudeBot',       // Anthropic training crawler
  'anthropic-ai',    // Anthropic alias
  'PerplexityBot',   // Perplexity AI search
  'Google-Extended', // Google's AI training opt-in flag (separate from Googlebot)
  'Bingbot',         // Microsoft search + Copilot
  'cohere-ai',       // Cohere
  'Amazonbot',       // Amazon (also Alexa-driven crawls)
  'ia_archiver',     // Internet Archive
]

// Routes never indexable regardless of user-agent.
const INTERNAL_PATHS = ['/api/', '/dashboard/', '/settings/', '/admin/', '/invite/', '/auth/']

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'

  // Hard SEO rule: only the production host (uptrue.io / www.uptrue.io)
  // is indexable. dev.uptrue.io and Vercel preview deployments are blocked
  // for every user-agent so we never leak duplicate content into search.
  if (!isProduction) {
    return {
      rules: [
        { userAgent: '*', disallow: '/' },
      ],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: INTERNAL_PATHS,
      },
      ...WELCOMED_AI_BOTS.map(bot => ({
        userAgent: bot,
        allow: '/',
        disallow: INTERNAL_PATHS,
      })),
    ],
    sitemap: 'https://uptrue.io/sitemap.xml',
  }
}
