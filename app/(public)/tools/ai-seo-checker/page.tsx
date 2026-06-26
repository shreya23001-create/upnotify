import type { Metadata } from 'next'
import Link from 'next/link'
import { AiSeoCheckerTool } from '@/components/tools/ai-seo-checker-tool'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'Free AI SEO Checker — GEO, AEO & AI Visibility Score',
  description:
    'Check if ChatGPT, Perplexity, Claude, and Gemini can find and cite your website. Get your free AI readiness score across 4 categories — crawler access, content structure, trust signals, and schema. No signup required.',
  keywords: [
    'AI SEO checker',
    'GEO generative engine optimization',
    'AI search optimization',
    'answer engine optimization',
    'AEO checker',
    'LLMO',
    'AI visibility',
    'llms.txt generator',
    'AI citation monitoring',
    'AI search presence',
    'AI brand presence',
    'ChatGPT SEO',
    'Perplexity SEO',
    'is my website AI ready',
  ],
  alternates: { canonical: 'https://uptrue.io/tools/ai-seo-checker' },
  openGraph: {
    title: 'Free AI SEO Checker — Is Your Website Visible to AI Search? | Uptrue',
    description:
      'Get your AI readiness score in seconds. Check crawler access, structured data, trust signals, and generate your llms.txt — all free. No signup.',
    url: 'https://uptrue.io/tools/ai-seo-checker',
    type: 'website',
  },
}

const FAQ_ITEMS = [
  {
    question: 'What is GEO — Generative Engine Optimization?',
    answer: 'GEO (Generative Engine Optimization) is the practice of optimising your website so that AI language models like ChatGPT, Perplexity, and Gemini cite it as a source in their answers. It is the AI-era equivalent of traditional SEO but instead of ranking in a list of blue links, the goal is to be referenced verbatim in a conversational AI response. GEO is sometimes called AI Search Optimization, AIO (AI Optimization), or LLMO (LLM Optimization).',
  },
  {
    question: 'What is the difference between AI SEO, AEO, GEO, and LLMO?',
    answer: 'These terms all describe the same emerging discipline but come from different communities. GEO (Generative Engine Optimization) is the academically coined term gaining traction fast. AI Search Optimization is the plain-English marketing version. AEO (Answer Engine Optimization) is older — it originally covered voice search and featured snippets, but the SEO industry is repurposing it for AI. LLMO (LLM Optimization) is the developer and technical crowd\'s label. AI Visibility is used by enterprise SEO platforms like BrightEdge. At Uptrue we use "AI Visibility" for the dashboard feature and "AI SEO" for the free tool because they are the most broadly understood terms across all audiences.',
  },
  {
    question: 'How does this AI SEO checker work?',
    answer: 'Enter your website URL and our server fetches your robots.txt and homepage HTML in real time. We run 30 checks across 4 categories: AI Crawler Access (can bots like GPTBot and PerplexityBot reach you?), AI Content Structure (is your content formatted for AI extraction?), Trust and Authority (do you have the E-E-A-T signals AI engines rely on?), and Schema & Technical (is your structured data correctly implemented?). The result is a 0–100 AI readiness score with specific fixes for every issue found.',
  },
  {
    question: 'Will allowing AI crawlers slow down my website?',
    answer: 'No. AI crawlers like GPTBot, ClaudeBot, and PerplexityBot are polite bots that respect your crawl-delay settings in robots.txt. They visit infrequently — typically a few pages per day — and have no measurable impact on site speed or real visitor experience. In contrast, blocking them means you are invisible to the fastest-growing traffic source on the web.',
  },
  {
    question: 'What is llms.txt and why does it matter for AI search?',
    answer: 'llms.txt is an emerging open standard (proposed by fast.ai) for a plain text file placed at yourdomain.com/llms.txt. It works like a README for AI — giving language models a structured summary of what your site is about, what pages exist, and how your content can be used. Sites with a well-written llms.txt are more likely to be cited accurately, more frequently, and with correct attribution by AI assistants. Think of it as the robots.txt of the AI era. Sign up free to generate a tailored llms.txt from your Uptrue dashboard.',
  },
  {
    question: 'What is AI Citation Monitoring?',
    answer: 'AI Citation Monitoring tracks whether AI engines are actually citing your website when users ask questions in your niche. You give it target keywords, it queries AI engines like Perplexity (which provides explicit citation URLs) and analyses whether your domain appears in the responses. This moves beyond technical readiness into actual AI search presence measurement — showing you which topics you\'re winning and which competitors are being cited instead. Available with an Uptrue account.',
  },
  {
    question: 'How is AI SEO different from traditional SEO?',
    answer: 'Traditional SEO optimises for ranking in a list of blue links on a search engine results page. AI SEO (or GEO) optimises for being cited in a conversational AI answer. The ranking signals are different: AI engines weight structured data, explicit authorship and E-E-A-T signals, clear question-and-answer formatting, and freshness — rather than backlink count or keyword density. AI engines also consume your robots.txt and are beginning to use llms.txt as a direct instruction file. A site that ranks well on Google can still be invisible to AI search if it blocks crawlers or lacks structured content.',
  },
  {
    question: 'What are E-E-A-T signals and why do AI engines care?',
    answer: 'E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trustworthiness — originally a Google quality guideline, now adopted as a key signal by AI engines when deciding which sources to cite. Practically, this means: named author or byline, an About page that explains who you are, a Privacy Policy and Contact page, links to and from credible external sources, and consistent presence across the web. AI engines prefer to cite sources they can verify as legitimate. Your AI brand presence — how you appear across the web as a credible source — directly affects whether AI answers reference you.',
  },
  {
    question: 'Does this checker work on any website?',
    answer: 'Yes. Enter any publicly accessible URL — your homepage, a specific blog post, a product page, or a landing page. Each page is checked independently. A blog post, for example, should also have Article or BlogPosting JSON-LD schema, an author name, and a publication date — checks that would not be expected on a homepage.',
  },
  {
    question: 'How often should I re-check my AI readiness score?',
    answer: 'After any major site change — a robots.txt edit, new schema added, structural redesign, or new content published. For ongoing AI search presence monitoring, set up an Uptrue AI Citation Monitor to track your visibility automatically. Your technical readiness score is a foundation; the citation data tells you whether it is actually translating into AI search referrals.',
  },
  {
    question: 'What is AI search presence and how do I improve it?',
    answer: 'AI search presence is the aggregate measure of how often and how accurately AI engines cite your website in responses — combining technical readiness, content quality, and actual citation frequency. To improve it: first fix your AI readiness score (this tool tells you exactly what to fix), then generate and deploy your llms.txt, then use structured content with clear question-and-answer headings, and finally monitor actual citations with a tool like Uptrue AI Citation Monitor to see what is working.',
  },
]

export default function AiSeoCheckerPage(): React.ReactElement {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  const toolSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Free AI SEO Checker',
    url: 'https://uptrue.io/tools/ai-seo-checker',
    description: 'Free tool to check if your website is optimised for AI search engines. Scores AI crawler access, content structure, trust signals, and schema across ChatGPT, Perplexity, Claude, and Gemini.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
    },
    provider: {
      '@type': 'Organization',
      name: 'Uptrue',
      url: 'https://uptrue.io',
    },
    dateModified: new Date().toISOString().split('T')[0],
  }

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={toolSchema} />

      <div className="tools-page">
        <div className="tools-hero">
          <div className="ai-checker-hero-badge">AI Search Optimisation · GEO · AEO · LLMO</div>
          <h1 className="tools-hero-title">Free AI SEO Checker</h1>
          <p className="tools-hero-subtitle">
            Is your website visible to ChatGPT, Perplexity, Claude, and Gemini?
            Get your AI readiness score in seconds — check crawler access, content structure,
            trust signals, and schema. Fix what is blocking your AI search presence. Free, no signup.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
            <time dateTime={new Date().toISOString().split('T')[0]} suppressHydrationWarning>
              Updated {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </time>
            {' '}· Published by the{' '}
            <Link href="/about" style={{ color: 'var(--color-primary)' }}>Uptrue team</Link>
          </p>
        </div>

        <div className="tools-container" style={{ maxWidth: 860 }}>
          <AiSeoCheckerTool />

          {/* ----------------------------------------------------------------
              What is AI SEO / GEO
              ---------------------------------------------------------------- */}
          <div className="tools-seo-section">
            <h2>What is AI SEO — and why does it matter now?</h2>
            <p>
              Search is changing. In 2024, ChatGPT surpassed 100 million daily active users.
              Perplexity grew to over 500 million monthly queries. Google added AI Overviews to
              billions of search results. When someone asks an AI assistant a question in your
              niche, they get one answer — not a list of ten blue links. You either get cited,
              or you don&apos;t exist.
            </p>
            <p>
              <strong>AI SEO</strong> — also called{' '}
              <strong>GEO (Generative Engine Optimization)</strong>,{' '}
              <strong>Answer Engine Optimization (AEO)</strong>, or{' '}
              <strong>LLMO (LLM Optimization)</strong> — is the practice of
              making your website a source that AI engines cite with confidence. The signals
              that matter are different from traditional SEO: structured data, explicit crawler
              permissions, clear authorship, and content written for human understanding rather
              than keyword density.
            </p>
            <p>
              This free checker audits your website across the four pillars that determine your
              <strong> AI visibility</strong> and gives you an actionable fix for every issue.
            </p>

            {/* 4 pillars */}
            <h3>The 4 pillars of AI readiness</h3>
            <div className="tools-info-grid" style={{ marginTop: 12 }}>
              <div className="tools-info-card">
                <h3>1. AI Crawler Access</h3>
                <p>Each AI engine sends its own bot. GPTBot, ClaudeBot, PerplexityBot,
                Google-Extended — if your robots.txt blocks them (or doesn&apos;t exist),
                they cannot index you. This is the single biggest mistake most sites make.</p>
              </div>
              <div className="tools-info-card">
                <h3>2. Content Structure</h3>
                <p>AI engines extract answers from structured content. Question-style headings,
                numbered lists, clear definitions, and direct answers improve the chance of
                being cited verbatim. Thin pages and vague copy are invisible.</p>
              </div>
              <div className="tools-info-card">
                <h3>3. Trust &amp; E-E-A-T</h3>
                <p>Experience, Expertise, Authoritativeness, Trustworthiness. Named authors,
                About and Contact pages, Privacy Policy, external citations — these are how
                AI engines verify that your <strong>AI brand presence</strong> is legitimate.</p>
              </div>
              <div className="tools-info-card">
                <h3>4. Schema &amp; Technical</h3>
                <p>JSON-LD structured data (Organization, Article, FAQ, HowTo) is how AI engines
                extract and verify facts about your content. Combined with a well-written
                llms.txt, it gives AI models an explicit map of your site.</p>
              </div>
            </div>

            {/* Which bots to allow */}
            <h3>Which AI bots should you allow — and what do they power?</h3>
            <div className="tools-sla-comparison">
              <table className="tools-sla-table">
                <thead>
                  <tr>
                    <th>Bot name</th>
                    <th>AI Engine</th>
                    <th>Why allow it</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>GPTBot</code></td>
                    <td>ChatGPT (OpenAI)</td>
                    <td>Trains future ChatGPT models and populates ChatGPT Browse — the largest AI assistant user base</td>
                  </tr>
                  <tr>
                    <td><code>OAI-SearchBot</code></td>
                    <td>ChatGPT Search</td>
                    <td>Powers real-time search results in ChatGPT&apos;s search feature</td>
                  </tr>
                  <tr>
                    <td><code>ClaudeBot</code></td>
                    <td>Claude (Anthropic)</td>
                    <td>Indexes content for Claude AI answers and document analysis</td>
                  </tr>
                  <tr>
                    <td><code>PerplexityBot</code></td>
                    <td>Perplexity AI</td>
                    <td>Perplexity cites sources with explicit URLs — the highest direct referral traffic potential of any AI engine</td>
                  </tr>
                  <tr>
                    <td><code>Google-Extended</code></td>
                    <td>Gemini / AI Overviews</td>
                    <td>Powers Google AI Overviews (shown to billions of users) and Gemini responses</td>
                  </tr>
                  <tr>
                    <td><code>Bingbot</code></td>
                    <td>Bing / Copilot</td>
                    <td>Powers Microsoft Copilot, used across Windows, Edge, and Microsoft 365</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* llms.txt */}
            <h3>What is llms.txt — and why should you have one?</h3>
            <p>
              <code>llms.txt</code> is an{' '}
              <a
                href="https://llmstxt.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-primary)' }}
              >
                emerging open standard
              </a>{' '}
              for a plain text file at your domain root (e.g. <code>yourdomain.com/llms.txt</code>)
              that provides AI language models with a structured summary of your site — what it
              does, what pages exist, and how the content can be used. Think of it as a README
              for AI, or the robots.txt of the AI era.
            </p>
            <p>
              Sites with a well-written llms.txt are more likely to be cited accurately and
              frequently by AI assistants. The standard was proposed by{' '}
              <a
                href="https://www.fast.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-primary)' }}
              >
                fast.ai
              </a>{' '}
              and is gaining rapid adoption. Uptrue generates one tailored to your site and
              the specific AI engines you want to target — sign up free to access the generator
              in your dashboard.
            </p>

            {/* How to improve score */}
            <h3>How to improve your AI readiness score — step by step</h3>
            <p>
              Most sites fail on the same four issues. Fix them in this order and you will
              capture the majority of your missing points:
            </p>
            <ol style={{ paddingLeft: '1.5rem', lineHeight: 2 }}>
              <li>
                <strong>Create or fix your robots.txt.</strong> This is the most common and most
                costly mistake — a missing or over-restrictive robots.txt blocks all AI crawlers
                at once. Explicitly allow GPTBot, ClaudeBot, PerplexityBot, and Google-Extended.
              </li>
              <li>
                <strong>Generate and deploy your llms.txt.</strong> Even a simple one-page file
                improves your AI search presence by giving models a direct description of your site.
                Use the{' '}
                <Link href="/signup?next=/dashboard/ai-visibility" style={{ color: 'var(--color-primary)' }}>free Uptrue generator</Link>{' '}
                to create one tailored to selected AI engines.
              </li>
              <li>
                <strong>Add JSON-LD structured data.</strong> At minimum: Organization and WebSite
                schema on your homepage. Article or BlogPosting on content pages. FAQPage schema
                on any page with a FAQ section. This is the primary channel through which AI engines
                extract verified facts.
              </li>
              <li>
                <strong>Add question-style headings and FAQ sections.</strong> AI engines are built
                to answer questions. Pages with headings like &quot;What is X?&quot; and &quot;How does Y work?&quot;
                are far more frequently cited than pages that only describe features or products.
              </li>
              <li>
                <strong>Add authorship and E-E-A-T signals.</strong> A named author, a linked About
                page, a Privacy Policy, and social profile links all contribute to AI brand presence
                — the credibility layer that determines whether AI engines trust you as a source.
              </li>
            </ol>

            {/* The AI search terms */}
            <h3>How to think about AI search — the terminology explained</h3>
            <p>
              The field is moving fast and the terminology is still settling. Here is a quick
              reference for the terms you will encounter:
            </p>
            <div className="tools-sla-comparison">
              <table className="tools-sla-table">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Who uses it</th>
                    <th>What it means</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>GEO</strong> — Generative Engine Optimization</td>
                    <td>Academics, early adopters</td>
                    <td>Most technically precise term; covers all generative AI answer engines</td>
                  </tr>
                  <tr>
                    <td><strong>AI Search Optimization</strong></td>
                    <td>Marketing teams</td>
                    <td>Plain English umbrella term; broadly understood across all audiences</td>
                  </tr>
                  <tr>
                    <td><strong>LLMO</strong> — LLM Optimization</td>
                    <td>Developers, technical teams</td>
                    <td>Emphasises the LLM layer; includes RAG pipelines and model training data</td>
                  </tr>
                  <tr>
                    <td><strong>AEO</strong> — Answer Engine Optimization</td>
                    <td>SEO industry</td>
                    <td>Older term covering voice/featured snippets; being repurposed for AI</td>
                  </tr>
                  <tr>
                    <td><strong>AI Visibility</strong></td>
                    <td>Enterprise SEO platforms</td>
                    <td>Aggregate measure of how visible a brand is across AI answers</td>
                  </tr>
                  <tr>
                    <td><strong>AI Brand Presence</strong></td>
                    <td>PR and brand teams</td>
                    <td>How a brand appears (correctly, frequently, positively) in AI responses</td>
                  </tr>
                  <tr>
                    <td><strong>AI Citation Monitoring</strong></td>
                    <td>Tools like Uptrue</td>
                    <td>Actively tracking which AI engines cite your domain, for which queries</td>
                  </tr>
                  <tr>
                    <td><strong>AI Search Presence</strong></td>
                    <td>Emerging / mixed</td>
                    <td>Composite score of technical readiness + actual citation frequency</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FAQ */}
            <h3>Frequently asked questions about AI SEO and GEO</h3>
            <div className="tools-faq">
              {FAQ_ITEMS.map((item, i) => (
                <details key={i} className="tools-faq-item">
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              marginTop: 'var(--space-10)',
              padding: 'var(--space-8)',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.08))',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(59,130,246,0.2)',
              textAlign: 'center',
            }}>
              <h3 style={{ margin: '0 0 var(--space-2)' }}>
                Ready to monitor your AI search presence?
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 var(--space-6)' }}>
                This checker gives you a technical readiness score. Uptrue AI Visibility&trade; goes further —
                generate your llms.txt and track whether Perplexity, ChatGPT, and Gemini are actually
                citing you for your target keywords. Pair it with{' '}
                <Link href="/monitoring/robots-txt-monitoring">robots.txt change monitoring</Link> and{' '}
                <Link href="/monitoring/sitemap-monitoring">sitemap validity monitoring</Link> so an
                accidental Disallow or broken sitemap never silently blocks AI crawlers.
              </p>
              <Link href="/signup?next=/dashboard/ai-visibility" className="btn btn-primary" style={{ marginRight: 'var(--space-3)' }}>
                Get Started Free
              </Link>
              <Link href="/dashboard/ai-visibility" className="btn btn-outline-brand">
                View AI Visibility Dashboard
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
