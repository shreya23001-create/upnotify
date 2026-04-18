import type { Metadata } from 'next'
import { WebsiteSpeedTestTool } from '@/components/tools/website-speed-test-tool'

export const metadata: Metadata = {
  title: 'Free Website Speed Test — Check Page Load Time | Uptrue',
  description:
    'Test your website\'s response time and TTFB (Time to First Byte) instantly. Get a performance grade and actionable tips to speed up your site. Free tool, no signup.',
  alternates: { canonical: 'https://uptrue.io/tools/website-speed-test' },
  openGraph: {
    title: 'Free Website Speed Test — Check Page Load Time | Uptrue',
    description:
      'Test your website\'s TTFB and load time. Get a performance grade and actionable tips to speed up your site.',
    url: 'https://uptrue.io/tools/website-speed-test',
    type: 'website',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is TTFB (Time to First Byte)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TTFB (Time to First Byte) is the time between a browser sending an HTTP request and receiving the first byte of the response. It measures server responsiveness and is a key factor in both user experience and Core Web Vitals. A good TTFB is under 200ms.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a good website response time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Google recommends a TTFB under 200ms (grade A). Under 500ms is acceptable (grade B). Over 800ms starts to negatively affect user experience and SEO rankings. For e-commerce sites, even a 100ms improvement in response time can measurably increase conversions.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I speed up my website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Key steps to speed up your website: (1) Use a CDN like Cloudflare to serve content from edge locations close to your users. (2) Enable gzip or Brotli compression to reduce transfer size. (3) Optimise database queries and use caching (Redis, Memcached). (4) Use a faster hosting provider or upgrade your server. (5) Minify HTML, CSS, and JavaScript. (6) Optimise and lazy-load images.',
      },
    },
    {
      '@type': 'Question',
      name: 'What causes slow TTFB?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Common causes of slow TTFB include: slow server-side processing (complex database queries, inefficient code), no server-side caching, shared hosting with resource contention, no CDN (serving content from a distant server), network latency, and slow DNS resolution.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does website speed affect SEO?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Google has used page speed as a ranking factor since 2010, and Core Web Vitals (which include TTFB-related metrics) became a ranking signal in 2021. Faster sites also have lower bounce rates, higher engagement, and better conversion rates — all of which indirectly benefit SEO.',
      },
    },
  ],
}

export default function WebsiteSpeedTestPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="tools-hero">
        <h1 className="tools-hero-title">Website Speed Test</h1>
        <p className="tools-hero-subtitle">
          Test your website&apos;s TTFB (Time to First Byte) and total response time instantly.
          Get a performance grade A–F and actionable tips to speed up your site.
        </p>
      </div>

      <div className="tools-container">
        <WebsiteSpeedTestTool />

        <div className="tools-info-section">
          <h2>What does this tool measure?</h2>
          <div className="tools-info-grid">
            <div className="tools-info-card">
              <h3>TTFB (Time to First Byte)</h3>
              <p>How long your server takes to start responding. This is a Core Web Vitals metric and a direct ranking signal for Google Search.</p>
            </div>
            <div className="tools-info-card">
              <h3>Total Response Time</h3>
              <p>The full time to download the complete response body — useful for understanding bandwidth and content size impact.</p>
            </div>
            <div className="tools-info-card">
              <h3>Compression &amp; Caching</h3>
              <p>Checks whether gzip/Brotli compression is enabled and whether a CDN is serving cached content at the edge.</p>
            </div>
            <div className="tools-info-card">
              <h3>Performance Grade</h3>
              <p>Gives your site a grade from A (excellent, TTFB &lt;200ms) to F (very slow, TTFB &gt;1500ms) with specific improvement tips.</p>
            </div>
          </div>
        </div>

        <div className="tools-info-section">
          <h2>Performance Grading Scale</h2>
          <div className="tools-info-grid">
            <div className="tools-info-card">
              <h3 style={{ color: '#10b981' }}>Grade A — Excellent</h3>
              <p>TTFB under 200ms. Your server responds very quickly. No action needed.</p>
            </div>
            <div className="tools-info-card">
              <h3 style={{ color: '#22c55e' }}>Grade B — Good</h3>
              <p>TTFB 200–500ms. Good performance. Consider a CDN for further improvement.</p>
            </div>
            <div className="tools-info-card">
              <h3 style={{ color: '#f59e0b' }}>Grade C — Needs Work</h3>
              <p>TTFB 500–800ms. Noticeable to users. Review server-side caching and CDN setup.</p>
            </div>
            <div className="tools-info-card">
              <h3 style={{ color: '#ef4444' }}>Grade D/F — Slow</h3>
              <p>TTFB over 800ms. This will hurt SEO and user experience. Investigate server performance immediately.</p>
            </div>
          </div>
        </div>

        <div className="tools-info-section">
          <h2>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqSchema.mainEntity.map((faq, i) => (
              <div key={i} className="tools-info-card">
                <h3>{faq.name}</h3>
                <p>{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tools-cta">
          <h2>Monitor response time 24/7</h2>
          <p>
            Uptrue checks your website every 30 seconds and alerts you the moment response
            times degrade — before your users notice a slow site.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}
