import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'UpdraftPlus Backup Failed: When Your Safety Net Has a Hole in It',
  description:
    'UpdraftPlus can silently stop backing up your WordPress site. Disk space exhaustion, PHP timeouts, and expired remote storage credentials are the most common causes. Learn what makes backups fail, how to fix each cause, and how Uptrue HTTP monitoring catches the 500 errors that disk-full servers produce.',
  alternates: { canonical: 'https://uptrue.io/blog/updraftplus-backup-failed' },
  openGraph: {
    title: 'UpdraftPlus Backup Failed: When Your Safety Net Has a Hole in It',
    description:
      'Why UpdraftPlus backups fail silently, how to fix disk space, timeout, and authentication errors, and how HTTP monitoring catches the server failures that follow.',
    url: 'https://uptrue.io/blog/updraftplus-backup-failed',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UpdraftPlus Backup Failed: When Your Safety Net Has a Hole in It',
    description:
      'Why UpdraftPlus backups fail silently, how to fix disk space, timeout, and authentication errors, and how HTTP monitoring catches the server failures that follow.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why does UpdraftPlus keep failing to back up?',
    answer:
      'The most common causes are insufficient disk space on the server to create the temporary backup files, PHP execution time limits that kill the backup process before it finishes, expired or revoked authentication tokens for remote storage services like Google Drive or Dropbox, and WordPress cron not firing reliably which prevents the scheduled backup from starting at all. UpdraftPlus needs enough free disk space to hold a complete copy of your database and files before uploading to remote storage, and it needs enough PHP execution time to compress and upload all those files. On shared hosting with strict resource limits, both of these are frequently insufficient for larger sites.',
  },
  {
    question: 'How much disk space does UpdraftPlus need to create a backup?',
    answer:
      'UpdraftPlus needs enough free disk space to hold the entire uncompressed backup temporarily, plus the compressed archive, plus your existing WordPress files and database. As a rough estimate, you need free space equal to at least 1.5 times the size of your current WordPress installation. If your WordPress files are 2 GB and your database is 500 MB, you need at least 3.75 GB of free disk space for the backup to succeed. If your hosting plan has a 5 GB total disk limit and your site uses 3 GB, you only have 2 GB free — which may not be enough for the backup. The backup process creates temporary files, compresses them, and then uploads them to remote storage before deleting the temporary files.',
  },
  {
    question: 'Can I fix UpdraftPlus timeout errors without upgrading my hosting?',
    answer:
      'You can try increasing the PHP max_execution_time in your php.ini or .htaccess file, but many shared hosting providers enforce a hard limit that cannot be overridden. If the hard limit is 30 or 60 seconds, a large backup simply cannot finish in time. UpdraftPlus Premium has a feature called "more files" that splits the backup into smaller chunks, which can help. You can also reduce the backup size by excluding large directories like wp-content/cache or wp-content/uploads/backups. But if your site is large and your hosting is strict, the only reliable fix is moving to a hosting plan with higher execution limits.',
  },
  {
    question: 'How does HTTP monitoring help when backups fail?',
    answer:
      'When UpdraftPlus backups fail due to disk space exhaustion, the failed backup leaves partial files on disk that consume even more space. Eventually the disk fills completely, and your WordPress site starts returning 500 Internal Server Error because PHP cannot write temporary files, the database cannot create temporary tables, and WordPress cannot write to its cache directories. HTTP monitoring detects these 500 errors immediately. This does not fix the backup problem itself, but it alerts you to the downstream consequence — your live site going down — before your visitors experience prolonged downtime. Without monitoring, a full disk can take your site offline for hours before anyone notices.',
  },
]

export default function UpdraftPlusBackupFailedPage(): React.ReactElement {
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
          headline: 'UpdraftPlus Backup Failed: When Your Safety Net Has a Hole in It',
          description: 'Why UpdraftPlus backups fail silently, how to fix each cause, and how HTTP monitoring catches the disk-full 500 errors that follow.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-04-01',
          dateModified: '2026-04-01',
          url: 'https://uptrue.io/blog/updraftplus-backup-failed',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>1 April 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">UpdraftPlus Backup Failed: When Your Safety Net Has a Hole in It</h1>
        <p className="blog-article-subtitle">
          You installed UpdraftPlus. You configured it to back up to Google Drive every day. You saw the first backup complete successfully. You assumed it would keep working forever. Six months later, your site gets hacked, and you go to restore from backup. The last successful backup was four months ago. Every backup since then has been failing silently, and nobody told you.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The false sense of security</h2>

        <p>
          UpdraftPlus is the most popular WordPress backup plugin, with over three million active installations. And it deserves that popularity — when it works, it works well. The problem is that &quot;when it works&quot; part. UpdraftPlus depends on server resources, external storage authentication, and WordPress cron — and every one of these can fail without any visible indication on your site.
        </p>

        <p>
          Your WordPress dashboard does not show a warning banner when the last backup failed. There is no red alert on your admin bar. UpdraftPlus logs the failure in its own settings page, but you have to actively navigate to that page and read the log to know something went wrong. If you set up backups six months ago and have not checked the UpdraftPlus settings page since, you have no idea whether your backups are current.
        </p>

        <p>
          And that is exactly the problem. Backups are insurance. You do not check them until you need them. And if you discover they have been failing only when you need to restore after a hack, a server crash, or a catastrophic plugin conflict — you have no safety net at the worst possible moment.
        </p>

        <h2>Cause 1: Disk space exhaustion from partial backups</h2>

        <p>
          This is the most common and the most destructive cause of UpdraftPlus backup failures. When UpdraftPlus creates a backup, it needs to write temporary files to your server&apos;s disk. It creates compressed archives of your WordPress files — themes, plugins, uploads, and the database — in the <code>wp-content/updraft/</code> directory. Once the archives are complete, it uploads them to your remote storage (Google Drive, Dropbox, Amazon S3, etc.) and then deletes the local copies.
        </p>

        <p>
          Here is what happens when a backup fails midway. UpdraftPlus starts creating the archive, writes 1.2 GB of compressed data to disk, and then the process is killed — by a PHP timeout, a memory limit, or a hosting provider resource limit. The partial archive is left on disk in <code>wp-content/updraft/</code>. It was never uploaded to remote storage. It was never cleaned up.
        </p>

        <p>
          The next scheduled backup runs. It tries to create new archives, adding another 1.2 GB to the disk. This backup also fails and leaves another partial archive. After a month of daily failed backups, you have 30 partial archives consuming 36 GB of disk space. Your 50 GB hosting plan now has 14 GB free. Your site starts slowing down because the database cannot create temporary tables. PHP cannot write session files. WordPress cannot write to the cache directory.
        </p>

        <p>
          Eventually, the disk fills completely. WordPress returns a{' '}
          <Link href="/blog/wordpress-white-screen-of-death">white screen of death</Link>{' '}
          or a 500 Internal Server Error. Your site is down — not because of a hack or a server crash, but because your backup plugin filled the disk with failed backups.
        </p>

        <p>
          <strong>How to fix it:</strong> Connect to your server via FTP or your hosting file manager. Navigate to <code>wp-content/updraft/</code>. Delete any partial backup files — they are useless for restoration anyway. Check your total disk usage through your hosting control panel. If you are above 80% disk usage, delete old local backups, clear your <code>wp-content/cache/</code> directory, and remove any other unnecessary files. Then configure UpdraftPlus to retain only 2 to 3 backup copies, not unlimited, to prevent future disk accumulation.
        </p>

        <h2>Cause 2: PHP execution timeout</h2>

        <p>
          Creating a backup of a WordPress site is a resource-intensive operation. UpdraftPlus needs to scan the entire WordPress directory, compress thousands of files, export the entire database, and upload the resulting archives to remote storage. On a large site — one with thousands of media files, a dozen plugins, and a database with hundreds of thousands of rows — this can take several minutes.
        </p>

        <p>
          PHP has a <code>max_execution_time</code> setting that limits how long a single PHP process can run. On most shared hosting providers, this is set to 30 to 120 seconds. When the backup process exceeds this limit, PHP kills the process. The backup stops mid-archive, leaving partial files on disk and a failure entry in the UpdraftPlus log.
        </p>

        <p>
          UpdraftPlus tries to work around this limitation by splitting the backup into smaller chunks. It starts a backup, works for a portion of the allowed time, then schedules a continuation using WordPress cron. The next cron run picks up where the previous one left off. In theory, this allows UpdraftPlus to back up a site of any size regardless of the PHP time limit.
        </p>

        <p>
          In practice, this chunked approach depends on WordPress cron firing reliably and frequently enough. If cron is unreliable — which it is on low-traffic sites, as we covered in our post about{' '}
          <Link href="/blog/wordpress-cron-not-working">wp-cron not firing</Link>
          {' '} — the continuation never runs, and the backup stalls indefinitely.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your PHP <code>max_execution_time</code> by creating a file with <code>&lt;?php phpinfo(); ?&gt;</code> and searching for the value. If it is 30 seconds, try increasing it to 300 in your <code>php.ini</code> or <code>.htaccess</code>. If your hosting provider enforces a hard limit, contact them or upgrade your plan. Alternatively, reduce the backup size: exclude large directories like <code>wp-content/cache/</code>, <code>wp-content/updraft/</code>, and any staging site directories. If your media library is very large, consider backing up the uploads directory less frequently (weekly) while backing up the database daily.
        </p>

        <h2>Cause 3: Remote storage authentication expired</h2>

        <p>
          When you connect UpdraftPlus to Google Drive, Dropbox, or Microsoft OneDrive, the plugin receives an authentication token that allows it to upload files to your account. These tokens have expiration dates. Google Drive tokens typically expire and need refreshing. Dropbox tokens can be revoked if you change your password or if the app is disconnected from your account. OneDrive tokens expire after a set period.
        </p>

        <p>
          UpdraftPlus stores the authentication token and uses it for every backup. When the token expires, the backup process completes locally — the archives are created successfully on your server — but the upload to remote storage fails. The backup log shows an authentication error. The archives sit on your local disk consuming space. And because the upload failed, there is no off-server backup to restore from.
        </p>

        <p>
          This is particularly dangerous because you might have months of &quot;successful&quot; backups — but they only exist on the same server as your WordPress site. If the server dies, you lose both your site and your backups. The entire point of remote storage is to have a copy somewhere else. When authentication fails, that safety net disappears.
        </p>

        <p>
          <strong>How to fix it:</strong> Go to UpdraftPlus settings and check your remote storage connection. Re-authenticate if the token has expired. For Google Drive, click the &quot;reauthenticate&quot; link and complete the OAuth flow again. For Dropbox, reauthorise the app in your Dropbox account settings. After re-authenticating, run a manual backup and verify it appears in your remote storage account. Set a calendar reminder to check the connection monthly — do not assume it will work forever.
        </p>

        <h2>Cause 4: WordPress cron not triggering backups</h2>

        <p>
          UpdraftPlus relies on WordPress cron (<code>wp-cron.php</code>) to trigger scheduled backups. WordPress cron is not a real cron system — it only runs when someone visits your site. If your site has low traffic, hours can pass between cron runs. The backup that was scheduled for 3 AM might not actually start until 9 AM when the first visitor arrives.
        </p>

        <p>
          On some hosting providers, <code>wp-cron.php</code> is disabled entirely for performance reasons. The hosting provider sets up a server-level cron job instead, which calls <code>wp-cron.php</code> at a fixed interval (usually every 15 minutes). This works well for most WordPress functions, but it can conflict with UpdraftPlus&apos;s chunked backup approach. If the server cron and the UpdraftPlus continuation get out of sync, the backup can stall.
        </p>

        <p>
          <strong>How to fix it:</strong> Check if <code>wp-cron.php</code> is disabled in your <code>wp-config.php</code> by looking for <code>define(&apos;DISABLE_WP_CRON&apos;, true);</code>. If it is disabled, make sure your hosting provider has a server-level cron job set up. If they do not, you need to add one yourself through your hosting control panel. Set it to run every 5 minutes: <code>*/5 * * * * wget -q -O /dev/null https://yoursite.com/wp-cron.php?doing_wp_cron</code>. The{' '}
          <a href="https://wordpress.org/plugins/updraftplus/" target="_blank" rel="noopener noreferrer">UpdraftPlus plugin page</a>
          {' '}has documentation on cron configuration for different hosting environments.
        </p>

        <h2>Why failed backups lead to site outages</h2>

        <p>
          Failed backups do not just mean you lack a restore point. They actively cause problems. Partial backup archives accumulate on disk. Log files from repeated failures grow larger. The <code>wp-content/updraft/</code> directory balloons in size. And the most common downstream consequence is your server running out of disk space.
        </p>

        <p>
          When a server runs out of disk space, everything breaks at once:
        </p>

        <ul>
          <li>PHP cannot create temporary files, producing 500 Internal Server Errors</li>
          <li>MySQL cannot create temporary tables, causing database query failures</li>
          <li>WordPress cannot write to its <code>wp-content/cache/</code> directory</li>
          <li>Your error log grows with each failed request, consuming even more disk space</li>
          <li>Even logging into wp-admin can fail because the session handler cannot write to disk</li>
        </ul>

        <p>
          A disk-full server does not produce a clean error message. It produces intermittent, unpredictable failures. Some pages load. Some return 500. Some load partially. The behaviour changes with every request because it depends on whether PHP happens to find enough temporary space for that specific request.
        </p>

        <h2>How Uptrue HTTP monitoring catches disk-full 500 errors</h2>

        <p>
          <Link href="/signup">Uptrue&apos;s HTTP monitoring</Link> checks your site every 60 seconds and verifies the server returns a 200 status code. When your disk fills up and WordPress starts returning 500 errors, Uptrue detects it immediately. You do not discover the problem hours later when a customer emails you about a broken website — you know within a minute.
        </p>

        <h3>Step 1: Set up HTTP monitoring on your homepage</h3>

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
          When a disk-full server starts returning 500 errors, Uptrue detects it on the next check. You are alerted within 60 seconds of the first failure.
        </p>

        <h3>Step 2: Monitor key inner pages for intermittent failures</h3>

        <p>
          Disk-full failures can be intermittent — your homepage might still load from cache while inner pages fail. Set up HTTP monitors on your most important inner pages:
        </p>

        <ol>
          <li>Add HTTP monitors for your top 5 pages by traffic</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the interval to <strong>5 minutes</strong></li>
        </ol>

        <h3>Step 3: Add keyword monitoring to catch partial failures</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to a visible heading or your brand name</li>
          <li>Set check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>5 minutes</strong></li>
        </ol>

        <p>
          Keyword monitoring catches cases where the server returns 200 but the page content is incomplete — a partial render caused by a database query failing mid-page because MySQL could not create a temporary table.
        </p>

        <h3>Step 4: Monitor your wp-cron endpoint</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>HTTP/HTTPS</strong></li>
          <li>Enter <code>https://yoursite.com/wp-cron.php?doing_wp_cron</code></li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the interval to <strong>15 minutes</strong></li>
        </ol>

        <p>
          This ensures that WordPress cron is accessible and responding. If your hosting provider blocks access to <code>wp-cron.php</code> or if the file is corrupted, this monitor catches it. A working wp-cron is essential for UpdraftPlus scheduled backups to trigger.
        </p>

        <h3>Step 5: Configure alerts for rapid response</h3>

        <ul>
          <li><strong>Slack</strong> — instant notification when your site returns a 500 error</li>
          <li><strong>Email</strong> — documented alert for incident tracking</li>
          <li><strong>Microsoft Teams</strong> — visibility for the operations team</li>
          <li><strong>Webhook</strong> — trigger automated disk space checks or cleanup scripts</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress server health right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if disk space or server issues are putting your site at risk.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>How to make UpdraftPlus backups reliable</h2>

        <h3>Set retention limits</h3>
        <p>
          In UpdraftPlus settings, set the number of retained backups to 3 to 5 for both files and database. This prevents old backups from accumulating on your server. Every new backup deletes the oldest one. Without retention limits, backups accumulate indefinitely until your disk fills up.
        </p>

        <h3>Exclude unnecessary directories</h3>
        <p>
          In UpdraftPlus settings under &quot;Include in files backup,&quot; uncheck directories you do not need. Common exclusions: <code>wp-content/cache/</code> (regenerated by your caching plugin), <code>wp-content/updraft/</code> (old backups backing up backups), and any staging site directories.
        </p>

        <h3>Back up database and files on different schedules</h3>
        <p>
          Your database changes frequently — new posts, new orders, new comments. Your files change rarely — only when you update plugins, themes, or upload media. Back up the database daily and files weekly. This reduces the load of each backup job and makes it more likely to complete within your PHP time limit.
        </p>

        <h3>Verify remote storage monthly</h3>
        <p>
          Log into your Google Drive, Dropbox, or S3 account once a month and verify that recent backup files are actually there. Check the file dates. Download one and try restoring it on a staging server if possible. A backup you cannot restore is not a backup.
        </p>

        <h3>Set up a real server cron job</h3>
        <p>
          Do not rely on WordPress cron for backups. Set up a server-level cron job through your hosting control panel that calls <code>wp-cron.php</code> every 5 minutes. This ensures the backup triggers on schedule regardless of site traffic.
        </p>

        <h2>Your backup is only as good as your last successful run</h2>

        <p>
          A backup plugin that ran successfully once, six months ago, is not protecting you. The only backup that matters is the most recent successful one. If that was four months ago because every backup since has been silently failing — from disk space, timeouts, or expired credentials — you are operating without a safety net and you do not know it.
        </p>

        <p>
          Uptrue cannot monitor your backup plugin directly. But it catches the most destructive downstream consequence of backup failures: your server filling up with partial backup files and your WordPress site going offline with 500 errors. When that alert fires at 3 AM, you know something is wrong with your server before your first morning visitor hits a broken page.
        </p>

        <div className="blog-cta-section">
          <h3>Catch disk-full 500 errors before your visitors do</h3>
          <p>
            Free plan available. HTTP monitoring that detects 500 errors in under 60 seconds. Keyword monitoring for content verification. Slack, email, Teams, and webhook alerts. No credit card required.
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
            <li><Link href="/blog/wordpress-cron-not-working">WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop</Link></li>
            <li><Link href="/blog/wordpress-php-memory-exhausted">PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide</Link></li>
            <li><Link href="/blog/wordpress-502-bad-gateway">502 Bad Gateway on WordPress: What It Means and How to Fix It Fast</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
