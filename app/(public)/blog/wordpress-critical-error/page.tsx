import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'There Has Been a Critical Error on This Website: What It Means and How to Fix It',
  description:
    'The WordPress critical error message replaced the White Screen of Death in WordPress 5.2. Learn what triggers it, how to fix it step by step, and how to monitor your site so you catch it before your visitors do.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-critical-error' },
  openGraph: {
    title: 'There Has Been a Critical Error on This Website: What It Means and How to Fix It',
    description:
      'What causes the WordPress critical error, how to fix it via recovery mode and FTP, and how to set up monitoring that detects it automatically.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-critical-error',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'There Has Been a Critical Error on This Website: What It Means and How to Fix It',
    description:
      'What causes the WordPress critical error, how to fix it via recovery mode and FTP, and how to set up monitoring that detects it automatically.',
  },
}

const FAQ_DATA = [
  {
    question: 'What does "There has been a critical error on this website" mean?',
    answer:
      'This message means WordPress encountered a PHP fatal error that prevented it from loading. Introduced in WordPress 5.2, it replaced the White Screen of Death with a more helpful message. Behind the scenes, a plugin, theme, or core file triggered a PHP error so severe that WordPress cannot recover and render your page. The error is shown to all visitors until you fix the underlying cause.',
  },
  {
    question: 'Will I receive an email when the critical error happens?',
    answer:
      'WordPress sends a recovery mode email to the admin email address on file. However, this email is not guaranteed to arrive — it depends on your server mail configuration, which is often broken on shared hosting. The email can also land in spam. You should never rely on it as your only notification method. External monitoring catches the error regardless of whether the email arrives.',
  },
  {
    question: 'Can uptime monitoring detect the WordPress critical error?',
    answer:
      'Standard HTTP uptime monitoring may not catch it, because the server can still return a 200 OK status code with the error message in the body. Keyword monitoring is the reliable solution: it checks that expected content appears on your page. If the page shows "There has been a critical error" instead of your normal content, keyword monitoring detects the change and alerts you.',
  },
  {
    question: 'How do I fix the critical error if I cannot access wp-admin?',
    answer:
      'Connect to your site via FTP or your hosting file manager. Navigate to /wp-content/plugins/ and rename the folder of the most recently updated plugin to disable it. If the site comes back, that plugin was the cause. If not, try renaming the active theme folder in /wp-content/themes/ to force WordPress to use a default theme. You can also increase the PHP memory limit in wp-config.php by adding: define(\'WP_MEMORY_LIMIT\', \'256M\');',
  },
]

export default function WordPressCriticalErrorPage(): React.ReactElement {
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
          headline: 'There Has Been a Critical Error on This Website: What It Means and How to Fix It',
          description: 'What causes the WordPress critical error, how to fix it step by step, and how to set up keyword monitoring that detects it automatically.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-14',
          dateModified: '2026-03-14',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-critical-error',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>14 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">There Has Been a Critical Error on This Website: What It Means and How to Fix It</h1>
        <p className="blog-article-subtitle">
          One line of text. That is all your visitors see. No menu, no content, no footer — just a message telling them something is seriously wrong. And WordPress&apos;s built-in email notification probably never reached you.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The error that tells your visitors you have a problem</h2>

        <p>
          You are running Google Ads. You are sending email campaigns. Maybe you just landed a mention on a popular blog. Traffic is flowing to your WordPress site. And instead of your homepage, every single visitor sees this:
        </p>

        <p>
          <strong>&quot;There has been a critical error on this website. Please check your site admin email inbox for instructions.&quot;</strong>
        </p>

        <p>
          That message is meant for you, the site owner. But your visitors see it too. They do not have access to your admin email. They do not know what a critical error is. All they know is that your website is broken, and they are going somewhere else.
        </p>

        <p>
          Every minute this error sits on your site, you are losing visitors, losing trust, and losing money. If you are running an ecommerce store, orders have stopped completely. If you depend on lead generation, your contact forms are gone. If Google crawls your site during the outage, your rankings take a hit that can take weeks to recover from.
        </p>

        <p>
          The worst part? WordPress tried to tell you about it. It sent an email to your admin address with a recovery link. But that email depends on your server&apos;s mail function working correctly — and on shared hosting, it often does not. The email might be in your spam folder. It might never have been sent at all. You are sitting there thinking everything is fine while your site is publicly broken.
        </p>

        <h2>What actually triggers the critical error</h2>

        <p>
          Before WordPress 5.2, a PHP fatal error gave you the White Screen of Death — a completely blank page with no explanation. WordPress 5.2 introduced a fatal error handler that catches these crashes and displays the &quot;critical error&quot; message instead. It also added recovery mode, which lets you log into wp-admin even when a plugin or theme is causing the crash.
        </p>

        <p>
          But the message itself does not tell you what went wrong. Here are the most common causes, and how to identify and fix each one.
        </p>

        <h3>1. A plugin update introduces a PHP fatal error</h3>

        <p>
          This is the number one cause. You update a plugin — or WordPress auto-updates it — and the new version contains code that crashes PHP. Maybe it calls a function that does not exist in your version of PHP. Maybe it has a syntax error. Maybe it conflicts with another plugin that hooks into the same WordPress function.
        </p>

        <p>
          WordPress catches the fatal error, identifies which plugin caused it, and displays the critical error message. If the server mail is working, it sends you an email with a link to enter recovery mode, where you can deactivate the offending plugin from wp-admin.
        </p>

        <p>
          <strong>How to fix it:</strong> If you received the recovery mode email, click the link. It gives you temporary access to wp-admin where you can deactivate the plugin. If you did not receive the email, connect via FTP or your hosting file manager. Go to <code>/wp-content/plugins/</code> and rename the folder of the plugin you most recently updated — for example, rename <code>my-plugin</code> to <code>my-plugin-disabled</code>. Reload your site. If it comes back, that plugin was the cause. Check the{' '}
          <a href="https://wordpress.org/documentation/article/common-errors/" target="_blank" rel="noopener noreferrer">WordPress common errors documentation</a>
          {' '}for additional troubleshooting steps.
        </p>

        <h3>2. Theme incompatibility or broken functions.php</h3>

        <p>
          Your theme&apos;s <code>functions.php</code> file runs on every page load. A single syntax error, a missing semicolon, or a call to a deprecated function can trigger a fatal error that takes down your entire site. This commonly happens after updating your theme or after editing <code>functions.php</code> directly through the WordPress code editor.
        </p>

        <p>
          <strong>How to fix it:</strong> Via FTP, navigate to <code>/wp-content/themes/</code> and rename your active theme folder. WordPress will fall back to the latest default theme — Twenty Twenty-Five or whichever default is installed. If the site loads, your theme is the problem. Review the changes you made to <code>functions.php</code>, or contact the theme developer for a compatible version.
        </p>

        <h3>3. PHP memory limit exhausted</h3>

        <p>
          WordPress and its plugins share a pool of PHP memory. The default limit on many hosting providers is just 40MB or 64MB. A single memory-hungry plugin — especially page builders, large form plugins, or WooCommerce with many products — can exhaust this limit. When PHP runs out of memory, it crashes, and WordPress shows the critical error.
        </p>

        <p>
          <strong>How to fix it:</strong> Open <code>wp-config.php</code> via FTP and add this line before the &quot;That&apos;s all, stop editing&quot; comment:
        </p>

        <p>
          <code>define(&apos;WP_MEMORY_LIMIT&apos;, &apos;256M&apos;);</code>
        </p>

        <p>
          If this resolves the error, you have a memory problem. But increasing the limit is a band-aid. You need to find which plugin is consuming excessive memory. Deactivate plugins one by one and check memory usage. Some hosting providers also enforce a hard PHP memory limit at the server level that overrides your <code>wp-config.php</code> setting — contact your host if the change does not take effect.
        </p>

        <h3>4. Corrupted WordPress core files</h3>

        <p>
          A failed auto-update, a server crash during a file write, or disk corruption can damage WordPress core files. If a critical file like <code>wp-settings.php</code>, <code>wp-includes/plugin.php</code>, or <code>wp-includes/class-wp-fatal-error-handler.php</code> is corrupted, WordPress cannot initialise and throws a fatal error.
        </p>

        <p>
          <strong>How to fix it:</strong> Download a fresh copy of your WordPress version from{' '}
          <a href="https://wordpress.org/download/" target="_blank" rel="noopener noreferrer">wordpress.org</a>. Upload the <code>wp-admin</code> and <code>wp-includes</code> directories to your server via FTP, overwriting the existing files. This replaces all core files without touching your content, themes, or plugins in <code>wp-content</code>.
        </p>

        <h3>5. PHP version incompatibility</h3>

        <p>
          Your hosting provider upgrades PHP from 8.1 to 8.3. One of your plugins has not been updated for the new version. It uses a function that was removed or changed. PHP throws a fatal error, and the critical error message appears.
        </p>

        <p>
          This is particularly insidious because you did not change anything on your end. Your site was working fine yesterday, and today it is broken because of a server-level change you were not told about.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your hosting control panel to see if PHP was recently changed. Most hosts let you switch PHP versions from cPanel or a similar dashboard. Temporarily downgrade to the previous PHP version and verify your site works. Then update the incompatible plugin or find an alternative before switching back to the newer PHP version.
        </p>

        <h2>Why WordPress recovery mode is not enough</h2>

        <p>
          WordPress 5.2 added recovery mode as a safety net. When a fatal error occurs, WordPress tries to send an email to the admin address with a special link. Clicking it lets you access wp-admin in a protected session where the crashing plugin or theme is paused.
        </p>

        <p>
          In theory, this is helpful. In practice, it has serious gaps.
        </p>

        <p>
          <strong>The email might never arrive.</strong> Many shared hosting providers do not have a properly configured mail server. The <code>wp_mail()</code> function fails silently, and the recovery email is never sent. Even if it is sent, your hosting IP might be on a spam blacklist, so the email goes to spam or gets rejected entirely.
        </p>

        <p>
          <strong>You might not check your email for hours.</strong> The critical error could happen at 2am. The recovery email sits in your inbox until you wake up. Meanwhile, your site has been broken for six hours and every visitor has seen the error.
        </p>

        <p>
          <strong>Recovery mode only catches some errors.</strong> If the fatal error happens before WordPress&apos;s error handler can load — for example, a corrupted <code>wp-settings.php</code> — recovery mode never triggers and no email is sent.
        </p>

        <p>
          You cannot rely on WordPress to tell you about its own failures. You need external monitoring.
        </p>

        <h2>Why standard uptime monitoring misses this error</h2>

        <p>
          Here is the detail that makes the critical error so dangerous from a monitoring perspective. When WordPress displays &quot;There has been a critical error on this website,&quot; your web server is still running. Apache or Nginx is still handling requests. In many configurations, it still returns a <strong>200 OK</strong> HTTP status code — just with the error message as the body content instead of your actual website.
        </p>

        <p>
          A standard uptime monitor that checks HTTP status codes sees a 200 response and reports your site as &quot;up.&quot; Your monitoring dashboard shows green. You think everything is fine.
        </p>

        <p>
          But your visitors see the critical error. Your site is technically up but functionally broken.
        </p>

        <p>
          This is why keyword monitoring is essential. It does not just check whether your server responded — it checks what the response actually contains.
        </p>

        <h2>How to detect the critical error with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s keyword monitoring</Link> catches this error by checking the actual content of your pages. If your normal content disappears and is replaced by an error message, you know about it in under a minute.
        </p>

        <h3>Step 1: Set up a keyword monitor to detect the error text</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to <strong>&quot;There has been a critical error&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          The moment that error text appears on your page, Upnotify detects it and sends you an alert. No waiting for a WordPress email that might never arrive. No depending on a customer to tell you about it.
        </p>

        <h3>Step 2: Add a positive keyword monitor as a second layer</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to something that always appears on your homepage — your site title, a tagline, or a navigation item</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This catches not only the critical error but any situation where your content disappears — the{' '}
          <Link href="/blog/wordpress-white-screen-of-death">White Screen of Death</Link>, a hacked page, a misconfigured maintenance mode, or a failed migration. If your expected content is gone, you know.
        </p>

        <h3>Step 3: Add an HTTP monitor for full coverage</h3>

        <ol>
          <li>Add an <strong>HTTP/HTTPS</strong> monitor for your homepage</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set check interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          Some server configurations return a 500 status code instead of 200 when the critical error occurs. The HTTP monitor catches those cases. Between the keyword monitors and the HTTP monitor, the critical error has nowhere to hide.
        </p>

        <h3>Step 4: Monitor your critical inner pages</h3>

        <p>
          The critical error does not always affect every page. If only one plugin causes the crash and that plugin only loads on specific pages, your homepage might work fine while your checkout page, contact form, or blog is broken. Set up keyword monitors for:
        </p>

        <ul>
          <li>Homepage</li>
          <li>Contact page</li>
          <li>Checkout page (if you run WooCommerce)</li>
          <li>Any landing page receiving paid traffic</li>
          <li>Your most popular blog post</li>
        </ul>

        <h3>Step 5: Configure alerts that reach you immediately</h3>

        <p>
          A monitoring alert is only useful if you actually see it. Configure your alerts to go where you will notice them within minutes, not hours:
        </p>

        <ul>
          <li><strong>Slack</strong> — instant notification in a dedicated channel</li>
          <li><strong>Microsoft Teams</strong> — same idea, different platform</li>
          <li><strong>Email</strong> — fine as a backup, but not fast enough for critical errors</li>
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

        <h2>Preventing the critical error before it happens</h2>

        <p>
          Monitoring catches the error fast. But these habits reduce the chances of it happening in the first place.
        </p>

        <h3>Update one plugin at a time</h3>
        <p>
          Never batch-update all your plugins at once. Update one, check your site, then update the next. If the critical error appears, you know exactly which plugin caused it. If you updated twelve plugins simultaneously, you are guessing.
        </p>

        <h3>Use a staging environment</h3>
        <p>
          Most managed WordPress hosts offer a staging site. Test every update on staging first. If a plugin update causes a fatal error on staging, you caught it before it hit production. This is the single most effective prevention measure.
        </p>

        <h3>Enable debug logging</h3>
        <p>
          Add these lines to <code>wp-config.php</code>:
        </p>

        <p>
          <code>define(&apos;WP_DEBUG&apos;, true);</code><br />
          <code>define(&apos;WP_DEBUG_LOG&apos;, true);</code><br />
          <code>define(&apos;WP_DEBUG_DISPLAY&apos;, false);</code>
        </p>

        <p>
          This logs PHP errors to <code>/wp-content/debug.log</code> without showing them to visitors. When the critical error hits, the debug log tells you exactly which file and which line caused the crash.
        </p>

        <h3>Increase the PHP memory limit proactively</h3>
        <p>
          Do not wait until you hit the memory limit. Set it to 256MB in <code>wp-config.php</code> now. If your hosting plan allows it, go higher. Running close to the memory limit means one traffic spike or one large import away from a crash.
        </p>

        <h3>Disable the WordPress theme and plugin file editor</h3>
        <p>
          Add this line to <code>wp-config.php</code>:
        </p>

        <p>
          <code>define(&apos;DISALLOW_FILE_EDIT&apos;, true);</code>
        </p>

        <p>
          This prevents anyone from editing theme or plugin files directly from wp-admin. A misplaced semicolon in the code editor can crash your entire site. If you need to edit code, do it via FTP or a proper code editor where you can undo mistakes.
        </p>

        <h3>Keep regular backups</h3>
        <p>
          A daily backup means you can restore your site in minutes. Make sure backups are stored off-server — if your hosting has issues, your backups should be somewhere else. Test your restore process before you need it.
        </p>

        <h2>Stop finding out from your customers</h2>

        <p>
          Your WordPress site could be showing the critical error right now and you would not know.
        </p>

        <p>
          WordPress&apos;s built-in recovery email is unreliable. Standard uptime monitoring often misses the error because the server still returns a 200 status code. The only reliable way to catch it is keyword monitoring that checks what your page actually says.
        </p>

        <p>
          Upnotify checks your pages every 60 seconds. If your content disappears — or if an error message appears — you know in under a minute. On Slack, Teams, email, or webhook. Before your customers see it. Before Google crawls it. Before you lose another lead.
        </p>

        <div className="blog-cta-section">
          <h3>Detect WordPress critical errors automatically</h3>
          <p>
            Free plan available. Keyword monitoring that checks your actual content. AI-powered reports. No credit card required.
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
            <li><Link href="/blog/wordpress-white-screen-of-death">WordPress White Screen of Death: How to Detect It Before Your Visitors Do</Link></li>
            <li><Link href="/blog/wordpress-php-memory-exhausted">PHP Fatal Error: Allowed Memory Size Exhausted in WordPress</Link></li>
            <li><Link href="/blog/wordpress-database-connection-error">Error Establishing a Database Connection in WordPress: Complete Fix Guide</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
