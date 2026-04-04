import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'iThemes Security Locked Me Out of WordPress: How to Regain Access and Prevent It',
  description:
    'iThemes Security (Solid Security) can lock you out of your own WordPress site through brute force protection, file change detection false alarms, and database ban table corruption. Learn what causes lockouts, how to regain access, and how HTTP monitoring detects 403 lockout pages automatically.',
  alternates: { canonical: 'https://uptrue.io/blog/ithemes-security-locked-out' },
  openGraph: {
    title: 'iThemes Security Locked Me Out of WordPress: How to Regain Access and Prevent It',
    description:
      'What causes iThemes Security to lock out legitimate users, how brute force protection and file change detection create false alarms, and how Uptrue HTTP monitoring detects lockout pages automatically.',
    url: 'https://uptrue.io/blog/ithemes-security-locked-out',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iThemes Security Locked Me Out of WordPress: How to Regain Access and Prevent It',
    description:
      'What causes iThemes Security to lock out legitimate users, how brute force protection and file change detection create false alarms, and how Uptrue HTTP monitoring detects lockout pages automatically.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why did iThemes Security lock me out of my own WordPress site?',
    answer:
      'iThemes Security locks users based on failed login attempts, IP address reputation, file change detection, and 404 detection. If you mistype your password too many times, the brute force protection locks your IP address. If your IP address is on a shared network or VPN that has been flagged, you can be locked out without any failed login attempts on your part. The plugin also locks out IPs that trigger too many 404 errors, which can happen during normal browsing if your site has broken links or missing images.',
  },
  {
    question: 'How do I unlock my IP address when iThemes Security has banned me?',
    answer:
      'If you can access your site through a different IP address (mobile data, VPN, different network), log in and go to the iThemes Security settings to remove your IP from the ban list. If you cannot access the site at all, connect to your database via phpMyAdmin or your hosting control panel. Look for the itsec_lockouts table (or wp_itsec_lockouts with your table prefix) and delete the rows containing your IP address. Alternatively, rename the plugin folder via FTP from better-wp-security to better-wp-security-disabled to deactivate the plugin entirely, then log in and reconfigure it.',
  },
  {
    question: 'Does iThemes Security file change detection cause false lockouts?',
    answer:
      'Yes. File change detection scans your WordPress files and alerts you when any file is modified. The problem is that legitimate changes trigger it constantly. WordPress core updates modify dozens of files. Plugin updates change files. Theme updates change files. Caching plugins create and modify files in the uploads directory. If file change detection is set to lock out or restrict access when changes are detected, routine updates can trigger a lockout. The feature is designed to detect malicious file changes, but it cannot distinguish between a WordPress auto-update and an attacker modifying a file.',
  },
  {
    question: 'Can iThemes Security lock out all administrators at once?',
    answer:
      'Yes. If iThemes Security enters a state where it blocks access to wp-admin based on a rule that applies to all incoming requests — such as a corrupted ban database, a misconfigured allowed IP list, or a file change detection rule that triggers on every request — all administrators are locked out simultaneously. Nobody can access the dashboard to fix the settings. The only recovery options are direct database access, FTP to rename the plugin folder, or asking your hosting provider to intervene. This scenario is more common than most site owners realise, especially after plugin updates that change the security rule database format.',
  },
]

export default function IthemesSecurityLockedOutPage(): React.ReactElement {
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
          headline: 'iThemes Security Locked Me Out of WordPress: How to Regain Access and Prevent It',
          description: 'What causes iThemes Security lockouts, how brute force protection and file change detection create false alarms, and how HTTP monitoring detects 403 lockout pages.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-05-21',
          dateModified: '2026-05-21',
          url: 'https://uptrue.io/blog/ithemes-security-locked-out',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>21 May 2026</span>
          <span>15 min read</span>
        </div>
        <h1 className="blog-article-title">iThemes Security Locked Me Out of WordPress: How to Regain Access and Prevent It</h1>
        <p className="blog-article-subtitle">
          You installed iThemes Security to keep hackers out. It worked. It kept everyone out — including you. You try to log in and get a blank page or a 403 Forbidden error. You try from your phone. Same thing. You try from a different browser. Blocked. Your own security plugin has decided you are the threat, and now you cannot access your own website.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The security plugin that locks out the site owner</h2>

        <p>
          iThemes Security — now rebranded as Solid Security — is one of the most popular WordPress security plugins, installed on over a million sites. It provides brute force protection, file change detection, 404 detection, database backups, two-factor authentication, and dozens of other security features. It is genuinely effective at stopping automated attacks. The problem is that it is also genuinely effective at locking out legitimate users — including the site owner.
        </p>

        <p>
          The lockout is not always a gradual process. One moment you are logged in, editing a page, updating a plugin. The next moment you are staring at a 403 Forbidden page. No warning. No grace period. No explanation on the page itself. You just cannot get in. And because iThemes Security controls access at a level that prevents you from reaching wp-admin, you cannot fix the settings that locked you out. You are locked out of the tool that locked you out.
        </p>

        <p>
          Refer to the{' '}
          <a href="https://wordpress.org/plugins/better-wp-security/" target="_blank" rel="noopener noreferrer">iThemes Security plugin page</a>
          {' '}for documentation on lockout settings and recovery procedures.
        </p>

        <h2>How brute force protection locks your own IP address</h2>

        <p>
          iThemes Security&apos;s brute force protection monitors login attempts and locks out IP addresses that exceed the failed attempt threshold. The default is typically five failed attempts within a 15-minute window, resulting in a 15-minute lockout. After multiple lockouts, the ban becomes permanent until manually removed.
        </p>

        <p>
          Here is how the site owner gets caught. You have a strong password — 20 characters, mixed case, numbers, symbols. Your browser autofill has an old version saved. You try to log in and it uses the old password. Failed attempt one. You clear the autofill and type it manually but make a typo. Failed attempt two. You try again, carefully. Another typo — the password is long and complex, after all. Failed attempt three. Your phone autocorrects part of the password. Failed attempt four. You paste from your password manager but accidentally include a trailing space. Failed attempt five. Locked out.
        </p>

        <p>
          Now you try from your phone, thinking the lockout is browser-specific. But it is IP-based. Your phone and laptop are on the same Wi-Fi network, sharing the same public IP. Locked out again. You wait 15 minutes. You try again, carefully this time. You get the password right. But iThemes Security has already escalated your IP to the permanent ban list because of the repeated lockout cycles. Permanent ban. You cannot get in at all.
        </p>

        <p>
          This gets worse if you are on a dynamic IP. Your ISP changes your IP address periodically. You come back the next day with a new IP, log in successfully, and think the problem is solved. But your old IP is still banned. If another user — a customer, a team member, a client — gets assigned that old IP by the same ISP, they are immediately locked out of your site even though they have never visited it before.
        </p>

        <h2>File change detection triggers false alarms constantly</h2>

        <p>
          iThemes Security includes a file change detection feature that scans your WordPress installation and alerts you when files are modified, added, or deleted. The idea is to catch hackers who modify core files, inject backdoors, or alter theme files. In practice, it generates so many false positives that most site owners either ignore the alerts or configure the feature to take automatic action — which is where the lockout problems begin.
        </p>

        <p>
          Legitimate file changes happen constantly on a WordPress site. WordPress auto-updates modify core files. Plugin updates change files in the <code>wp-content/plugins/</code> directory. Theme updates change files in <code>wp-content/themes/</code>. Caching plugins like{' '}
          <Link href="/blog/wp-rocket-cache-issues">WP Rocket</Link>
          {' '}create and modify cache files continuously. Upload directories change when media is added. Log files grow. Temporary files are created and deleted.
        </p>

        <p>
          Every one of these legitimate changes triggers file change detection. If the feature is configured to &quot;restrict access to the dashboard until reviewed,&quot; an automatic WordPress core update at 3 AM triggers the detection, and when you try to log in the next morning, access is restricted. If it is configured to &quot;lock out the site,&quot; your caching plugin rebuilding its cache files at midnight triggers a lockout that affects everyone until someone manually reviews and dismisses the alert.
        </p>

        <p>
          The false alarm rate is so high that the feature trains site owners to ignore it. They see &quot;12 files changed&quot; and click &quot;dismiss&quot; without reviewing them. Then when an actual malicious change occurs, they dismiss that too because they are conditioned to treat every alert as a false positive. The security feature designed to protect you either locks you out or becomes useless — often both.
        </p>

        <h2>404 detection banning legitimate visitors</h2>

        <p>
          iThemes Security includes a feature that monitors 404 errors and locks out IP addresses that trigger too many of them. The logic is that attackers often scan for vulnerable files and paths, generating many 404 errors in the process. If an IP triggers more than a threshold number of 404 errors, iThemes Security assumes it is a scanner and locks it out.
        </p>

        <p>
          The problem is that legitimate visitors trigger 404 errors constantly. A broken image link in a blog post generates a 404 for the image URL on every page view. A deleted page that still has internal links pointing to it generates 404s for every visitor who clicks those links. A Google search result pointing to a page you renamed generates 404s for every organic visitor. A social media post with a slightly wrong URL generates 404s for every click.
        </p>

        <p>
          If your site has broken links — and every site of any size has broken links — legitimate visitors are generating 404 errors just by browsing normally. They click a broken link, get a 404, and iThemes Security counts it. They click another broken link on a different page, get another 404, and iThemes Security counts that too. After five or ten 404s in a session, their IP is locked out. They can no longer access any page on your site — not just the broken pages. They see a{' '}
          <Link href="/blog/wordpress-403-forbidden">403 Forbidden</Link>
          {' '}error and think your entire site is down.
        </p>

        <h2>Database ban table corruption locks out everyone</h2>

        <p>
          This is the most dangerous iThemes Security failure mode, and it is more common than you would expect. iThemes Security stores its lockout and ban data in custom database tables. These tables contain every IP that has been temporarily locked out, permanently banned, or flagged for review. Over time, on a busy site, these tables can grow to thousands or tens of thousands of rows.
        </p>

        <p>
          When the database tables become large, queries against them slow down. Every page request requires iThemes Security to check whether the requesting IP is in the ban list. On a site with 50,000 entries in the lockout table, this query adds latency to every single page load. The site gets slower, which can trigger your hosting provider&apos;s resource limits, which can cause additional problems.
        </p>

        <p>
          But the real danger is corruption. A database table that is written to thousands of times per day — recording every failed login attempt, every 404 trigger, every lockout — is susceptible to corruption from server crashes, MySQL timeouts, disk space issues, or concurrent write conflicts. When the lockout table becomes corrupted, iThemes Security can behave unpredictably. It might fail to find any IP in the table and lock out everyone. It might crash on every lookup, returning a PHP fatal error that breaks your entire site. It might enter a state where it treats every IP as banned because the corrupt data matches every query.
        </p>

        <p>
          When this happens, your entire site goes down — not just wp-admin but the front end too, because iThemes Security checks every request, not just login requests. Visitors see 403 errors or{' '}
          <Link href="/blog/wordpress-white-screen-of-death">white screens</Link>. Your uptime monitor might see 403 or 500 errors. And you cannot fix it through the WordPress dashboard because you are locked out too.
        </p>

        <h2>How to regain access when iThemes Security locks you out</h2>

        <h3>Method 1: Use a different IP address</h3>
        <p>
          If the lockout is IP-based, access your site from a different IP address. Disconnect from Wi-Fi and use your mobile phone&apos;s cellular data. Use a VPN. Go to a coffee shop. If you can log in from a different IP, navigate to the iThemes Security settings and remove your original IP from the ban list. Then add your IP to the permanent allowlist to prevent future lockouts.
        </p>

        <h3>Method 2: Rename the plugin folder via FTP</h3>
        <p>
          Connect to your site via FTP or your hosting provider&apos;s file manager. Navigate to <code>wp-content/plugins/</code>. Find the folder named <code>better-wp-security</code> and rename it to <code>better-wp-security-disabled</code>. This deactivates the plugin entirely. Log in to WordPress, rename the folder back, and reconfigure the security settings with less aggressive thresholds.
        </p>

        <h3>Method 3: Clear the lockout database tables</h3>
        <p>
          Access your database through phpMyAdmin, Adminer, or your hosting control panel. Find the tables <code>wp_itsec_lockouts</code> and <code>wp_itsec_temp</code> (your table prefix may differ). Delete all rows from these tables, or if the tables are corrupted, drop and recreate them. This clears all lockouts immediately. The tables will be recreated when iThemes Security next runs.
        </p>

        <h3>Method 4: Edit the wp-config.php file</h3>
        <p>
          Some iThemes Security lockouts are enforced through constants in <code>wp-config.php</code>. Open the file via FTP and look for any lines added by iThemes Security. Remove them, save, and try logging in again. Also check your <code>.htaccess</code> file for any IP deny rules that iThemes Security may have added — these persist even after the plugin is deactivated.
        </p>

        <h2>How to prevent iThemes Security from locking you out again</h2>

        <h3>Add your IP to the permanent allowlist</h3>
        <p>
          In iThemes Security settings, go to Global Settings and find the Authorized Hosts list. Add every IP address you use regularly — your office, your home, your mobile network. If your IP is dynamic, add a range. The allowlist bypasses all lockout rules, so these IPs will never be banned regardless of failed login attempts or 404 triggers.
        </p>

        <h3>Increase the lockout thresholds</h3>
        <p>
          The default five failed attempts before lockout is too aggressive for most sites. Increase it to at least 15 or 20. Real brute force attacks send hundreds or thousands of attempts per minute — a threshold of 20 still catches automated attacks while giving you room for genuine password mistakes. Increase the lockout window as well — 30 minutes is better than 15 for the initial lockout, with permanent bans requiring manual action only.
        </p>

        <h3>Disable 404 detection lockouts</h3>
        <p>
          Turn off the 404 detection lockout feature entirely. It generates too many false positives to be useful. If you want to monitor for scanning activity, use the logging feature to record 404s without banning IPs. Review the logs manually to identify actual attacks. Automated 404-based banning will inevitably lock out legitimate visitors on any site that has broken links.
        </p>

        <h3>Set file change detection to alert only</h3>
        <p>
          Never set file change detection to take automatic action. Configure it to send email alerts only. Review the alerts manually. If you see changes that coincide with a known update, dismiss them. If you see unexpected changes to core files, investigate. The detection feature is useful as a notification tool — it is dangerous as an enforcement tool.
        </p>

        <h2>How Uptrue detects when iThemes Security locks out your visitors</h2>

        <p>
          <Link href="/signup">Uptrue&apos;s HTTP monitoring</Link> checks your site from multiple external locations. When iThemes Security starts blocking IPs — whether through brute force protection, 404 detection, or database corruption — Uptrue detects the 403 responses or lockout pages immediately. You know about the problem before your visitors start contacting you, or worse, before they silently leave and never come back.
        </p>

        <h3>Step 1: Set up HTTP monitoring to detect 403 lockout responses</h3>

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
          When iThemes Security locks out Uptrue&apos;s monitoring IP, the check returns 403 instead of 200 and triggers an alert. The two-confirmation system verifies from a second location — if both are blocked, iThemes Security is blocking broadly and your site is effectively down for external visitors.
        </p>

        <h3>Step 2: Add a keyword monitor for the lockout page text</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to <strong>&quot;has been locked out&quot;</strong> or <strong>&quot;temporarily restricted&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          iThemes Security displays a lockout page with specific text when it blocks a visitor. The exact wording depends on your configuration, but it typically contains phrases like &quot;has been locked out&quot; or &quot;access to this site has been temporarily restricted.&quot; A keyword monitor catches this page even if iThemes Security returns a 200 status code with the lockout content instead of a proper 403.
        </p>

        <h3>Step 3: Monitor your login page separately</h3>

        <ol>
          <li>Add an HTTP monitor for <code>yoursite.com/wp-login.php</code></li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Add a keyword monitor to check it contains <strong>&quot;Log In&quot;</strong></li>
        </ol>

        <p>
          iThemes Security can block the login page while leaving the front end accessible. Your homepage works fine, but nobody can log in. Administrators, editors, customers with accounts — all locked out of the dashboard. A dedicated monitor on the login page catches this immediately.
        </p>

        <h3>Step 4: Monitor wp-admin access</h3>

        <ol>
          <li>Add an HTTP monitor for <code>yoursite.com/wp-admin/</code></li>
          <li>Set expected status to <strong>302</strong> (redirects to login if not authenticated)</li>
        </ol>

        <p>
          If wp-admin returns a 403 instead of a 302 redirect, iThemes Security is blocking access to the admin area entirely. This catches database corruption scenarios where the ban table is so damaged that every request to wp-admin is denied regardless of IP.
        </p>

        <h3>Step 5: Set up alerts for immediate response</h3>

        <ul>
          <li><strong>Slack</strong> — instant notification when iThemes Security blocks external access</li>
          <li><strong>Microsoft Teams</strong> — visibility for the entire team so someone can respond</li>
          <li><strong>Email</strong> — written record of every lockout incident with timestamps</li>
          <li><strong>Webhook</strong> — trigger automated database cleanup scripts or plugin deactivation</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check if your security plugin is blocking visitors right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if iThemes Security is causing lockout problems you cannot see from your own allowlisted IP.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>The cost of security plugin lockouts</h2>

        <p>
          Every minute your site is locked down by iThemes Security, you are losing visitors, customers, and credibility. If the lockout affects the front end, every visitor sees a 403 error. If it only affects wp-admin, your content team cannot publish, your support team cannot respond to tickets, and your developers cannot deploy fixes. If the lockout is partial — blocking some IPs but not others — you have the worst possible scenario: an invisible problem that only affects some of your audience.
        </p>

        <p>
          The lockout does not trigger WordPress&apos;s built-in recovery mode. It does not send you an email. It does not appear in your error logs. iThemes Security simply blocks the request at the application level before WordPress processes it. From the server&apos;s perspective, everything is working. The plugin is doing exactly what it was told to do. The problem is that it was told to do the wrong thing.
        </p>

        <h2>Your security plugin might be your biggest vulnerability</h2>

        <p>
          You installed iThemes Security to protect your WordPress site. It is protecting your site — from you, from your team, from your customers, and from your visitors. Every IP ban, every false lockout, every file change detection panic is a moment where your security plugin is making your site less accessible than it would be with no security plugin at all.
        </p>

        <p>
          The solution is not to remove the security plugin. The solution is to configure it carefully, allowlist your own IPs, increase thresholds to reasonable levels, and monitor from the outside. Uptrue checks your site every 60 seconds from external IPs. When iThemes Security decides those IPs are threats — and eventually, with aggressive enough settings, it will — you get an alert. Before your customers are locked out. Before your team is locked out. Before your security becomes your downtime.
        </p>

        <div className="blog-cta-section">
          <h3>Detect security plugin lockouts before they cost you traffic</h3>
          <p>
            Free plan available. Multi-location HTTP monitoring detects 403 lockout responses. Keyword monitoring catches lockout page text. No credit card required.
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
            <li><Link href="/blog/wordfence-blocking-traffic">Wordfence Blocking Real Users: When Your Security Plugin Becomes Your Biggest Problem</Link></li>
            <li><Link href="/blog/wordpress-403-forbidden">WordPress 403 Forbidden Error: Why Your Pages Are Blocked and How to Fix It</Link></li>
            <li><Link href="/blog/wordpress-brute-force-attack">WordPress Brute Force Attack Slowing Your Site: How Thousands of Login Attempts Cause Downtime</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
