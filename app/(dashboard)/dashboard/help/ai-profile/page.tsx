'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is AI Profile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI Profile is the inverse of AI Citation Monitoring. Instead of asking "for these keywords I picked, do AIs cite me?", it asks "what does each AI engine actually think my site is about?" We send a set of introspection questions about your domain to ChatGPT, Claude, Gemini, Perplexity, and Exa, and capture each engine\'s answer.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is AI Profile different from Citation Monitoring?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Citation Monitoring is outbound: you tell us your target keywords, we check if AIs cite you for them. AI Profile is inbound: we ask AIs to describe your site, and you discover what they think it is. Most users find that some AI engines have miscategorised them, or have outdated information, or don\'t recognise their site at all — none of which Citation Monitoring would surface.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does AI Profile use my Citation Monitor quota?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Each AI Profile run consumes one slot of your monthly AI Visibility quota — the same bucket as citation checks. So if your plan includes 10 AI Visibility runs per month, you can use any combination of citation checks and profile runs that adds up to 10.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does it mean when an engine "doesn\'t mention" my domain?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It means the AI engine answered the introspection question without naming your domain literally. This could be because: the engine has no knowledge of your site (training data gap), it knows your topic but not your specific brand (brand recognition gap), or it cited competitors instead. In all three cases, it\'s a sign that visitors who ask AI about your category will not be sent to you.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should I run an AI Profile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For an active site, monthly is a reasonable cadence — AI engines re-train periodically and your llms.txt updates take time to propagate. Running it after major site changes (new homepage, repositioned messaging, new categories) is also useful for spotting whether your repositioning has reached the AI layer.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I customise the introspection prompts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Custom prompts are managed by your account admin. The default set includes "What is your domain?", "Who is it for?", "What does it do best?", "When would you recommend it?", and "What category does it belong to?". An admin can add additional prompts (e.g., comparison questions or category-specific probes) from the admin panel.',
      },
    },
  ],
}

export default function AiProfileHelpPage(): React.ReactElement {
  const pathname = usePathname()

  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
        />

        <nav className="help-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard/help">Help Center</Link>
          <span className="help-breadcrumb-sep">/</span>
          <span>AI Profile</span>
        </nav>

        <h1 className="help-page-title">AI Profile — what AI thinks of you</h1>
        <p className="help-page-intro">
          AI Profile is the inbound counterpart to Citation Monitoring. Instead of testing whether
          AIs cite you for the keywords <em>you</em> care about, it reveals what AI engines
          <em> already think</em> your site is — in their own words.
        </p>

        {/* Why this matters — per the Boss decision to lead with macro context */}
        <section className="help-section">
          <h2 className="help-section-title">Why this matters</h2>
          <p>
            More buying journeys now start with &ldquo;Ask ChatGPT about X&rdquo; than with a Google search.
            By <strong>2027 it&apos;s expected to dominate</strong> high-intent product research, especially in
            travel, software, finance, and B2B services. Whoever the AI assistant recommends gets the
            click and the conversion.
          </p>
          <p>
            Two things shape what AI assistants recommend: <strong>what they know about you</strong>, and
            <strong> how they categorise you</strong>. Both can be wrong, both are invisible to you by default,
            and both decide whether AI sends visitors your way or to a competitor. AI Profile makes
            this visible.
          </p>
          <p>
            Concretely, AI Profile answers four questions you can&apos;t answer any other way:
          </p>
          <ul>
            <li><strong>Does AI know I exist?</strong> If an engine returns a generic &ldquo;I don&apos;t have specific information about that site&rdquo;, you&apos;re invisible to it.</li>
            <li><strong>What does it think I do?</strong> AIs frequently miscategorise sites. A boutique hotel might get classified as a travel agency. A B2B SaaS might be summarised as a consumer app.</li>
            <li><strong>What does it think I&apos;m best at?</strong> Reveals whether the differentiator you market is the one AI internalised — or something else entirely.</li>
            <li><strong>Who does it think I&apos;m for?</strong> If AI describes your audience differently than you do, your category-defining content is missing or being out-ranked.</li>
          </ul>
        </section>

        <section className="help-section">
          <h2 className="help-section-title">How it works</h2>
          <ol>
            <li>You enter your domain and pick which AI engines to ask (uses your active engines from
                AI Visibility settings).</li>
            <li>Uptrue sends each active introspection prompt — five by default, configurable by your admin —
                to every selected engine, with <code>{'{domain}'}</code> substituted with your site.</li>
            <li>Each engine&apos;s response is captured and stored. We highlight any mentions of your domain
                in green so you can see what the engine knows about you.</li>
            <li>You get a per-engine awareness summary: which engines mentioned your domain in any
                response (&ldquo;knows you&rdquo;) vs which didn&apos;t.</li>
          </ol>
          <p>
            A complete run takes 30–90 seconds depending on how many engines and prompts are active.
            Runs are stored permanently — you can return to past runs to track how AI&apos;s perception
            of your site has evolved.
          </p>
        </section>

        <section className="help-section">
          <h2 className="help-section-title">How to read the results</h2>
          <p>
            For each prompt × engine cell, focus on three signals:
          </p>
          <ul>
            <li><strong>Does the response mention your domain?</strong> If green-highlighted text appears,
                the engine knows you. If not, you&apos;re a knowledge gap to that engine.</li>
            <li><strong>What category does the engine place you in?</strong> Often surprising. AI engines
                sometimes describe sites by what was on the homepage three years ago.</li>
            <li><strong>Who does the engine think you&apos;re for?</strong> Compare the engine&apos;s answer
                against your real ICP. Mismatches are usually fixable with better landing-page copy and
                an updated llms.txt.</li>
          </ul>
        </section>

        <section className="help-section">
          <h2 className="help-section-title">What to do with the findings</h2>
          <ul>
            <li><strong>If an engine doesn&apos;t recognise your site at all</strong>, the most common cause is
                a robots.txt block on AI crawlers. Make sure GPTBot, ClaudeBot, PerplexityBot, and
                Google-Extended are not blocked. Then add a clear llms.txt at your site root.</li>
            <li><strong>If engines describe you in the wrong category</strong>, your homepage and llms.txt
                aren&apos;t making your purpose clear enough. Rewrite to lead with the unambiguous category
                and audience.</li>
            <li><strong>If only some engines recognise you</strong>, the gap is usually training data freshness.
                Different engines crawl at different cadences — Perplexity is near-real-time, ChatGPT
                lags by months. Keep publishing.</li>
            <li><strong>If engines describe an old version of your site</strong>, consider doing a one-off
                content refresh on your most-cited pages to push fresher signal into the next training cycle.</li>
          </ul>
        </section>

        <section className="help-section">
          <h2 className="help-section-title">Quota and pricing</h2>
          <p>
            AI Profile runs share the monthly AI Visibility quota with citation checks. One profile
            run consumes one slot of your plan&apos;s monthly limit. Free-tier users can run AI Profile
            with the free engines (Copilot, Exa). Paid plans access all engines.
          </p>
        </section>

        <section className="help-section">
          <h2 className="help-section-title">Frequently asked questions</h2>
          {FAQ_SCHEMA.mainEntity.map(({ name, acceptedAnswer }) => (
            <details key={name} className="help-faq-item">
              <summary>{name}</summary>
              <p>{acceptedAnswer.text}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  )
}
