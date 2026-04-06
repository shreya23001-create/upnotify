import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'What Is a Good Website Response Time? (And How to Fix a Slow Server)',
  description:
    'What is a good website response time? Under 200ms is excellent, under 800ms is acceptable, over 2 seconds is damaging. Learn what drives slow server response times (TTFB), how to fix each cause, and how to monitor response time continuously.',
  alternates: { canonical: 'https://uptrue.io/blog/website-response-time' },
  openGraph: {
    title: 'What Is a Good Website Response Time? (And How to Fix a Slow Server)',
    description:
      'Learn what good website response time looks like, what causes slow TTFB, and how to fix server response time. With benchmarks, diagnosis steps, and monitoring guide.',
    url: 'https://uptrue.io/blog/website-response-time',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Is a Good Website Response Time? (And How to Fix a Slow Server)',
    description:
      'What good server response time looks like, what causes high TTFB, and how to fix a slow server. Benchmarks, diagnosis, and monitoring.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is a good server response time (TTFB)?',
    answer:
      'Google classifies Time to First Byte (TTFB) as fast when it is under 200ms, moderate between 200ms and 500ms, and slow above 600ms. For practical purposes: under 200ms is excellent and your server is not the bottleneck, 200ms–800ms is acceptable for most websites, 800ms–2,000ms is noticeably slow and worth investigating, and above 2,000ms is seriously damaging to user experience and search rankings. Note that these thresholds apply to the server response time specifically — not total page load time, which includes downloading CSS, JavaScript, images, and fonts.',
  },
  {
    question: 'Is website response time the same as page load time?',
    answer:
      'No. Website response time (TTFB — Time to First Byte) is the time from the browser sending a request to receiving the first byte of the server\'s response. Page load time is the total time until the entire page — including all images, scripts, and stylesheets — has loaded. Response time is a server-side metric; page load time includes both server processing and the time to download all page resources. A site can have excellent TTFB (fast server) but slow page load time (too many large images or blocking JavaScript). TTFB is typically the most important metric to optimise first because nothing else can start until the first byte arrives.',
  },
  {
    question: 'How do I check my website response time?',
    answer:
      'Open your browser\'s developer tools (F12), go to the Network tab, reload the page, click on the first HTML document in the list, and look at the "Waiting (TTFB)" value in the Timing section. For more detailed analysis, use Google PageSpeed Insights (look for "Reduce initial server response time" under Opportunities), WebPageTest.org (waterfall view shows TTFB clearly), or GTmetrix. For ongoing monitoring rather than one-off tests, use an uptime monitoring tool like Uptrue that checks your TTFB every minute and alerts you when it exceeds a threshold.',
  },
  {
    question: 'Does slow response time affect Google rankings?',
    answer:
      'Yes, indirectly. Google uses Core Web Vitals as a ranking signal, and TTFB directly affects Largest Contentful Paint (LCP). A page cannot start rendering until the first byte arrives, so if your TTFB is 2 seconds, your LCP cannot be better than 2 seconds — and Google\'s threshold for "good" LCP is 2.5 seconds. High TTFB also increases bounce rate, which is a user experience signal Google considers. Additionally, Chrome labels pages as "usually slow" based on aggregated performance data from real users, which can deter clicks from search results even before someone visits your site.',
  },
  {
    question: 'My website is fast in my browser but slow for visitors. Why?',
    answer:
      'Several factors can explain this discrepancy. First, browser caching: your browser caches your site aggressively after multiple visits, so it loads fast for you but is slower for first-time visitors. Second, geography: if you are geographically close to your server but your visitors are not, they experience higher latency. Test from multiple locations using tools like WebPageTest or Uptrue\'s multi-region monitoring. Third, server load: your site may be fast when you are the only one on it but slow under real traffic. Fourth, your ISP: your internet connection speed and routing affects perceived response time from your location.',
  },
]

export default function WebsiteResponseTimePage(): React.ReactElement {
  return (
    <article className="blog-article">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_DATA.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'What Is a Good Website Response Time? (And How to Fix a Slow Server)',
          description: 'What good website response time looks like, what causes high TTFB, how to fix slow server response, and how to monitor it continuously.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-04-06',
          dateModified: '2026-04-06',
          url: 'https://uptrue.io/blog/website-response-time',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Performance</span>
          <span>6 April 2026</span>
          <span>13 min read</span>
        </div>
        <h1 className="blog-article-title">What Is a Good Website Response Time? (And How to Fix a Slow Server)</h1>
        <p className="blog-article-subtitle">
          Server response time is the foundation of web performance. Before your page can start rendering, the server has to respond. Here is what good looks like, what bad looks like, and what to do when yours is too slow.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>What website response time actually measures</h2>

        <p>
          Website response time — more precisely called Time to First Byte (TTFB) — measures the time between a browser sending a request to your server and receiving the first byte of the response. It captures the entire server-side processing time: DNS resolution, TCP connection setup, TLS handshake (for HTTPS), server processing, and the start of the response transmission.
        </p>

        <p>
          TTFB is important because it is the starting gun for everything else. The browser cannot start parsing HTML, building the DOM tree, requesting CSS and JavaScript files, or rendering anything until it receives that first byte. A slow TTFB means every subsequent step in the page load is delayed by the same amount.
        </p>

        <p>
          A page with a TTFB of 2 seconds and a total load time of 5 seconds cannot achieve a total load time under 2 seconds — even if you optimise every other aspect of the page. TTFB is the floor of your performance. You cannot go faster than it.
        </p>

        <h2>What good, acceptable, and poor response times look like</h2>

        <p>
          Here are the benchmarks that matter, based on Google&apos;s web.dev guidance and real-world performance expectations:
        </p>

        <h3>Under 200ms — Excellent</h3>

        <p>
          A TTFB under 200ms is excellent. The server is responding almost instantly. At this level, TTFB is not a meaningful bottleneck — the browser starts rendering quickly and overall page performance is determined primarily by how much the page needs to download and render. Well-configured servers on quality hosting, combined with a CDN and effective caching, routinely achieve sub-200ms TTFB for cached pages.
        </p>

        <h3>200ms–800ms — Acceptable</h3>

        <p>
          A TTFB between 200ms and 800ms is acceptable for most websites. Visitors will not consciously notice the delay, though it contributes to overall page load time. Most well-run websites on shared hosting with caching enabled fall in this range. Google PageSpeed Insights will not flag this as a critical issue.
        </p>

        <h3>800ms–2,000ms — Slow</h3>

        <p>
          A TTFB between 800ms and 2 seconds is noticeably slow. Visitors may notice the slight delay before content appears. Google classifies anything above 600ms as slow in its TTFB documentation. Pages in this range typically fail the &quot;Reduce initial server response time&quot; audit in PageSpeed Insights. This range usually indicates fixable problems: insufficient caching, a slow database, shared hosting under load, or unoptimised server-side code.
        </p>

        <h3>Above 2,000ms — Seriously damaging</h3>

        <p>
          A TTFB above 2 seconds is seriously damaging to user experience and search rankings. Research from Google shows that 53% of mobile users abandon pages that take more than 3 seconds to load — and if TTFB alone is 2 seconds, the full page load is almost certainly over 3 seconds. This range indicates significant infrastructure problems, severe resource contention, or application-level bottlenecks that need urgent attention.
        </p>

        <h2>TTFB vs total page load time: understanding the difference</h2>

        <p>
          TTFB is one component of total page load time, not the whole picture. After the first byte arrives, the browser still needs to:
        </p>

        <ul>
          <li>Download the rest of the HTML document</li>
          <li>Parse the HTML and build the DOM tree</li>
          <li>Request and download CSS stylesheets</li>
          <li>Request and download JavaScript files (which can block rendering)</li>
          <li>Execute JavaScript</li>
          <li>Download images, fonts, and other media</li>
          <li>Render the final page layout</li>
        </ul>

        <p>
          A page can have excellent TTFB but terrible total load time if it has large unoptimised images, render-blocking scripts, or excessive third-party resources. Conversely, a page with mediocre TTFB can still feel fast if it is lightweight and well-optimised.
        </p>

        <p>
          Focus on TTFB first. It is the only metric that is entirely under the server&apos;s control and affects everything else downstream. Once TTFB is under 800ms, optimise the frontend separately.
        </p>

        <h2>What causes slow server response times</h2>

        <h3>Shared hosting resource contention</h3>

        <p>
          On shared hosting, your website runs on a server alongside dozens or hundreds of other websites. You share CPU, memory, database connections, and disk I/O with all of them. When any of those sites experiences a traffic spike or runs a heavy database query, every other site on the server slows down — including yours.
        </p>

        <p>
          This is the most common cause of variable TTFB — fast in the morning, slow in the afternoon, no apparent reason for the difference from your end. The &quot;noisy neighbour&quot; problem is inherent to shared hosting. Upgrading to a VPS or managed hosting gives you dedicated resources that are not affected by other tenants.
        </p>

        <h3>No server-side caching</h3>

        <p>
          Dynamic websites (WordPress, Magento, Drupal, custom applications) generate HTML on demand — running application code, querying databases, and assembling the response for every request. Without caching, every visitor triggers the full generation process.
        </p>

        <p>
          Server-side caching stores the generated HTML and serves it directly on subsequent requests, bypassing the application entirely. A cached response can be served in under 50ms even if generating it from scratch takes 2 seconds. Caching is the single most impactful change for high-TTFB dynamic sites.
        </p>

        <h3>Slow database queries</h3>

        <p>
          Most dynamic websites generate pages primarily by querying a database. Slow queries — missing indexes, unoptimised joins, large table scans, or simply large amounts of data — add directly to TTFB. A page that runs 100 database queries averaging 30ms each adds 3 seconds to TTFB from database queries alone.
        </p>

        <p>
          Identify slow queries using your database&apos;s slow query log (MySQL&apos;s <code>slow_query_log</code>, PostgreSQL&apos;s <code>log_min_duration_statement</code>). Add missing indexes. Cache frequently-accessed query results in a memory cache like Redis. Reduce the number of queries per page.
        </p>

        <h3>PHP or application code inefficiency</h3>

        <p>
          Application code that does unnecessary work on every request — parsing large configuration files, loading modules that are not needed for the current page, making HTTP requests to external APIs, or running complex calculations — adds processing time to every page load. Profiling your application with tools like Xdebug (PHP), New Relic, or Datadog identifies the specific code paths that consume the most time.
        </p>

        <h3>Geographic distance between server and visitor</h3>

        <p>
          Network latency — the time for data to travel between the browser and server — is limited by the speed of light. A server in London responding to a visitor in Sydney will always have higher latency than the same server responding to a visitor in Manchester. For global audiences, this is a fundamental physical constraint.
        </p>

        <p>
          A Content Delivery Network (CDN) addresses this by caching your content on servers around the world and serving visitors from the nearest location. A CDN can reduce TTFB for cached content from 500ms to under 50ms for geographically distant visitors.
        </p>

        <h3>Insufficient server resources</h3>

        <p>
          Under sufficient traffic load, even well-optimised applications will hit the limits of available server resources. PHP-FPM processes queue up waiting for available workers. Database connection pools become exhausted. Memory pressure causes swapping. These conditions cause TTFB to spike under load while appearing fast during low-traffic periods.
        </p>

        <p>
          Monitor your server resource utilisation alongside TTFB. Rising CPU, memory pressure, or database connection saturation alongside rising TTFB indicates you need more server capacity.
        </p>

        <h2>How to fix slow server response time</h2>

        <h3>Add a caching layer first</h3>

        <p>
          Before making infrastructure changes, implement caching. The appropriate caching approach depends on your platform:
        </p>

        <ul>
          <li><strong>WordPress</strong> — Install a caching plugin (WP Rocket, LiteSpeed Cache, or W3 Total Cache) for page caching. Add a persistent object cache via Redis or Memcached for database query caching.</li>
          <li><strong>Custom PHP applications</strong> — Implement output caching at the application level. Cache database query results in Redis or Memcached. Use OPcache for PHP opcode caching.</li>
          <li><strong>Node.js / Python</strong> — Add a response caching layer using Redis. Enable HTTP cache headers so CDNs and browsers cache static responses.</li>
          <li><strong>Static site generators</strong> — Generate static HTML at build time and serve it via a CDN. TTFB for static HTML served from a CDN edge node is typically under 50ms globally.</li>
        </ul>

        <h3>Upgrade your hosting if you are on shared hosting</h3>

        <p>
          If your TTFB is consistently above 800ms and caching does not fix it, your hosting is the bottleneck. Moving from shared hosting to a VPS or managed hosting typically cuts TTFB by 50% to 80% for the same application. The difference in cost — often £5 to £20 per month — is trivial compared to the revenue impact of a slow site.
        </p>

        <p>
          Managed WordPress hosts (Kinsta, WP Engine, Cloudways) include server-level caching, Redis object caching, and PHP-FPM configuration tuned for WordPress. A WordPress site that is slow on shared hosting is typically fast the day it migrates to managed hosting, without any code changes.
        </p>

        <h3>Add a CDN</h3>

        <p>
          A CDN serves your content from geographically distributed edge nodes, reducing the physical distance between your server and your visitors. Cloudflare&apos;s free plan provides CDN functionality for most websites. For dynamic content that cannot be cached at the CDN layer, the CDN still reduces latency for DNS resolution and the TCP/TLS connection setup portions of TTFB.
        </p>

        <h3>Optimise your database</h3>

        <p>
          Add indexes to columns that are frequently used in WHERE clauses or JOIN conditions. Enable the MySQL slow query log and identify queries that take more than 100ms. Review your most expensive queries and optimise them — often an index is all that is needed. Consider enabling query caching at the application level.
        </p>

        <h3>Tune your PHP configuration</h3>

        <p>
          Ensure PHP OPcache is enabled — it caches compiled PHP bytecode and eliminates the need to recompile scripts on every request. This alone can reduce PHP processing time by 30% to 50%. Tune <code>opcache.memory_consumption</code> to be large enough for your application. Enable <code>opcache.preload</code> in PHP 8+ to precompile your most-used files at server startup.
        </p>

        <h2>How to monitor response time continuously</h2>

        <p>
          A one-time check of your TTFB is useful, but it is a snapshot. Response time varies by time of day, traffic load, and server conditions. What matters is the trend — is it consistently fast, getting slower over time, or spiking at certain times?
        </p>

        <p>
          Continuous response time monitoring checks your TTFB every minute and records each measurement. This gives you:
        </p>

        <ul>
          <li><strong>Trend data</strong> — See whether your TTFB is stable, improving, or degrading over days and weeks</li>
          <li><strong>Spike detection</strong> — Identify when TTFB spikes and correlate with server events, traffic increases, or deployments</li>
          <li><strong>Alerting</strong> — Get notified when TTFB exceeds a threshold (e.g., 1,000ms) so you can investigate before it becomes a full outage</li>
          <li><strong>Evidence for hosting discussions</strong> — Data showing consistent high TTFB from an external measurement tool is far more compelling when raising a support ticket with your host than a screenshot</li>
        </ul>

        <p>
          Set up an HTTP monitor in <Link href="https://uptrue.io/signup">Uptrue</Link> for each critical page on your site. Configure a response time threshold — 1,000ms is a good starting point — so you get alerted when the server is slow, not just when it is completely down.
        </p>

        <p>
          Monitor multiple pages, not just your homepage. Your homepage may be cached and fast while your product archive pages are slow. Your checkout may be uncacheable and significantly slower than the rest of your site. Each page can have its own TTFB characteristics.
        </p>

        <div className="blog-cta-section">
          <h3>Track your server response time on every check</h3>
          <p>
            Uptrue measures TTFB every minute and alerts you when your server slows down — before it crashes completely. Free plan available, no credit card required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="https://uptrue.io/signup" className="btn btn-primary btn-lg">
              Start Monitoring Free
            </Link>
          </div>
        </div>

        <h2>Response time and Google rankings: the connection</h2>

        <p>
          Google has been clear that page speed is a ranking factor. TTFB feeds directly into Largest Contentful Paint (LCP), one of the three Core Web Vitals metrics that Google uses in its ranking algorithm. A page with TTFB above 2 seconds will almost certainly fail the LCP threshold of 2.5 seconds, resulting in a &quot;Poor&quot; rating in Google Search Console.
        </p>

        <p>
          Beyond algorithmic impact, slow TTFB affects the user signals that indirectly influence rankings: higher bounce rates (users leave before the page loads), lower average session duration, and reduced pages per session. These behavioural signals tell Google that users are not finding your pages satisfying, which affects rankings over time.
        </p>

        <p>
          The good news is that improving TTFB — through caching, hosting upgrades, and database optimisation — typically produces measurable ranking improvements within weeks of implementation. Google reindexes pages regularly, and Core Web Vitals data feeds into ranking calculations on an ongoing basis.
        </p>

        <p>
          For WordPress specifically, see our detailed guide on <Link href="/blog/wordpress-slow-ttfb">WordPress TTFB over 3 seconds</Link> for platform-specific diagnosis and fixes.
        </p>

        <h2>Frequently asked questions</h2>

        <div className="blog-faq-list">
          {FAQ_DATA.map((faq) => (
            <div key={faq.question} className="blog-faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="blog-article-footer">
        <div className="blog-author">
          <div className="blog-author-info">
            <span className="blog-author-name">Uptrue Team</span>
            <span className="blog-author-role">Website Monitoring Platform</span>
          </div>
        </div>

        <div className="blog-related">
          <h3>Related posts</h3>
          <ul>
            <li><Link href="/blog/wordpress-slow-ttfb">WordPress TTFB Over 3 Seconds: Why Your Site Feels Dead Even When It&apos;s Technically Up</Link></li>
            <li><Link href="/blog/wordpress-504-gateway-timeout">504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail</Link></li>
            <li><Link href="/blog/uptime-monitoring-tools">Best Uptime Monitoring Tools in 2026: What to Look For</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
