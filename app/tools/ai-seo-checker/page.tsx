import type { Metadata } from 'next'
import { AiSeoCheckerTool } from '@/components/tools/ai-seo-checker-tool'

export const metadata: Metadata = {
  title: 'Free AI SEO Checker — Is Your Website Ready for AI Search?',
  description:
    'Check if ChatGPT, Perplexity, Claude, and Gemini can find and cite your website. Free AI readiness score, llms.txt generator, and crawler access audit. No signup required.',
  alternates: { canonical: 'https://uptrue.io/tools/ai-seo-checker' },
  openGraph: {
    title: 'Free AI SEO Checker | Uptrue',
    description:
      'Is your website ready for AI search? Check crawler access, generate your llms.txt, and get your AI readiness score free.',
    url: 'https://uptrue.io/tools/ai-seo-checker',
    type: 'website',
  },
}

export default function AiSeoCheckerPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <div className="tools-hero">
        <div className="ai-checker-hero-badge">AI Search Optimisation</div>
        <h1 className="tools-hero-title">AI SEO Checker</h1>
        <p className="tools-hero-subtitle">
          Is your website visible to ChatGPT, Perplexity, Claude, and Gemini?
          Get your AI readiness score, fix crawler blocks, and generate your llms.txt — free.
        </p>
      </div>

      <div className="tools-container" style={{ maxWidth: 860 }}>
        <AiSeoCheckerTool />

        {/* What is AI SEO */}
        <div className="tools-seo-section">
          <h2>What is AI SEO?</h2>
          <p>
            Traditional SEO gets you found on Google. <strong>AI SEO</strong> gets you cited by AI search engines —
            ChatGPT, Perplexity, Google Gemini, and Microsoft Copilot. When someone asks an AI assistant a question
            in your niche, you want your website to be the source it references.
          </p>
          <p>
            AI engines work differently from Google. They prioritise sites with clear structured data, explicit
            permissions for their crawlers, and content written for human understanding — not just keyword density.
          </p>

          <h3>The 4 pillars of AI readiness</h3>
          <div className="tools-info-grid" style={{ marginTop: 12 }}>
            <div className="tools-info-card">
              <h3>1. Crawler Access</h3>
              <p>Each AI engine sends its own bot. GPTBot, ClaudeBot, PerplexityBot — if your robots.txt blocks them, they can&apos;t index you.</p>
            </div>
            <div className="tools-info-card">
              <h3>2. llms.txt</h3>
              <p>A new standard file (like robots.txt) that tells AI models what your site is about and how to use your content in answers.</p>
            </div>
            <div className="tools-info-card">
              <h3>3. Structured Data</h3>
              <p>JSON-LD schema markup (Article, FAQ, HowTo, Organization) is how AI engines extract and verify facts about your content.</p>
            </div>
            <div className="tools-info-card">
              <h3>4. E-E-A-T Signals</h3>
              <p>Experience, Expertise, Authoritativeness, Trustworthiness. AI engines prioritise pages with clear authorship and credibility signals.</p>
            </div>
          </div>

          <h3>Which AI bots should you allow?</h3>
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
                <tr><td><code>GPTBot</code></td><td>ChatGPT (OpenAI)</td><td>Trains future ChatGPT models and populates ChatGPT Browse</td></tr>
                <tr><td><code>OAI-SearchBot</code></td><td>ChatGPT Search</td><td>Powers real-time search results in ChatGPT</td></tr>
                <tr><td><code>ClaudeBot</code></td><td>Claude (Anthropic)</td><td>Indexes content for Claude AI answers</td></tr>
                <tr><td><code>PerplexityBot</code></td><td>Perplexity AI</td><td>Perplexity cites sources explicitly — high referral traffic potential</td></tr>
                <tr><td><code>Google-Extended</code></td><td>Gemini / AI Overviews</td><td>Powers Google AI Overviews and Gemini responses</td></tr>
                <tr><td><code>Bingbot</code></td><td>Bing / Copilot</td><td>Powers Microsoft Copilot answers</td></tr>
              </tbody>
            </table>
          </div>

          <h3>What is llms.txt?</h3>
          <p>
            <code>llms.txt</code> is an emerging standard proposed by fast.ai. It&apos;s a plain text file placed at your domain root
            (e.g. <code>yourdomain.com/llms.txt</code>) that provides AI language models with a structured summary of your site —
            what it&apos;s about, what pages exist, and how the content can be used.
          </p>
          <p>
            Think of it as a README for AI. Sites with a well-written llms.txt are more likely to be cited accurately
            and frequently by AI assistants. Use the generator above to create yours in seconds.
          </p>

          <h3>Frequently asked questions</h3>
          <div className="tools-faq">
            <details className="tools-faq-item">
              <summary>Will allowing AI bots slow down my site?</summary>
              <p>No. AI crawlers are polite bots that respect crawl-delay settings. They visit infrequently and do not affect your site speed or real visitor experience.</p>
            </details>
            <details className="tools-faq-item">
              <summary>Does this tool actually check live AI citations?</summary>
              <p>The free checker audits your site&apos;s technical AI readiness (robots.txt, structured data, llms.txt). Live citation monitoring — tracking whether AI engines are actually citing you for specific keywords — is available with an Uptrue account.</p>
            </details>
            <details className="tools-faq-item">
              <summary>How is AI SEO different from traditional SEO?</summary>
              <p>Traditional SEO optimises for ranking in a list of blue links. AI SEO optimises for being cited as a source in a conversational AI answer. AI engines weight structured data, authorship, and directness of content more heavily than keyword density or backlink count.</p>
            </details>
            <details className="tools-faq-item">
              <summary>How often should I re-check my AI readiness?</summary>
              <p>After any major site changes — new pages, robots.txt edits, schema additions. For ongoing automated monitoring, set up an Uptrue AI Citation Monitor to track your visibility weekly.</p>
            </details>
          </div>
        </div>

      </div>
    </div>
  )
}
