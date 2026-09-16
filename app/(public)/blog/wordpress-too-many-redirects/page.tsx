import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever',
  description:
    'The ERR_TOO_MANY_REDIRECTS error makes your WordPress site completely inaccessible. Learn what causes redirect loops, how to fix each cause, and how to set up monitoring that catches redirect loops before your visitors do.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-too-many-redirects' },
  openGraph: {
    title: 'WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever',
    description:
      'What causes WordPress redirect loops, how to fix each cause step by step, and how HTTP monitoring automatically detects redirect loops.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-too-many-redirects',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever',
    description:
      'What causes WordPress redirect loops, how to fix each cause step by step, and how HTTP monitoring automatically detects redirect loops.',
  },
}

const FAQ_DATA = [
  {
    question: 'What does ERR_TOO_MANY_REDIRECTS mean?',
    answer:
      'ERR_TOO_MANY_REDIRECTS means your browser detected a redirect loop — your site is redirecting to a URL that redirects back to the original URL, creating an infinite cycle. The browser gives up after a set number of redirects (usually 20) and shows this error. Your visitors cannot access any page on your site until the loop is broken.',
  },
  {
    question: 'Why does WordPress cause too many redirects?',
    answer:
      'The most common causes are: an SSL plugin redirecting HTTP to HTTPS while your .htaccess file or hosting panel does the same (double redirect), a mismatch between WordPress Address and Site Address in Settings, a CDN like Cloudflare set to Flexible SSL creating a redirect loop with your server, and conflicting redirect rules in .htaccess from multiple plugins. Each of these creates a situation where URL A redirects to URL B, which redirects back to URL A.',
  },
  {
    question: 'Can I fix the redirect loop without access to wp-admin?',
    answer:
      'Yes. The redirect loop usually prevents you from logging into wp-admin because the login page itself is caught in the loop. You need to fix it via FTP or your hosting file manager. The most effective approach is to rename .htaccess to .htaccess-backup (which removes all redirect rules), then deactivate plugins by renaming the /wp-content/plugins/ folder. Once the site loads, you can reactivate plugins one by one to find the culprit.',
  },
  {
    question: 'Can uptime monitoring detect a redirect loop?',
    answer:
      'Yes, if your monitoring tool follows redirects and detects loops. Upnotify HTTP monitoring follows the redirect chain and alerts you when it detects a loop or when the number of redirects exceeds the expected count. This catches redirect loops automatically — often within 60 seconds of the problem starting — so you know about it before your visitors report it.',
  },
]

export default function WordPressTooManyRedirectsPage(): React.ReactElement {
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
          headline: 'WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever',
          description: 'What causes WordPress redirect loops, how to fix each cause step by step, and how to set up monitoring that catches redirect loops automatically.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-15',
          dateModified: '2026-03-15',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-too-many-redirects',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>15 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever</h1>
        <p className="blog-article-subtitle">
          Your site is not just down — it is actively refusing to load. Every page, every link, even your wp-admin login is caught in an infinite redirect loop. And clearing your browser cookies will not fix it this time.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The error that locks you out of your own site</h2>

        <p>
          You try to visit your WordPress site and the browser shows you a stark message:
        </p>

        <p>
          <strong>&quot;This page isn&apos;t working. yoursite.com redirected you too many times. Try clearing your cookies. ERR_TOO_MANY_REDIRECTS.&quot;</strong>
        </p>

        <p>
          You clear your cookies. Same error. You try a different browser. Same error. You try your phone. Same error. You try logging into wp-admin. Same error. You are completely locked out of your own website.
        </p>

        <p>
          Your visitors are seeing the same thing. Every page on your site is broken. Google is crawling your site and hitting redirect loops — which it interprets as a serious technical failure. If the loop persists for more than a few hours, Google starts dropping your pages from the index. Rankings you spent months building can disappear in a day.
        </p>

        <p>
          And the infuriating thing is, you probably did not change anything. Or you changed one small thing — installed an SSL plugin, updated a redirect plugin, switched your CDN settings — and now your entire site is unreachable.
        </p>

        <h2>What a redirect loop actually is</h2>

        <p>
          A redirect loop happens when URL A redirects to URL B, and URL B redirects back to URL A. Your browser follows the chain: A to B to A to B to A to B — until it gives up.
        </p>

        <p>
          In WordPress, these redirects can come from multiple sources simultaneously: your <code>.htaccess</code> file, your WordPress settings, an SSL plugin, a redirect plugin, your hosting control panel, and your CDN. When two or more of these sources create conflicting redirect rules, you get a loop.
        </p>

        <p>
          The browser typically follows up to 20 redirects before giving up and showing the ERR_TOO_MANY_REDIRECTS error. The entire process happens in milliseconds — your visitors see the error almost instantly.
        </p>

        <h2>The five causes of WordPress redirect loops</h2>

        <p>
          Every redirect loop in WordPress comes down to conflicting rules. Two or more systems are each trying to redirect the same URL, and they disagree on where it should go. Here are the five most common culprits.
        </p>

        <h3>1. SSL redirect stacking — the most common cause</h3>

        <p>
          This is the number one cause of redirect loops in WordPress, and it happens when multiple layers try to force HTTPS at the same time.
        </p>

        <p>
          Here is a typical scenario. You install an SSL certificate. Your hosting provider automatically adds a redirect from HTTP to HTTPS in the server configuration. Then you install an SSL plugin like Really Simple SSL, which adds its own redirect. Then your <code>.htaccess</code> file also has a redirect rule from a previous attempt to force HTTPS. Now you have three layers all trying to redirect the same request.
        </p>

        <p>
          In some configurations, one layer redirects to HTTPS, the next layer does not see the HTTPS and redirects again, the third layer redirects back — and you have a loop.
        </p>

        <p>
          <strong>How to fix it:</strong> You need exactly one HTTPS redirect, not three. Connect via FTP and open your <code>.htaccess</code> file. Remove any manual HTTPS redirect rules (they typically contain <code>RewriteRule ^(.*)$ https://%&#123;HTTP_HOST&#125;%&#123;REQUEST_URI&#125;</code>). Then deactivate your SSL plugin by renaming its folder in <code>/wp-content/plugins/</code>. Let your hosting provider&apos;s built-in HTTPS redirect handle it — this is the most reliable approach. If the site loads, reactivate your other plugins one by one.
        </p>

        <h3>2. WordPress Address vs Site Address mismatch</h3>

        <p>
          WordPress has two URL settings in <strong>Settings &gt; General</strong>: &quot;WordPress Address (URL)&quot; and &quot;Site Address (URL).&quot; The WordPress Address is where your WordPress files live. The Site Address is where visitors access your site.
        </p>

        <p>
          If these two values conflict — one uses <code>https://www.yoursite.com</code> and the other uses <code>https://yoursite.com</code> — WordPress redirects between them in an infinite loop. This also happens if one uses HTTP and the other uses HTTPS.
        </p>

        <p>
          <strong>How to fix it:</strong> Since you cannot access wp-admin, you need to fix this in the database or in <code>wp-config.php</code>. Add these two lines to <code>wp-config.php</code> above the &quot;That&apos;s all, stop editing&quot; comment:
        </p>

        <p>
          <code>define(&apos;WP_HOME&apos;, &apos;https://yoursite.com&apos;);</code><br />
          <code>define(&apos;WP_SITEURL&apos;, &apos;https://yoursite.com&apos;);</code>
        </p>

        <p>
          Make sure both values are identical and use the correct protocol (HTTP or HTTPS) and the correct www or non-www format. Save the file and reload your site.
        </p>

        <h3>3. Cloudflare Flexible SSL creating a loop</h3>

        <p>
          This is extremely common and extremely confusing. Cloudflare offers a &quot;Flexible SSL&quot; option that encrypts the connection between the visitor and Cloudflare, but sends an unencrypted HTTP request to your server. Your server sees an HTTP request and redirects to HTTPS. Cloudflare receives the HTTPS redirect, but its Flexible SSL mode sends the request to your server over HTTP again. Your server redirects to HTTPS again. Loop.
        </p>

        <p>
          The{' '}
          <a href="https://developers.cloudflare.com/ssl/troubleshooting/too-many-redirects/" target="_blank" rel="noopener noreferrer">Cloudflare documentation on redirect loops</a>
          {' '}explains this in detail. The fix is straightforward.
        </p>

        <p>
          <strong>How to fix it:</strong> In your Cloudflare dashboard, go to <strong>SSL/TLS</strong> and change the encryption mode from <strong>Flexible</strong> to <strong>Full</strong> or <strong>Full (Strict)</strong>. Full mode means Cloudflare connects to your server over HTTPS, which matches the redirect your server is issuing. The loop breaks immediately.
        </p>

        <p>
          If you do not have an SSL certificate on your origin server, install one first. Free certificates from Let&apos;s Encrypt work perfectly. Never use Flexible SSL as a permanent solution — it gives visitors a false sense of security because the connection between Cloudflare and your server is unencrypted.
        </p>

        <h3>4. Conflicting .htaccess redirect rules</h3>

        <p>
          Your <code>.htaccess</code> file is a collection of rules that Apache processes on every request. Over time, plugins add rules, you add rules manually, tutorials tell you to paste rules — and eventually you end up with conflicting redirects.
        </p>

        <p>
          A common example: one rule redirects non-www to www, and another rule further down redirects www to non-www. Or one plugin adds a trailing-slash redirect that conflicts with another plugin&apos;s non-trailing-slash redirect.
        </p>

        <p>
          <strong>How to fix it:</strong> Via FTP, rename <code>.htaccess</code> to <code>.htaccess-backup</code>. This removes all redirect rules at once. If the site loads, the problem is in your <code>.htaccess</code> file. Create a fresh <code>.htaccess</code> with only the default WordPress rules:
        </p>

        <p>
          <code># BEGIN WordPress</code><br />
          <code>&lt;IfModule mod_rewrite.c&gt;</code><br />
          <code>RewriteEngine On</code><br />
          <code>RewriteBase /</code><br />
          <code>RewriteRule ^index\.php$ - [L]</code><br />
          <code>RewriteCond %&#123;REQUEST_FILENAME&#125; !-f</code><br />
          <code>RewriteCond %&#123;REQUEST_FILENAME&#125; !-d</code><br />
          <code>RewriteRule . /index.php [L]</code><br />
          <code>&lt;/IfModule&gt;</code><br />
          <code># END WordPress</code>
        </p>

        <p>
          Then go to <strong>Settings &gt; Permalinks</strong> in wp-admin and click Save without changing anything. This regenerates clean permalink rules.
        </p>

        <h3>5. Redirect plugin conflicts</h3>

        <p>
          Redirect plugins like Redirection, Safe Redirect Manager, or Yoast Premium&apos;s redirect manager can create loops if they contain circular rules — for example, redirecting <code>/old-page</code> to <code>/new-page</code> and <code>/new-page</code> back to <code>/old-page</code>. This also happens when a redirect plugin conflicts with rules in your <code>.htaccess</code> file or your hosting panel.
        </p>

        <p>
          <strong>How to fix it:</strong> Deactivate all redirect plugins by renaming their folders in <code>/wp-content/plugins/</code>. If the loop breaks, reactivate them one by one to identify the culprit. Then review all redirect rules within that plugin for circular patterns. The{' '}
          <a href="https://wordpress.org/documentation/article/common-errors/" target="_blank" rel="noopener noreferrer">WordPress common errors guide</a>
          {' '}covers additional redirect debugging techniques.
        </p>

        <h2>The nuclear option: reset everything and rebuild</h2>

        <p>
          If none of the individual fixes work, take the scorched-earth approach:
        </p>

        <ol>
          <li>Rename <code>.htaccess</code> to <code>.htaccess-backup</code> via FTP</li>
          <li>Rename the <code>/wp-content/plugins/</code> folder to <code>/wp-content/plugins-backup/</code> — this deactivates all plugins</li>
          <li>Add <code>WP_HOME</code> and <code>WP_SITEURL</code> constants to <code>wp-config.php</code> with the correct URL</li>
          <li>If using Cloudflare, set SSL mode to Full</li>
          <li>Reload your site</li>
        </ol>

        <p>
          If the site loads, you know the problem is in one of the things you just disabled. Rename <code>plugins-backup</code> back to <code>plugins</code> and reactivate them one by one from wp-admin. Recreate <code>.htaccess</code> by saving your permalink settings. This methodical approach always finds the culprit.
        </p>

        <h2>How Upnotify catches redirect loops automatically</h2>

        <p>
          The redirect loop is one of the few WordPress errors that is relatively easy to detect with standard HTTP monitoring — if your monitoring tool is configured correctly. <Link href="/signup">Upnotify&apos;s HTTP monitoring</Link> follows the redirect chain and detects when a loop occurs.
        </p>

        <h3>Step 1: Set up an HTTP monitor</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (paid plans from ₹999/year)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your WordPress site URL</li>
          <li>Set the expected status code to <strong>200</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          When a redirect loop occurs, the HTTP monitor follows the redirects, detects the loop, and triggers an alert. You know about the problem within 60 seconds — before your visitors start bouncing, before Google starts deindexing.
        </p>

        <h3>Step 2: Add a keyword monitor for extra protection</h3>

        <ol>
          <li>Add a <strong>Keyword</strong> monitor for the same URL</li>
          <li>Set the keyword to your site title or a phrase always present on your homepage</li>
          <li>Set check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          The keyword monitor catches cases where the redirect does not technically loop but lands on the wrong page — for example, if your homepage redirects to a parking page, a default server page, or a hosting error page. If your expected content is not there, you get alerted.
        </p>

        <h3>Step 3: Set up a public status page</h3>

        <p>
          If your site serves clients or customers, a{' '}
          <Link href="/blog/public-status-page-guide">public status page</Link>
          {' '}lets them check the current status without contacting you. When the redirect loop hits and your monitors trigger, the status page updates automatically.
        </p>

        <div className="blog-cta-section">
          <h3>Check your WordPress site health right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. Catch redirect issues and other vulnerabilities before they become outages.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing redirect loops permanently</h2>

        <p>
          Monitoring catches the loop fast. But these practices stop it from happening in the first place.
        </p>

        <h3>Use one HTTPS redirect method only</h3>
        <p>
          Choose one: your hosting provider, your <code>.htaccess</code> file, or a plugin. Never all three. Your hosting provider&apos;s built-in HTTPS redirect is usually the most reliable choice because it runs before WordPress even loads.
        </p>

        <h3>Set Cloudflare SSL to Full or Full (Strict)</h3>
        <p>
          If you use Cloudflare, never use Flexible SSL. Always use Full or Full (Strict). This prevents the most common CDN-related redirect loop. Install a proper SSL certificate on your origin server — free Let&apos;s Encrypt certificates work perfectly.
        </p>

        <h3>Match your www preference everywhere</h3>
        <p>
          Decide whether your site uses <code>www.yoursite.com</code> or <code>yoursite.com</code> and make sure every system agrees: WordPress settings, DNS records, CDN settings, <code>.htaccess</code>, and your SSL certificate. Mixed preferences are the second most common cause of redirect loops after SSL stacking.
        </p>

        <h3>Audit your .htaccess regularly</h3>
        <p>
          Open your <code>.htaccess</code> file every few months and review the redirect rules. Remove anything you do not recognise. Remove duplicate rules. Make sure no two rules contradict each other. If you are not comfortable reading Apache rewrite rules, reset to the WordPress defaults and let plugins handle the rest.
        </p>

        <h3>Test redirect changes on staging first</h3>
        <p>
          Any change to SSL settings, CDN configuration, <code>.htaccess</code>, or redirect plugins should be tested on a staging environment first. A redirect loop takes your entire site offline instantly — there is no graceful degradation.
        </p>

        <h2>Stop finding out from your customers</h2>

        <p>
          Your WordPress site could be stuck in a redirect loop right now and you would not know.
        </p>

        <p>
          The ERR_TOO_MANY_REDIRECTS error makes your entire site completely inaccessible. Every page. Your homepage, your contact form, your checkout, your login page. Everything. And it can happen from a single setting change in your CDN, a plugin update, or a hosting configuration change.
        </p>

        <p>
          Upnotify monitors your site every 60 seconds and alerts you on Slack, email, or Teams the moment something goes wrong. HTTP monitoring detects redirect loops automatically. Keyword monitoring catches the edge cases where the redirect lands on the wrong page instead of looping.
        </p>

        <p>
          Never discover redirect loops from your customers again.
        </p>

        <div className="blog-cta-section">
          <h3>Detect redirect loops before your visitors do</h3>
          <p>
            Start monitoring in minutes. HTTP monitoring with redirect loop detection. AI-powered reports.
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
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</Link></li>
            <li><Link href="/blog/wordpress-database-connection-error">Error Establishing a Database Connection in WordPress: Complete Fix Guide</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
