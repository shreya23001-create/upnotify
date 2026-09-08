import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop',
  description:
    'WordPress wp-cron relies on site traffic to trigger scheduled tasks. On low-traffic sites, cron jobs silently stop firing — scheduled posts publish late, backup emails never arrive, and maintenance tasks pile up. Learn why wp-cron fails and how heartbeat monitoring keeps it running.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-cron-not-working' },
  openGraph: {
    title: 'WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop',
    description:
      'Why WordPress wp-cron fails on low-traffic sites, what breaks when DISABLE_WP_CRON is set without a server cron replacement, and how Upnotify heartbeat monitoring keeps wp-cron firing on schedule.',
    url: 'https://uptrue.io/blog/wordpress-cron-not-working',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop',
    description:
      'Why WordPress wp-cron fails on low-traffic sites, what breaks when DISABLE_WP_CRON is set without a server cron replacement, and how Upnotify heartbeat monitoring keeps wp-cron firing on schedule.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why is WordPress wp-cron not working?',
    answer:
      'WordPress wp-cron is not a real cron system. It does not run on a schedule. Instead, it checks for due tasks every time a visitor loads a page. If nobody visits your site for hours, no cron tasks run during those hours. Scheduled posts publish late, backup plugins miss their schedule, email digests never send, and maintenance tasks like database cleanup stop happening. Low-traffic sites, staging environments, and password-protected sites are especially affected because they do not receive enough page loads to trigger wp-cron reliably.',
  },
  {
    question: 'What happens if I set DISABLE_WP_CRON without a replacement?',
    answer:
      'If you add define("DISABLE_WP_CRON", true) to wp-config.php without setting up a real server cron job to call wp-cron.php, all scheduled tasks stop completely. No scheduled posts will publish. No backup plugins will run. No email notifications will send. No database maintenance will happen. No security scans will trigger. Many WordPress guides recommend disabling wp-cron for performance reasons but fail to explain that you must replace it with a server-level cron job or external trigger. Without the replacement, everything that depends on scheduling silently breaks.',
  },
  {
    question: 'Can uptime monitoring fix WordPress cron problems?',
    answer:
      'Yes, indirectly. Upnotify heartbeat monitoring can be configured to ping your wp-cron.php URL on a fixed schedule — every 1, 5, or 15 minutes. Each ping triggers WordPress to check for and execute any due cron tasks. This effectively turns the unreliable traffic-based wp-cron into a reliable schedule-based system. Combined with DISABLE_WP_CRON in wp-config.php, this gives you full control over when cron runs without relying on visitor traffic.',
  },
  {
    question: 'How do I set up a real cron job for WordPress?',
    answer:
      'First, add define("DISABLE_WP_CRON", true) to your wp-config.php to disable the traffic-based trigger. Then set up a server-level cron job that calls wp-cron.php on a fixed schedule. On Linux servers, use crontab: */5 * * * * wget -q -O /dev/null https://yourdomain.com/wp-cron.php?doing_wp_cron. On managed hosting without crontab access, use an external service like Upnotify heartbeat monitoring to ping wp-cron.php every few minutes. The external ping triggers WordPress to process all due scheduled tasks.',
  },
]

export default function WordPressCronNotWorkingPage(): React.ReactElement {
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
          headline: 'WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop',
          description: 'Why WordPress wp-cron relies on traffic, what breaks when it stops firing, and how heartbeat monitoring keeps scheduled tasks running reliably.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-26',
          dateModified: '2026-03-26',
          url: 'https://uptrue.io/blog/wordpress-cron-not-working',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>26 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop</h1>
        <p className="blog-article-subtitle">
          You scheduled a blog post for 9am Monday. It is now Tuesday afternoon and the post is still sitting in &quot;Scheduled&quot; status. Your backup plugin says the last backup was 11 days ago. Your email digest plugin has not sent anything in a week. Nothing is broken. Nothing threw an error. WordPress just quietly stopped doing the things you told it to do.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>WordPress cron is not actually cron</h2>

        <p>
          On a real server, a cron job runs on a fixed schedule. Every 5 minutes, every hour, every day at midnight — the server wakes up and executes the task regardless of what else is happening. It does not depend on anyone visiting a website. It does not depend on traffic. It just runs.
        </p>

        <p>
          WordPress wp-cron does not work this way. It has no scheduler. It has no background process. It cannot wake itself up. Instead, every time a visitor loads any page on your WordPress site, WordPress runs a quick check: are there any scheduled tasks that are overdue? If yes, it fires them. If no visitor comes, no check happens. No check, no tasks run. It is that simple and that broken.
        </p>

        <p>
          This design made sense in 2004 when WordPress was a blogging platform running on shared hosting where server-level cron access was rare. It does not make sense in 2026 when WordPress powers business-critical sites, ecommerce stores, and SaaS applications where scheduled tasks are not optional. But the architecture has not changed. WordPress still depends on a visitor walking through the door before it checks its to-do list.
        </p>

        <p>
          If your site gets steady traffic — a visitor every few minutes — wp-cron works well enough. Tasks fire close to their scheduled time. The delay is a few minutes at most. But if your site has low traffic — a small business site, a staging environment, a site behind a password, a new site that has not been indexed yet — hours can pass between visits. During those hours, every scheduled task sits idle. Your 9am post publishes at 2pm when someone finally visits. Your daily backup runs three days late. Your security scan never triggers.
        </p>

        <h2>Everything that breaks when wp-cron stops firing</h2>

        <p>
          The damage from a non-firing wp-cron is not dramatic. There is no error page, no crash, no alert. Things just quietly stop happening. And because they stop silently, you often do not notice for days or weeks.
        </p>

        <h3>Scheduled posts publish late or not at all</h3>

        <p>
          WordPress&apos;s scheduled publishing feature relies entirely on wp-cron. When you schedule a post for 9am, WordPress stores the post with a &quot;future&quot; status and a timestamp. The next time wp-cron runs after 9am, it checks for posts with a past-due timestamp and publishes them. If wp-cron does not run until 3pm, the post publishes at 3pm. If your site gets no traffic that day, the post never publishes at all — it stays in &quot;Scheduled&quot; status indefinitely. This is the classic &quot;missed schedule&quot; problem that frustrates WordPress users who manage editorial calendars.
        </p>

        <h3>Backup plugins miss their schedule</h3>

        <p>
          Plugins like UpdraftPlus, BackWPup, and BlogVault schedule backups through wp-cron. If you configured daily backups at 2am, the backup only runs when the first visitor arrives after 2am. On a site with no overnight traffic, that might be 8am. On a very low-traffic site, it might be the next afternoon. Or it might not run that day at all. Your &quot;daily backup&quot; becomes a weekly backup — and you do not find out until you need to restore from one that does not exist.
        </p>

        <h3>Email notifications silently stop</h3>

        <p>
          Many plugins use wp-cron to send scheduled emails — digest summaries, weekly reports, membership renewal reminders, WooCommerce follow-up emails, and subscription notifications. When wp-cron does not fire, these emails sit in the queue indefinitely. Your customers do not get their order status updates. Your subscribers do not get their weekly digest. Your members do not get their renewal reminders. There is no error — the emails are queued and waiting. They just never get processed.
        </p>

        <h3>Database maintenance stops</h3>

        <p>
          WordPress schedules internal maintenance tasks through wp-cron: deleting expired transients, cleaning up revision history, checking for core and plugin updates, and rotating log files. When these stop running, your database grows with stale data, your <code>wp_options</code> table fills with expired transients, and you miss security updates because the update check never fires. The site slows down gradually as the unmaintained database becomes bloated.
        </p>

        <h3>Security scans never trigger</h3>

        <p>
          Security plugins like Wordfence, Sucuri, and iThemes Security schedule regular malware scans through wp-cron. If wp-cron does not fire, the scans do not run. You think your site is being monitored. It is not. A malware infection could sit on your site for weeks before the next scan finally happens — if it happens at all.
        </p>

        <h2>The DISABLE_WP_CRON trap</h2>

        <p>
          Search for &quot;WordPress slow&quot; or &quot;WordPress performance optimization&quot; and half the guides will tell you to add this line to your wp-config.php:
        </p>

        <p>
          <code>define(&apos;DISABLE_WP_CRON&apos;, true);</code>
        </p>

        <p>
          The advice is not wrong. Running wp-cron on every page load does add overhead. On high-traffic sites, it can cause performance issues when multiple simultaneous requests all try to run cron tasks at the same time. Disabling the page-load trigger and replacing it with a server-level cron job is genuinely the recommended approach.
        </p>

        <p>
          The problem is that most guides skip the second part. They tell you to disable wp-cron. They do not tell you — or do not emphasize enough — that you must set up a real cron job to replace it. Without the replacement, you have disabled the only mechanism that triggers scheduled tasks. Everything stops. Silently.
        </p>

        <p>
          This is one of the most common WordPress misconfigurations. A developer or hosting guide tells you to disable wp-cron for performance. You add the line to wp-config.php. Your site feels faster (or you imagine it does). Weeks later, you notice your scheduled posts are not publishing. Your backups have not run. You have no idea the two are connected because you added that line to wp-config.php a month ago and forgot about it.
        </p>

        <h2>wp-cron.php errors that kill cron silently</h2>

        <p>
          Even when wp-cron is not disabled, it can fail silently due to errors in the wp-cron.php file itself.
        </p>

        <h3>Hosting blocks wp-cron.php</h3>

        <p>
          Some hosting providers block direct access to wp-cron.php because it can be abused for DDoS amplification attacks. Bots hit wp-cron.php repeatedly, causing the server to execute resource-intensive cron tasks on every request. The host blocks the file to protect server resources. But this also prevents legitimate cron execution. If your server-level cron job calls wp-cron.php via HTTP and the host returns a 403 or 404, cron silently fails. Check by visiting <code>https://yourdomain.com/wp-cron.php?doing_wp_cron</code> in your browser. If you get a blank page, it is working. If you get an error, it is blocked.
        </p>

        <h3>SSL/HTTPS misconfiguration</h3>

        <p>
          If your site uses HTTPS but the cron call uses HTTP (or vice versa), the request may fail due to redirect loops or SSL errors. This commonly happens when a site is migrated to HTTPS but the server-level cron job still uses the old HTTP URL. The HTTP request redirects to HTTPS, but the redirect does not carry the cron parameters, so wp-cron.php does not execute. The cron job appears to succeed (it got a 301 response) but the cron tasks never actually run.
        </p>

        <h3>PHP errors in cron callbacks</h3>

        <p>
          If a scheduled task contains a PHP error — a fatal error in a plugin&apos;s cron callback function — it can prevent other cron tasks from running in the same batch. WordPress processes cron tasks sequentially. If one task causes a fatal error, PHP execution stops and any remaining tasks in the queue are skipped. The site continues to work for visitors because the fatal error only occurs within the cron context, not during normal page loads.
        </p>

        <h2>How to fix wp-cron properly</h2>

        <h3>Option 1: Server-level cron job (if you have SSH access)</h3>

        <p>
          This is the recommended approach. Disable the traffic-based trigger and replace it with a real cron job.
        </p>

        <p>
          First, add to wp-config.php:
        </p>

        <p>
          <code>define(&apos;DISABLE_WP_CRON&apos;, true);</code>
        </p>

        <p>
          Then set up a cron job via <code>crontab -e</code>:
        </p>

        <p>
          <code>*/5 * * * * wget -q -O /dev/null https://yourdomain.com/wp-cron.php?doing_wp_cron</code>
        </p>

        <p>
          This pings wp-cron.php every 5 minutes regardless of traffic. Adjust the interval based on your needs — every minute for sites with time-sensitive tasks, every 15 minutes for sites where a few minutes of delay is acceptable. The{' '}
          <a href="https://developer.wordpress.org/plugins/cron/" target="_blank" rel="noopener noreferrer">WordPress Plugin Handbook cron documentation</a>
          {' '}covers the details of wp-cron internals.
        </p>

        <h3>Option 2: WP-CLI cron runner (for VPS and dedicated servers)</h3>

        <p>
          If WP-CLI is installed on your server, you can trigger cron directly through the command line without making an HTTP request:
        </p>

        <p>
          <code>*/5 * * * * cd /path/to/wordpress &amp;&amp; wp cron event run --due-now</code>
        </p>

        <p>
          This is more efficient than the HTTP approach because it does not create a web request — it runs PHP directly. It also avoids issues with blocked wp-cron.php URLs, SSL misconfigurations, and HTTP authentication.
        </p>

        <h3>Option 3: External cron trigger (for managed hosting without SSH)</h3>

        <p>
          If your hosting does not provide crontab access — which is common on managed WordPress hosts and shared hosting — you need an external service to ping wp-cron.php on a schedule. This is where{' '}
          <Link href="/signup">Upnotify&apos;s heartbeat monitoring</Link>
          {' '}provides a dual benefit: it triggers your cron tasks on a fixed schedule and monitors that wp-cron.php is responding correctly.
        </p>

        <h2>How Upnotify heartbeat monitoring keeps wp-cron firing</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s heartbeat monitoring</Link> was designed to monitor scheduled tasks — but it works equally well as a cron trigger. By pointing a heartbeat monitor at your wp-cron.php URL, every ping serves double duty: it triggers WordPress to process any due cron tasks, and it monitors that wp-cron.php is responding correctly.
        </p>

        <h3>Step 1: Disable the built-in wp-cron trigger</h3>

        <p>
          Add to your wp-config.php (before the line that says &quot;That&apos;s all, stop editing!&quot;):
        </p>

        <p>
          <code>define(&apos;DISABLE_WP_CRON&apos;, true);</code>
        </p>

        <p>
          This stops WordPress from running wp-cron on every page load, which improves page load performance and prevents race conditions where multiple simultaneous visitors trigger cron at the same time.
        </p>

        <h3>Step 2: Set up an Upnotify heartbeat monitor</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>Heartbeat</strong> as the monitor type</li>
          <li>Enter the URL: <code>https://yourdomain.com/wp-cron.php?doing_wp_cron</code></li>
          <li>Set the check interval to <strong>5 minutes</strong> (or 1 minute for time-critical tasks)</li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          Every 5 minutes, Upnotify pings your wp-cron.php URL. This triggers WordPress to check for and execute any due scheduled tasks. If wp-cron.php returns an error — a 403 because hosting blocked it, a 500 because a plugin crashed, or a timeout because the server is overloaded — Upnotify alerts you immediately. You know the moment your scheduled tasks stop working.
        </p>

        <h3>Step 3: Add an HTTP monitor for your homepage</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This gives you full visibility: the heartbeat monitor ensures wp-cron fires and alerts you if wp-cron.php breaks, while the HTTP monitor ensures your site is up and serving visitors correctly. Together, they cover both the public-facing site and the background task infrastructure.
        </p>

        <h3>Step 4: Monitor the outcomes of critical cron tasks</h3>

        <p>
          Triggering wp-cron is only half the battle. You also need to verify that the tasks it runs are succeeding. Set up keyword monitors for the outcomes:
        </p>

        <ul>
          <li><strong>Scheduled posts:</strong> Monitor your blog page for the title of a post that should have published — if it is missing, the cron task failed</li>
          <li><strong>Backup plugins:</strong> Check your backup destination (cloud storage, email) for recent backup files</li>
          <li><strong>Email digests:</strong> Subscribe to your own digest and monitor your inbox</li>
        </ul>

        <h3>Step 5: Configure alerts for cron failures</h3>

        <p>
          A broken cron is a silent failure. You will not notice until something important does not happen — a missed backup before a migration, a security scan that never ran before an infection, a renewal email that never sent before a membership lapsed. Get alerts the moment cron stops responding.
        </p>

        <ul>
          <li><strong>Slack</strong> — instant notification when wp-cron.php returns an error</li>
          <li><strong>Microsoft Teams</strong> — visibility for the entire ops team</li>
          <li><strong>Email</strong> — written record of every cron failure</li>
          <li><strong>Webhook</strong> — trigger automated remediation workflows</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site health right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if your scheduled tasks are at risk.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Common wp-cron problems and quick fixes</h2>

        <h3>Missed schedule error on posts</h3>
        <p>
          If posts show &quot;Missed schedule&quot; in wp-admin, wp-cron is not firing frequently enough. Either increase your site traffic, set up a server-level cron job, or use Upnotify heartbeat monitoring to ping wp-cron.php on a fixed schedule. There is also a{' '}
          <a href="https://wordpress.org/plugins/search/missed+schedule/" target="_blank" rel="noopener noreferrer">Missed Schedule plugin</a>
          {' '}that retries publishing missed posts, but it still depends on wp-cron firing — it does not fix the underlying trigger problem.
        </p>

        <h3>WP-Cron running too frequently on high-traffic sites</h3>
        <p>
          On high-traffic sites, every page load triggers wp-cron. Hundreds of simultaneous requests all try to run cron at the same time. This causes database locks, slow page loads, and resource spikes. The fix is to disable the page-load trigger with <code>DISABLE_WP_CRON</code> and use a server-level cron job or Upnotify heartbeat monitor instead. One request every 5 minutes is far more efficient than hundreds of requests per minute all checking the cron queue.
        </p>

        <h3>Cron tasks piling up and never completing</h3>
        <p>
          If a cron task takes longer than the PHP <code>max_execution_time</code>, it is killed before it finishes. The task stays in the queue and is retried on the next cron run — where it is killed again. Tasks pile up indefinitely. Check for plugins scheduling resource-intensive operations as single cron events. The fix is either to increase <code>max_execution_time</code> for cron context or to break the heavy task into smaller batches that complete within the time limit. The{' '}
          <a href="https://developer.wordpress.org/plugins/cron/hooking-wp-cron-into-the-system-task-scheduler/" target="_blank" rel="noopener noreferrer">WordPress developer documentation on cron</a>
          {' '}explains how to hook wp-cron into the system task scheduler properly.
        </p>

        <h3>Cron working locally but not on production</h3>
        <p>
          If cron works in your local development environment but not on your production server, the issue is almost always one of: production hosting blocks wp-cron.php (check for 403 or 404 responses), a security plugin blocks the cron request (check firewall rules), or HTTPS misconfiguration causes the cron HTTP request to fail silently. Test by visiting <code>https://yourdomain.com/wp-cron.php?doing_wp_cron</code> directly in your browser. If you get a blank white page, it is working. Any other response indicates a configuration problem.
        </p>

        <h2>Your scheduled tasks are probably not running right now</h2>

        <p>
          That is not hyperbole. If you run a low-traffic WordPress site — and most WordPress sites are low-traffic — your wp-cron is unreliable. Your scheduled posts publish hours late. Your backups are days behind schedule. Your security scans run sporadically at best. And you have no idea because wp-cron fails silently. There is no error message. There is no alert. Things just do not happen.
        </p>

        <p>
          Upnotify heartbeat monitoring pings your wp-cron.php every few minutes on a fixed schedule. Every ping triggers WordPress to process due tasks. Every ping also verifies that wp-cron.php is responding. If it stops responding — because hosting blocked it, a plugin crashed it, or the server is down — you know in under five minutes. Your cron fires reliably. Your scheduled tasks run on time. And you get alerted the moment something breaks.
        </p>

        <div className="blog-cta-section">
          <h3>Keep your WordPress cron firing reliably</h3>
          <p>
            Free plan available. Heartbeat monitoring that triggers wp-cron on a fixed schedule and alerts you if it stops responding. No credit card required.
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
            <li><Link href="/blog/wordpress-database-connection-error">Error Establishing a Database Connection in WordPress: Complete Fix Guide</Link></li>
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
            <li><Link href="/blog/wordpress-recovery-mode">WordPress Recovery Mode: What Triggers It, What It Means, and How to Respond</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
