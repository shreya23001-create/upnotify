import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Mixed Content Errors: Why Your Site Shows \'Not Secure\' After Installing SSL',
  description:
    'You installed an SSL certificate but your browser still shows "Not Secure." Hardcoded HTTP URLs in your database, plugin assets loading over HTTP, CDN misconfigurations, and images with absolute HTTP paths all cause mixed content errors. Learn how to find every mixed content source and how Upnotify SSL and keyword monitoring catches them automatically.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-mixed-content' },
  openGraph: {
    title: 'WordPress Mixed Content Errors: Why Your Site Shows \'Not Secure\' After Installing SSL',
    description:
      'Why your WordPress site still shows "Not Secure" after installing SSL, how to find and fix every mixed content source, and how Upnotify monitoring catches insecure elements automatically.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-mixed-content',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Mixed Content Errors: Why Your Site Shows \'Not Secure\' After Installing SSL',
    description:
      'Why your WordPress site still shows "Not Secure" after installing SSL, how to find and fix every mixed content source, and how Upnotify monitoring catches insecure elements automatically.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is mixed content on a WordPress site?',
    answer:
      'Mixed content occurs when a page loaded over HTTPS includes resources — images, scripts, stylesheets, iframes, or fonts — that are loaded over HTTP. The page itself is encrypted, but the insecure resources create a security gap. Browsers flag this as "Not Secure" because an attacker could intercept or modify the HTTP resources in transit, even though the page itself was loaded securely. There are two types: active mixed content (scripts, iframes, stylesheets) which browsers block entirely, and passive mixed content (images, audio, video) which browsers may load but flag with a warning.',
  },
  {
    question: 'Why does my WordPress site show "Not Secure" after installing SSL?',
    answer:
      'Installing an SSL certificate only encrypts the connection between the browser and your server. It does not automatically update the URLs of every resource your site loads. If your WordPress database contains hardcoded http:// URLs in post content, widget text, theme options, or plugin settings, those resources will still load over HTTP. Similarly, plugins that enqueue scripts or stylesheets using http:// URLs, CDN configurations that have not been updated to HTTPS, and images inserted with absolute HTTP paths all cause mixed content warnings even though your SSL certificate is valid and active.',
  },
  {
    question: 'Does mixed content affect SEO?',
    answer:
      'Yes. Google has used HTTPS as a ranking signal since 2014 and Chrome marks pages with mixed content as "Not Secure" in the address bar. Pages that trigger mixed content warnings may receive lower trust signals from Google. Active mixed content that browsers block can also break page functionality — missing scripts can prevent forms, navigation, and interactive elements from working. If Google crawls a page where critical scripts are blocked due to mixed content, the page may be indexed without important content, affecting both rankings and how the page appears in search results.',
  },
  {
    question: 'Can Upnotify detect mixed content errors on my WordPress site?',
    answer:
      'Yes. Upnotify offers two monitoring approaches that catch mixed content issues. The SSL monitor validates your certificate and detects configuration problems that contribute to mixed content warnings. The keyword monitor can check your pages for the presence of "not secure" indicators or verify that specific secure elements are loading correctly. Combined, these monitors alert you within 60 seconds if a plugin update, content change, or CDN misconfiguration reintroduces mixed content on any monitored page.',
  },
]

export default function WordPressMixedContentPage(): React.ReactElement {
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
          headline: 'WordPress Mixed Content Errors: Why Your Site Shows \'Not Secure\' After Installing SSL',
          description: 'Why your WordPress site still shows "Not Secure" after installing SSL, how to find and fix every mixed content source, and how Upnotify monitoring catches insecure elements automatically.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-04-04',
          dateModified: '2026-04-04',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-mixed-content',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>4 April 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Mixed Content Errors: Why Your Site Shows &quot;Not Secure&quot; After Installing SSL</h1>
        <p className="blog-article-subtitle">
          You paid for the SSL certificate. You installed it. You confirmed the padlock appears. Then you check another page on your site and the browser says &quot;Not Secure.&quot; You did everything right and your site is still flagged as insecure.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The padlock that disappears on certain pages</h2>

        <p>
          You migrated your WordPress site from HTTP to HTTPS. The homepage loads with a padlock. Your login page shows the padlock. But then you open a blog post you published two years ago and the padlock is gone. The browser address bar says &quot;Not Secure.&quot; You check another page — same thing. Some pages are secure, some are not.
        </p>

        <p>
          Your visitors see it too. They land on a page, see the &quot;Not Secure&quot; warning, and leave. If you run a WooCommerce store, customers see the warning on product pages or at checkout and abandon their cart. They do not investigate why the warning appears. They do not check whether the payment form is actually secure. They see &quot;Not Secure&quot; and they go to a competitor.
        </p>

        <p>
          The SSL certificate is not the problem. The certificate is valid, installed correctly, and working. The problem is <strong>mixed content</strong> — your page loads over HTTPS but some resources on the page are still loading over HTTP. One insecure image, one HTTP script, one unencrypted stylesheet is enough to strip the padlock from the address bar.
        </p>

        <p>
          And here is the part that makes mixed content particularly dangerous: you cannot see it by glancing at your site. The page looks normal. The images load. The layout is fine. Everything appears to work. But the browser knows that some resources came over an unencrypted connection, and it warns your visitors accordingly.
        </p>

        <h2>What causes mixed content on WordPress sites</h2>

        <p>
          Mixed content is not a single problem — it is usually five or six problems layered on top of each other. Each one has a different source and requires a different fix. Missing any one of them means the &quot;Not Secure&quot; warning persists.
        </p>

        <h3>1. Hardcoded HTTP URLs in the WordPress database</h3>

        <p>
          This is the most common cause and the hardest to find manually. Every time you inserted an image into a post, added a link, configured a widget, or saved a page with the visual editor, WordPress stored the full URL in the database. If your site was running on HTTP at the time, every one of those URLs starts with <code>http://</code>.
        </p>

        <p>
          Installing an SSL certificate does not update the database. Your posts, pages, custom fields, widget settings, theme options, and plugin configurations all still contain <code>http://yourdomain.com</code> URLs. Every image in every old blog post loads over HTTP. Every internal link points to the HTTP version. Every embedded video, every PDF link, every custom field with a URL — all HTTP.
        </p>

        <p>
          On a site with hundreds of posts, there can be thousands of hardcoded HTTP URLs scattered across dozens of database tables. You cannot fix them one by one from the WordPress editor. You need a database-wide search and replace.
        </p>

        <h3>2. Plugin assets loading over HTTP</h3>

        <p>
          WordPress plugins enqueue their JavaScript and CSS files using <code>wp_enqueue_script()</code> and <code>wp_enqueue_style()</code>. Well-written plugins use protocol-relative URLs or WordPress functions that automatically use the correct protocol. Poorly written plugins hardcode <code>http://</code> in their asset URLs.
        </p>

        <p>
          When a plugin loads its stylesheet from <code>http://yourdomain.com/wp-content/plugins/some-plugin/style.css</code>, browsers classify this as active mixed content and block it entirely. The stylesheet does not load. The plugin&apos;s visual elements break. And the &quot;Not Secure&quot; warning appears.
        </p>

        <p>
          This is particularly common with older plugins, free plugins with infrequent updates, and premium plugins purchased from third-party marketplaces outside the official WordPress repository. The plugin works perfectly on HTTP — you only discover the mixed content issue after migrating to HTTPS.
        </p>

        <h3>3. CDN still serving assets over HTTP</h3>

        <p>
          If you use a CDN — Cloudflare, StackPath, KeyCDN, BunnyCDN, or any other — the CDN has its own SSL configuration. Installing SSL on your origin server does not automatically configure SSL on the CDN. If your CDN is set up to pull assets from your origin over HTTP, or if the CDN URLs in your WordPress configuration use <code>http://</code>, every asset served through the CDN triggers a mixed content warning.
        </p>

        <p>
          CDN plugins like CDN Enabler or W3 Total Cache store the CDN URL in their settings. If you configured the CDN before migrating to HTTPS, the stored URL is <code>http://cdn.yourdomain.com</code>. Every image, script, and stylesheet rewritten by the CDN plugin points to the HTTP version of the CDN.
        </p>

        <h3>4. Images with absolute HTTP paths in post content</h3>

        <p>
          WordPress stores image URLs as absolute paths in the <code>wp_posts</code> table. When you insert an image into a post, the HTML stored in the database looks like: <code>&lt;img src=&quot;http://yourdomain.com/wp-content/uploads/2024/03/photo.jpg&quot;&gt;</code>. That <code>http://</code> prefix stays in the database forever unless you explicitly change it.
        </p>

        <p>
          This affects every image inserted before the HTTPS migration — featured images, inline images in post content, gallery images, images in page builder elements, and background images set through custom fields. On a site that has been publishing content for years, there can be thousands of these references.
        </p>

        <h3>5. Theme hardcoding HTTP resources</h3>

        <p>
          Some WordPress themes hardcode URLs for fonts, icon libraries, or external resources directly in their template files or theme options. A theme that loads Google Fonts via <code>http://fonts.googleapis.com</code> instead of <code>https://</code> or a protocol-relative URL causes mixed content on every page that uses the font.
        </p>

        <p>
          Custom themes built by agencies or freelancers are especially prone to this. The developer built the theme when the site was on HTTP and hardcoded URLs throughout. Logo images, background images, and external script includes can all contain HTTP paths buried in theme files or stored in theme option values in the database.
        </p>

        <h3>6. External embeds and iframes using HTTP</h3>

        <p>
          Embedded content from third-party services — YouTube videos, Google Maps, social media widgets, advertising scripts, analytics pixels — can trigger mixed content if the embed code uses HTTP. Older embed codes copied from third-party services years ago may use <code>http://</code> even though the service now supports HTTPS.
        </p>

        <p>
          This is common in posts that embed content from smaller services or legacy platforms that were slower to adopt HTTPS. The embed works and displays correctly, but the HTTP iframe or script triggers the mixed content warning.
        </p>

        <h2>How to find every mixed content source on your site</h2>

        <h3>Method 1: Browser developer console</h3>

        <p>
          Open your site in Chrome, press <code>F12</code> to open Developer Tools, and click the Console tab. Mixed content warnings appear as yellow warnings with the prefix &quot;Mixed Content.&quot; Each warning shows the specific URL that is loading over HTTP. Check multiple pages — mixed content can vary from page to page depending on which images and resources each page loads.
        </p>

        <p>
          The limitation of this method is that you have to manually visit every page. On a site with hundreds of pages, this is impractical. You will find the mixed content on the pages you check and miss it on the pages you do not.
        </p>

        <h3>Method 2: Search your database for HTTP URLs</h3>

        <p>
          Connect to your WordPress database using phpMyAdmin, Adminer, or the command line. Run this query:
        </p>

        <p>
          <code>SELECT * FROM wp_posts WHERE post_content LIKE &apos;%http://yourdomain.com%&apos;;</code>
        </p>

        <p>
          Replace <code>yourdomain.com</code> with your actual domain and <code>wp_</code> with your table prefix. This shows every post and page that contains a hardcoded HTTP URL. Check <code>wp_options</code>, <code>wp_postmeta</code>, and <code>wp_termmeta</code> tables as well — plugins and themes store URLs throughout the database.
        </p>

        <h3>Method 3: Use the Better Search Replace plugin</h3>

        <p>
          Install the{' '}
          <a href="https://wordpress.org/plugins/better-search-replace/" target="_blank" rel="noopener noreferrer">Better Search Replace</a>{' '}
          plugin from the WordPress repository. In the plugin settings:
        </p>

        <ol>
          <li>Set &quot;Search for&quot; to <code>http://yourdomain.com</code></li>
          <li>Set &quot;Replace with&quot; to <code>https://yourdomain.com</code></li>
          <li>Select all database tables</li>
          <li>Check &quot;Run as dry run&quot; first to see what will change</li>
          <li>Review the results — make sure the count looks reasonable</li>
          <li>Uncheck &quot;Run as dry run&quot; and run the replacement</li>
        </ol>

        <p>
          This handles the database-wide replacement in one operation. It correctly handles serialised data in WordPress options and postmeta tables, which a simple SQL REPLACE command would corrupt.
        </p>

        <h2>How to fix each mixed content source</h2>

        <h3>Fix 1: Database search and replace for hardcoded URLs</h3>

        <p>
          Use Better Search Replace or WP-CLI to replace all instances of <code>http://yourdomain.com</code> with <code>https://yourdomain.com</code> across all database tables. If you also have <code>http://www.yourdomain.com</code> references, run a second replacement for that variant. Always back up your database before running the replacement.
        </p>

        <p>
          With WP-CLI, the command is: <code>wp search-replace &apos;http://yourdomain.com&apos; &apos;https://yourdomain.com&apos; --all-tables</code>
        </p>

        <h3>Fix 2: Update plugin and theme settings</h3>

        <p>
          After the database replacement, check each plugin&apos;s settings page. Some plugins store URLs in their own settings format that the search and replace might not catch. CDN plugins, caching plugins, and SEO plugins often have URL fields that need manual updating. Check your theme&apos;s customiser settings, logo upload, and any custom URL fields.
        </p>

        <h3>Fix 3: Update your CDN configuration</h3>

        <p>
          Log into your CDN provider&apos;s dashboard and verify that the origin URL uses HTTPS. Update any CDN URLs stored in WordPress plugins or theme settings to use <code>https://</code>. If you use Cloudflare, set the SSL mode to &quot;Full (strict)&quot; and enable &quot;Always Use HTTPS&quot; — but be aware that the latter can cause issues with Let&apos;s Encrypt renewal as described in our{' '}
          <Link href="/blog/wordpress-ssl-expired">SSL certificate expiry guide</Link>.
        </p>

        <h3>Fix 4: Force HTTPS redirects at the server level</h3>

        <p>
          Add an HTTP to HTTPS redirect in your <code>.htaccess</code> file or server configuration. This ensures that any remaining HTTP URLs in your content automatically redirect to HTTPS. While this does not fix the mixed content warning itself — the browser flags the initial HTTP request before the redirect — it prevents any insecure content from actually loading over HTTP.
        </p>

        <p>
          For Apache, add to your .htaccess:
        </p>

        <p>
          <code>RewriteEngine On</code><br />
          <code>RewriteCond %&#123;HTTPS&#125; off</code><br />
          <code>RewriteRule ^(.*)$ https://%&#123;HTTP_HOST&#125;%&#123;REQUEST_URI&#125; [L,R=301]</code>
        </p>

        <h3>Fix 5: Update WordPress and Site URL settings</h3>

        <p>
          In WordPress admin, go to Settings &gt; General. Make sure both &quot;WordPress Address (URL)&quot; and &quot;Site Address (URL)&quot; use <code>https://</code>. If these are still set to HTTP, WordPress generates HTTP URLs for all internal links, asset paths, and canonical URLs. This single setting affects hundreds of URLs across your site.
        </p>

        <h3>Fix 6: Check and update external embeds</h3>

        <p>
          Search your post content for <code>http://</code> references to external services. Update YouTube embeds, Google Maps iframes, social media widgets, and any other third-party embeds to use <code>https://</code>. Most major services have supported HTTPS for years — changing the protocol in the embed code is usually all that is needed.
        </p>

        <p>
          The{' '}
          <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content" target="_blank" rel="noopener noreferrer">Mozilla Developer Network mixed content documentation</a>{' '}
          provides a comprehensive reference on how browsers handle different types of mixed content and which resources are blocked versus warned.
        </p>

        <h2>How to detect mixed content automatically with Upnotify</h2>

        <p>
          Fixing mixed content once is relatively straightforward. The real challenge is keeping it fixed. A plugin update can reintroduce HTTP asset URLs. A content editor can paste an HTTP image link into a post. A CDN configuration change can revert to HTTP. A theme update can reset a hardcoded URL.
        </p>

        <p>
          <Link href="/signup">Upnotify&apos;s monitoring</Link> catches these regressions automatically, so you do not discover them from a customer complaint or a Google ranking drop.
        </p>

        <h3>Step 1: Set up an SSL monitor for your domain</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>SSL Certificate</strong> as the monitor type</li>
          <li>Enter your domain name</li>
          <li>Set the check interval to <strong>every hour</strong></li>
          <li>Configure alert channels — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          The SSL monitor validates your certificate configuration and detects issues that contribute to mixed content warnings — certificate chain problems, protocol mismatches, and configuration errors that cause browsers to flag your site as insecure.
        </p>

        <h3>Step 2: Add keyword monitors for critical pages</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter the URL of a critical page — homepage, checkout, contact</li>
          <li>Set the keyword to a phrase that always appears when the page loads correctly — your site title, a heading, or a product name</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          When active mixed content is blocked by the browser, page elements that depend on those scripts or stylesheets break. If a critical script is blocked, interactive elements stop working and the page may render differently. The keyword monitor detects when the expected content is missing — catching the downstream effects of mixed content blocking.
        </p>

        <h3>Step 3: Monitor your WooCommerce checkout</h3>

        <p>
          If you run WooCommerce, the checkout page is the most sensitive to mixed content. A single insecure resource can trigger the &quot;Not Secure&quot; warning on the page where customers enter their payment details. Set up a separate HTTP monitor for your checkout URL with a 1-minute interval. Any SSL or mixed content issue that affects checkout needs to be caught immediately.
        </p>

        <h3>Step 4: Set up alerts that reach you before customers complain</h3>

        <ul>
          <li><strong>Slack</strong> — immediate notification in your ops channel</li>
          <li><strong>Microsoft Teams</strong> — for teams using Microsoft tools</li>
          <li><strong>Email</strong> — as a backup alert trail</li>
          <li><strong>Webhook</strong> — to integrate with PagerDuty, Opsgenie, or your incident management system</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your site for SSL issues right now</h3>
          <p>
            Instant scan showing your certificate status, chain validation, and configuration issues. Free, no signup required.
          </p>
          <Link href="/tools/ssl-checker" className="btn btn-primary btn-lg">
            Free SSL Checker
          </Link>
        </div>

        <h2>Preventing mixed content from coming back</h2>

        <p>
          Mixed content is not a one-time fix. It is an ongoing risk that can be reintroduced by any content change, plugin update, or configuration modification. These practices reduce the chances of recurrence.
        </p>

        <h3>Use relative URLs or protocol-relative URLs where possible</h3>
        <p>
          When adding links or images manually, use relative URLs (<code>/wp-content/uploads/image.jpg</code>) instead of absolute URLs. This avoids the HTTP vs HTTPS problem entirely because the browser automatically uses the protocol of the current page.
        </p>

        <h3>Set the Content-Security-Policy header</h3>
        <p>
          The <code>Content-Security-Policy: upgrade-insecure-requests</code> header tells browsers to automatically upgrade HTTP resource requests to HTTPS. This acts as a safety net — if an HTTP URL slips through, the browser upgrades it to HTTPS before making the request. Add this header in your web server configuration or via a WordPress security plugin.
        </p>

        <h3>Audit after every plugin and theme update</h3>
        <p>
          Plugin and theme updates can reintroduce hardcoded HTTP URLs in their settings or asset files. After updating any plugin or theme, check the browser console on a few key pages for new mixed content warnings. Better yet, rely on Upnotify&apos;s monitoring to alert you automatically if an update reintroduces insecure resources.
        </p>

        <h3>Train content editors to use HTTPS URLs</h3>
        <p>
          If you have multiple people editing content on your WordPress site, make sure they understand that all URLs pasted into posts must use <code>https://</code>. This includes image URLs from external sources, embed codes, and links to documents. One HTTP URL in one post is enough to strip the padlock from that page.
        </p>

        <p>
          The{' '}
          <a href="https://wordpress.org/documentation/article/why-should-i-use-https/" target="_blank" rel="noopener noreferrer">WordPress documentation on HTTPS</a>{' '}
          provides additional context on configuring WordPress for secure connections and avoiding common HTTPS issues.
        </p>

        <h2>Stop losing trust over insecure resources you cannot see</h2>

        <p>
          Mixed content is invisible to you when you are browsing your own site. Your browser might have cached the secure version. You might be checking the homepage while the problem is on a product page. You might have fixed the database URLs but missed a plugin setting. The &quot;Not Secure&quot; warning only appears for some visitors on some pages — and they leave without telling you.
        </p>

        <p>
          Upnotify monitors your SSL configuration continuously and checks your critical pages every minute. When a plugin update, content change, or CDN misconfiguration reintroduces mixed content, you get alerted before your visitors see the warning. You fix it in minutes instead of losing traffic for days.
        </p>

        <p>
          Set up SSL and keyword monitoring now. The next plugin update could reintroduce the problem you already fixed.
        </p>

        <div className="blog-cta-section">
          <h3>Catch mixed content before your visitors do</h3>
          <p>
            Free plan available. SSL monitoring, keyword monitoring, and AI-powered reports. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/tools/ssl-checker" className="btn btn-primary btn-lg">
              Check Your SSL Free
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
            <li><Link href="/blog/wordpress-ssl-expired">WordPress SSL Certificate Expired? Here&apos;s How to Never Let It Happen Again</Link></li>
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</Link></li>
            <li><Link href="/blog/wordpress-too-many-redirects">WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
