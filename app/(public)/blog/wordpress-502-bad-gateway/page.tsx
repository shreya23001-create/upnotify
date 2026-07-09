import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: '502 Bad Gateway on WordPress: What It Means and How to Fix It Fast',
  description:
    'A 502 Bad Gateway error means your web server could not get a valid response from PHP. Learn what causes it on WordPress sites — PHP-FPM crashes, upstream timeouts, and hosting resource limits — and how to monitor for 502 errors automatically.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-502-bad-gateway' },
  openGraph: {
    title: '502 Bad Gateway on WordPress: What It Means and How to Fix It Fast',
    description:
      'What causes 502 Bad Gateway on WordPress, how to fix PHP-FPM crashes and upstream timeouts, and how HTTP monitoring catches 502 errors instantly.',
    url: 'https://uptrue.io/blog/wordpress-502-bad-gateway',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '502 Bad Gateway on WordPress: What It Means and How to Fix It Fast',
    description:
      'What causes 502 Bad Gateway on WordPress, how to fix PHP-FPM crashes and upstream timeouts, and how HTTP monitoring catches 502 errors instantly.',
  },
}

const FAQ_DATA = [
  {
    question: 'What does 502 Bad Gateway mean on a WordPress site?',
    answer:
      'A 502 Bad Gateway error means the web server (Nginx or Apache acting as a reverse proxy) tried to pass your request to PHP for processing, but PHP did not respond correctly. The web server is working — it received your request and tried to handle it — but the backend PHP process that actually runs WordPress crashed, timed out, or returned an invalid response. It is a server-side error, not something the visitor did wrong.',
  },
  {
    question: 'Why does my WordPress site show 502 Bad Gateway intermittently?',
    answer:
      'Intermittent 502 errors are usually caused by PHP-FPM running out of available worker processes. When all PHP workers are busy handling requests and a new request arrives, there is no worker available to process it. The web server waits briefly, gets no response, and returns a 502. This happens during traffic spikes, when a slow database query ties up workers for too long, or when a plugin creates an infinite loop that never releases its worker. Increasing the number of PHP-FPM workers or optimising slow queries usually fixes intermittent 502 errors.',
  },
  {
    question: 'Can uptime monitoring detect 502 Bad Gateway errors?',
    answer:
      'Yes. Unlike some WordPress errors that return a 200 status code with error text in the body, a 502 Bad Gateway returns a clear 502 HTTP status code. Any HTTP uptime monitor that checks for a 200 response will detect a 502 immediately. Uptrue HTTP monitoring checks your site every 60 seconds and alerts you the moment a 502 is returned. For complete coverage, add keyword monitoring as well — some 502 errors are caught by caching layers that return a cached 200 page instead of the 502.',
  },
  {
    question: 'How do I fix 502 Bad Gateway on WordPress?',
    answer:
      'Start by reloading the page after 30 seconds — a 502 can be a momentary PHP-FPM restart. If it persists, check if PHP-FPM is running on your server. Restart PHP-FPM and your web server. If you are on shared hosting, contact your provider — you may have hit resource limits. Check your error logs (Nginx error log or Apache error log) for the specific upstream error. Common fixes include increasing PHP-FPM max_children, increasing PHP memory_limit, increasing the proxy timeout in your Nginx configuration, and deactivating resource-heavy plugins.',
  },
]

export default function WordPress502BadGatewayPage(): React.ReactElement {
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
          headline: '502 Bad Gateway on WordPress: What It Means and How to Fix It Fast',
          description: 'What causes 502 Bad Gateway errors on WordPress, how to fix each cause, and how HTTP monitoring catches them instantly.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-23',
          dateModified: '2026-03-23',
          url: 'https://uptrue.io/blog/wordpress-502-bad-gateway',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>23 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">502 Bad Gateway on WordPress: What It Means and How to Fix It Fast</h1>
        <p className="blog-article-subtitle">
          Your website was working five minutes ago. Now every page shows &quot;502 Bad Gateway.&quot; Your web server is running. Your database is running. But PHP — the engine that powers WordPress — has stopped responding. And every second it stays down costs you visitors, trust, and revenue.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The error that means your server is fighting itself</h2>

        <p>
          A 502 Bad Gateway is different from most WordPress errors. It does not come from WordPress at all. It comes from the web server — Nginx, Apache, or a reverse proxy like Cloudflare — telling you that it tried to reach the backend process that runs WordPress, and that process did not respond.
        </p>

        <p>
          Think of it like calling a phone number and hearing a disconnected tone. The phone network works. Your phone works. But the person you are trying to reach is not picking up. In this case, the &quot;person&quot; is PHP-FPM — the process that executes your WordPress code — and it has either crashed, timed out, or run out of capacity.
        </p>

        <p>
          The 502 error is especially dangerous because it affects your entire site. Not one page. Not one feature. Everything. Every URL returns the same error. Your homepage, your blog, your contact form, your checkout — all gone. And unlike some WordPress errors that only appear intermittently, a 502 often persists until the underlying cause is resolved.
        </p>

        <p>
          The good news is that a 502 returns a clear HTTP status code, which means monitoring can detect it instantly. The bad news is that the causes range from simple (a PHP restart) to complex (server resource exhaustion under load). Here is every major cause and how to fix each one.
        </p>

        <h2>1. PHP-FPM crashed or stopped running</h2>

        <p>
          PHP-FPM (FastCGI Process Manager) is the service that processes PHP code on most modern WordPress hosting setups. It runs as a separate service from your web server. When a visitor requests a page, Nginx or Apache passes the request to PHP-FPM, which executes the WordPress code and returns the HTML. If PHP-FPM crashes or stops running, the web server has nothing to pass requests to. Every request fails with a 502.
        </p>

        <p>
          PHP-FPM can crash because of a segmentation fault in a PHP extension, a corrupted OPcache, a fatal error in a PHP file that runs on every request (like <code>wp-config.php</code> or a must-use plugin), or an out-of-memory condition that kills the process. On managed hosting, the provider&apos;s process monitor usually restarts PHP-FPM automatically within a few seconds. On self-managed servers, it may stay down until you restart it manually.
        </p>

        <p>
          <strong>How to fix it:</strong> Check if PHP-FPM is running. On the command line: <code>systemctl status php-fpm</code> (or <code>php8.2-fpm</code> depending on your setup). If it is stopped, restart it: <code>systemctl restart php-fpm</code>. Check the PHP-FPM error log for the crash reason — usually at <code>/var/log/php-fpm/error.log</code> or <code>/var/log/php8.2-fpm.log</code>. If you are on shared hosting and cannot access these commands, contact your hosting provider. They can restart PHP-FPM for you and check the logs.
        </p>

        <h2>2. Upstream server overload — all PHP workers are busy</h2>

        <p>
          PHP-FPM uses a pool of worker processes. Each worker handles one request at a time. The number of workers is configured in your PHP-FPM pool configuration (usually <code>pm.max_children</code>). When every worker is busy and a new request arrives, one of two things happens: the request waits in a queue until a worker becomes available, or — if the queue is full or the wait exceeds the timeout — the web server gives up and returns a 502.
        </p>

        <p>
          This is the most common cause of intermittent 502 errors. Your site works most of the time. But during traffic spikes, when a bot crawls your site aggressively, or when a slow database query ties up workers for several seconds each, the pool runs out of available workers. Some requests get through. Others get a 502. It looks random to your visitors.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your PHP-FPM status page or run <code>ps aux | grep php-fpm</code> to see how many workers are running versus your <code>pm.max_children</code> setting. If all workers are consistently busy, increase <code>pm.max_children</code>. But be careful — each worker consumes memory (typically 20-50MB for WordPress). If you increase workers beyond what your server&apos;s RAM can support, you will trade 502 errors for out-of-memory crashes. The real fix is often to optimise slow queries, add page caching, and reduce the amount of work each PHP request has to do. Refer to the{' '}
          <a href="https://nginx.org/en/docs/http/ngx_http_upstream_module.html" target="_blank" rel="noopener noreferrer">Nginx upstream module documentation</a>
          {' '}for tuning proxy settings.
        </p>

        <h2>3. Reverse proxy timeout</h2>

        <p>
          When Nginx acts as a reverse proxy in front of PHP-FPM, it has a timeout setting — <code>proxy_read_timeout</code> — that defines how long it will wait for PHP-FPM to respond. The default is often 60 seconds. If a WordPress request takes longer than this timeout — a large WooCommerce order, a heavy report generation, a slow database migration — Nginx stops waiting and returns a 502.
        </p>

        <p>
          You might also hit this if you use Cloudflare or another CDN as a reverse proxy. Cloudflare has its own timeout (100 seconds on the free plan) and returns a 502 if your origin server does not respond within that window. The Cloudflare 502 page looks different — it shows Cloudflare branding and says &quot;Bad gateway&quot; with a &quot;Cloudflare&quot; identifier.
        </p>

        <p>
          <strong>How to fix it:</strong> For Nginx, increase the timeout values in your site configuration:
        </p>

        <p>
          <code>proxy_read_timeout 300;</code><br />
          <code>proxy_connect_timeout 300;</code><br />
          <code>proxy_send_timeout 300;</code>
        </p>

        <p>
          If you use <code>fastcgi_pass</code> instead of <code>proxy_pass</code>, the equivalent settings are <code>fastcgi_read_timeout</code>, <code>fastcgi_connect_timeout</code>, and <code>fastcgi_send_timeout</code>. For Cloudflare, you cannot increase the timeout beyond 100 seconds on the free plan (Enterprise plans allow longer). Optimise the slow request instead — add caching, optimise the database query, or move the heavy operation to a background process.
        </p>

        <h2>4. Hosting resource limits</h2>

        <p>
          Shared hosting and even some managed WordPress hosts impose hard limits on CPU time, memory, number of processes, and number of simultaneous connections. When your site exceeds any of these limits, the hosting provider&apos;s resource manager kills the offending process. If it kills PHP-FPM workers, the web server returns 502 errors until the resource usage drops below the limit.
        </p>

        <p>
          This often happens during traffic spikes, heavy cron jobs, or when a plugin runs a resource-intensive operation like importing products, generating reports, or sending bulk emails. The hosting provider&apos;s control panel may show a &quot;Resource Limit Reached&quot; message, but this message is not always displayed — sometimes you just get a generic 502.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your hosting control panel for resource usage metrics. If you are consistently hitting limits, you need either a better hosting plan or a more efficient site. Optimise your site: add page caching (WP Super Cache or W3 Total Cache), optimise images, reduce the number of plugins, and ensure your database is indexed properly. If traffic spikes are the trigger, consider a CDN to serve static assets and reduce the load on your server. If you are on shared hosting and hitting limits regularly, it is time to upgrade to a VPS or managed WordPress host. Refer to the{' '}
          <a href="https://wordpress.org/documentation/article/optimization/" target="_blank" rel="noopener noreferrer">WordPress optimization documentation</a>
          {' '}for performance tuning guidance.
        </p>

        <h2>5. Corrupted OPcache</h2>

        <p>
          OPcache is a PHP extension that caches compiled PHP bytecode in memory so PHP does not have to parse and compile the same files on every request. It dramatically improves performance. But if the cache becomes corrupted — due to a failed deployment, a disk error, or a PHP version upgrade — PHP-FPM can crash or return garbage data. The web server receives an invalid response and returns a 502.
        </p>

        <p>
          <strong>How to fix it:</strong> Restart PHP-FPM, which clears the OPcache. If the problem recurs, add <code>opcache.validate_timestamps=1</code> to your <code>php.ini</code> so OPcache checks for file changes. On deployments, use <code>opcache_reset()</code> or restart PHP-FPM as part of your deployment script to ensure the cache is fresh.
        </p>

        <h2>6. Database connection exhaustion</h2>

        <p>
          Every WordPress page load requires multiple database queries. If your database server runs out of available connections — because too many PHP workers are holding connections simultaneously, because a slow query is blocking other queries, or because the database server itself is overloaded — PHP-FPM workers hang waiting for a database response. They hit the timeout. Nginx gets no response. 502 Bad Gateway.
        </p>

        <p>
          This looks similar to a PHP-FPM overload but the root cause is the database. You might also see the{' '}
          <Link href="/blog/wordpress-database-connection-error">&quot;Error Establishing a Database Connection&quot;</Link>
          {' '}message on some requests while others get 502 — depending on which error surfaces first.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your database server&apos;s connection count and slow query log. Increase <code>max_connections</code> in your MySQL or MariaDB configuration if you are running out. Identify and optimise slow queries — a single query that takes 10 seconds blocks a PHP worker and a database connection for that entire duration. Add object caching (Redis or Memcached) to reduce the number of database queries per page load.
        </p>

        <h2>Why the 502 is actually the easiest WordPress error to monitor</h2>

        <p>
          Unlike the <Link href="/blog/wordpress-critical-error">critical error</Link> or the <Link href="/blog/wordpress-white-screen-of-death">White Screen of Death</Link>, which can return a 200 OK status while showing an error, the 502 Bad Gateway returns a clear 502 HTTP status code. Any HTTP monitor that checks for a 200 response will catch it immediately. This makes the 502 the one WordPress error where standard uptime monitoring actually works as expected.
        </p>

        <p>
          But there is a caveat. If you use Cloudflare, a CDN, or a caching reverse proxy, the caching layer might serve a cached version of the page even when the origin returns a 502. Your monitor checks the cached page, gets a 200, and reports everything as fine. Your cache eventually expires, and then the 502 is exposed to visitors. Adding keyword monitoring alongside HTTP monitoring catches this edge case.
        </p>

        <h2>How to detect 502 errors with Uptrue</h2>

        <p>
          <Link href="/signup">Uptrue&apos;s HTTP monitoring</Link> checks your site every 60 seconds and alerts you the moment it receives a non-200 response. Combined with keyword monitoring, you catch 502 errors whether they come from the origin server or are hidden behind a caching layer.
        </p>

        <h3>Step 1: Set up an HTTP monitor to catch 502 status codes</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          The moment your site returns a 502 instead of 200, Uptrue triggers an alert. Uptrue uses a two-confirmation check — if the first check fails, it retries from a different location before alerting. This eliminates false positives from momentary network issues while still catching real 502 errors within two minutes.
        </p>

        <h3>Step 2: Add a keyword monitor for CDN-cached sites</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to <strong>&quot;Bad Gateway&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          Some CDN and caching configurations intercept the 502 and serve a custom error page with a 200 status code. The page often contains the text &quot;Bad Gateway&quot; or &quot;502.&quot; This keyword monitor catches those cases.
        </p>

        <h3>Step 3: Add a positive keyword monitor for content verification</h3>

        <ol>
          <li>Add another <strong>Keyword</strong> monitor for your homepage</li>
          <li>Set the keyword to your site title, tagline, or a navigation item that always appears</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This is your safety net. If your normal content disappears for any reason — a 502, a white screen, a critical error, a hacked page, or anything else — you know something is wrong. It does not matter what specific error replaced your content. If your expected content is gone, Uptrue alerts you.
        </p>

        <h3>Step 4: Monitor critical inner pages</h3>

        <p>
          502 errors usually affect the entire site, but not always. A specific PHP-FPM pool configured for a subdomain, or a plugin that only loads on certain pages, could cause 502 errors on specific URLs while the rest of the site works. Monitor:
        </p>

        <ul>
          <li>Homepage</li>
          <li>Checkout or cart page (if you run WooCommerce)</li>
          <li>Contact page</li>
          <li>API endpoints that serve your mobile app or integrations</li>
          <li>Any page receiving paid traffic</li>
        </ul>

        <h3>Step 5: Configure alerts that reach you immediately</h3>

        <p>
          A 502 means your entire site is down. This is not a degraded feature or a broken form — every visitor sees an error. Configure alerts for maximum speed:
        </p>

        <ul>
          <li><strong>Slack</strong> — instant notification in a dedicated channel</li>
          <li><strong>Microsoft Teams</strong> — same idea, different platform</li>
          <li><strong>Email</strong> — fine as a backup, but not fast enough for full outages</li>
          <li><strong>Webhook</strong> — pipe alerts into PagerDuty, Opsgenie, or your own incident management system</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site health right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See your vulnerabilities before they become outages.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing 502 errors before they happen</h2>

        <p>
          Monitoring catches the problem fast. But these measures reduce the chances of a 502 hitting your site in the first place.
        </p>

        <h3>Right-size your PHP-FPM pool</h3>
        <p>
          Calculate the right <code>pm.max_children</code> value for your server. A common formula: divide your available RAM (minus what the OS, database, and web server need) by the average memory per PHP worker. If you have 2GB available for PHP and each worker uses 40MB, set <code>pm.max_children</code> to 50. Monitor actual usage and adjust. Too few workers and you get 502 errors under load. Too many and you get out-of-memory crashes.
        </p>

        <h3>Add page caching</h3>
        <p>
          Page caching serves static HTML files for most requests, bypassing PHP entirely. A cached page does not need a PHP worker. This dramatically reduces the load on PHP-FPM and makes 502 errors under traffic spikes far less likely. Use a caching plugin like WP Super Cache, W3 Total Cache, or your hosting provider&apos;s built-in caching.
        </p>

        <h3>Add object caching with Redis or Memcached</h3>
        <p>
          Object caching stores database query results in memory so WordPress does not have to query the database on every page load. This reduces both PHP execution time and database load, freeing up PHP workers faster and preventing connection exhaustion. Most managed WordPress hosts include Redis or Memcached.
        </p>

        <h3>Optimise slow database queries</h3>
        <p>
          A single slow query that takes 5 seconds ties up a PHP worker and a database connection for that entire duration. Install the Query Monitor plugin in development to identify slow queries. Add database indexes where needed. Avoid plugins that run expensive queries on every page load — especially when they query the <code>wp_options</code> table with autoload enabled for large datasets.
        </p>

        <h3>Use a CDN for static assets</h3>
        <p>
          Images, CSS, JavaScript, and fonts served through a CDN never touch your server. This reduces the total number of requests your server has to handle, leaving more capacity for the dynamic PHP requests that need PHP-FPM workers.
        </p>

        <h2>Stop finding out about 502 errors from your visitors</h2>

        <p>
          A 502 Bad Gateway takes your entire WordPress site offline. Your homepage, your blog, your checkout, your login — everything returns an error. Unlike some WordPress problems that hide behind a 200 status code, the 502 is honest about what happened. It returns a clear error code that monitoring can detect instantly.
        </p>

        <p>
          Uptrue checks your site every 60 seconds. The moment a 502 is returned, you know. On Slack, Teams, email, or webhook. Before your visitors complain. Before Google crawls an error page. Before your client calls to ask why their site is down. Under a minute. Every time.
        </p>

        <div className="blog-cta-section">
          <h3>Detect 502 errors before your visitors do</h3>
          <p>
            Free plan available. HTTP monitoring with two-confirmation checks. Keyword monitoring for CDN-cached sites. AI-powered reports. No credit card required.
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
            <span className="blog-author-name">Uptrue Team</span>
            <span className="blog-author-role">Website Monitoring Platform</span>
          </div>
        </div>

        <div className="blog-related">
          <h3>Related posts</h3>
          <ul>
            <li><Link href="/blog/wordpress-database-connection-error">Error Establishing a Database Connection in WordPress: Complete Fix Guide</Link></li>
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
            <li><Link href="/blog/wordpress-php-memory-exhausted">PHP Fatal Error: Allowed Memory Size Exhausted in WordPress</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
