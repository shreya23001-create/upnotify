import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Brute Force Attack Slowing Your Site: How Thousands of Login Attempts Cause Downtime',
  description:
    'WordPress brute force attacks flood wp-login.php and xmlrpc.php with thousands of login attempts, exhausting CPU, memory, and PHP workers until your site slows to a crawl or crashes completely. Learn what causes the performance impact, how to harden your site, and how HTTP monitoring catches response time spikes from active attacks.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-brute-force-attack' },
  openGraph: {
    title: 'WordPress Brute Force Attack Slowing Your Site: How Thousands of Login Attempts Cause Downtime',
    description:
      'What causes WordPress brute force attacks to crash your site, how wp-login.php and xmlrpc.php flooding exhausts server resources, and how Upnotify HTTP monitoring detects response time spikes from active attacks.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-brute-force-attack',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Brute Force Attack Slowing Your Site: How Thousands of Login Attempts Cause Downtime',
    description:
      'What causes WordPress brute force attacks to crash your site, how wp-login.php and xmlrpc.php flooding exhausts server resources, and how Upnotify HTTP monitoring detects response time spikes from active attacks.',
  },
}

const FAQ_DATA = [
  {
    question: 'How does a brute force attack slow down my WordPress site?',
    answer:
      'Every login attempt on wp-login.php triggers a full WordPress bootstrap — loading the entire WordPress core, connecting to the database, querying the users table, hashing the attempted password with bcrypt, and comparing it against the stored hash. Each attempt consumes CPU time, memory, database connections, and a PHP worker process. When an attacker sends thousands of attempts per minute, every PHP worker is occupied processing login attempts instead of serving pages to real visitors. The database connection pool fills up. CPU usage hits 100%. Your site either slows to a crawl with response times of 10-30 seconds, or crashes with 502 and 503 errors.',
  },
  {
    question: 'What is xmlrpc.php and why do attackers use it?',
    answer:
      'xmlrpc.php is a WordPress file that provides an XML-RPC API for remote publishing, pingbacks, and third-party integrations. Attackers exploit it for brute force attacks because it supports the system.multicall method, which allows multiple login attempts in a single HTTP request. An attacker can try 500 username-password combinations in one request to xmlrpc.php, whereas wp-login.php requires a separate request for each attempt. This makes xmlrpc.php attacks far more efficient for the attacker and far more damaging to your server — a single request triggers 500 authentication attempts internally.',
  },
  {
    question: 'Can uptime monitoring detect a brute force attack?',
    answer:
      'Standard uptime monitoring that only checks for a 200 status code will not detect a brute force attack until it has already crashed your site. But HTTP monitoring that tracks response time will detect it early. A brute force attack causes a gradual increase in response time as PHP workers become occupied with login attempts. Response time might climb from 500ms to 2 seconds, then 5 seconds, then 10 seconds before the site eventually crashes. Monitoring that alerts on response time thresholds catches the attack while your site is still responding — giving you time to intervene before it goes down completely.',
  },
  {
    question: 'How do I stop brute force attacks on WordPress?',
    answer:
      'Layer multiple defences. First, block direct access to xmlrpc.php in your web server configuration or .htaccess — most WordPress sites do not need it. Second, limit login attempts using a plugin like Limit Login Attempts Reloaded or Wordfence. Third, change the login URL from wp-login.php to a custom URL using a plugin like WPS Hide Login. Fourth, add two-factor authentication to all admin and editor accounts. Fifth, use a Web Application Firewall (WAF) like Cloudflare or Sucuri that blocks known attack IPs at the edge before requests reach your server. Sixth, block access to wp-login.php by IP at the server level if only specific IPs need admin access.',
  },
]

export default function WordPressBruteForceAttackPage(): React.ReactElement {
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
          headline: 'WordPress Brute Force Attack Slowing Your Site: How Thousands of Login Attempts Cause Downtime',
          description: 'What causes WordPress brute force attacks to crash your site, how to harden against them, and how HTTP monitoring catches the response time spike before the crash.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-brute-force-attack',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>3 April 2026</span>
          <span>15 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Brute Force Attack Slowing Your Site: How Thousands of Login Attempts Cause Downtime</h1>
        <p className="blog-article-subtitle">
          Your WordPress site has been getting slower for the past hour. Pages that normally load in under a second are taking five, ten, fifteen seconds. Then they stop loading entirely. Your hosting provider sends a notification: CPU usage at 100%. Your site is down. But nobody changed anything. No updates, no new plugins, no code changes. What happened is an attack — and it does not even need to succeed to destroy your site&apos;s performance.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The attack that does not need to break in to break your site</h2>

        <p>
          A brute force attack on WordPress is not sophisticated. There is no clever exploit, no zero-day vulnerability, no social engineering. The attacker simply tries to guess your admin password by submitting thousands of username-password combinations to your login page. They run automated scripts that try common passwords, leaked credentials from other breaches, and dictionary word combinations against your <code>wp-login.php</code> page.
        </p>

        <p>
          Most of these attacks never succeed. Your password is strong enough. The attacker gives up after a few thousand attempts. But here is what site owners do not understand: the attack does not need to guess your password to cause damage. The damage is the attack itself. Every single login attempt forces WordPress to execute its full authentication stack — loading core files, connecting to the database, running the password hash comparison, firing authentication hooks, and logging the attempt. Each one consumes server resources.
        </p>

        <p>
          One login attempt is nothing. A hundred per minute is manageable. But attackers do not send a hundred. They send thousands. Tens of thousands. From botnets of compromised machines spread across the world. Each attempt ties up a PHP worker, a database connection, and CPU cycles. When all your PHP workers are busy processing login attempts, none are available to serve your homepage, your blog posts, your product pages, or your checkout. Real visitors see timeout errors. Your site is under attack and it is losing the war of resources.
        </p>

        <h2>How wp-login.php flooding crashes your server</h2>

        <p>
          The <code>wp-login.php</code> file is the default WordPress login page. It is publicly accessible on every WordPress installation at <code>yourdomain.com/wp-login.php</code>. There is no authentication required to access the login form itself — only to submit valid credentials. This means anyone in the world can send POST requests to your login page, and WordPress will process each one.
        </p>

        <p>
          Here is what happens on each login attempt. WordPress loads the entire core — <code>wp-load.php</code>, <code>wp-config.php</code>, the database connection, the plugin system, and the authentication handlers. It queries the <code>wp_users</code> table to find the submitted username. If the username exists, it retrieves the hashed password and runs it through <code>wp_check_password()</code>, which uses PHP&apos;s <code>password_verify()</code> function with bcrypt. Bcrypt is deliberately slow — that is its security feature for protecting passwords, but it also means each failed attempt costs real CPU time.
        </p>

        <p>
          On a modest shared hosting server, each login attempt takes 200-500 milliseconds of CPU time. That sounds fast, but at 100 attempts per second — which is a moderate attack — your server is spending 20-50 seconds of CPU time every second just processing login attempts. That is more CPU than your entire site needs to serve legitimate traffic. The PHP worker pool is saturated. Nginx or Apache queues incoming requests. Queue fills up. New requests are rejected with 502 or 503 errors. Your site is effectively down.
        </p>

        <p>
          On shared hosting, the situation is worse because you share resources with other sites. Your hosting provider&apos;s resource manager detects your account consuming excessive CPU and may throttle or suspend your account. Now your site is not just slow — it is offline because your host has taken it down to protect other customers on the same server.
        </p>

        <h2>xmlrpc.php amplification makes it worse</h2>

        <p>
          If <code>wp-login.php</code> brute force is a rifle, <code>xmlrpc.php</code> brute force is a shotgun. The XML-RPC interface was built for remote publishing — allowing tools like the WordPress mobile app and third-party blogging clients to publish posts without using the web interface. It also supports a method called <code>system.multicall</code> that allows multiple XML-RPC method calls in a single HTTP request.
        </p>

        <p>
          Attackers exploit <code>system.multicall</code> to send hundreds of login attempts in a single POST request. One request to <code>xmlrpc.php</code> can contain 500 or more <code>wp.getUsersBlogs</code> calls, each with a different password. WordPress processes every single one. From the server&apos;s perspective, it looks like a single HTTP request, but internally it triggers 500 authentication attempts — 500 database lookups, 500 bcrypt comparisons, 500 times the CPU cost.
        </p>

        <p>
          This is devastating for performance. A standard brute force attack on <code>wp-login.php</code> at 100 requests per second translates to 100 login attempts per second. The same attack rate against <code>xmlrpc.php</code> with <code>system.multicall</code> translates to 50,000 login attempts per second. Your server cannot process this. It crashes. And because the attack is technically just a few hundred HTTP requests per second — not the thousands that a simple volumetric attack would generate — many basic DDoS protection systems do not flag it.
        </p>

        <p>
          Refer to the{' '}
          <a href="https://wordpress.org/documentation/article/hardening-wordpress/" target="_blank" rel="noopener noreferrer">WordPress hardening guide</a>
          {' '}for official recommendations on securing your installation against these attacks.
        </p>

        <h2>The performance degradation timeline</h2>

        <p>
          A brute force attack does not take your site down instantly. It degrades performance over minutes or hours, and the timeline follows a predictable pattern that monitoring can detect.
        </p>

        <h3>Minutes 0-5: Response time creep</h3>
        <p>
          The attack begins. PHP workers start processing login attempts alongside legitimate traffic. Your normal 400ms response time climbs to 800ms, then 1.2 seconds. Visitors might not notice yet — pages still load, just slightly slower. Your standard uptime monitor reports everything as up because the site still returns 200.
        </p>

        <h3>Minutes 5-15: Worker saturation</h3>
        <p>
          Attack volume increases or the initial wave saturates workers. Response time climbs to 3-5 seconds. Visitors notice now. Some leave. Google&apos;s crawlers get slow responses and reduce crawl rate. If you have an HTTP monitor tracking response time, this is when you should get your first alert. Intervention at this stage — blocking the attacking IPs at the server or CDN level — prevents the crash.
        </p>

        <h3>Minutes 15-30: Queue overflow</h3>
        <p>
          All PHP workers are occupied. Incoming requests queue at the web server level. The queue has a finite length. When it fills, the web server starts returning 502 Bad Gateway or 503 Service Unavailable errors. Some requests get through; others do not. The site is effectively in a partial outage — intermittently available depending on whether a PHP worker frees up in time.
        </p>

        <h3>Minutes 30+: Full crash</h3>
        <p>
          The server runs out of memory, the database connection pool is exhausted, or the hosting provider suspends the account. Every request returns an error. The site is down. Recovery requires blocking the attack source, restarting PHP-FPM and the web server, and potentially contacting the hosting provider to unsuspend the account.
        </p>

        <h2>How to harden WordPress against brute force attacks</h2>

        <h3>1. Disable xmlrpc.php</h3>
        <p>
          If you do not use XML-RPC — and most modern WordPress sites do not — disable it entirely. Add this to your <code>.htaccess</code> file:
        </p>
        <p>
          <code>&lt;Files xmlrpc.php&gt;</code><br />
          <code>Order Allow,Deny</code><br />
          <code>Deny from all</code><br />
          <code>&lt;/Files&gt;</code>
        </p>
        <p>
          Or in Nginx, add this to your server block:
        </p>
        <p>
          <code>location = /xmlrpc.php {'{'} deny all; return 403; {'}'}</code>
        </p>
        <p>
          This blocks all access to xmlrpc.php at the web server level, before WordPress even loads. The CPU cost drops to near zero for these requests.
        </p>

        <h3>2. Limit login attempts</h3>
        <p>
          Install a login limiting plugin that blocks an IP after a set number of failed attempts. After 5 failed attempts, lock the IP out for 15 minutes. After 3 lockouts, lock them out for 24 hours. This does not stop the attack — the attacker can rotate IPs — but it dramatically reduces the number of authentication attempts each IP can make, which reduces the CPU load.
        </p>

        <h3>3. Change the login URL</h3>
        <p>
          Use a plugin like WPS Hide Login to change <code>wp-login.php</code> to a custom URL that only you know. Automated brute force scripts target the default <code>wp-login.php</code> path. If that path returns a 404, the script moves on to the next target. This is security through obscurity — it should not be your only defence — but it eliminates the vast majority of automated attacks.
        </p>

        <h3>4. Add two-factor authentication</h3>
        <p>
          Two-factor authentication makes brute force attacks pointless. Even if an attacker guesses your password, they cannot log in without the second factor. Use a plugin that supports TOTP (time-based one-time password) apps like Google Authenticator or Authy. Apply 2FA to all admin, editor, and author accounts — any account that can modify content.
        </p>

        <h3>5. Use a CDN or WAF to block at the edge</h3>
        <p>
          Services like Cloudflare, Sucuri, and Fastly can block brute force attacks before they reach your server. They identify known attack patterns, block known malicious IPs, and rate limit requests to sensitive URLs. The attack traffic is stopped at the CDN edge, hundreds of miles from your server, consuming none of your server resources. This is the most effective defence because it eliminates the resource consumption entirely.
        </p>

        <h3>6. Block login by IP at the server level</h3>
        <p>
          If only specific IP addresses need to access wp-admin — your office IP, your home IP, your VPN IP — restrict access at the web server level. In <code>.htaccess</code>:
        </p>
        <p>
          <code>&lt;Files wp-login.php&gt;</code><br />
          <code>Order Deny,Allow</code><br />
          <code>Deny from all</code><br />
          <code>Allow from 203.0.113.10</code><br />
          <code>&lt;/Files&gt;</code>
        </p>
        <p>
          Replace <code>203.0.113.10</code> with your actual IP. This blocks every brute force attempt at the web server level — no PHP execution, no database queries, no CPU cost.
        </p>

        <h2>How to detect brute force attacks with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s HTTP monitoring</Link> tracks both uptime and response time on every check. A brute force attack causes a characteristic response time spike that monitoring catches before the site crashes — giving you time to block the attack and prevent downtime.
        </p>

        <h3>Step 1: Set up HTTP monitoring with response time alerting</h3>

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
          Upnotify tracks response time on every check. When a brute force attack begins consuming your server resources, response time climbs from your normal baseline to 2, 5, 10 seconds. The response time history in your dashboard shows the exact moment the degradation started — which correlates with the attack start time in your server logs.
        </p>

        <h3>Step 2: Monitor wp-login.php directly</h3>

        <ol>
          <li>Add another <strong>HTTP/HTTPS</strong> monitor</li>
          <li>Enter <code>https://yourdomain.com/wp-login.php</code> as the URL</li>
          <li>Set expected status to <strong>200</strong> (or 403 if you have restricted access)</li>
          <li>Set the check interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          If you have blocked <code>wp-login.php</code> at the server level, the expected status should be 403. If the monitor suddenly gets a 200 instead, it means your blocking rule has been bypassed or removed. If you have not blocked it and the monitor gets a 503 or 502, the login page is being overwhelmed — a strong indicator of an active brute force attack.
        </p>

        <h3>Step 3: Add keyword monitoring for error pages</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to <strong>&quot;Service Unavailable&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          When a brute force attack exhausts your PHP workers, some requests get a 503 Service Unavailable page. This keyword monitor catches that error text even if the server returns it with an unexpected status code. Some hosting providers return custom error pages with a 200 status — keyword monitoring catches those.
        </p>

        <h3>Step 4: Monitor xmlrpc.php if you cannot disable it</h3>

        <p>
          If you need XML-RPC for a mobile app or third-party integration, you cannot disable it entirely. Instead, monitor it:
        </p>

        <ol>
          <li>Add an <strong>HTTP/HTTPS</strong> monitor for <code>https://yourdomain.com/xmlrpc.php</code></li>
          <li>Expected status: <strong>200</strong> (XML-RPC returns 200 even for error responses)</li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          If xmlrpc.php starts returning 502 or 503, it is under attack. If response time spikes from its normal 200ms to 5+ seconds, an amplification attack is in progress.
        </p>

        <h3>Step 5: Set up alerts for maximum speed</h3>

        <ul>
          <li><strong>Slack</strong> — instant notification when response time spikes or errors appear</li>
          <li><strong>Microsoft Teams</strong> — keep the development team informed during active attacks</li>
          <li><strong>Email</strong> — written record of attack timeline for post-incident analysis</li>
          <li><strong>Webhook</strong> — trigger automated responses like enabling Cloudflare &quot;Under Attack&quot; mode</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site&apos;s attack surface right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if your login page and xmlrpc.php are exposed.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>After the attack: what to check</h2>

        <h3>Check your server logs</h3>
        <p>
          Review your web server access logs for the attack period. Look for excessive POST requests to <code>wp-login.php</code> and <code>xmlrpc.php</code>. Identify the attacking IP addresses or ranges. Block them permanently at the server level or in your CDN.
        </p>

        <h3>Check for successful logins</h3>
        <p>
          If the attack succeeded — if the attacker guessed a valid password — you have a much bigger problem than performance. Check your WordPress user list for new admin accounts. Check your plugin list for newly installed plugins. Check your theme files for modifications. If any account was compromised, change all passwords, revoke all sessions, and scan for malware. Refer to the <Link href="/blog/wordpress-site-hacked">WordPress site hacked guide</Link> for full remediation steps.
        </p>

        <h3>Check your database</h3>
        <p>
          Some brute force attacks cause database table locks or corruption. Run <code>mysqlcheck --auto-repair</code> on your WordPress database. Check the <code>wp_options</code> table for unexpected changes. Verify that the <code>siteurl</code> and <code>home</code> options have not been modified.
        </p>

        <h2>Your site is being attacked right now — the question is whether you know</h2>

        <p>
          Every WordPress site on the internet is a target for brute force attacks. This is not a question of if, but of when and how often. Most site owners never see the attacks in their logs because they never look. They only notice when the site slows down or crashes — and then they blame the hosting provider, blame WordPress, blame a plugin. They do not think to check the login page access logs where the real story is written.
        </p>

        <p>
          Upnotify HTTP monitoring tracks your response time on every check. When an attack starts consuming your resources, the response time graph spikes. You get alerted before the crash. You block the attack. Your site stays up. Your visitors never know anything happened. That is the difference between monitoring and hoping.
        </p>

        <div className="blog-cta-section">
          <h3>Catch brute force attacks before they crash your site</h3>
          <p>
            Free plan available. HTTP monitoring with response time tracking. Two-confirmation checks from multiple locations. Slack, Teams, email, and webhook alerts. No credit card required.
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
            <li><Link href="/blog/wordfence-blocking-traffic">Wordfence Blocking Real Users: When Your Security Plugin Becomes Your Biggest Problem</Link></li>
            <li><Link href="/blog/wordpress-504-gateway-timeout">504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail</Link></li>
            <li><Link href="/blog/wordpress-slow-ttfb">WordPress TTFB Over 3 Seconds: Why Your Site Feels Dead Even When It&apos;s Technically Up</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
