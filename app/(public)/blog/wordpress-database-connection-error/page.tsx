import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'Error Establishing a Database Connection in WordPress: Complete Fix and Monitoring Guide',
  description:
    'Learn what causes the "Error Establishing a Database Connection" in WordPress, how to fix it step by step, and how to monitor your site so you never discover database errors from your customers again.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-database-connection-error' },
  openGraph: {
    title: 'Error Establishing a Database Connection in WordPress: Complete Fix and Monitoring Guide',
    description:
      'What causes the WordPress database connection error, how to fix it, and how to monitor your site so you catch it before your visitors do.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-database-connection-error',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Error Establishing a Database Connection in WordPress: Complete Fix and Monitoring Guide',
    description:
      'What causes the WordPress database connection error, how to fix it, and how to monitor your site so you catch it before your visitors do.',
  },
}

const FAQ_DATA = [
  {
    question: 'What does "Error Establishing a Database Connection" mean in WordPress?',
    answer:
      'This error means WordPress cannot connect to its MySQL database. WordPress stores all your content, settings, users, and pages in a database. When it cannot reach that database — because of wrong credentials, a crashed MySQL server, exceeded connection limits, or corrupted tables — it shows this error instead of your website.',
  },
  {
    question: 'Can this error happen even if my hosting is up?',
    answer:
      'Yes. Your web server (Apache or Nginx) can be running perfectly while your MySQL database server is down, overloaded, or unreachable. Standard uptime monitoring that only checks HTTP status codes may report your site as "up" because the server still returns a response — it just returns an error page. This is why keyword monitoring is critical: it checks for expected content, not just a response.',
  },
  {
    question: 'How do I prevent the WordPress database connection error from happening again?',
    answer:
      'Three things help: First, use a reliable hosting provider with dedicated MySQL resources. Second, keep your WordPress plugins and database optimised to avoid connection limit exhaustion. Third, set up continuous monitoring with both HTTP checks and keyword monitoring so you are alerted the moment the error appears — before your visitors notice.',
  },
  {
    question: 'Will a caching plugin prevent this error?',
    answer:
      'A caching plugin can reduce the number of database queries, which helps with connection limit issues. However, if MySQL crashes or your wp-config.php credentials are wrong, caching will not help — once the cache expires, visitors will see the error. Caching is a performance optimisation, not a reliability solution. You still need monitoring.',
  },
]

export default function WordPressDatabaseConnectionErrorPage(): React.ReactElement {
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
          headline: 'Error Establishing a Database Connection in WordPress: Complete Fix and Monitoring Guide',
          description: 'What causes the WordPress database connection error, how to fix each cause, and how to set up monitoring so you catch it before your visitors do.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-11',
          dateModified: '2026-03-11',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-database-connection-error',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>11 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">Error Establishing a Database Connection in WordPress: Complete Fix and Monitoring Guide</h1>
        <p className="blog-article-subtitle">
          This is the scariest page your WordPress site can show. Here is exactly what causes it, how to fix it, and how to make sure you never find out about it from a customer again.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The worst WordPress error you can get</h2>

        <p>
          You are browsing your own website and instead of your homepage, you see a white page with one line of text:
        </p>

        <p>
          <strong>&quot;Error establishing a database connection.&quot;</strong>
        </p>

        <p>
          That is it. No header. No footer. No content. Just that sentence. And if you are seeing it, so is every single person trying to visit your site right now.
        </p>

        <p>
          This is not a minor glitch. When WordPress cannot connect to its database, your entire site is gone. Every page, every post, every product, every form. The front end is dead. If you have WooCommerce, orders are not going through. If you have a membership site, nobody can log in. If you rely on organic traffic, Google is crawling a broken page and quietly reconsidering your rankings.
        </p>

        <p>
          The painful part? This error can happen at 3am and sit there for hours. Unless someone happens to visit your site and tells you about it, you have no idea. Your hosting dashboard might show everything as &quot;operational.&quot; Your server is technically running. It is just not serving your website.
        </p>

        <h2>What actually causes this error</h2>

        <p>
          WordPress stores everything in a MySQL database — your content, settings, users, plugin configurations, everything. When WordPress loads a page, it connects to that database, runs queries, and assembles the page from the results. If that connection fails for any reason, you get this error.
        </p>

        <p>
          There are four common causes, and each one requires a different fix.
        </p>

        <h3>1. Wrong database credentials in wp-config.php</h3>

        <p>
          This is the most common cause after a migration or hosting change. Your <code>wp-config.php</code> file contains four critical values:
        </p>

        <ul>
          <li><code>DB_NAME</code> — the name of your database</li>
          <li><code>DB_USER</code> — the database username</li>
          <li><code>DB_PASSWORD</code> — the database password</li>
          <li><code>DB_HOST</code> — the database server address (usually <code>localhost</code>)</li>
        </ul>

        <p>
          If any of these are wrong, WordPress cannot connect. This happens when you migrate to a new host and forget to update the credentials, when your hosting provider changes the database server address, or when someone accidentally edits the file.
        </p>

        <p>
          <strong>How to fix it:</strong> Open <code>wp-config.php</code> via FTP or your hosting file manager. Check each value against your hosting control panel&apos;s database settings. The{' '}
          <a href="https://developer.wordpress.org/advanced-administration/wordpress/wp-config/" target="_blank" rel="noopener noreferrer">WordPress wp-config.php documentation</a>
          {' '}explains exactly what each value should be. Pay special attention to <code>DB_HOST</code> — on shared hosting it is usually <code>localhost</code>, but on some providers like AWS RDS or managed MySQL it is a full hostname.
        </p>

        <h3>2. MySQL server has crashed or is not running</h3>

        <p>
          Your database credentials can be perfectly correct, but if the MySQL server itself is down, nothing connects. This happens more often than you would think, especially on shared hosting where hundreds of sites share the same database server.
        </p>

        <p>
          Common triggers include: the hosting provider running out of memory and killing MySQL to free resources, a traffic spike on another site on the same shared server, a failed MySQL update, or a corrupted InnoDB tablespace.
        </p>

        <p>
          <strong>How to fix it:</strong> If you have SSH access, check if MySQL is running with <code>sudo systemctl status mysql</code>. If it is stopped, restart it with <code>sudo systemctl restart mysql</code>. On shared hosting, you cannot do this yourself — contact your host. If MySQL keeps crashing, check the MySQL error log (usually at <code>/var/log/mysql/error.log</code>) for out-of-memory errors or table corruption messages.
        </p>

        <p>
          The{' '}
          <a href="https://dev.mysql.com/doc/refman/8.0/en/starting-server-troubleshooting.html" target="_blank" rel="noopener noreferrer">MySQL troubleshooting documentation</a>
          {' '}covers the most common startup failures in detail.
        </p>

        <h3>3. Database connection limits exceeded</h3>

        <p>
          Every MySQL server has a maximum number of simultaneous connections. When your site gets a traffic spike, or when a misbehaving plugin opens connections without closing them, you can hit that limit. Once you do, new connections are refused — and WordPress shows the database error.
        </p>

        <p>
          This is especially common on shared hosting where the connection limit is low (often 25 to 50 connections), and on WooCommerce sites during flash sales or promotional events.
        </p>

        <p>
          <strong>How to fix it:</strong> First, check if a plugin is the culprit. Deactivate plugins one by one (via FTP if you cannot access wp-admin — rename the plugin folder in <code>/wp-content/plugins/</code>). Install a persistent object cache like Redis or Memcached to reduce database queries. If you are on shared hosting and hitting limits regularly, it is time to upgrade to a VPS or managed WordPress host with dedicated MySQL resources.
        </p>

        <h3>4. Corrupted database tables</h3>

        <p>
          MySQL tables can become corrupted after a server crash, a failed write operation, or disk issues. When WordPress tries to read from a corrupted table, the query fails and the connection error appears.
        </p>

        <p>
          <strong>How to fix it:</strong> Add this line to your <code>wp-config.php</code> temporarily:
        </p>

        <p>
          <code>define(&apos;WP_ALLOW_REPAIR&apos;, true);</code>
        </p>

        <p>
          Then visit <code>yoursite.com/wp-admin/maint/repair.php</code>. WordPress will attempt to repair and optimise all database tables. Once finished, remove the line from <code>wp-config.php</code> immediately — leaving it in place lets anyone trigger a repair without authentication.
        </p>

        <p>
          For more advanced repair, use phpMyAdmin from your hosting panel. Select all tables, choose &quot;Repair table&quot; from the dropdown, and run it. The{' '}
          <a href="https://developer.wordpress.org/advanced-administration/server/optimization/" target="_blank" rel="noopener noreferrer">WordPress database optimisation guide</a>
          {' '}covers additional optimisation techniques.
        </p>

        <h2>The real problem: you did not know it was happening</h2>

        <p>
          Here is the thing that nobody talks about with this error. Fixing it is usually straightforward once you know it is happening. The real damage comes from the hours or days it sits there undetected.
        </p>

        <p>
          Think about it. When was the last time you manually checked your own website? Not your dashboard — your actual public-facing site. If you are like most site owners, it has been days. Maybe weeks. Your WordPress site could be showing this error right now and you would not know.
        </p>

        <p>
          And the error is invisible to most basic monitoring. Here is why: when WordPress shows &quot;Error establishing a database connection,&quot; your web server is still running. Apache or Nginx is still responding to HTTP requests. Some hosts even return a 200 OK status code with the error message in the body. So a simple uptime check that only looks at HTTP status codes will report your site as &quot;up.&quot;
        </p>

        <p>
          Your site is up. It is just not working.
        </p>

        <h2>How to monitor for this error with Upnotify</h2>

        <p>
          This is exactly the kind of failure that <Link href="/signup">Upnotify</Link> is built to catch. You need two types of monitors working together: an HTTP monitor and a keyword monitor.
        </p>

        <h3>Step 1: Set up an HTTP monitor</h3>

        <p>
          The HTTP monitor is your first line of defence. It checks that your site responds at all.
        </p>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your WordPress site URL (your homepage)</li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Set expected status code to <strong>200</strong></li>
          <li>Configure your alert channels — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          This catches the cases where MySQL is completely down and your server returns a 500 error. But it will not catch the cases where the server returns a 200 status with the error message in the body.
        </p>

        <h3>Step 2: Set up a keyword monitor (this is the critical one)</h3>

        <p>
          The keyword monitor is what catches the sneaky failures. It checks that specific text exists on your page — or that specific text does <em>not</em> exist.
        </p>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to your site name or a phrase that always appears on your homepage (like your tagline or a menu item)</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          Now, if WordPress shows &quot;Error establishing a database connection&quot; instead of your actual content, the keyword monitor will not find your expected text. It triggers an alert immediately.
        </p>

        <p>
          For extra protection, add a second keyword monitor:
        </p>

        <ol>
          <li>Same URL, same settings</li>
          <li>Set the keyword to <strong>&quot;Error establishing a database connection&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
        </ol>

        <p>
          This one fires the moment that specific error text appears on your site. Between these two monitors, the database error has nowhere to hide.
        </p>

        <h3>Step 3: Set up a status page (optional but smart)</h3>

        <p>
          If you run a site that your clients or customers depend on, set up a{' '}
          <Link href="/blog/public-status-page-guide">public status page</Link>. When the database error hits, your monitors trigger, your status page updates automatically, and your users can check the status themselves instead of flooding your inbox asking &quot;is the site down?&quot;
        </p>

        <h3>Step 4: Check your site health right now</h3>

        <p>
          Before you set up monitoring, run a free health check on your site. It analyses your uptime, SSL, DNS, security headers, and performance — and shows you exactly where your vulnerabilities are.
        </p>

        <div className="blog-cta-section">
          <h3>Check your WordPress site health for free</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. No account required.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing the error before it happens</h2>

        <p>
          Monitoring catches the error fast. But you should also reduce the chances of it happening in the first place.
        </p>

        <h3>Keep your wp-config.php credentials documented</h3>
        <p>
          Store your database credentials securely outside your hosting panel. If you ever need to migrate or troubleshoot, you want immediate access without digging through support tickets.
        </p>

        <h3>Monitor your hosting resource usage</h3>
        <p>
          Most hosting panels show CPU, memory, and MySQL connection usage. If you are consistently running above 80% on any of these, you are one traffic spike away from a database error. Consider upgrading before it becomes a problem.
        </p>

        <h3>Optimise your database regularly</h3>
        <p>
          WordPress accumulates post revisions, transient options, spam comments, and orphaned metadata over time. Use a plugin like WP-Optimize to clean up your database monthly. Fewer rows means faster queries means fewer connection timeouts.
        </p>

        <h3>Use a persistent object cache</h3>
        <p>
          Redis or Memcached stores frequently-accessed data in memory so WordPress does not need to hit the database for every page load. This dramatically reduces the number of database connections and makes your site more resilient under load.
        </p>

        <h3>Choose hosting with dedicated MySQL resources</h3>
        <p>
          Shared hosting means shared database servers. When another site on the same server gets a traffic spike, your database slows down or becomes unreachable. Managed WordPress hosting or a VPS with dedicated MySQL resources eliminates this risk.
        </p>

        <h2>Stop finding out from your customers</h2>

        <p>
          Your WordPress site could be down right now and you would not know.
        </p>

        <p>
          Upnotify monitors your site every 60 seconds and alerts you on Slack, email, or Teams the moment something goes wrong — from full outages to subtle content changes that only a keyword monitor catches.
        </p>

        <p>
          The database connection error is one of the most common WordPress failures, and one of the hardest to detect with basic monitoring. A simple HTTP check is not enough. You need keyword monitoring that checks what your page actually says.
        </p>

        <p>
          Never discover database errors from your customers again.
        </p>

        <div className="blog-cta-section">
          <h3>Start monitoring your WordPress site in 60 seconds</h3>
          <p>
            Free plan available. HTTP and keyword monitoring. AI-powered reports. No credit card required.
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
            <li><Link href="/blog/wordpress-contact-form-not-sending">Contact Form 7 Not Sending Emails: Your Leads Are Disappearing</Link></li>
            <li><Link href="/blog/website-monitoring-guide">Website Monitoring in 2026: The Complete Guide</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
