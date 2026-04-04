import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'WordPress XML-RPC Brute Force Attack: How Hackers Slow Down Your Site Without You Knowing',
  description:
    'WordPress xmlrpc.php allows attackers to try hundreds of passwords in a single request using system.multicall. Your site slows to a crawl while uptime monitors say it is fine. Learn how XML-RPC attacks work, how to disable xmlrpc.php properly, and how Uptrue HTTP monitoring catches the response time spike before the crash.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-xmlrpc-attack' },
  openGraph: {
    title: 'WordPress XML-RPC Brute Force Attack: How Hackers Slow Down Your Site Without You Knowing',
    description:
      'How attackers exploit xmlrpc.php system.multicall for amplified brute force attacks, why your site slows down, and how HTTP monitoring catches the response time spike.',
    url: 'https://uptrue.io/blog/wordpress-xmlrpc-attack',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress XML-RPC Brute Force Attack: How Hackers Slow Down Your Site Without You Knowing',
    description:
      'How attackers exploit xmlrpc.php system.multicall for amplified brute force attacks, why your site slows down, and how HTTP monitoring catches the response time spike.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is xmlrpc.php in WordPress?',
    answer:
      'xmlrpc.php is a file in every WordPress installation that provides an XML-RPC API for remote communication. It was originally designed for remote publishing — allowing desktop blogging apps and mobile apps to create, edit, and delete posts without logging into wp-admin. It also handles pingbacks (notifications when another site links to yours) and provides an interface for third-party integrations. XML-RPC was critical before WordPress introduced the REST API in version 4.7, but most modern WordPress sites no longer need it. Despite this, xmlrpc.php is still present and active by default in every WordPress installation.',
  },
  {
    question: 'How does the system.multicall attack work on xmlrpc.php?',
    answer:
      'The XML-RPC protocol supports a method called system.multicall that allows multiple method calls to be bundled into a single HTTP request. An attacker sends one POST request to xmlrpc.php containing hundreds of wp.getUsersBlogs calls, each with a different username-password combination. WordPress processes every single call within that one request — authenticating each attempt against the database, hashing each password with bcrypt, and comparing it against the stored hash. A single HTTP request can trigger 500 or more authentication attempts internally. This bypasses login attempt limits that only count HTTP requests, and it generates enormous CPU and database load from what appears to be a single request in your access logs.',
  },
  {
    question: 'Will disabling xmlrpc.php break my WordPress site?',
    answer:
      'For most modern WordPress sites, disabling xmlrpc.php will not break anything. The WordPress REST API, introduced in WordPress 4.7, handles all the functionality that xmlrpc.php provided — remote publishing, mobile app access, and third-party integrations. However, a small number of plugins still require XML-RPC. The Jetpack plugin uses XML-RPC to communicate with WordPress.com servers. Some older mobile apps and desktop publishing tools rely on XML-RPC instead of the REST API. If you use Jetpack or a legacy publishing tool, test after disabling xmlrpc.php to verify nothing breaks. For everyone else, disabling it removes an attack surface with no functional impact.',
  },
  {
    question: 'Can monitoring detect an XML-RPC brute force attack?',
    answer:
      'Standard uptime monitoring that only checks for a 200 status code will not detect an XML-RPC attack until the site has already crashed. The attack causes gradual resource exhaustion — your site stays up but response times climb from hundreds of milliseconds to seconds, then tens of seconds. HTTP monitoring that tracks response time detects this progression. Uptrue records response time on every check and alerts you when it exceeds a threshold — catching the attack while your site is still responding but degraded, giving you time to block the attack before it causes a full outage.',
  },
]

export default function WordPressXmlrpcAttackPage(): React.ReactElement {
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
          headline: 'WordPress XML-RPC Brute Force Attack: How Hackers Slow Down Your Site Without You Knowing',
          description: 'How attackers exploit xmlrpc.php system.multicall for amplified brute force attacks, why your site slows down, and how HTTP monitoring catches the response time spike.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-04-04',
          dateModified: '2026-04-04',
          url: 'https://uptrue.io/blog/wordpress-xmlrpc-attack',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>4 April 2026</span>
          <span>15 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress XML-RPC Brute Force Attack: How Hackers Slow Down Your Site Without You Knowing</h1>
        <p className="blog-article-subtitle">
          Your WordPress site has been getting slower for the past two days. Pages that loaded in under a second now take five, sometimes ten seconds. You check your plugins, clear your cache, restart PHP. Nothing helps. You do not realise that someone is sending thousands of password attempts to a file you have never heard of.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The file that lets attackers try 500 passwords in one request</h2>

        <p>
          Every WordPress installation contains a file called <code>xmlrpc.php</code> in the root directory. It has been there since WordPress 3.5 — enabled by default, visible to anyone, and accepting POST requests from the entire internet. Most WordPress site owners have never heard of it, never configured it, and have no idea it is active.
        </p>

        <p>
          XML-RPC was designed for a legitimate purpose: allowing remote publishing. Before the WordPress REST API existed, desktop blogging apps and mobile apps used XML-RPC to create and manage posts without logging into wp-admin. It also handled pingbacks — the notification system that tells you when another site links to your content.
        </p>

        <p>
          The problem is a feature called <code>system.multicall</code>. This method allows multiple XML-RPC calls to be bundled into a single HTTP request. An attacker sends one POST request containing hundreds of <code>wp.getUsersBlogs</code> calls, each with a different username and password. WordPress obediently processes every single one — authenticating each attempt, hashing each password with bcrypt, querying the database, and returning the result.
        </p>

        <p>
          One HTTP request. Five hundred login attempts. Your access logs show a single POST to <code>xmlrpc.php</code>. Your login attempt limiter counts it as one request and lets it through. But internally, your server just processed 500 authentication operations — each one consuming CPU time, memory, and a database query.
        </p>

        <p>
          Now imagine the attacker sending 10 of these requests per second. That is 5,000 authentication attempts per second, all hitting your database with bcrypt hash comparisons. Your site does not crash immediately — it slows down. Your visitors experience 3-second load times, then 8-second load times, then timeouts. And you have no idea why.
        </p>

        <h2>Why XML-RPC attacks are worse than wp-login.php brute force</h2>

        <p>
          A traditional brute force attack on <code>wp-login.php</code> sends one login attempt per HTTP request. Each request triggers one authentication operation. Rate limiting plugins count each request and block the IP after a set number of failed attempts. The attack is visible in your access logs as thousands of POST requests to <code>wp-login.php</code>.
        </p>

        <p>
          XML-RPC attacks bypass all of this. Here is why they are fundamentally more dangerous.
        </p>

        <h3>1. Amplification through system.multicall</h3>

        <p>
          A single HTTP request to <code>xmlrpc.php</code> can contain 500 or more <code>wp.getUsersBlogs</code> calls. Each call is a complete authentication attempt — WordPress loads the user from the database, hashes the provided password with bcrypt, and compares it to the stored hash. The CPU cost of bcrypt is intentionally high (that is the point of bcrypt — making brute force expensive). Multiply that by 500 and one HTTP request consumes as much CPU as 500 individual login attempts.
        </p>

        <p>
          Login attempt limiting plugins like Limit Login Attempts Reloaded or Wordfence typically count HTTP requests, not internal authentication operations. They see one request to <code>xmlrpc.php</code> and count it as one attempt. The 500 authentication operations inside that request go uncounted and unblocked.
        </p>

        <h3>2. Invisible in standard access logs</h3>

        <p>
          Your web server access log shows one line for each HTTP request. An XML-RPC multicall attack generates far fewer log entries than a wp-login.php attack. If you are scanning logs for suspicious activity — looking for hundreds of POST requests to the login page — you will miss the XML-RPC attack entirely. It looks like a handful of POST requests to an XML file.
        </p>

        <h3>3. CPU exhaustion without visible errors</h3>

        <p>
          The attack does not cause immediate errors. Your site stays up, returns 200 status codes, and serves pages — just increasingly slowly. CPU usage climbs to 100% as bcrypt operations pile up. PHP workers that would normally serve your pages are stuck processing authentication attempts. New visitor requests wait in the queue. Response times climb from 500ms to 2 seconds to 5 seconds to 15 seconds.
        </p>

        <p>
          On shared hosting, the hosting provider might throttle or suspend your account for excessive CPU usage — and you receive a warning email about your own site being a resource hog, not a notification that you are under attack.
        </p>

        <h3>4. DDoS amplification via pingback</h3>

        <p>
          XML-RPC&apos;s pingback feature can also be exploited for DDoS amplification. An attacker sends a pingback request to your xmlrpc.php asking it to verify a link on a target website. Your WordPress server makes an HTTP request to the target site on behalf of the attacker. By sending this request to thousands of WordPress sites simultaneously, the attacker uses those sites — including yours — as a DDoS botnet. Your server becomes an unwitting participant in an attack against someone else.
        </p>

        <h2>How to check if your site is under XML-RPC attack right now</h2>

        <h3>Check your access logs</h3>

        <p>
          Look for POST requests to <code>/xmlrpc.php</code> in your web server access logs. On most Linux servers, the access log is at <code>/var/log/apache2/access.log</code> or <code>/var/log/nginx/access.log</code>. Filter for xmlrpc:
        </p>

        <p>
          <code>grep xmlrpc.php /var/log/apache2/access.log | tail -50</code>
        </p>

        <p>
          If you see dozens or hundreds of POST requests to xmlrpc.php from the same IP or multiple IPs, you are likely under attack. Legitimate XML-RPC usage generates very few requests — if you are not using a remote publishing tool, you should see zero.
        </p>

        <h3>Check server resource usage</h3>

        <p>
          Run <code>top</code> or <code>htop</code> on your server. If PHP or MySQL processes are consuming an abnormal amount of CPU, and your site is not experiencing a legitimate traffic spike, an XML-RPC attack may be the cause. Cross-reference the CPU spike timing with the xmlrpc.php requests in your access log.
        </p>

        <h3>Test if xmlrpc.php is accessible</h3>

        <p>
          Visit <code>yourdomain.com/xmlrpc.php</code> in your browser. If you see &quot;XML-RPC server accepts POST requests only,&quot; the endpoint is active and accessible. Anyone on the internet can send POST requests to it.
        </p>

        <h2>How to disable xmlrpc.php properly</h2>

        <h3>Method 1: Block at the web server level (.htaccess)</h3>

        <p>
          The most effective approach is blocking access to xmlrpc.php before the request reaches PHP. This means WordPress never loads, no CPU is consumed processing the request, and the attack is stopped at the web server level.
        </p>

        <p>
          For Apache, add this to your <code>.htaccess</code> file in the WordPress root directory:
        </p>

        <p>
          <code>&lt;Files xmlrpc.php&gt;</code><br />
          <code>  Order Deny,Allow</code><br />
          <code>  Deny from all</code><br />
          <code>&lt;/Files&gt;</code>
        </p>

        <p>
          For Nginx, add this to your server block:
        </p>

        <p>
          <code>location = /xmlrpc.php &#123;</code><br />
          <code>  deny all;</code><br />
          <code>  return 403;</code><br />
          <code>&#125;</code>
        </p>

        <p>
          This returns a 403 Forbidden error for any request to xmlrpc.php without loading PHP at all. It is the lowest-overhead solution.
        </p>

        <h3>Method 2: Disable via WordPress filter</h3>

        <p>
          If you do not have access to your web server configuration, you can disable XML-RPC at the application level. Add this to your theme&apos;s <code>functions.php</code> or a custom plugin:
        </p>

        <p>
          <code>add_filter(&apos;xmlrpc_enabled&apos;, &apos;__return_false&apos;);</code>
        </p>

        <p>
          This disables XML-RPC functionality but the file still loads. WordPress still bootstraps, PHP still executes, and some CPU is still consumed. This is less effective than blocking at the web server level but better than leaving XML-RPC fully active.
        </p>

        <h3>Method 3: Use a security plugin</h3>

        <p>
          Security plugins like Wordfence, iThemes Security, and Sucuri include options to disable XML-RPC. In Wordfence, go to Firewall &gt; Brute Force Protection and enable &quot;Block XML-RPC authentication attempts.&quot; This blocks the authentication-based attacks while still allowing non-authentication XML-RPC methods if needed.
        </p>

        <p>
          The{' '}
          <a href="https://wordpress.org/documentation/article/hardening-wordpress/" target="_blank" rel="noopener noreferrer">WordPress Hardening Guide</a>{' '}
          provides additional security recommendations for protecting your WordPress installation against common attack vectors.
        </p>

        <h3>Method 4: Block at Cloudflare or WAF level</h3>

        <p>
          If your site is behind Cloudflare or another Web Application Firewall, create a rule to block all requests to <code>/xmlrpc.php</code>. In Cloudflare, go to Security &gt; WAF &gt; Custom Rules and create a rule where &quot;URI Path equals /xmlrpc.php&quot; with the action &quot;Block.&quot; This stops the request at the edge before it ever reaches your server — zero CPU impact on your origin.
        </p>

        <h2>How to detect XML-RPC attacks with Uptrue before your site crashes</h2>

        <p>
          The dangerous thing about XML-RPC attacks is the gap between when the attack starts and when your site actually crashes. The attack might run for hours, gradually exhausting your server&apos;s resources, while your uptime monitor reports that everything is fine — because the site is still technically returning 200 status codes. It is just taking 15 seconds to do it.
        </p>

        <p>
          <Link href="/signup">Uptrue&apos;s HTTP monitoring</Link> tracks response time on every check. It does not just tell you whether your site is up or down — it tells you how fast your site is responding. When an XML-RPC attack starts consuming CPU and slowing your server, Uptrue detects the response time increase and alerts you before the site goes down.
        </p>

        <h3>Step 1: Set up an HTTP monitor with response time alerting</h3>

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
          Uptrue records response time on every check. When your site is healthy, response time is consistent — say 300ms to 800ms. During an XML-RPC attack, response time climbs steadily as PHP workers become occupied with authentication attempts. You will see the response time graph spike from hundreds of milliseconds to seconds. The alert fires when response time exceeds your threshold, giving you time to investigate and block the attack.
        </p>

        <h3>Step 2: Monitor xmlrpc.php directly</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter <code>yourdomain.com/xmlrpc.php</code> as the URL</li>
          <li>Set expected status to <strong>403</strong> (if you have blocked it) or <strong>405</strong></li>
          <li>Set the interval to <strong>5 minutes</strong></li>
        </ol>

        <p>
          If you have blocked xmlrpc.php at the server level, this monitor confirms the block is still active. If the expected status changes from 403 back to 200 (meaning the block was removed — perhaps by a WordPress update overwriting .htaccess or a server configuration change), Uptrue alerts you immediately. This prevents the attack surface from silently reopening.
        </p>

        <h3>Step 3: Monitor wp-login.php for parallel attacks</h3>

        <p>
          Attackers often run XML-RPC and wp-login.php brute force attacks simultaneously. While you are focused on the XML-RPC vector, the wp-login.php attack continues. Set up an additional HTTP monitor on your login page to detect response time spikes from concurrent brute force attempts. See our guide on{' '}
          <Link href="/blog/wordpress-brute-force-attack">WordPress brute force attacks</Link>{' '}
          for details on hardening wp-login.php.
        </p>

        <h3>Step 4: Configure escalating alerts</h3>

        <p>
          XML-RPC attacks can escalate from a performance degradation to a full outage within minutes. Your alerts need to match this urgency:
        </p>

        <ul>
          <li><strong>Slack</strong> — immediate notification when response time exceeds threshold</li>
          <li><strong>Microsoft Teams</strong> — for teams using Microsoft collaboration tools</li>
          <li><strong>Email</strong> — as a backup trail and for post-incident review</li>
          <li><strong>Webhook</strong> — integrate with PagerDuty or Opsgenie for phone alerts during off-hours</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site health right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if xmlrpc.php is exposed and catch vulnerabilities before attackers do.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Hardening your site against XML-RPC attacks</h2>

        <p>
          Disabling xmlrpc.php is the first step. These additional measures create layers of defence against brute force attacks from all vectors.
        </p>

        <h3>Implement rate limiting at the server level</h3>
        <p>
          Configure your web server to rate-limit POST requests to both xmlrpc.php and wp-login.php. In Nginx, use the <code>limit_req</code> module. In Apache, use <code>mod_evasive</code> or <code>mod_security</code>. Rate limiting at the server level catches attacks before WordPress loads, reducing the CPU impact to nearly zero.
        </p>

        <h3>Use a Web Application Firewall</h3>
        <p>
          A WAF like Cloudflare, Sucuri, or AWS WAF blocks known attack patterns and malicious IPs at the edge. The requests never reach your server. Cloudflare&apos;s free plan includes basic WAF protection that is sufficient for most WordPress sites. The Pro plan includes more aggressive bot detection that stops automated attacks more effectively.
        </p>

        <h3>Enable two-factor authentication</h3>
        <p>
          Even if an attacker discovers valid credentials through a brute force attack, two-factor authentication prevents them from logging in. Use a plugin like WP 2FA or Wordfence Login Security to require a TOTP code from an authenticator app for all administrator and editor accounts.
        </p>

        <h3>Change the admin username</h3>
        <p>
          XML-RPC brute force attacks typically target the &quot;admin&quot; username because it is the WordPress default. If your admin username is &quot;admin,&quot; every brute force attack is already half-successful — they have the username right and only need to guess the password. Change the admin username to something unique and non-obvious.
        </p>

        <h3>Monitor server resources alongside uptime</h3>
        <p>
          CPU and memory monitoring alongside HTTP monitoring gives you a complete picture. A response time spike alerts you to the symptom. High CPU usage confirms the cause. Together, they tell you exactly when an attack started, how severe it is, and whether your mitigations are working.
        </p>

        <h2>Stop discovering attacks from your hosting provider&apos;s warning email</h2>

        <p>
          Most WordPress site owners discover XML-RPC attacks in one of two ways: their hosting provider sends a warning about excessive CPU usage, or their site crashes and a visitor tells them. By either point, the damage is done. The attack has been running for hours, your server resources have been exhausted, and your visitors have experienced slow or broken pages.
        </p>

        <p>
          Uptrue checks your site every 60 seconds and tracks response time on every check. When an XML-RPC attack starts degrading your site&apos;s performance, you see the response time climbing in real time. You get alerted when it crosses your threshold — while your site is still responding, while you can still log in and apply a fix, while your visitors are experiencing a slowdown rather than a complete outage.
        </p>

        <p>
          Disable xmlrpc.php today. Set up response time monitoring. The next attack attempt will fail silently instead of silently succeeding.
        </p>

        <div className="blog-cta-section">
          <h3>Detect XML-RPC attacks before they crash your site</h3>
          <p>
            Free plan available. HTTP monitoring with response time tracking. Alerts on Slack, email, Teams, and webhook. No credit card required.
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
            <li><Link href="/blog/wordpress-brute-force-attack">WordPress Brute Force Attack Slowing Your Site</Link></li>
            <li><Link href="/blog/wordpress-504-gateway-timeout">504 Gateway Timeout on WordPress</Link></li>
            <li><Link href="/blog/wordpress-slow-ttfb">WordPress TTFB Over 3 Seconds</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
