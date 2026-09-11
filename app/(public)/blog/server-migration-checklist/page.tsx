import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'Server Migration Checklist: How to Move Hosts Without Losing Your Site',
  description:
    'A complete server migration checklist covering DNS propagation, SSL transfer, database migration, email continuity, and monitoring during the switch. Move hosting providers without downtime or data loss.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/server-migration-checklist' },
  openGraph: {
    title: 'Server Migration Checklist: How to Move Hosts Without Losing Your Site',
    description:
      'DNS propagation, SSL certificate transfer, database migration, and monitoring during the switch. The complete checklist for moving hosting providers without losing your site.',
    url: 'https://upnotify-monitoring.vercel.app/blog/server-migration-checklist',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Server Migration Checklist: How to Move Hosts Without Losing Your Site',
    description:
      'DNS propagation, SSL certificate transfer, database migration, and monitoring during the switch. The complete checklist for moving hosting providers without losing your site.',
  },
}

const FAQ_DATA = [
  {
    question: 'How long does DNS propagation take during a server migration?',
    answer:
      'DNS propagation typically takes 1 to 48 hours, though most changes propagate within 4 to 8 hours. The time depends on your DNS record TTL (time to live) settings, your registrar, and the DNS resolvers used by your visitors\' ISPs. Before migration, lower your DNS TTL to 300 seconds (5 minutes) at least 48 hours in advance. This ensures that when you change the DNS records to point to your new server, the change propagates much faster. If you skip this step, old DNS records with high TTLs can persist for up to 48 hours, sending visitors to your old server.',
  },
  {
    question: 'Can I migrate my website without any downtime?',
    answer:
      'Near-zero downtime is possible with careful planning but true zero downtime is very difficult. The strategy is to keep your old server running while the new server is fully set up and tested. Lower DNS TTL in advance, copy all files and database to the new server, test thoroughly on the new server using a temporary URL or hosts file entry, then update DNS. During propagation, some visitors go to the old server and some to the new server. Both should be functional. The gap where things can go wrong is if data changes on the old server during propagation — form submissions, orders, comments — that do not make it to the new server.',
  },
  {
    question: 'How do I transfer my SSL certificate to a new host?',
    answer:
      'If you use Let\'s Encrypt (the most common free SSL), you do not transfer it — you issue a new certificate on the new server. Install your site on the new server, verify it works on HTTP, then run Certbot or your hosting provider\'s SSL tool to issue a new Let\'s Encrypt certificate. If you have a paid SSL certificate from a certificate authority, you can transfer it by exporting the certificate file, private key, and CA bundle from the old server and importing them to the new one. Most managed hosting providers handle SSL automatically — you just need to ensure DNS is pointing to them.',
  },
  {
    question: 'What happens to emails during a server migration?',
    answer:
      'If your email is hosted on the same server as your website (common with cPanel hosting), email is the most dangerous part of a migration. During DNS propagation, some emails go to your old server and some go to your new server. Emails sent to the old server during propagation can be lost if that server is decommissioned before you retrieve them. The safest approach is to migrate email to a separate service (Google Workspace, Microsoft 365, or Zoho Mail) before migrating your website. This decouples email from hosting entirely. If you must migrate email with the site, keep the old server running for at least 7 days after migration to catch stragglers.',
  },
  {
    question: 'How do I test my site on the new server before changing DNS?',
    answer:
      'There are three ways. First, use the new server\'s IP address directly — most hosting providers give you a temporary URL like your-server-ip/~username. Second, edit your local hosts file (on Windows: C:\\Windows\\System32\\drivers\\etc\\hosts, on Mac/Linux: /etc/hosts) to point your domain to the new server IP. This lets you browse your site on the new server while everyone else still sees the old one. Third, some hosting providers offer a staging URL. Test all critical pages, forms, checkout flows, and functionality before touching DNS.',
  },
  {
    question: 'Should I use my new hosting provider\'s migration service?',
    answer:
      'Many managed hosting providers offer free migration as part of their onboarding. This is usually the easiest option — they have done thousands of migrations and have the process refined. However, you should still verify the migration yourself. Check every page. Test every form. Verify the database. Check that file permissions are correct. Run your monitoring on the new server before switching DNS. Free migration services are good at copying files but they cannot verify that your specific site\'s functionality works correctly — only you can do that.',
  },
  {
    question: 'What is the biggest risk during a server migration?',
    answer:
      'Data loss during the DNS propagation window. After you update DNS but before propagation is complete, some visitors still reach the old server. If someone places an order, submits a form, or posts a comment on the old server during this window, that data exists only on the old server. If you decommission the old server too quickly, that data is lost. The solution is to keep the old server running for at least 7 days after migration, then export any new data from it. For ecommerce sites, consider putting the site in maintenance mode during the actual DNS switch to prevent split-brain data issues.',
  },
  {
    question: 'How does monitoring help during a server migration?',
    answer:
      'External monitoring catches migration problems in real time. Set up HTTP monitoring on both the old and new server before the migration. Monitor the new server using its IP address or temporary URL to verify it is working before DNS changes. After changing DNS, monitor your domain to catch any downtime during propagation. Set up keyword monitoring to verify your content is loading correctly — not a hosting error page or a partially migrated site. Response time monitoring confirms the new server actually performs better than the old one. Alert channels ensure you know instantly if anything goes wrong.',
  },
]

export default function ServerMigrationChecklistPage(): React.ReactElement {
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
          headline: 'Server Migration Checklist: How to Move Hosts Without Losing Your Site',
          description: 'Complete server migration checklist covering DNS propagation, SSL transfer, database migration, email continuity, and monitoring during the move.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-28',
          dateModified: '2026-03-28',
          url: 'https://upnotify-monitoring.vercel.app/blog/server-migration-checklist',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Hosting</span>
          <span>28 March 2026</span>
          <span>15 min read</span>
        </div>
        <h1 className="blog-article-title">Server Migration Checklist: How to Move Hosts Without Losing Your Site</h1>
        <p className="blog-article-subtitle">
          You have decided to move to better hosting. Good. But between here and there lies a minefield — DNS propagation delays, SSL certificates that do not transfer, databases that corrupt during export, and emails that vanish into the void. Here is the complete checklist to get through it without losing your site, your data, or your mind.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>Why migrations go wrong</h2>

        <p>
          Server migration is one of the highest-risk operations in web infrastructure. You are moving a live website — with active visitors, incoming emails, and possibly processing transactions — from one server to another while keeping everything running. It is like changing the engine on a car while driving it.
        </p>

        <p>
          Most migration problems fall into three categories: things that were not copied correctly, things that break because the new server is configured differently, and things that happen during the DNS propagation window when traffic is split between old and new servers. Every item on this checklist addresses one of these risks.
        </p>

        <h2>Phase 1: Before the migration (1 to 2 weeks before)</h2>

        <h3>Lower your DNS TTL</h3>
        <p>
          This is the most commonly skipped step — and the one that causes the most problems. Your DNS records have a TTL (time to live) value that tells DNS resolvers how long to cache the record. If your TTL is 86400 (24 hours), then after you change DNS, some visitors will still be directed to your old server for up to 24 hours.
        </p>
        <p>
          At least 48 hours before migration, log into your DNS provider and lower the TTL on your A record, CNAME records, and MX records to 300 (5 minutes). Wait 48 hours for the old high TTL to expire from caches worldwide. Then when you change DNS during the actual migration, propagation happens in minutes instead of hours.
        </p>

        <h3>Take a full backup of everything</h3>
        <ul>
          <li>All website files — including hidden files like .htaccess</li>
          <li>Database — full SQL export with all tables, triggers, and stored procedures</li>
          <li>Email accounts and their contents (if email is on the same server)</li>
          <li>SSL certificate files (certificate, private key, CA bundle) if using a paid certificate</li>
          <li>Cron job configurations</li>
          <li>Server configuration files (php.ini settings, .htaccess rules, Nginx config)</li>
        </ul>
        <p>
          Store the backup somewhere independent of both the old and new server — a local computer, cloud storage, or a separate backup service. If both servers have problems simultaneously, you need an independent copy.
        </p>

        <h3>Document your current configuration</h3>
        <p>
          Before you touch anything, record the current state:
        </p>
        <ul>
          <li>PHP version on the old server</li>
          <li>MySQL or MariaDB version</li>
          <li>PHP memory limit, max execution time, upload limits</li>
          <li>Installed PHP extensions (your site may depend on specific ones)</li>
          <li>All DNS records — A, AAAA, CNAME, MX, TXT, SPF, DKIM, DMARC</li>
          <li>Current server IP address</li>
          <li>Any custom Apache or Nginx rewrite rules</li>
        </ul>
        <p>
          This documentation becomes your reference when setting up the new server. If something breaks, you can compare configurations line by line to find the difference.
        </p>

        <h3>Set up monitoring on both servers</h3>
        <p>
          Before the migration, set up <Link href="/signup">Upnotify monitoring</Link> on your current site. This establishes a performance baseline — you will know your normal response time, uptime pattern, and SSL status. After migration, you can compare the new server&apos;s performance against this baseline.
        </p>
        <ol>
          <li>Add an HTTP monitor for your main domain</li>
          <li>Add a keyword monitor checking for your site title or key content</li>
          <li>Note your current average response time — this is your baseline</li>
          <li>Set up alerts on Slack, email, or Teams</li>
        </ol>

        <h3>Decouple email from hosting (if possible)</h3>
        <p>
          If your email runs on the same server as your website, migrate email to a dedicated service first. Google Workspace, Microsoft 365, or Zoho Mail all handle email independently of your web hosting. Doing this before the website migration removes the biggest risk — lost emails during DNS propagation.
        </p>
        <p>
          If you cannot decouple email before migration, be extremely careful with MX records during the DNS switch, and keep the old server running for at least 7 days after migration to catch any emails that arrive there.
        </p>

        <h2>Phase 2: Set up the new server (before DNS change)</h2>

        <h3>Configure the new server to match</h3>
        <p>
          Using your documentation from Phase 1, set up the new server with matching or better specifications:
        </p>
        <ul>
          <li>Same or newer PHP version (test compatibility if upgrading)</li>
          <li>Same or newer MySQL/MariaDB version</li>
          <li>All required PHP extensions installed</li>
          <li>PHP settings matching or exceeding old server (memory_limit, max_execution_time, upload_max_filesize)</li>
          <li>Same timezone configuration</li>
        </ul>

        <h3>Upload files and import database</h3>
        <ol>
          <li>Upload all website files to the new server via SFTP or the hosting provider&apos;s file manager</li>
          <li>Import the database from your SQL export</li>
          <li>Update database connection settings in your configuration files (wp-config.php for WordPress, .env for Laravel, etc.)</li>
          <li>Set correct file permissions — 644 for files, 755 for directories on Linux servers</li>
          <li>Verify .htaccess or Nginx configuration is in place</li>
        </ol>

        <h3>Test on the new server before changing DNS</h3>
        <p>
          This is critical. Do not change DNS until you have verified the site works on the new server.
        </p>
        <ol>
          <li>Access the site using the new server&apos;s IP address or temporary URL</li>
          <li>Or edit your local hosts file to point your domain to the new server IP</li>
          <li>Test every important page — homepage, product pages, contact page, blog</li>
          <li>Test all forms — submit a test enquiry, test the checkout process</li>
          <li>Check that images and media files load correctly</li>
          <li>Verify SSL works (if using a temporary URL, test HTTP first; SSL comes after DNS)</li>
          <li>Check for mixed content warnings in the browser console</li>
          <li>Test the admin panel / CMS login</li>
          <li>Verify cron jobs are configured and running</li>
        </ol>

        <h3>Set up SSL on the new server</h3>
        <p>
          If using Let&apos;s Encrypt, you typically need DNS to point to the new server before issuing a certificate (because Let&apos;s Encrypt validates domain ownership). Some hosting providers support DNS validation, which lets you issue the certificate before the DNS change. If available, use DNS validation. If not, plan a brief HTTP-only window while you issue the certificate after DNS change, or use a paid certificate that you can transfer.
        </p>

        <h3>Set up monitoring on the new server</h3>
        <p>
          Add an HTTP monitor in Upnotify pointing to the new server&apos;s IP address or temporary URL. Verify it responds correctly and note the response time. This confirms the new server is healthy before you send real traffic to it.
        </p>

        <div className="blog-cta-section">
          <h3>Monitor your migration in real time</h3>
          <p>
            Set up monitoring on both old and new servers before the switch. See response times, uptime, and SSL status throughout the migration process.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start Free Monitoring
          </Link>
        </div>

        <h2>Phase 3: The DNS switch</h2>

        <h3>Final sync before switching</h3>
        <p>
          If your site has changed since the initial file copy — new posts, form submissions, orders — do a final sync:
        </p>
        <ol>
          <li>Export a fresh database from the old server</li>
          <li>Import it to the new server (replacing the old import)</li>
          <li>Copy any new uploaded files</li>
          <li>Verify the new server has the latest content</li>
        </ol>

        <h3>Update DNS records</h3>
        <p>
          Log into your DNS provider (this might be your domain registrar or a DNS service like Cloudflare). Update the following records to point to the new server:
        </p>
        <ul>
          <li><strong>A record</strong> — point to the new server&apos;s IP address</li>
          <li><strong>AAAA record</strong> — if the new server has an IPv6 address</li>
          <li><strong>CNAME records</strong> — update www and any subdomains</li>
          <li><strong>MX records</strong> — only if email is moving too (skip if you decoupled email)</li>
        </ul>
        <p>
          Do NOT change nameservers unless you are also moving DNS management. Changing nameservers propagates more slowly than changing individual records.
        </p>

        <h3>Issue SSL certificate (if not done in Phase 2)</h3>
        <p>
          Once DNS points to the new server, run Certbot or your hosting provider&apos;s SSL tool to issue a Let&apos;s Encrypt certificate. Verify HTTPS works. Check for mixed content. Force HTTPS redirect if your site requires it.
        </p>

        <h3>Monitor during propagation</h3>
        <p>
          During DNS propagation, traffic is split between old and new servers. Monitor both:
        </p>
        <ul>
          <li>Your Upnotify HTTP monitor on your domain catches any downtime during the switch</li>
          <li>Keyword monitoring verifies your content is loading (not a parking page or error)</li>
          <li>SSL monitoring confirms the certificate is valid on the new server</li>
          <li>Response time monitoring shows whether the new server is faster (it should be — that is why you migrated)</li>
        </ul>

        <h2>Phase 4: After the migration (1 to 7 days after)</h2>

        <h3>Verify everything works</h3>
        <ul>
          <li>Test from multiple devices and networks (not just your office network)</li>
          <li>Check Google Search Console for crawl errors</li>
          <li>Verify Google Analytics and tracking codes are working</li>
          <li>Test all email deliverability — send tests to Gmail, Outlook, and Yahoo</li>
          <li>Check that cron jobs are firing correctly</li>
          <li>Verify backups are running on the new server</li>
        </ul>

        <h3>Keep the old server running</h3>
        <p>
          Do not decommission the old server immediately. Keep it running for at least 7 days after migration. During this time:
        </p>
        <ul>
          <li>Check for any emails that arrived at the old server during propagation</li>
          <li>Check for any form submissions or orders that went to the old server</li>
          <li>Keep it as a rollback option in case something goes wrong on the new server</li>
        </ul>

        <h3>Compare performance</h3>
        <p>
          After 7 days on the new server, compare Upnotify&apos;s response time data with your pre-migration baseline. You should see:
        </p>
        <ul>
          <li>Lower average response time</li>
          <li>Fewer response time spikes</li>
          <li>More consistent performance throughout the day</li>
          <li>Better TTFB on database-heavy pages</li>
        </ul>
        <p>
          If performance is not better, investigate. You migrated for a reason — make sure the new hosting actually delivers.
        </p>

        <h3>Update DNS TTL back to normal</h3>
        <p>
          Once you are confident the migration is complete and stable, increase your DNS TTL back to a normal value — 3600 (1 hour) or 86400 (24 hours). Low TTLs cause more DNS lookups, which adds a small overhead to every new visitor.
        </p>

        <h3>Cancel old hosting</h3>
        <p>
          After 7 to 14 days with no issues on the new server, and after retrieving any straggler data from the old server, you can safely cancel the old hosting account. Take a final backup from the old server before cancellation — just in case.
        </p>

        <h2>The complete checklist</h2>

        <p>
          Here is the full migration checklist you can follow step by step:
        </p>

        <h3>One to two weeks before</h3>
        <ol>
          <li>Lower DNS TTL to 300 seconds on all records</li>
          <li>Take a complete backup (files, database, emails, config)</li>
          <li>Document current server configuration (PHP version, extensions, settings)</li>
          <li>Document all DNS records</li>
          <li>Set up Upnotify monitoring on current site (baseline)</li>
          <li>Decouple email to a separate service if possible</li>
          <li>Purchase and set up the new hosting account</li>
        </ol>

        <h3>One to two days before</h3>
        <ol>
          <li>Configure new server to match old (PHP, MySQL, extensions)</li>
          <li>Upload files and import database to new server</li>
          <li>Update configuration files with new database credentials</li>
          <li>Set correct file permissions</li>
          <li>Test new server via IP or hosts file — all pages and forms</li>
          <li>Issue SSL certificate on new server (if DNS validation available)</li>
          <li>Set up Upnotify monitoring on new server IP</li>
        </ol>

        <h3>Migration day</h3>
        <ol>
          <li>Do a final database and file sync from old to new server</li>
          <li>Update DNS A record to new server IP</li>
          <li>Update DNS CNAME records for www and subdomains</li>
          <li>Issue SSL certificate if not done earlier</li>
          <li>Verify HTTPS works and force redirect</li>
          <li>Monitor response times and uptime throughout the day</li>
        </ol>

        <h3>One to seven days after</h3>
        <ol>
          <li>Test from multiple devices and networks</li>
          <li>Check old server for straggler emails and data</li>
          <li>Verify Google Search Console shows no new errors</li>
          <li>Confirm analytics tracking is working</li>
          <li>Verify backups are running on new server</li>
          <li>Compare response time data — old versus new</li>
          <li>Increase DNS TTL back to normal</li>
          <li>Take final backup from old server</li>
          <li>Cancel old hosting</li>
        </ol>

        <div className="blog-cta-section">
          <h3>Do not migrate blind</h3>
          <p>
            Monitor your old and new server throughout the migration. Catch DNS issues, SSL failures, and performance problems the moment they happen — not when a customer emails you.
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
            <li><Link href="/blog/cheap-hosting-hidden-costs">Why Cheap Hosting Is the Most Expensive Mistake You Can Make</Link></li>
            <li><Link href="/blog/dns-monitoring-explained">DNS Monitoring Explained: Why Your Domain Records Matter More Than You Think</Link></li>
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</Link></li>
            <li><Link href="/blog/cdn-vs-better-hosting">CDN vs Better Hosting: What Actually Makes Your Site Faster?</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
