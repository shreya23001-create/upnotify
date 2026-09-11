import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Login Redirect Loop: Why wp-admin Keeps Sending You Back to the Login Page',
  description:
    'Your WordPress login page keeps redirecting back to itself. You enter the correct password, hit Log In, and land right back on the same screen. Learn what causes the wp-admin redirect loop and how to fix it.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-redirect-loop' },
  openGraph: {
    title: 'WordPress Login Redirect Loop: Why wp-admin Keeps Sending You Back to the Login Page',
    description:
      'What causes the WordPress login redirect loop, how to fix cookie issues and URL mismatches, and how Upnotify HTTP monitoring detects redirect loops on wp-admin automatically.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-redirect-loop',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Login Redirect Loop: Why wp-admin Keeps Sending You Back to the Login Page',
    description:
      'What causes the WordPress login redirect loop, how to fix cookie issues and URL mismatches, and how Upnotify HTTP monitoring detects redirect loops on wp-admin automatically.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why does WordPress keep redirecting me to the login page?',
    answer:
      'WordPress uses cookies to maintain your login session. If your browser cannot store or send these cookies back to the server, WordPress does not recognise you as logged in and sends you back to the login page. Common causes include browser cookie settings, a mismatch between your WordPress URL and Site URL, plugin conflicts that interfere with authentication, and incorrect cookie domain constants in wp-config.php.',
  },
  {
    question: 'Can I fix the redirect loop without FTP access?',
    answer:
      'If you can access your hosting control panel (cPanel, Plesk, or similar), you can use the file manager to edit wp-config.php and the database via phpMyAdmin. If you cannot access any server-side tools, you will need to contact your hosting provider. The redirect loop locks you out of wp-admin entirely, so there is no way to fix it from within the WordPress dashboard.',
  },
  {
    question: 'Will clearing my browser cookies fix the WordPress login loop?',
    answer:
      'Sometimes yes. If the issue is a corrupted or stale cookie in your browser, clearing cookies for your domain and trying again can resolve it. However, if the problem is server-side — such as a URL mismatch or a plugin conflict — clearing cookies will not help. It is worth trying first because it takes seconds, but if the loop persists, you need to investigate server-side causes.',
  },
  {
    question: 'How can monitoring detect a WordPress login redirect loop?',
    answer:
      'An HTTP monitor configured to check your wp-admin or wp-login.php URL will detect a redirect loop because the server returns a 302 redirect repeatedly rather than a 200 OK with the dashboard page. Upnotify follows redirects up to a limit and flags the loop as an error. You can also use keyword monitoring on your homepage to confirm that the front end is still loading normally while the admin area is broken.',
  },
]

export default function WordPressRedirectLoopPage(): React.ReactElement {
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
          headline: 'WordPress Login Redirect Loop: Why wp-admin Keeps Sending You Back to the Login Page',
          description: 'What causes the WordPress login redirect loop, how to fix cookie issues and URL mismatches, and how HTTP monitoring detects redirect loops automatically.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-18',
          dateModified: '2026-03-18',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-redirect-loop',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>18 March 2026</span>
          <span>13 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Login Redirect Loop: Why wp-admin Keeps Sending You Back to the Login Page</h1>
        <p className="blog-article-subtitle">
          You enter the correct username and password. You click Log In. And WordPress sends you right back to the same login screen. No error message. No explanation. Just the same form, staring back at you, as if nothing happened.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>Locked out of your own website</h2>

        <p>
          There are few things more frustrating than being unable to access the admin panel of a website you own. You know the password is correct. You even reset it to be sure. But every time you log in, WordPress redirects you straight back to <code>wp-login.php</code> as if you never authenticated at all.
        </p>

        <p>
          Meanwhile, your site might be working perfectly fine for visitors. The homepage loads. Blog posts are visible. But you cannot manage anything. You cannot update plugins, publish content, respond to comments, or fix a security issue. You are locked out of your own property.
        </p>

        <p>
          Or worse — the redirect loop is not just affecting wp-admin. Sometimes the loop affects the front end too, and your visitors see a browser error: <strong>&quot;This page isn&apos;t working. yoursite.com redirected you too many times.&quot;</strong> That version locks everyone out — you and your visitors.
        </p>

        <p>
          The login redirect loop is insidious because it gives you no error message from WordPress itself. There is no &quot;critical error&quot; screen. There is no white screen. The login page looks completely normal. It just refuses to let you in. And because the front end can still work, standard uptime monitoring reports everything as fine.
        </p>

        <h2>What causes the WordPress login redirect loop</h2>

        <p>
          The login redirect loop happens when WordPress cannot verify your authentication session after you log in. You submit your credentials, WordPress validates them, sets a cookie, and redirects you to wp-admin. But when wp-admin loads, WordPress checks for the cookie, does not find it or does not trust it, and sends you back to the login page to authenticate again. This creates an infinite loop.
        </p>

        <p>
          There are several reasons this chain breaks. Each one requires a different fix.
        </p>

        <h3>1. Browser cookie issues</h3>

        <p>
          WordPress authentication depends entirely on cookies. When you log in, WordPress sets two cookies: <code>wordpress_logged_in_[hash]</code> and <code>wordpress_[hash]</code>. Your browser must store these cookies and send them back with every request to wp-admin. If your browser blocks cookies, has stale cookies from a previous installation, or has a privacy extension that strips cookies, the login loop occurs.
        </p>

        <p>
          <strong>How to fix it:</strong> Clear all cookies for your domain in your browser settings. If you use a privacy extension like uBlock Origin, Privacy Badger, or a cookie auto-delete tool, temporarily disable it. Try logging in using a private or incognito window — this starts with a clean cookie jar and eliminates browser-side causes immediately. If it works in incognito, the problem is a browser extension or cached cookie.
        </p>

        <h3>2. WordPress Address and Site Address mismatch</h3>

        <p>
          WordPress stores two URLs in its <code>options</code> table: <code>siteurl</code> (WordPress Address) and <code>home</code> (Site Address). These must match exactly. If one says <code>https://www.yoursite.com</code> and the other says <code>https://yoursite.com</code> — or one uses <code>http</code> and the other uses <code>https</code> — the cookie domain does not match the redirect target, and the login loop begins.
        </p>

        <p>
          This commonly happens after migrating a site to a new domain, enabling SSL, or changing the URL in Settings &gt; General without updating both fields. Since you are locked out of wp-admin, you cannot fix it from the dashboard.
        </p>

        <p>
          <strong>How to fix it:</strong> Connect to your database via phpMyAdmin (available in most hosting control panels). Open the <code>wp_options</code> table. Find the rows where <code>option_name</code> is <code>siteurl</code> and <code>home</code>. Make sure both values are identical — same protocol (<code>https</code>), same domain, same www or non-www format. Save the changes and try logging in again. Refer to the{' '}
          <a href="https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#blog-address-url" target="_blank" rel="noopener noreferrer">WordPress wp-config documentation</a>
          {' '}for more details on hardcoding these values.
        </p>

        <h3>3. Plugin conflict on login</h3>

        <p>
          Security plugins, caching plugins, and custom login plugins hook into the WordPress authentication process. If a plugin modifies the login flow, the redirect behaviour, or the cookie handling, it can break the authentication chain. This is especially common with plugins that add two-factor authentication, custom login pages, or aggressive page caching that caches the login page itself.
        </p>

        <p>
          A caching plugin that caches the <code>wp-login.php</code> page will serve a stale version that does not process your login form submission. The form posts to a cached page, the server never receives your credentials, and you are redirected back to the login form.
        </p>

        <p>
          <strong>How to fix it:</strong> Via FTP or your hosting file manager, navigate to <code>/wp-content/plugins/</code>. Rename the entire <code>plugins</code> folder to <code>plugins-disabled</code>. This deactivates all plugins at once. Try logging in. If the loop stops, one of your plugins is the cause. Rename the folder back to <code>plugins</code>, then rename individual plugin folders one by one to find the culprit. Start with any security plugin, caching plugin, or custom login plugin.
        </p>

        <h3>4. Incorrect cookie constants in wp-config.php</h3>

        <p>
          WordPress allows you to define the cookie domain and cookie path in <code>wp-config.php</code> using constants. If these are set incorrectly — for example, pointing to the wrong domain, an old domain, or a subdirectory that does not match your installation — cookies are set for the wrong scope and WordPress cannot read them back.
        </p>

        <p>
          <strong>How to fix it:</strong> Open <code>wp-config.php</code> via FTP. Search for these lines:
        </p>

        <p>
          <code>define(&apos;COOKIE_DOMAIN&apos;, &apos;yoursite.com&apos;);</code><br />
          <code>define(&apos;COOKIEPATH&apos;, &apos;/&apos;);</code><br />
          <code>define(&apos;SITECOOKIEPATH&apos;, &apos;/&apos;);</code><br />
          <code>define(&apos;ADMIN_COOKIE_PATH&apos;, &apos;/wp-admin&apos;);</code>
        </p>

        <p>
          If these lines exist, verify the domain matches your current domain exactly. If you are not sure, comment them out by adding <code>{'//'}</code> at the start of each line. WordPress will use its default cookie settings, which work correctly in standard installations.
        </p>

        <h3>5. SSL and mixed content forcing redirect</h3>

        <p>
          If you recently added an SSL certificate and forced HTTPS but did not update your WordPress URLs, or if your hosting provider is handling SSL at the load balancer level while WordPress thinks it is running on HTTP, the login form can get stuck in a redirect loop. WordPress sets cookies for HTTPS, but the redirect goes to HTTP (or vice versa), and the cookies do not travel across the protocol boundary.
        </p>

        <p>
          <strong>How to fix it:</strong> First, ensure both <code>siteurl</code> and <code>home</code> in the database use <code>https://</code>. Then, if your hosting uses a reverse proxy or load balancer, add this to <code>wp-config.php</code> before the &quot;That&apos;s all, stop editing&quot; comment:
        </p>

        <p>
          <code>if (isset($_SERVER[&apos;HTTP_X_FORWARDED_PROTO&apos;]) &amp;&amp; $_SERVER[&apos;HTTP_X_FORWARDED_PROTO&apos;] === &apos;https&apos;) &#123; $_SERVER[&apos;HTTPS&apos;] = &apos;on&apos;; &#125;</code>
        </p>

        <p>
          This tells WordPress that the connection is secure even though the server itself receives HTTP from the load balancer. The{' '}
          <a href="https://developer.wordpress.org/advanced-administration/wordpress/wp-config/" target="_blank" rel="noopener noreferrer">WordPress wp-config.php documentation</a>
          {' '}covers this and other reverse proxy configurations.
        </p>

        <h3>6. Corrupted .htaccess file</h3>

        <p>
          The <code>.htaccess</code> file controls URL rewriting on Apache servers. A malformed rewrite rule — from a plugin, a manual edit, or a failed update — can create a redirect loop that specifically targets <code>wp-login.php</code> or <code>wp-admin</code>. The browser follows the redirects until it hits the browser limit and displays the &quot;too many redirects&quot; error.
        </p>

        <p>
          <strong>How to fix it:</strong> Via FTP, rename <code>.htaccess</code> to <code>.htaccess-backup</code>. Try logging in. If the loop stops, the <code>.htaccess</code> file was the problem. Log into wp-admin, go to Settings &gt; Permalinks, and click Save Changes without changing anything. WordPress regenerates a clean <code>.htaccess</code> file.
        </p>

        <h2>Why standard uptime monitoring misses the login redirect loop</h2>

        <p>
          If the redirect loop only affects <code>wp-admin</code> and <code>wp-login.php</code>, your front end can appear completely normal. A standard HTTP monitor checking your homepage sees a 200 OK response and reports your site as up. Your monitoring dashboard is green.
        </p>

        <p>
          But you cannot manage your site. You cannot publish that urgent blog post. You cannot update the plugin with the critical security patch. You cannot process the WooCommerce order that is sitting in the queue. Your site looks alive, but you have lost control of it.
        </p>

        <p>
          Even if you monitor <code>wp-login.php</code> directly, a basic HTTP check might follow one redirect and see a 200 response — the login page itself — and report it as healthy. It does not know that logging in leads to an infinite loop. You need a monitor that follows the full redirect chain and flags when the number of redirects exceeds a reasonable threshold.
        </p>

        <h2>How to detect the login redirect loop with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s HTTP monitoring</Link> follows redirect chains and detects when a URL enters a loop. Combined with keyword monitoring, you get complete coverage of both the admin panel and the front end.
        </p>

        <h3>Step 1: Set up an HTTP monitor on wp-admin</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your wp-admin URL: <code>https://yoursite.com/wp-admin/</code></li>
          <li>Set expected status to <strong>200</strong> or <strong>302</strong> (a single redirect to the login page is normal for unauthenticated requests)</li>
          <li>Set the check interval to <strong>5 minutes</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          When a redirect loop occurs, the server returns repeated 302 redirects that never resolve to a final 200 page. Upnotify detects this as a failure and alerts you immediately. A normal wp-admin check returns a single 302 to the login page — but a loop produces a chain of redirects that exceeds the follow limit.
        </p>

        <h3>Step 2: Add a keyword monitor on your homepage</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to your site title or a tagline that always appears on the page</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This confirms that even when wp-admin is in a loop, your visitors can still see your content. If both monitors go red, the redirect loop has spread to the front end and the situation is critical.
        </p>

        <h3>Step 3: Add a keyword monitor to detect the browser error</h3>

        <ol>
          <li>Add a <strong>Keyword</strong> monitor for your homepage</li>
          <li>Set the keyword to <strong>&quot;redirected you too many times&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          If the redirect loop reaches the front end, browsers display an error page. Upnotify detects the absence of your normal content or the presence of redirect error text and alerts you before your visitors start complaining.
        </p>

        <h3>Step 4: Configure alerts that reach you immediately</h3>

        <p>
          A login redirect loop can persist for hours or days because your front end still works and you have no reason to log into wp-admin. By the time you notice, a plugin has been out of date for a week, or a security patch has gone uninstalled. Configure your alerts to go where you will see them:
        </p>

        <ul>
          <li><strong>Slack</strong> — instant notification in a dedicated channel</li>
          <li><strong>Microsoft Teams</strong> — same idea, different platform</li>
          <li><strong>Email</strong> — fine as a backup, but not fast enough for emergencies</li>
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

        <h2>Preventing the login redirect loop</h2>

        <p>
          Once you fix the loop, these habits keep it from coming back.
        </p>

        <h3>Keep your URLs consistent</h3>
        <p>
          Decide on one canonical URL format — www or non-www, http or https — and stick with it everywhere. In the database, in wp-config.php, in your DNS settings, and in your SSL configuration. Any mismatch between these locations is a redirect loop waiting to happen.
        </p>

        <h3>Exclude login pages from caching</h3>
        <p>
          If you use a caching plugin (WP Super Cache, W3 Total Cache, WP Rocket, or similar), verify that <code>wp-login.php</code> and <code>wp-admin</code> are excluded from the page cache. Most caching plugins do this by default, but custom rules or server-level caching (Varnish, Nginx FastCGI Cache) might not respect WordPress login cookies.
        </p>

        <h3>Test plugin updates one at a time</h3>
        <p>
          Security plugins and caching plugins are the most common culprits. Update them individually. After each update, verify that you can log out and log back in. If a plugin update breaks authentication, you know immediately which one caused it.
        </p>

        <h3>Keep a backup of wp-config.php</h3>
        <p>
          Before making any changes to <code>wp-config.php</code>, download a copy. If your edits cause a login loop, you can restore the original file in seconds. A broken <code>wp-config.php</code> can lock you out of your site completely.
        </p>

        <h2>Stop finding out from your customers</h2>

        <p>
          The WordPress login redirect loop is silent. Your front end can look perfectly healthy while you are completely locked out of your admin panel. No error message. No WordPress notification. No monitoring alert if you are only checking the homepage.
        </p>

        <p>
          Upnotify monitors your wp-admin URL directly. When a redirect loop starts, you know in minutes — not when you next try to log in and find yourself staring at the same login form for the fifth time.
        </p>

        <p>
          One minute checks. HTTP and keyword monitoring. Slack, Teams, email, and webhook alerts. Full redirect chain analysis that catches loops before your browser does.
        </p>

        <div className="blog-cta-section">
          <h3>Detect WordPress admin redirect loops automatically</h3>
          <p>
            Free plan available. HTTP monitoring that follows redirect chains. Keyword monitoring that checks actual content. No credit card required.
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
            <li><Link href="/blog/wordpress-too-many-redirects">WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever</Link></li>
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
            <li><Link href="/blog/wordpress-white-screen-of-death">WordPress White Screen of Death: How to Detect It Before Your Visitors Do</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
