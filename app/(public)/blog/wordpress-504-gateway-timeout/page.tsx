import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: '504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail',
  description:
    'A 504 Gateway Timeout means your server waited too long for a response that never came. Learn what causes 504 errors on WordPress — slow PHP scripts, heavy database queries, proxy timeout limits, and hosting resource caps — and how to monitor for them automatically.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-504-gateway-timeout' },
  openGraph: {
    title: '504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail',
    description:
      'What causes 504 Gateway Timeout on WordPress, how to fix slow PHP scripts and proxy timeouts, and how HTTP monitoring detects 504 errors and tracks response time trends.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-504-gateway-timeout',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail',
    description:
      'What causes 504 Gateway Timeout on WordPress, how to fix slow PHP scripts and proxy timeouts, and how HTTP monitoring detects 504 errors and tracks response time trends.',
  },
}

const FAQ_DATA = [
  {
    question: 'What does 504 Gateway Timeout mean on a WordPress site?',
    answer:
      'A 504 Gateway Timeout means the web server (Nginx, Apache, or a CDN like Cloudflare) acted as a gateway or proxy and did not receive a timely response from the upstream server — in this case, PHP-FPM processing your WordPress code. Unlike a 502 Bad Gateway where the backend crashes or returns an invalid response, a 504 means the backend simply took too long. The web server gave up waiting and returned a 504 to the visitor. The request may still be running in the background, consuming server resources.',
  },
  {
    question: 'What is the difference between a 502 and a 504 error on WordPress?',
    answer:
      'A 502 Bad Gateway means the upstream server (PHP-FPM) returned an invalid response or crashed — the connection was made but the response was garbage or the process died. A 504 Gateway Timeout means the upstream server did not respond at all within the allowed time. Think of it this way: a 502 means PHP answered the phone but said something unintelligible. A 504 means PHP never picked up the phone. The fix for a 502 is usually restarting PHP-FPM or fixing a crash. The fix for a 504 is usually optimising slow code, increasing timeout values, or upgrading server resources.',
  },
  {
    question: 'Can uptime monitoring detect 504 Gateway Timeout errors?',
    answer:
      'Yes. A 504 Gateway Timeout returns a clear 504 HTTP status code. Any HTTP uptime monitor that checks for a 200 response will detect a 504 immediately. Upnotify HTTP monitoring checks your site every 60 seconds and alerts you the moment a 504 is returned. Upnotify also tracks response time trends over time, so you can see your site getting slower before it hits the timeout threshold — giving you a chance to fix the problem before it causes a full 504.',
  },
  {
    question: 'How do I fix a 504 Gateway Timeout on WordPress?',
    answer:
      'Start by identifying whether the timeout is caused by a slow PHP script, a slow database query, or a proxy configuration issue. Check your PHP-FPM slow log to find which scripts are taking too long. Check your MySQL slow query log for queries exceeding a few seconds. If specific pages trigger the 504, look at what those pages do differently — heavy WooCommerce queries, report generation, or uncached dynamic content. Increase timeout values in Nginx (proxy_read_timeout or fastcgi_read_timeout) as a temporary fix. The permanent fix is optimising the slow code, adding caching, or upgrading server resources.',
  },
]

export default function WordPress504GatewayTimeoutPage(): React.ReactElement {
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
          headline: '504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail',
          description: 'What causes 504 Gateway Timeout on WordPress, how to fix each cause, and how HTTP monitoring detects them and tracks response time degradation.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-24',
          dateModified: '2026-03-24',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-504-gateway-timeout',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>24 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail</h1>
        <p className="blog-article-subtitle">
          Your page starts loading. The browser spinner keeps going. Ten seconds. Twenty seconds. Thirty seconds. Then instead of your website, your visitor sees a blank white page with three words: &quot;504 Gateway Timeout.&quot; Your server did not crash. It just never finished thinking.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The error that means your server ran out of patience</h2>

        <p>
          A 504 Gateway Timeout is different from a crash. Your server is running. PHP is running. Your database is running. Everything is alive and connected. But somewhere in the chain, a request is taking so long to process that the web server — Nginx, Apache, or a CDN like Cloudflare — gives up waiting and tells the visitor to go away.
        </p>

        <p>
          The timeout threshold is configurable. Nginx defaults to 60 seconds. Cloudflare free plans timeout at 100 seconds. Your hosting provider may set it even lower. When PHP takes longer than this threshold to generate a response, the web server returns a 504 to the visitor. The PHP process might still be running in the background, chewing through whatever slow operation triggered the timeout. But the visitor is already gone.
        </p>

        <p>
          The 504 is especially insidious because it often starts as a performance problem. Your site does not go from fast to 504 overnight. It slows down gradually. Response times creep up from 200 milliseconds to 2 seconds, then to 5 seconds, then to 15 seconds. Visitors notice the slowness but you do not, because you are testing from your office on a fast connection with your browser cache warm. Then one day, a traffic spike or a particularly heavy page load pushes response times past the timeout threshold. The 504 appears for the first time. And by then, the underlying problem has been building for weeks.
        </p>

        <h2>1. Slow PHP scripts that exceed the timeout</h2>

        <p>
          Every WordPress page requires PHP to execute code — loading the theme, running plugin hooks, querying the database, generating HTML. Most pages complete this in under a second. But some operations take much longer. A WooCommerce product page with 50 variations and no object cache. A page builder rendering a complex layout with nested queries. A plugin running an API call to a third-party service that is itself slow. A contact form plugin validating email addresses against a remote DNS lookup.
        </p>

        <p>
          When any of these operations takes longer than the proxy timeout, visitors get a 504. The page was going to load eventually — maybe in 90 seconds — but the web server only waited 60. From the server&apos;s perspective, everything is fine. From the visitor&apos;s perspective, the site is broken.
        </p>

        <p>
          <strong>How to fix it:</strong> Enable the PHP-FPM slow log by setting <code>request_slowlog_timeout = 5s</code> in your PHP-FPM pool configuration. This logs every request that takes longer than 5 seconds, including the exact PHP function that was running at that time. This tells you precisely which plugin, theme function, or database query is the bottleneck. Then optimise that specific code path — add caching, reduce the number of queries, or move the heavy operation to a background process using{' '}
          <a href="https://developer.wordpress.org/plugins/cron/" target="_blank" rel="noopener noreferrer">WordPress cron</a>
          {' '}or Action Scheduler.
        </p>

        <h2>2. Long-running database queries</h2>

        <p>
          WordPress relies heavily on its database. Every page load triggers multiple queries — fetching post content, loading options, checking user permissions, running plugin queries. Most of these complete in milliseconds. But a single slow query can tie up a PHP worker for seconds or even minutes.
        </p>

        <p>
          Common culprits include: the <code>wp_options</code> table with thousands of autoloaded rows (every page load queries every autoloaded option), the <code>wp_postmeta</code> table without proper indexes on large sites, WooCommerce order queries on stores with tens of thousands of orders, and search queries on sites without a proper search index. A query that takes 30 seconds leaves the PHP worker waiting for the database response the entire time. Stack a few of these together and every PHP worker is blocked, leading to 504 errors site-wide.
        </p>

        <p>
          <strong>How to fix it:</strong> Enable the MySQL slow query log by adding <code>slow_query_log = 1</code> and <code>long_query_time = 2</code> to your MySQL configuration. This logs every query taking longer than 2 seconds. Use <code>EXPLAIN</code> on the slow queries to understand their execution plan. Common fixes include adding database indexes, cleaning up autoloaded options in <code>wp_options</code>, deleting post revisions and transients, and adding object caching with Redis or Memcached to eliminate repeated queries. Refer to the{' '}
          <a href="https://wordpress.org/documentation/article/optimization/" target="_blank" rel="noopener noreferrer">WordPress optimization documentation</a>
          {' '}for database tuning guidance.
        </p>

        <h2>3. Proxy timeout configuration too low</h2>

        <p>
          Your web server has a timeout value that defines how long it will wait for PHP to respond. If this value is set too low for the work your site does, legitimate requests will trigger 504 errors even though they would complete successfully with a few more seconds.
        </p>

        <p>
          This is common on Nginx setups where the default <code>proxy_read_timeout</code> or <code>fastcgi_read_timeout</code> is 60 seconds. Sixty seconds sounds generous — until your WooCommerce checkout processes a payment through a gateway that takes 45 seconds, and a slow database query adds another 20 seconds on top. The request needed 65 seconds. The timeout was 60. The customer sees a 504 instead of an order confirmation.
        </p>

        <p>
          If you use Cloudflare, you face an additional timeout layer. Cloudflare free plan timeout is 100 seconds. If your origin server takes longer than 100 seconds to respond, Cloudflare returns its own 504 page — with Cloudflare branding and a different error code. You cannot increase this timeout on the free plan. Enterprise plans allow up to 6000 seconds, but that is not a fix — it is a band-aid for a performance problem.
        </p>

        <p>
          <strong>How to fix it:</strong> For Nginx with fastcgi_pass (the most common WordPress configuration):
        </p>

        <p>
          <code>fastcgi_read_timeout 300;</code><br />
          <code>fastcgi_connect_timeout 300;</code><br />
          <code>fastcgi_send_timeout 300;</code>
        </p>

        <p>
          For Nginx with proxy_pass (reverse proxy setups):
        </p>

        <p>
          <code>proxy_read_timeout 300;</code><br />
          <code>proxy_connect_timeout 300;</code><br />
          <code>proxy_send_timeout 300;</code>
        </p>

        <p>
          Increasing the timeout is a temporary fix. It prevents the 504 but does not solve the underlying performance problem. The real fix is always to make the slow request faster. A request that takes 90 seconds is a terrible user experience even if it does not 504.
        </p>

        <h2>4. Hosting resource limits and throttling</h2>

        <p>
          Shared hosting providers impose resource limits — CPU time, memory, number of processes, I/O throughput. When your site exceeds these limits, the hosting provider throttles your account. Throttling slows your PHP execution dramatically. A request that normally takes 2 seconds might take 30 seconds under throttling. If throttling pushes response times past the timeout threshold, visitors get 504 errors.
        </p>

        <p>
          This is different from the <Link href="/blog/wordpress-502-bad-gateway">502 Bad Gateway</Link> where the hosting provider kills the process outright. With throttling, the process is still running — just painfully slowly. The server is not refusing connections. It is accepting them, starting to process them, and then timing out because it cannot finish in time.
        </p>

        <p>
          Resource throttling often happens during specific events: a traffic spike from a social media mention, a bot crawling your site aggressively, a cron job running during peak hours, or a plugin performing a bulk operation like importing products or sending newsletters. The timing makes it feel random to you — everything was fine yesterday, but today certain pages return 504.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your hosting control panel for resource usage graphs. Look for CPU usage hitting 100% or memory approaching the limit. If you are consistently hitting resource caps, you have two options: optimise your site to use fewer resources (caching, fewer plugins, optimised queries) or upgrade your hosting plan. Moving from shared hosting to a VPS or managed WordPress host gives you dedicated resources that are not shared with other accounts. If traffic spikes are the trigger, add a CDN to serve static assets and page caching to reduce the number of requests that need PHP processing.
        </p>

        <h2>5. External API calls that block page rendering</h2>

        <p>
          Some WordPress plugins make external API calls during page rendering. A social sharing plugin fetching share counts from Facebook and Twitter. An analytics plugin loading data from a remote service. A currency converter plugin checking exchange rates. A weather widget querying a weather API. Each of these calls adds network latency to your page load time.
        </p>

        <p>
          If the external API is slow or unresponsive, the PHP script blocks — waiting for a response from a server you do not control. If the API call has no timeout or a generous timeout (30 seconds), and multiple API calls are made per page, the total page generation time can easily exceed your proxy timeout. Your visitor gets a 504 because Facebook&apos;s share count API took 45 seconds to respond.
        </p>

        <p>
          <strong>How to fix it:</strong> Identify plugins that make external API calls during page rendering. Set aggressive timeouts on all outbound HTTP requests — 5 seconds maximum. Cache API responses so you are not making the same call on every page load. Better yet, move external API calls to background processes using WordPress cron and store the results in a transient. The page loads instantly from the cached data. The fresh data is fetched in the background on a schedule.
        </p>

        <h2>6. PHP max_execution_time versus proxy timeout mismatch</h2>

        <p>
          PHP has its own execution time limit: <code>max_execution_time</code>, set in <code>php.ini</code>. The default is 30 seconds. This is separate from the web server&apos;s proxy timeout. If <code>max_execution_time</code> is set higher than the proxy timeout, PHP will happily continue processing a request that the web server has already given up on. The visitor saw a 504 sixty seconds ago. PHP is still running the script, consuming CPU and memory, generating a response that nobody will ever see.
        </p>

        <p>
          The reverse is also problematic. If <code>max_execution_time</code> is set lower than the proxy timeout, PHP kills the script before the proxy times out. The visitor sees a 500 Internal Server Error or a white screen instead of a 504. Both are bad, but the error codes are different, which can make debugging confusing.
        </p>

        <p>
          <strong>How to fix it:</strong> Align your timeout values. Set <code>max_execution_time</code> in <code>php.ini</code> to the same value as your proxy timeout — or slightly higher so that PHP can finish generating an error response before the proxy gives up. A common configuration: <code>max_execution_time = 120</code>, <code>fastcgi_read_timeout = 120</code>. But remember, if you regularly need more than 30 seconds to generate a page, you have a performance problem that timeouts cannot solve.
        </p>

        <h2>Why the 504 is a warning sign, not just an error</h2>

        <p>
          The 502 Bad Gateway is a crash. It happens suddenly. The 504 Gateway Timeout is different — it is the final symptom of a site that has been slowing down for days, weeks, or months. Response times do not jump from 200 milliseconds to 60 seconds overnight. They degrade gradually, and the 504 appears only when they cross the timeout threshold.
        </p>

        <p>
          This means the 504 is actually an opportunity. If you track response times over time, you can see the degradation happening before it causes an outage. A site averaging 500ms that suddenly averages 3 seconds is already in trouble — even though it is still loading for visitors. If you catch it at 3 seconds, you can fix the problem before it hits 60 seconds and triggers a 504. If you wait for the 504, you are already in an outage.
        </p>

        <h2>How to detect 504 errors and performance degradation with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s HTTP monitoring</Link> catches 504 errors the moment they happen. But more importantly, it tracks response time trends so you can see your site slowing down before it reaches the timeout threshold.
        </p>

        <h3>Step 1: Set up an HTTP monitor to catch 504 status codes</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          The moment your site returns a 504 instead of 200, Upnotify triggers an alert. Upnotify uses a two-confirmation check — if the first check fails, it retries from a different location before alerting. This eliminates false positives from momentary network issues while still catching real 504 errors within two minutes.
        </p>

        <h3>Step 2: Track response time trends to catch slowdowns early</h3>

        <p>
          Every HTTP check records the response time. Upnotify displays this as a trend over time in your dashboard. A healthy site shows a flat line around a consistent response time. A site heading towards a 504 shows a gradual upward trend — response times creeping higher week by week.
        </p>

        <p>
          Check your response time trends weekly. If you see average response times increasing — from 400ms to 800ms to 1.5 seconds — investigate before it reaches your timeout threshold. The cause is usually a growing database, a newly installed plugin, or increasing traffic without corresponding infrastructure upgrades.
        </p>

        <h3>Step 3: Monitor your slowest pages individually</h3>

        <p>
          Not all pages are equally fast. Your homepage might load in 500ms while your WooCommerce shop page takes 4 seconds. The shop page will hit the timeout threshold long before the homepage does. Set up individual monitors for:
        </p>

        <ul>
          <li><strong>Homepage</strong> — your baseline performance indicator</li>
          <li><strong>WooCommerce shop and product pages</strong> — heavy database queries</li>
          <li><strong>Checkout page</strong> — payment gateway API calls add latency</li>
          <li><strong>Search results page</strong> — search queries are often the slowest</li>
          <li><strong>Admin-heavy pages receiving traffic</strong> — dashboards, account pages</li>
          <li><strong>Any page receiving paid traffic</strong> — slow pages waste ad spend</li>
        </ul>

        <h3>Step 4: Add keyword monitoring as a backup</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to <strong>&quot;Gateway Timeout&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          Some CDN and caching configurations intercept the 504 and serve a custom error page with a 200 status code. The page often contains the text &quot;Gateway Timeout&quot; or &quot;504.&quot; This keyword monitor catches those cases that slip past HTTP status code checking.
        </p>

        <h3>Step 5: Configure alerts for maximum speed</h3>

        <p>
          A 504 means visitors are waiting 60 seconds or more and then seeing an error. This is worse than a fast error like a 500 — the visitor wasted a full minute of their life before being told the site is broken. They will not try again.
        </p>

        <ul>
          <li><strong>Slack</strong> — instant notification in a dedicated channel</li>
          <li><strong>Microsoft Teams</strong> — immediate visibility for your team</li>
          <li><strong>Email</strong> — written record as a backup alert</li>
          <li><strong>Webhook</strong> — pipe alerts into PagerDuty, Opsgenie, or your incident management system</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site speed right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if your response times are creeping towards the timeout threshold.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing 504 errors before they happen</h2>

        <h3>Add page caching</h3>
        <p>
          Page caching serves pre-generated HTML files, bypassing PHP and the database entirely. A cached page responds in milliseconds regardless of how complex the underlying WordPress page is. Install a caching plugin like WP Super Cache or W3 Total Cache. If your host offers built-in caching (Kinsta, WP Engine, Cloudways), enable it. Page caching alone eliminates the vast majority of 504 errors on WordPress sites.
        </p>

        <h3>Add object caching with Redis</h3>
        <p>
          Object caching stores database query results in memory. WordPress does not have to query the database on every page load for data that rarely changes — options, user meta, transients. This reduces both PHP execution time and database load. Most managed WordPress hosts include Redis. On a VPS, install Redis and the Redis Object Cache plugin.
        </p>

        <h3>Optimise your database</h3>
        <p>
          Delete post revisions, expired transients, spam comments, and trashed posts. Clean up the <code>wp_options</code> table — remove rows from plugins you have already uninstalled. Check that <code>autoload</code> is set to &quot;no&quot; for large options that do not need to load on every page. Add indexes to custom tables created by plugins. A lean database responds faster and uses less memory.
        </p>

        <h3>Audit your plugins</h3>
        <p>
          Every active plugin adds PHP execution time to every page load. Some plugins are well-optimised and add microseconds. Others add seconds. Use the Query Monitor plugin in development to identify which plugins are adding the most database queries and the most execution time. Deactivate or replace plugins that are disproportionately slow. The fewer plugins you run, the faster your site loads and the further you are from the timeout threshold.
        </p>

        <h3>Use a CDN</h3>
        <p>
          A CDN serves static assets (images, CSS, JavaScript, fonts) from edge servers close to your visitors. This reduces the number of requests that reach your origin server, leaving more capacity for the dynamic PHP requests that actually need processing. Cloudflare, Bunny CDN, and KeyCDN are popular options that work well with WordPress.
        </p>

        <h2>Stop waiting for the 504 to find you</h2>

        <p>
          A 504 Gateway Timeout is the last stage of a performance problem that has been building for a long time. By the time your visitors see it, your response times have been degrading for days or weeks. The visitors who waited 8 seconds and gave up before the timeout never showed up in your error logs — they just left.
        </p>

        <p>
          Upnotify checks your site every 60 seconds and records the response time on every check. The moment a 504 is returned, you know. But more importantly, you can see the trend. You can see your site slowing down from 400ms to 2 seconds to 8 seconds — and you can fix it before it reaches the 60-second timeout that triggers the error.
        </p>

        <div className="blog-cta-section">
          <h3>Detect 504 errors and performance degradation automatically</h3>
          <p>
            Free plan available. HTTP monitoring with response time tracking. Two-confirmation checks. AI-powered reports. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/score" className="btn btn-primary btn-lg">
              Check Your Site Free
            </Link>
            <Link href="/signup" className="btn btn-secondary btn-lg">
              Start Monitoring
            </Link>
          </div>
        </div>

        </div>

      <div className="reveal">
        <Faq items={FAQ_DATA} headline="Frequently asked questions" />
      </div>

      <footer className="blog-article-footer">
        <div className="blog-author">
          <div className="blog-author-info">
            <span className="blog-author-name">Upnotify Team</span>
            <span className="blog-author-role">Website Monitoring Platform</span>
          </div>
        </div>

        <div className="blog-related">
          <h3>Related posts</h3>
          <ul>
            <li><Link href="/blog/wordpress-502-bad-gateway">502 Bad Gateway on WordPress: What It Means and How to Fix It Fast</Link></li>
            <li><Link href="/blog/wordpress-database-connection-error">Error Establishing a Database Connection in WordPress: Complete Fix Guide</Link></li>
            <li><Link href="/blog/wordpress-php-memory-exhausted">PHP Fatal Error: Allowed Memory Size Exhausted in WordPress</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
