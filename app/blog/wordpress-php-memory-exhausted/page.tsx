import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide',
  description:
    'The PHP memory exhausted error crashes your WordPress site with a white screen or 500 error. Learn what causes it, how to fix it permanently with wp-config, php.ini, and .htaccess, and how to monitor for the 500 errors it causes.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-php-memory-exhausted' },
  openGraph: {
    title: 'PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide',
    description:
      'What causes the PHP memory exhausted error, how to fix it with wp-config and php.ini, and how to monitor for the 500 errors and white screens it causes.',
    url: 'https://uptrue.io/blog/wordpress-php-memory-exhausted',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide',
    description:
      'What causes the PHP memory exhausted error, how to fix it with wp-config and php.ini, and how to monitor for the 500 errors and white screens it causes.',
  },
}

const FAQ_DATA = [
  {
    question: 'What does "Allowed memory size exhausted" mean in WordPress?',
    answer:
      'This error means a PHP script on your WordPress site tried to use more memory than the server allows. PHP has a memory limit (typically 40MB to 128MB) set by your hosting provider. When a WordPress plugin, theme, or core process exceeds that limit, PHP kills the script and throws a fatal error. The result is usually a white screen, a 500 Internal Server Error, or the WordPress critical error message.',
  },
  {
    question: 'What is the recommended PHP memory limit for WordPress?',
    answer:
      'WordPress recommends a minimum of 64MB for basic sites and 128MB to 256MB for sites running WooCommerce, page builders, or multiple plugins. For large WooCommerce stores with many products or sites running complex import/export operations, 512MB may be necessary. Setting the limit too high is not harmful — it just defines the maximum a script can use, not what it will use on every request.',
  },
  {
    question: 'Will increasing the memory limit fix the problem permanently?',
    answer:
      'Increasing the memory limit fixes the immediate error, but it does not address the root cause. If a plugin has a memory leak or inefficient code, it will eventually hit even a higher limit — especially under traffic spikes or during large operations. You should increase the limit to stop the immediate crash, then investigate which plugin or process is consuming excessive memory and address it directly.',
  },
  {
    question: 'Can uptime monitoring detect a PHP memory exhausted error?',
    answer:
      'Yes. When PHP runs out of memory, the result is typically a 500 Internal Server Error or a blank white page. An HTTP monitor catches the 500 error directly. A keyword monitor catches the white page by detecting that your expected content is missing. Together, they provide complete coverage — you know about the crash within 60 seconds, regardless of how the error manifests.',
  },
]

export default function WordPressPhpMemoryExhaustedPage(): React.ReactElement {
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
          headline: 'PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide',
          description: 'What causes the PHP memory limit exhausted error in WordPress, four ways to fix it, and how to monitor for the 500 errors and white screens it causes.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-04-28',
          dateModified: '2026-04-28',
          url: 'https://uptrue.io/blog/wordpress-php-memory-exhausted',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>28 April 2026</span>
          <span>13 min read</span>
        </div>
        <h1 className="blog-article-title">PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide</h1>
        <p className="blog-article-subtitle">
          Your WordPress site just crashed with a cryptic PHP error — or worse, a blank white screen that tells you nothing at all. The cause is almost always the same: PHP ran out of memory. Here is how to fix it, find the real culprit, and make sure you know instantly when it happens again.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The error behind the white screen</h2>

        <p>
          You are updating a WooCommerce product catalogue. Or importing a large CSV file. Or just visiting your homepage on a busy day. And instead of your site, you see one of these:
        </p>

        <p>
          <strong>&quot;Fatal error: Allowed memory size of 41943040 bytes exhausted (tried to allocate 20480 bytes) in /home/user/public_html/wp-includes/class-wpdb.php on line 2056&quot;</strong>
        </p>

        <p>
          Or, worse, you see nothing at all. Just a blank white screen. Or a generic 500 Internal Server Error page from your hosting provider. No explanation, no clue, no debug information.
        </p>

        <p>
          Behind all three of these symptoms is the same problem: PHP ran out of memory.
        </p>

        <p>
          That number in the error message — 41943040 bytes — is 40MB. That is the default PHP memory limit on many shared hosting providers. Your WordPress site, with all its plugins and themes and database queries, tried to use more than 40MB of memory on a single page load, and PHP killed the process.
        </p>

        <p>
          The result? Your site is down. Not just the page you were looking at — potentially every page, depending on which plugin or process exhausted the memory. If it happens on a core WordPress file like <code>class-wpdb.php</code>, it can take down every page that touches the database. Which is every page.
        </p>

        <p>
          Your visitors see a white screen or a 500 error. Your WooCommerce orders stop processing. Your forms stop submitting. And because the error can be intermittent — appearing only under load — you might not see it when you check your site yourself.
        </p>

        <h2>Why PHP has a memory limit at all</h2>

        <p>
          PHP sets a memory limit to prevent a single script from consuming all available server RAM. Without it, one misbehaving plugin could crash the entire server, taking down every site hosted on it.
        </p>

        <p>
          The limit is configured at the server level and applies per-request. Every time a visitor loads a page, PHP starts a new process, and that process gets a fixed amount of memory to work with. If the page requires more memory than the limit allows, PHP kills the process.
        </p>

        <p>
          The{' '}
          <a href="https://www.php.net/manual/en/ini.core.php#ini.memory-limit" target="_blank" rel="noopener noreferrer">PHP documentation for memory_limit</a>
          {' '}explains how the limit works at a technical level. For WordPress specifically, the issue is that 40MB or 64MB — the defaults on most shared hosting — is simply not enough for a modern WordPress site with multiple plugins.
        </p>

        <h2>What causes the memory to run out</h2>

        <p>
          Knowing why PHP has a limit is useful. But you need to know why your site is exceeding it. Here are the most common causes, from most frequent to least.
        </p>

        <h3>1. Too many plugins loaded simultaneously</h3>

        <p>
          Every active plugin consumes memory on every page load, even if it only does something on specific pages. A plugin that adds a contact form to one page still loads its PHP classes and hooks on every page. Twenty active plugins loading on every request can easily push a site past 40MB.
        </p>

        <p>
          The typical WordPress site with a page builder, a forms plugin, an SEO plugin, a security plugin, a caching plugin, an analytics plugin, and a few others is running right at the edge of 64MB. Add a WooCommerce store on top of that and you are past 128MB before any actual content is processed.
        </p>

        <h3>2. Plugin memory leaks</h3>

        <p>
          Some plugins have inefficient code that consumes far more memory than necessary. A common pattern is loading an entire dataset into memory instead of processing it in chunks. A plugin that imports 10,000 products by loading all of them into a PHP array at once can consume hundreds of megabytes.
        </p>

        <p>
          Memory leaks are hard to detect because they might not show up during normal browsing. They appear during specific operations — imports, exports, report generation, sitemap building — that are often run by cron jobs or admin users, not regular visitors.
        </p>

        <h3>3. Large WooCommerce operations</h3>

        <p>
          WooCommerce is a significant memory consumer on its own. Adding products with many variations, running sales reports over large date ranges, importing product catalogues via CSV, or generating PDF invoices for large orders can all push past the memory limit.
        </p>

        <p>
          The problem is amplified on shared hosting where the memory limit is low and cannot be easily increased. A WooCommerce store with 5,000 products needs substantially more memory than a simple blog.
        </p>

        <h3>4. Large media uploads and image processing</h3>

        <p>
          When you upload an image, WordPress generates multiple sizes — thumbnail, medium, large, and any custom sizes your theme defines. Processing a 5MB image into six different sizes requires significant memory. If your theme defines four custom sizes and you upload a high-resolution image, PHP can run out of memory during the resize operations.
        </p>

        <p>
          This is especially common when uploading multiple images at once via the media library bulk uploader.
        </p>

        <h3>5. The default memory limit is simply too low</h3>

        <p>
          Many shared hosting providers set the PHP memory limit to 40MB or 64MB. WordPress itself recommends a minimum of 64MB, and WooCommerce recommends 128MB. If your host is set at 40MB, even a basic WordPress installation with a handful of popular plugins will hit the limit under any kind of load.
        </p>

        <h2>Four ways to increase the PHP memory limit</h2>

        <p>
          The immediate fix is to increase the memory limit. There are four methods, and which one works depends on your hosting setup. Try them in this order.
        </p>

        <h3>Method 1: wp-config.php (works on most hosts)</h3>

        <p>
          This is the most common and most reliable method. Open <code>wp-config.php</code> via FTP or your hosting file manager. Add this line before the &quot;That&apos;s all, stop editing&quot; comment:
        </p>

        <p>
          <code>define(&apos;WP_MEMORY_LIMIT&apos;, &apos;256M&apos;);</code>
        </p>

        <p>
          For admin operations that need more memory (like plugin updates or WooCommerce imports), you can also set a separate admin limit:
        </p>

        <p>
          <code>define(&apos;WP_MAX_MEMORY_LIMIT&apos;, &apos;512M&apos;);</code>
        </p>

        <p>
          Save the file and reload your site. If the error disappears, you are done — for now. Note that some hosting providers override this setting at the server level, in which case you need one of the other methods.
        </p>

        <h3>Method 2: php.ini (if your host allows it)</h3>

        <p>
          The <code>php.ini</code> file controls PHP settings at the server level. If your host allows you to create or edit a <code>php.ini</code> file in your WordPress root directory, add this line:
        </p>

        <p>
          <code>memory_limit = 256M</code>
        </p>

        <p>
          Some hosts use <code>.user.ini</code> instead of <code>php.ini</code>. If you are unsure, check your hosting documentation or create a simple PHP info file to see which configuration files PHP is reading. The{' '}
          <a href="https://www.php.net/manual/en/ini.core.php" target="_blank" rel="noopener noreferrer">PHP core ini directives documentation</a>
          {' '}lists all available settings.
        </p>

        <h3>Method 3: .htaccess (Apache servers only)</h3>

        <p>
          If your WordPress site runs on Apache (which most shared hosting uses), you can set the PHP memory limit in your <code>.htaccess</code> file. Add this line:
        </p>

        <p>
          <code>php_value memory_limit 256M</code>
        </p>

        <p>
          Place this line above the WordPress rewrite rules. Note that this only works if your host allows PHP value overrides via <code>.htaccess</code>. Some security-hardened hosts disable this.
        </p>

        <h3>Method 4: Hosting control panel</h3>

        <p>
          Many hosting providers offer a PHP settings page in their control panel (cPanel, Plesk, or a custom dashboard). Look for a &quot;PHP Configuration,&quot; &quot;PHP Settings,&quot; or &quot;MultiPHP INI Editor&quot; section. Change the <code>memory_limit</code> value to 256M or higher.
        </p>

        <p>
          This is the most reliable method because it sets the limit at the server level, where no WordPress setting or plugin can override it. If your hosting provider does not offer this option and the other methods do not work, contact their support and ask them to increase the limit for your account.
        </p>

        <h2>Finding the real culprit</h2>

        <p>
          Increasing the memory limit stops the immediate crash. But if a plugin is consuming 200MB per request, raising the limit to 256MB just buys you time until traffic increases or another plugin pushes you over the new limit. You need to find what is consuming the memory and fix it.
        </p>

        <h3>Check the error message itself</h3>
        <p>
          The fatal error message tells you exactly which file exhausted the memory. If it says <code>/wp-content/plugins/some-plugin/includes/class-import.php</code>, you know which plugin is responsible. If it points to a WordPress core file like <code>class-wpdb.php</code>, the root cause is usually a plugin making an enormous database query.
        </p>

        <h3>Enable WordPress debug logging</h3>
        <p>
          Add these lines to <code>wp-config.php</code>:
        </p>

        <p>
          <code>define(&apos;WP_DEBUG&apos;, true);</code><br />
          <code>define(&apos;WP_DEBUG_LOG&apos;, true);</code><br />
          <code>define(&apos;WP_DEBUG_DISPLAY&apos;, false);</code>
        </p>

        <p>
          This logs all PHP errors and warnings to <code>/wp-content/debug.log</code> without showing them to visitors. Check this file after the memory error occurs — it often shows a trail of warnings leading up to the crash that points to the guilty plugin.
        </p>

        <h3>Deactivate plugins one by one</h3>
        <p>
          The definitive way to find the culprit. Deactivate all plugins, then reactivate them one at a time, loading a page between each activation. When the memory error returns, the last plugin you activated is the problem. This is tedious but reliable.
        </p>

        <h3>Review what you changed recently</h3>
        <p>
          If the error started suddenly, think about what changed. Did you update a plugin? Install a new one? Import a large dataset? Change your theme? The most recent change is almost always the cause.
        </p>

        <h2>How Uptrue catches the crash automatically</h2>

        <p>
          The PHP memory exhausted error manifests as a 500 error or a white screen to your visitors. Both are detectable with the right monitoring setup. <Link href="/signup">Uptrue</Link> catches both within 60 seconds.
        </p>

        <h3>Step 1: Set up an HTTP monitor</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your WordPress site URL</li>
          <li>Set the expected status code to <strong>200</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          When PHP runs out of memory and the server returns a 500 error, the HTTP monitor catches it immediately and alerts you. This is the most common manifestation of the memory error.
        </p>

        <h3>Step 2: Set up a keyword monitor for the white screen</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to your site title or a phrase always present on your homepage</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          Sometimes the memory error does not return a 500 status — it returns a 200 with a blank body (the{' '}
          <Link href="/blog/wordpress-white-screen-of-death">White Screen of Death</Link>
          ). The keyword monitor catches this by checking that your expected content is actually there. If the page is blank, the keyword is missing, and you get alerted.
        </p>

        <h3>Step 3: Monitor your high-memory pages</h3>

        <p>
          The memory error often affects specific pages more than others — pages that load more plugins, process more data, or display more content. Set up additional monitors for:
        </p>

        <ul>
          <li>Your WooCommerce shop page (loads product data)</li>
          <li>Your checkout page (loads payment gateways)</li>
          <li>Your most content-heavy blog post</li>
          <li>Any page with a complex form or interactive element</li>
          <li>Your wp-admin dashboard (often the first to crash)</li>
        </ul>

        <h3>Step 4: Set up alerts that wake you up</h3>

        <p>
          Memory errors can be intermittent — they happen under load and disappear when traffic drops. If you only check email once an hour, you might miss a memory crash that lasted 20 minutes during your busiest traffic period. Configure alerts for immediate delivery:
        </p>

        <ul>
          <li><strong>Slack</strong> — real-time notification in a dedicated channel</li>
          <li><strong>Microsoft Teams</strong> — same concept, different platform</li>
          <li><strong>Webhook</strong> — route to PagerDuty, Opsgenie, or your own alerting system</li>
          <li><strong>Email</strong> — as a backup for less urgent awareness</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site health right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if your site is vulnerable to memory-related outages.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing memory exhaustion long term</h2>

        <p>
          Raising the memory limit and setting up monitoring are the immediate steps. But to prevent the error from recurring, you need to address the underlying causes.
        </p>

        <h3>Audit your plugins ruthlessly</h3>
        <p>
          Deactivate and delete every plugin you are not actively using. Every active plugin consumes memory on every page load, even if it has nothing to do with the page being viewed. If you have 30 active plugins and only use 15 regularly, you are wasting memory on every request.
        </p>

        <h3>Choose lightweight plugin alternatives</h3>
        <p>
          Not all plugins are created equal. A contact form plugin that loads a 5MB JavaScript framework on every page is not the same as one that loads a 20KB script only on the contact page. Research memory usage and performance impact before choosing plugins. <Link href="/tools">Free website analysis tools</Link> can help you measure the impact.
        </p>

        <h3>Optimise your images before uploading</h3>
        <p>
          Compress and resize images before uploading them to WordPress. A 10MB image from your camera does not need to be uploaded at full resolution. Resize to the maximum display size your theme uses (usually 1200px to 2000px wide) and compress it. This reduces the memory needed for WordPress to process and resize the image.
        </p>

        <h3>Process imports in smaller batches</h3>
        <p>
          If you are importing products, posts, or users via CSV, split the file into smaller batches. Instead of importing 10,000 products at once, import 500 at a time. This keeps memory usage per-request well within limits.
        </p>

        <h3>Upgrade your hosting if you are on shared</h3>
        <p>
          Shared hosting with a 40MB memory limit is not designed for a WordPress site with WooCommerce, a page builder, and a dozen plugins. If you are hitting memory limits regularly, it is time to move to managed WordPress hosting or a VPS where you control the memory allocation. The cost difference is usually small compared to the revenue you lose during outages.
        </p>

        <h2>Stop finding out from your customers</h2>

        <p>
          Your WordPress site could be throwing memory errors right now — intermittently, under load, during your busiest traffic hours — and you would not know.
        </p>

        <p>
          The PHP memory exhausted error is one of the most common WordPress crashes and one of the hardest to catch without monitoring. It can manifest as a 500 error, a white screen, or the &quot;critical error&quot; message. It can be intermittent, only appearing under specific conditions or traffic levels.
        </p>

        <p>
          Uptrue monitors your site every 60 seconds with both HTTP and keyword monitoring. Whether the memory crash causes a 500 error or a blank white page, you know about it in under a minute. Fix it before your customers notice. Fix it before Google crawls the broken page. Fix it before you lose another sale.
        </p>

        <div className="blog-cta-section">
          <h3>Catch memory crashes before your visitors do</h3>
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
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
            <li><Link href="/blog/wordpress-white-screen-of-death">WordPress White Screen of Death: How to Detect It Before Your Visitors Do</Link></li>
            <li><Link href="/blog/wordpress-database-connection-error">Error Establishing a Database Connection in WordPress: Complete Fix Guide</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
