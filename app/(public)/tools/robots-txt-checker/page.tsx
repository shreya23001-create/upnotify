import type { Metadata } from 'next'
import Link from 'next/link'
import { RobotsTxtCheckerTool } from '@/components/tools/robots-txt-checker-tool'

export const metadata: Metadata = {
  title: 'Free robots.txt Checker & Validator — Test Your robots.txt | Uptrue',
  description:
    'Check and validate your robots.txt file instantly. See if you\'re accidentally blocking Googlebot, find missing sitemaps, and validate crawl rules. Free tool.',
  alternates: { canonical: 'https://uptrue.io/tools/robots-txt-checker' },
  openGraph: {
    title: 'Free robots.txt Checker & Validator — Test Your robots.txt | Uptrue',
    description:
      'Validate your robots.txt instantly. Check Googlebot access, missing sitemaps, and crawl rules.',
    url: 'https://uptrue.io/tools/robots-txt-checker',
    type: 'website',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is robots.txt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'robots.txt is a text file placed at the root of a website (e.g., https://example.com/robots.txt) that tells search engine crawlers which pages or sections they are allowed or not allowed to crawl and index.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I stop Google from indexing my site?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Add the following to your robots.txt file:\n\nUser-agent: *\nDisallow: /\n\nThis will block all crawlers from all pages. For Googlebot specifically, use "User-agent: Googlebot" instead of "*". Note: robots.txt blocks crawling, but already-indexed pages may still appear in search results until they are recrawled.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does robots.txt affect SEO?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Incorrectly configured robots.txt can prevent Google from crawling important pages, hurting your search rankings. Common mistakes include accidentally blocking Googlebot, blocking CSS/JS files (which prevents Google from rendering your pages), or forgetting to declare your sitemap.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Disallow: / in robots.txt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '"Disallow: /" means the entire website is blocked for that user-agent. If applied to "User-agent: *", no search engine crawler can access any page on the site. This is one of the most common SEO mistakes — often introduced accidentally during development or migration.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I add a sitemap to robots.txt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Add a Sitemap directive at the end of your robots.txt file:\n\nSitemap: https://example.com/sitemap.xml\n\nYou can include multiple sitemap lines if you have more than one. This helps search engines find all your pages more efficiently.',
      },
    },
  ],
}

export default function RobotsTxtCheckerPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="tools-hero">
        <h1 className="tools-hero-title">robots.txt Checker</h1>
        <p className="tools-hero-subtitle">
          Fetch, parse, and validate any website&apos;s robots.txt file. Check if you&apos;re
          blocking Googlebot, find missing sitemaps, and view crawl rules for every user agent.
        </p>
      </div>

      <div className="tools-container">
        <RobotsTxtCheckerTool />

        <div className="tools-info-section">
          <h2>What does this tool check?</h2>
          <div className="tools-info-grid">
            <div className="tools-info-card">
              <h3>Googlebot &amp; Bingbot Access</h3>
              <p>Instantly flags if your robots.txt accidentally blocks Google or Bing crawlers, which can remove your site from search results.</p>
            </div>
            <div className="tools-info-card">
              <h3>Crawl Rules by Agent</h3>
              <p>Parses all User-agent blocks and shows every Allow, Disallow, and Crawl-delay directive in a readable format.</p>
            </div>
            <div className="tools-info-card">
              <h3>Sitemap Detection</h3>
              <p>Lists all Sitemap URLs declared in robots.txt so you can verify search engines can find your sitemap.</p>
            </div>
            <div className="tools-info-card">
              <h3>Raw File View</h3>
              <p>Shows the complete raw robots.txt content so you can spot formatting issues, comments, or unexpected directives.</p>
            </div>
          </div>
        </div>

        <div className="tools-info-section">
          <h2>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqSchema.mainEntity.map((faq, i) => (
              <div key={i} className="tools-info-card">
                <h3>{faq.name}</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tools-cta">
          <h2>Monitor your robots.txt for changes</h2>
          <p>
            Uptrue&apos;s <Link href="/monitoring/robots-txt-monitoring">robots.txt change monitoring</Link>{' '}
            alerts you the moment a deploy modifies your crawl rules. Pair it with{' '}
            <Link href="/monitoring/sitemap-monitoring">sitemap validity monitoring</Link> so a broken
            sitemap reference never silently sinks your indexation.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}
