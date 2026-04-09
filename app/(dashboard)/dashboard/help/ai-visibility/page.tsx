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
      name: 'What is a llms.txt file and why do I need one?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A llms.txt file is a plain-text file you place at the root of your website (e.g. yourdomain.com/llms.txt). It tells AI language models — ChatGPT, Perplexity, Gemini, Claude, and others — what your site is about, what your key pages are, and how you want to be described. Without it, AI engines have to guess from your HTML. With it, you give them accurate, structured context so they cite you correctly and more often.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is AI Citation Monitoring?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI Citation Monitoring checks whether real AI engines — ChatGPT, Perplexity, Gemini, and others — are actually mentioning your domain when users ask about your topic or industry. Uptrue queries each engine with your target keywords and analyses the responses for citations of your domain. The result is a citation score and a breakdown of which engines cite you and which do not.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between GEO and AEO?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'GEO (Generative Engine Optimisation) is the practice of optimising your content so AI-powered search engines and chatbots include your site in their generated answers. AEO (Answer Engine Optimisation) focuses on making your content the best answer to specific questions. Both are about being cited by AI, not just ranked by traditional search engines. Your llms.txt file is a foundational step for both.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should I regenerate my llms.txt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Regenerate your llms.txt whenever you add major new sections, products, or pages to your site, or when your core description changes. AI engines re-crawl llms.txt periodically, so keeping it current helps them cite you accurately. For most sites, updating it every 1–3 months or after a significant content launch is sufficient.',
      },
    },
  ],
}

export default function AiVisibilityHelpPage(): React.ReactElement {
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
          <span>AI Visibility</span>
        </nav>

        <article className="help-article">
          <h1 className="help-article-title">AI Visibility — llms.txt &amp; Citation Monitor</h1>
          <p className="help-article-intro">
            Search is changing. ChatGPT, Perplexity, Gemini, and Claude are answering questions
            directly — and the sites they cite get the traffic. AI Visibility helps you control
            how AI engines understand and reference your website.
          </p>

          <section className="help-section">
            <h2 className="help-section-title">What AI Visibility does</h2>
            <p>
              AI Visibility gives you two tools in one place:
            </p>
            <ul className="help-list">
              <li>
                <strong>llms.txt Generator</strong> — creates a structured plain-text file that
                tells AI engines exactly what your site is, who you are, and which pages matter.
                You upload it to your web root once and AI engines find it automatically.
              </li>
              <li>
                <strong>AI Citation Monitor</strong> — queries real AI engines with your target
                keywords and checks whether they cite your domain. You get a citation score and
                a breakdown per engine.
              </li>
            </ul>
            <p>
              Together these tools cover the two fundamentals of GEO (Generative Engine Optimisation)
              and AEO (Answer Engine Optimisation): making your site understandable to AI, and
              measuring whether that is working.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How to generate your llms.txt</h2>
            <ol className="help-steps">
              <li>
                Go to <strong>AI Visibility</strong> in the sidebar. The <strong>llms.txt Generator</strong> tab
                opens by default.
              </li>
              <li>
                Enter your domain in the <strong>Your domain</strong> field — e.g. <code>mywebsite.com</code>.
                Do not include <code>https://</code>.
              </li>
              <li>
                Select which <strong>AI engines to optimise for</strong>. All engines are selected by default.
                Each chip shows a signal quality indicator — higher signal means that engine actively
                crawls and reads llms.txt files.
              </li>
              <li>
                Click <strong>Generate llms.txt</strong>. Uptrue calls the AI engine and drafts a
                structured file for your domain. This takes a few seconds.
              </li>
              <li>
                Review the output. You will see placeholder sections marked with <code>[placeholder]</code> —
                fill these in with your real site description, key pages, and author details before uploading.
                The more specific you are, the better AI engines will understand you.
              </li>
              <li>
                Click <strong>Copy</strong> or <strong>Download</strong> to get the file.
              </li>
              <li>
                Upload the file to your web root so it is accessible at <code>https://yourdomain.com/llms.txt</code>.
                See the deployment steps below for platform-specific instructions.
              </li>
              <li>
                Verify by visiting <code>https://yourdomain.com/llms.txt</code> in your browser and
                running the <Link href="/tools/ai-seo-checker" target="_blank">free AI SEO Checker</Link> on
                your domain — the llms.txt check should now pass.
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Deploying your llms.txt</h2>
            <p>The file must be publicly accessible at the root of your domain. Here is how to do it on common platforms:</p>
            <ul className="help-list">
              <li>
                <strong>WordPress</strong> — upload via FTP or your hosting File Manager to the root folder
                (same level as <code>wp-config.php</code>). Or use a plugin like Yoast to add a custom file route.
              </li>
              <li>
                <strong>Webflow</strong> — go to <em>Project Settings → Publishing → Static Files</em> and upload
                <code>llms.txt</code> there. It will be served from your root automatically.
              </li>
              <li>
                <strong>Squarespace</strong> — go to <em>Settings → Advanced → Code Injection</em> or use the
                URL Mappings feature. Note: Squarespace has limited support for arbitrary root files — check
                their current docs for the best approach.
              </li>
              <li>
                <strong>Vercel / Netlify</strong> — place the file in your <code>public/</code> folder. It will
                be deployed to your root on the next build.
              </li>
              <li>
                <strong>Custom server (nginx / Apache)</strong> — place the file in your web root
                (e.g. <code>/var/www/html/llms.txt</code>). No special configuration needed.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">What a llms.txt file looks like</h2>
            <p>
              The generated file is plain text. A typical llms.txt includes:
            </p>
            <ul className="help-list">
              <li>
                <strong>Site title and description</strong> — a concise summary of what your site does.
              </li>
              <li>
                <strong>Key pages</strong> — your most important URLs with short descriptions, so AI
                engines know where to find your best content.
              </li>
              <li>
                <strong>Author or organisation details</strong> — who is behind the site.
              </li>
              <li>
                <strong>Topics and categories</strong> — the main subjects your site covers.
              </li>
            </ul>
            <p>
              Fill in the <code>[placeholder]</code> sections before uploading. A generic file is
              better than nothing, but a specific, accurate file produces far better citation results.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How to use the AI Citation Monitor</h2>
            <ol className="help-steps">
              <li>
                Switch to the <strong>AI Citation Monitor</strong> tab at the top of the AI Visibility page.
              </li>
              <li>
                Enter your domain and the <strong>keywords</strong> you want to check — these are the search
                queries your potential customers would type into ChatGPT or Perplexity. Separate keywords with
                commas.
              </li>
              <li>
                Select which <strong>AI engines</strong> to check. Free plan users can check free engines only.
                Paid plans unlock all engines.
              </li>
              <li>
                Click <strong>Run Citation Check</strong>. The check runs asynchronously — it queries each AI
                engine with each keyword and analyses the responses. You will receive an email when it completes.
              </li>
              <li>
                Review your citation score. You will see which engines cite you and which do not, along with
                the confidence level for each result.
              </li>
            </ol>
            <p>
              Use the results to prioritise which engines to focus on and to measure improvement after
              uploading your llms.txt or publishing new content.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Plan limits</h2>
            <p>AI Visibility limits depend on your plan:</p>
            <ul className="help-list">
              <li><strong>Free</strong> — 1 llms.txt generation (lifetime). Citation checks on free engines only.</li>
              <li><strong>Lite</strong> — Unlimited llms.txt generations. 2 citation checks per month.</li>
              <li><strong>Builder</strong> — Unlimited llms.txt generations. 4 citation checks per month.</li>
              <li><strong>Scale</strong> — Unlimited llms.txt generations. 4 citation checks per month.</li>
            </ul>
            <p>
              Citation check limits reset on the 1st of each month.{' '}
              <Link href="/dashboard/settings?tab=billing">Upgrade your plan</Link> to increase your limits.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Frequently asked questions</h2>

            <div className="help-faq">
              <div className="help-faq-item">
                <h3 className="help-faq-q">What is a llms.txt file and why do I need one?</h3>
                <p className="help-faq-a">
                  A llms.txt file is a plain-text file you place at the root of your website. It tells AI
                  language models — ChatGPT, Perplexity, Gemini, Claude, and others — what your site is about,
                  what your key pages are, and how you want to be described. Without it, AI engines have to guess
                  from your HTML. With it, you give them accurate, structured context so they cite you correctly
                  and more often.
                </p>
              </div>

              <div className="help-faq-item">
                <h3 className="help-faq-q">What is AI Citation Monitoring?</h3>
                <p className="help-faq-a">
                  AI Citation Monitoring checks whether real AI engines are actually mentioning your domain when
                  users ask about your topic or industry. Uptrue queries each engine with your target keywords and
                  analyses the responses for citations of your domain. The result is a citation score and a
                  breakdown of which engines cite you and which do not.
                </p>
              </div>

              <div className="help-faq-item">
                <h3 className="help-faq-q">What is the difference between GEO and AEO?</h3>
                <p className="help-faq-a">
                  GEO (Generative Engine Optimisation) is the practice of optimising your content so AI-powered
                  search engines and chatbots include your site in their generated answers. AEO (Answer Engine
                  Optimisation) focuses on making your content the definitive answer to specific questions.
                  Both are about being cited by AI, not just ranked by traditional search. Your llms.txt is a
                  foundational step for both.
                </p>
              </div>

              <div className="help-faq-item">
                <h3 className="help-faq-q">How often should I regenerate my llms.txt?</h3>
                <p className="help-faq-a">
                  Regenerate whenever you add major new sections, products, or pages, or when your core
                  description changes. For most sites, updating it every 1–3 months or after a significant
                  content launch is sufficient. AI engines re-crawl llms.txt periodically, so keeping it
                  current helps them cite you accurately.
                </p>
              </div>

              <div className="help-faq-item">
                <h3 className="help-faq-q">Does llms.txt replace robots.txt?</h3>
                <p className="help-faq-a">
                  No. robots.txt controls which pages crawlers are allowed to visit. llms.txt provides context
                  about your site to AI engines. You need both. Make sure your robots.txt does not block
                  AI crawlers — run the <Link href="/tools/ai-seo-checker" target="_blank">free AI SEO Checker</Link> to
                  check whether GPTBot, ClaudeBot, PerplexityBot, and Google-Extended are allowed.
                </p>
              </div>
            </div>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/watchdog" className="help-next-link">
              Watchdog — Competitor Tracking &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
