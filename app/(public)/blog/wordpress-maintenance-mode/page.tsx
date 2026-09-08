import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Stuck in Maintenance Mode: How to Fix It and Never Get Stuck Again',
  description:
    'WordPress creates a .maintenance file during updates and sometimes forgets to delete it. Learn why your site gets stuck showing "Briefly unavailable for scheduled maintenance," how to fix it in seconds, and how to monitor for it automatically.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-maintenance-mode' },
  openGraph: {
    title: 'WordPress Stuck in Maintenance Mode: How to Fix It and Never Get Stuck Again',
    description:
      'What causes WordPress to get stuck in maintenance mode, how to fix it via FTP, and how keyword monitoring detects it before your visitors do.',
    url: 'https://uptrue.io/blog/wordpress-maintenance-mode',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Stuck in Maintenance Mode: How to Fix It and Never Get Stuck Again',
    description:
      'What causes WordPress to get stuck in maintenance mode, how to fix it via FTP, and how keyword monitoring detects it before your visitors do.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why is my WordPress site stuck in maintenance mode?',
    answer:
      'WordPress creates a temporary .maintenance file in your site root directory when it runs updates. If the update process is interrupted — by a server timeout, a browser tab being closed, a PHP crash, or a hosting resource limit — WordPress never gets the chance to delete the file. As long as the .maintenance file exists, every visitor sees "Briefly unavailable for scheduled maintenance. Check back in a minute." The fix is to delete the .maintenance file via FTP or your hosting file manager.',
  },
  {
    question: 'How do I get my WordPress site out of maintenance mode?',
    answer:
      'Connect to your site via FTP or your hosting file manager. Navigate to the root directory of your WordPress installation — the same folder that contains wp-config.php and the wp-content directory. Look for a file called .maintenance (it starts with a dot, so it may be hidden). Delete the file. Your site will immediately return to normal. No need to restart the server or clear any cache.',
  },
  {
    question: 'Can uptime monitoring detect WordPress maintenance mode?',
    answer:
      'Standard HTTP monitoring may not detect it reliably. WordPress returns a 503 Service Unavailable status during maintenance mode, which some HTTP monitors will catch. However, some server configurations override this and return 200. Keyword monitoring is the most reliable method: set up a monitor that alerts you when the page contains "Briefly unavailable for scheduled maintenance." This catches maintenance mode regardless of the HTTP status code returned.',
  },
  {
    question: 'How do I prevent WordPress from getting stuck in maintenance mode?',
    answer:
      'Update plugins one at a time instead of batch-updating them all at once. Make sure your PHP max_execution_time is at least 300 seconds so updates have time to complete. Avoid closing your browser tab while an update is running. If you are on shared hosting with strict resource limits, run updates during low-traffic hours. Consider using WP-CLI to run updates from the command line, which is more reliable than the browser-based updater.',
  },
]

export default function WordPressMaintenanceModePage(): React.ReactElement {
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
          headline: 'WordPress Stuck in Maintenance Mode: How to Fix It and Never Get Stuck Again',
          description: 'What causes WordPress to get stuck in maintenance mode, how to fix it in seconds, and how keyword monitoring detects it automatically.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-22',
          dateModified: '2026-03-22',
          url: 'https://uptrue.io/blog/wordpress-maintenance-mode',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>22 March 2026</span>
          <span>13 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Stuck in Maintenance Mode: How to Fix It and Never Get Stuck Again</h1>
        <p className="blog-article-subtitle">
          You clicked &quot;Update All&quot; and walked away. Now every visitor to your site sees one line of text: &quot;Briefly unavailable for scheduled maintenance. Check back in a minute.&quot; That was three hours ago. The minute never ended.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>A one-line message that blocks your entire website</h2>

        <p>
          WordPress has a built-in maintenance mode. When you update plugins, themes, or WordPress core, it creates a temporary file that tells the server to show a maintenance message instead of your website. The update runs. The file gets deleted. Your site comes back. The whole process is supposed to take a few seconds.
        </p>

        <p>
          But sometimes the update does not finish. The server times out. PHP crashes. Your hosting provider kills the process because it used too many resources. The browser tab closes before the update completes. And when the update fails mid-way, WordPress never gets the chance to delete that temporary file.
        </p>

        <p>
          So it sits there. And every single request to your website — the homepage, the blog, the contact page, the checkout, the login page, everything — returns the same message:
        </p>

        <p>
          <strong>&quot;Briefly unavailable for scheduled maintenance. Check back in a minute.&quot;</strong>
        </p>

        <p>
          Your visitors cannot access anything. Search engines cannot crawl your pages. If Google happens to crawl during the outage, it indexes a 503 response and your rankings can drop. If you run an ecommerce store, orders have stopped. If you depend on lead generation, your forms are inaccessible. And if you are not monitoring your site, you have no idea any of this is happening.
        </p>

        <h2>What actually happens during a WordPress update</h2>

        <p>
          Understanding the maintenance mode mechanism makes the fix obvious. Here is what WordPress does when you click &quot;Update&quot; on a plugin, theme, or core update.
        </p>

        <p>
          <strong>Step 1:</strong> WordPress creates a file called <code>.maintenance</code> in your site&apos;s root directory — the same folder that contains <code>wp-config.php</code>. This file contains a PHP timestamp.
        </p>

        <p>
          <strong>Step 2:</strong> On every page request, WordPress checks for the existence of the <code>.maintenance</code> file. If it exists and the timestamp inside it is less than 10 minutes old, WordPress stops loading the site and instead returns the &quot;Briefly unavailable&quot; message with a 503 HTTP status code.
        </p>

        <p>
          <strong>Step 3:</strong> The update process runs — downloading the new version, extracting files, replacing old files, running any database migrations.
        </p>

        <p>
          <strong>Step 4:</strong> When the update completes successfully, WordPress deletes the <code>.maintenance</code> file. The site comes back immediately.
        </p>

        <p>
          The problem is step 4. If the update process is interrupted before it can delete the file, the file stays. And as long as it stays, your site is in maintenance mode. After 10 minutes, WordPress is supposed to ignore the file — but many hosting configurations and WordPress versions do not implement this timeout correctly, leaving the site stuck indefinitely.
        </p>

        <h2>Why updates get interrupted</h2>

        <h3>1. Server timeout during a batch update</h3>

        <p>
          You have 15 plugins waiting for updates. You click &quot;Update All.&quot; WordPress starts updating them one by one. Each update involves downloading a zip file, extracting it, deleting the old version, copying the new version, and running activation hooks. On a shared hosting server with limited resources, this can take several minutes. If your PHP <code>max_execution_time</code> is set to 30 or 60 seconds — which is common on cheap hosting — PHP kills the process before all updates finish. The <code>.maintenance</code> file was created at the start and never deleted.
        </p>

        <h3>2. Browser tab closed mid-update</h3>

        <p>
          WordPress updates run as a server-side process triggered by a browser request. If you close the tab, navigate away, or lose your internet connection while the update is running, the browser disconnects. Some server configurations terminate the PHP process when the client disconnects. The update stops mid-way. The <code>.maintenance</code> file remains.
        </p>

        <h3>3. Hosting resource limits</h3>

        <p>
          Shared hosting providers impose CPU time limits, memory limits, and process limits. A large plugin update that consumes too much memory or CPU gets killed by the hosting provider&apos;s resource monitor. The update never completes. The <code>.maintenance</code> file stays.
        </p>

        <h3>4. PHP fatal error during the update</h3>

        <p>
          The new plugin version has a PHP error that crashes during activation. Or it conflicts with another plugin during the activation hook. PHP dies with a fatal error. WordPress cannot clean up after itself. The site is stuck in maintenance mode and also has a broken plugin.
        </p>

        <h3>5. Disk space exhaustion</h3>

        <p>
          WordPress needs to download the new version and extract it alongside the old version before swapping them. If your server runs out of disk space mid-extraction, the update fails. The <code>.maintenance</code> file stays, and you may also have partially extracted files causing additional issues.
        </p>

        <h2>How to fix it in 30 seconds</h2>

        <p>
          The fix is simple once you know what to look for. You need to delete a single file.
        </p>

        <h3>Option 1: Delete .maintenance via FTP</h3>

        <ol>
          <li>Connect to your server using an FTP client (FileZilla, Cyberduck, or similar)</li>
          <li>Navigate to your WordPress root directory — the folder containing <code>wp-config.php</code></li>
          <li>Look for a file called <code>.maintenance</code> — note the dot at the beginning</li>
          <li>If your FTP client does not show files starting with a dot, enable &quot;Show hidden files&quot; in the settings</li>
          <li>Delete the <code>.maintenance</code> file</li>
          <li>Reload your website — it should come back immediately</li>
        </ol>

        <h3>Option 2: Delete .maintenance via your hosting file manager</h3>

        <ol>
          <li>Log into your hosting control panel (cPanel, Plesk, or your host&apos;s custom panel)</li>
          <li>Open the File Manager</li>
          <li>Navigate to your WordPress root directory</li>
          <li>Enable &quot;Show hidden files&quot; if available (in cPanel, this is under Settings)</li>
          <li>Find and delete the <code>.maintenance</code> file</li>
        </ol>

        <h3>Option 3: Delete .maintenance via SSH</h3>

        <p>
          If you have SSH access, connect to your server and run:
        </p>

        <p>
          <code>rm /path/to/your/wordpress/.maintenance</code>
        </p>

        <p>
          Replace <code>/path/to/your/wordpress/</code> with the actual path to your WordPress installation. On most shared hosts, this is <code>/home/username/public_html/.maintenance</code>.
        </p>

        <h3>After deleting the file</h3>

        <p>
          Your site should load immediately. But you are not done. The update that was interrupted may have left your site in a partially updated state. Check your plugins page — look for any that say &quot;Update failed&quot; or are deactivated. Run the update again for those plugins. If a plugin is broken after a partial update, delete it via FTP and reinstall it from scratch. Check the{' '}
          <a href="https://wordpress.org/documentation/article/common-errors/" target="_blank" rel="noopener noreferrer">WordPress documentation on common errors</a>
          {' '}if you encounter issues after the interrupted update.
        </p>

        <h2>Why uptime monitoring alone is not enough</h2>

        <p>
          WordPress returns a <strong>503 Service Unavailable</strong> status code during maintenance mode. A standard HTTP monitor that checks for 200 OK will detect this and alert you. That sounds like the problem is solved — but there are two complications.
        </p>

        <p>
          <strong>First:</strong> some server configurations, reverse proxies, or caching layers intercept the 503 and return a 200 with a custom error page. Your uptime monitor sees 200 and reports the site as up. Your visitors see the maintenance message.
        </p>

        <p>
          <strong>Second:</strong> even when the HTTP monitor catches the 503, it does not tell you the cause. A 503 could be maintenance mode, a server overload, a PHP-FPM crash, or a hosting-level issue. Keyword monitoring tells you exactly what your visitors see — including the specific text of the maintenance message.
        </p>

        <h2>How to detect maintenance mode with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s keyword monitoring</Link> checks the actual text on your pages. If the maintenance message appears, you know within 60 seconds — and you know exactly what the problem is, not just that a status code changed.
        </p>

        <h3>Step 1: Set up a keyword monitor to detect the maintenance message</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to <strong>&quot;Briefly unavailable for scheduled maintenance&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          The moment WordPress enters maintenance mode and does not come back, Upnotify detects the message and alerts you. You connect via FTP, delete the <code>.maintenance</code> file, and your site is back. Total downtime: minutes instead of hours.
        </p>

        <h3>Step 2: Add a positive keyword monitor as a safety net</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to your site title, tagline, or a navigation item that always appears</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This catches maintenance mode and every other situation where your normal content disappears — the{' '}
          <Link href="/blog/wordpress-white-screen-of-death">White Screen of Death</Link>, the{' '}
          <Link href="/blog/wordpress-critical-error">critical error message</Link>, a hacked page, or a failed migration. If your expected content is gone, you know something is wrong.
        </p>

        <h3>Step 3: Add an HTTP monitor for full coverage</h3>

        <ol>
          <li>Add an <strong>HTTP/HTTPS</strong> monitor for your homepage</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set check interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This catches the 503 status code that WordPress returns during maintenance mode — at least on servers that pass it through correctly. Combined with the keyword monitors, you have complete coverage regardless of how your server handles the maintenance response.
        </p>

        <h3>Step 4: Configure alerts that reach you immediately</h3>

        <ul>
          <li><strong>Slack</strong> — instant notification in a dedicated channel</li>
          <li><strong>Microsoft Teams</strong> — same idea, different platform</li>
          <li><strong>Email</strong> — fine as a backup, but not fast enough for outages</li>
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

        <h2>Preventing maintenance mode from getting stuck</h2>

        <p>
          Monitoring catches the problem fast. But these habits prevent it from happening in the first place.
        </p>

        <h3>Update plugins one at a time</h3>
        <p>
          Never click &quot;Update All&quot; when you have more than two or three plugins waiting. Update one, wait for it to complete, check your site, then update the next. If something goes wrong, you know exactly which plugin caused it. Batch updates multiply the risk of a timeout.
        </p>

        <h3>Increase PHP max_execution_time</h3>
        <p>
          If your server allows it, set <code>max_execution_time</code> to 300 seconds in <code>php.ini</code> or <code>.htaccess</code>. This gives large plugin updates enough time to complete before PHP kills the process. On shared hosting, you may need to contact your provider to increase this limit.
        </p>

        <h3>Do not close the browser tab</h3>
        <p>
          When an update is running, leave the browser tab open until WordPress shows the &quot;Updated successfully&quot; message. Closing the tab can terminate the server-side process on some hosting configurations. If you accidentally close it, wait a few minutes and then check your site — do not immediately start another update.
        </p>

        <h3>Use WP-CLI for updates</h3>
        <p>
          If you have SSH access, use WP-CLI to update plugins: <code>wp plugin update --all</code>. WP-CLI runs directly on the server without depending on a browser connection. It is faster, more reliable, and gives you immediate feedback if an update fails. It is the most reliable way to run WordPress updates.
        </p>

        <h3>Run updates during low-traffic hours</h3>
        <p>
          Even when maintenance mode works correctly, your site is briefly unavailable during updates. Run updates when your traffic is lowest — typically late night or early morning in your primary audience&apos;s timezone. This minimises the number of visitors affected if something goes wrong.
        </p>

        <h3>Keep regular backups</h3>
        <p>
          A daily backup means that if an update goes catastrophically wrong — partially updated files, database corruption, or a broken plugin — you can restore your entire site in minutes. Make sure backups are stored off-server and test your restore process before you need it.
        </p>

        <h2>Stop losing visitors to a forgotten file</h2>

        <p>
          Your WordPress site could be stuck in maintenance mode right now and you would not know. A single file — <code>.maintenance</code> — left behind by an interrupted update is blocking every visitor from seeing your website. Your uptime monitor might not catch it if the server returns a 200 instead of a 503. WordPress cannot email you about it because WordPress itself is not loading.
        </p>

        <p>
          Upnotify checks your pages every 60 seconds. If the maintenance message appears — or if your normal content disappears — you know in under a minute. Delete one file and your site is back. Total downtime: the time it takes you to open an FTP client instead of the hours it takes you to notice on your own.
        </p>

        <div className="blog-cta-section">
          <h3>Never get stuck in maintenance mode again</h3>
          <p>
            Free plan available. Keyword monitoring that detects the maintenance message instantly. Alerts via Slack, Teams, email, and webhook. No credit card required.
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
            <li><Link href="/blog/wordpress-white-screen-of-death">WordPress White Screen of Death: How to Detect It Before Your Visitors Do</Link></li>
            <li><Link href="/blog/wordpress-502-bad-gateway">502 Bad Gateway on WordPress: What It Means and How to Fix It Fast</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
