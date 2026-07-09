import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Permalink Changes Breaking All URLs: How to Prevent SEO Disaster',
  description:
    'Changing your WordPress permalink structure breaks every URL on your site. Every indexed page returns 404. Every backlink leads nowhere. Every bookmark fails. Learn what causes permalink failures, how to fix them, and how Uptrue HTTP monitoring on multiple pages catches widespread 404 errors before your rankings collapse.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-permalinks-not-working' },
  openGraph: {
    title: 'WordPress Permalink Changes Breaking All URLs: How to Prevent SEO Disaster',
    description:
      'Why WordPress permalink changes break every URL, how to fix them, and how HTTP monitoring across multiple pages catches widespread 404s before Google notices.',
    url: 'https://uptrue.io/blog/wordpress-permalinks-not-working',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Permalink Changes Breaking All URLs: How to Prevent SEO Disaster',
    description:
      'Why WordPress permalink changes break every URL, how to fix them, and how HTTP monitoring across multiple pages catches widespread 404s before Google notices.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why are my WordPress permalinks returning 404?',
    answer:
      'The most common cause is that the .htaccess file does not contain the correct rewrite rules for your permalink structure. This happens when the permalink structure is changed without .htaccess being updated, when .htaccess is deleted or overwritten, when mod_rewrite is disabled on your Apache server, or when WordPress does not have write permission to .htaccess. Go to Settings then Permalinks and click Save Changes to force WordPress to regenerate the rewrite rules. If you use Nginx instead of Apache, you need to add rewrite rules to your Nginx configuration manually because Nginx does not use .htaccess.',
  },
  {
    question: 'What happens to SEO when permalink structure changes?',
    answer:
      'Every URL that Google has indexed becomes invalid. Google crawls those URLs, receives 404 errors, and begins removing them from the search index. All backlinks from other websites point to URLs that no longer exist — the link equity from those backlinks is lost. Internal links between your pages break. Any page bookmarked by users returns a 404. Social media shares link to dead pages. The SEO damage accumulates with every Google crawl cycle. Without 301 redirects from old URLs to new URLs, you can lose months or years of accumulated search authority within days.',
  },
  {
    question: 'How do I fix WordPress permalinks without losing SEO?',
    answer:
      'If you have already changed the permalink structure, change it back to the original structure immediately. If you cannot change it back or if the change was intentional, set up 301 redirects from every old URL pattern to the corresponding new URL. Use a redirect plugin or add rewrite rules to .htaccess. A 301 redirect tells Google the page has permanently moved and transfers most of the link equity to the new URL. Test every redirect to ensure it points to the correct new page. Monitor your Google Search Console for crawl errors over the following weeks to catch any URLs you missed.',
  },
  {
    question: 'Can monitoring detect when WordPress permalinks break?',
    answer:
      'Yes, but only if you monitor more than just your homepage. A permalink change does not break the homepage — it breaks every inner page. If your monitoring only checks the homepage, you will not know anything is wrong. Uptrue lets you monitor multiple URLs across your site. Set up HTTP monitors on your most important pages — your top blog posts, your service pages, your product pages. If the permalink structure changes and those pages start returning 404, Uptrue alerts you immediately. One monitor on your homepage is not enough when the problem affects hundreds of inner pages.',
  },
]

export default function WordPressPermalinksNotWorkingPage(): React.ReactElement {
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
          headline: 'WordPress Permalink Changes Breaking All URLs: How to Prevent SEO Disaster',
          description: 'Why permalink changes break every URL on your WordPress site, how to fix them, and how monitoring multiple pages catches widespread 404 errors.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-29',
          dateModified: '2026-03-29',
          url: 'https://uptrue.io/blog/wordpress-permalinks-not-working',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>29 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Permalink Changes Breaking All URLs: How to Prevent SEO Disaster</h1>
        <p className="blog-article-subtitle">
          Someone changed the permalink structure. Maybe it was you, trying to make your URLs cleaner. Maybe it was a developer who thought &quot;Post name&quot; looked better than &quot;Day and name.&quot; Maybe a plugin reset it during an update. Whatever happened, every single URL on your WordPress site just changed. And every old URL — every Google result, every backlink, every bookmark, every social media share — now returns a 404.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>What WordPress permalinks actually control</h2>

        <p>
          WordPress permalinks define the URL structure of every page and post on your site. When you go to Settings &gt; Permalinks in wp-admin, you are choosing how WordPress translates URLs into database queries. The &quot;Post name&quot; structure turns <code>yourdomain.com/?p=123</code> into <code>yourdomain.com/your-post-title/</code>. The &quot;Day and name&quot; structure turns it into <code>yourdomain.com/2026/05/10/your-post-title/</code>. The &quot;Month and name&quot; structure uses <code>yourdomain.com/2026/05/your-post-title/</code>.
        </p>

        <p>
          Behind the scenes, WordPress writes rewrite rules to your .htaccess file (on Apache servers) that tell the web server how to interpret these URLs. When a visitor requests <code>/your-post-title/</code>, Apache rewrites that to the internal WordPress request, which looks up the post by its slug and serves the content. Without the correct rewrite rules, Apache does not know what to do with the pretty URL and returns a 404.
        </p>

        <p>
          This is why permalink changes are so destructive. Changing the permalink structure changes the rewrite rules. Every URL that was valid under the old structure is invalid under the new one. And WordPress does not create redirects from old URLs to new URLs. It just changes the structure and assumes you know what you are doing.
        </p>

        <h2>How an accidental permalink change destroys your SEO</h2>

        <p>
          Let us say your site has 200 blog posts, 15 service pages, and 30 product pages. Your permalink structure has been &quot;Post name&quot; for three years. Google has indexed all 245 pages. Other websites have linked to your best posts. Social media shares point to specific URLs. Customers have bookmarked your service pages.
        </p>

        <p>
          Now someone changes the permalink structure to &quot;Month and name.&quot; Every URL changes. <code>/best-monitoring-tools/</code> becomes <code>/2024/03/best-monitoring-tools/</code>. The old URL returns a 404. All 245 pages are now serving 404 errors at their indexed URLs.
        </p>

        <p>
          Here is what happens next, day by day:
        </p>

        <h3>Day 1 to 3: Google starts crawling</h3>
        <p>
          Google&apos;s crawler visits your previously indexed URLs on its regular crawl schedule. Each one returns a 404. Google does not immediately remove pages from the index after a single 404 — it recrawls them over the next few days to confirm the 404 is persistent, not temporary. But it starts flagging them in Search Console as crawl errors.
        </p>

        <h3>Day 3 to 7: Rankings start dropping</h3>
        <p>
          Google sees persistent 404 errors on URLs that previously served content. It begins removing these pages from search results. Your organic traffic starts declining. Not all at once — Google processes URLs at different rates. But your highest-traffic pages, which Google crawls most frequently, are the first to disappear from search results.
        </p>

        <h3>Day 7 to 14: Backlink equity evaporates</h3>
        <p>
          Every backlink from another website now points to a 404 page. The link equity — the SEO value that those backlinks passed to your pages — is gone. Google does not transfer link equity from a 404 page to anything. Those backlinks, which may have taken years to earn, are effectively worthless. The pages on other sites still link to you, but the links point to nothing.
        </p>

        <h3>Day 14 to 30: Full deindexing</h3>
        <p>
          By this point, Google has confirmed that hundreds of your pages consistently return 404. They are removed from the search index entirely. Your domain authority drops because Google sees a site with hundreds of broken URLs. New pages may still get indexed, but they are competing without the historical authority that your old pages had built up.
        </p>

        <p>
          The recovery takes months. Even after you fix the issue — either by reverting the permalink structure or by adding 301 redirects — it takes Google weeks to recrawl and reindex everything. And the backlink equity that was lost to 404 errors does not fully recover even with 301 redirects, because there is always some link equity loss in a redirect chain.
        </p>

        <h2>Why .htaccess not updating causes permalink failures</h2>

        <p>
          Sometimes you do not intentionally change your permalink structure. It just stops working. The URLs that were fine yesterday return 404 today. The most common reason: your .htaccess file was overwritten, deleted, or corrupted, and the rewrite rules that make permalinks work are gone.
        </p>

        <p>
          WordPress writes its rewrite rules inside a specific block in .htaccess marked by <code># BEGIN WordPress</code> and <code># END WordPress</code>. If something deletes or overwrites that block — a plugin writing conflicting rules, a hosting provider resetting the file, a file transfer that failed partway — the pretty permalinks stop resolving. The homepage still works (because it does not need a rewrite rule), but every inner page returns 404.
        </p>

        <p>
          The fix is the same as for any .htaccess issue: go to Settings &gt; Permalinks and click Save Changes. WordPress rewrites the rewrite rules. But you need to know this is the problem first — and when every inner page is returning 404, it is not always obvious that a missing .htaccess block is the cause.
        </p>

        <h2>mod_rewrite disabled on your server</h2>

        <p>
          WordPress pretty permalinks require Apache&apos;s <code>mod_rewrite</code> module. On most hosting providers, this module is enabled by default. But some shared hosting providers disable it for performance or security reasons. Some VPS configurations do not have it enabled after initial setup. And some hosting providers disable it during server maintenance and forget to re-enable it.
        </p>

        <p>
          When <code>mod_rewrite</code> is disabled, the rewrite rules in .htaccess are ignored. Apache does not throw an error — it just does not process the rules. The result: every URL except the homepage returns 404. The homepage works because it is the default document. Every other URL relies on rewrite rules to function.
        </p>

        <p>
          To check if <code>mod_rewrite</code> is enabled, create a simple PHP file with <code>&lt;?php phpinfo(); ?&gt;</code> and search the output for <code>mod_rewrite</code> in the loaded modules list. If it is not listed, contact your hosting provider to enable it. On a VPS, you can enable it yourself with <code>a2enmod rewrite</code> and restart Apache.
        </p>

        <h2>Nginx servers and the missing rewrite rules</h2>

        <p>
          If your WordPress site runs on Nginx instead of Apache, .htaccess does not exist and has no effect. Nginx uses its own configuration files for rewrite rules. WordPress cannot automatically write Nginx rewrite rules — you have to add them to your Nginx server block manually.
        </p>

        <p>
          The required Nginx configuration for WordPress pretty permalinks is:
        </p>

        <p>
          <code>location / {'{'} try_files $uri $uri/ /index.php?$args; {'}'}</code>
        </p>

        <p>
          If this rule is missing or incorrect in your Nginx configuration, every inner page returns 404 while the homepage works fine. This commonly happens after a server migration from Apache to Nginx, a hosting provider change, or an Nginx configuration update that overwrites the WordPress rules. The{' '}
          <a href="https://wordpress.org/documentation/" target="_blank" rel="noopener noreferrer">WordPress documentation</a>
          {' '}has the reference configuration for Nginx permalink support.
        </p>

        <h2>How Uptrue catches permalink failures across your entire site</h2>

        <p>
          Here is the problem with monitoring just your homepage: a permalink failure does not break the homepage. The homepage loads perfectly. It is every other page that returns 404. If your monitoring tool only checks <code>yourdomain.com</code>, you will not know that 200 inner pages are all returning 404.
        </p>

        <p>
          <Link href="/signup">Uptrue</Link> lets you monitor multiple URLs across your site. By setting up HTTP monitors on your most important inner pages, you catch permalink failures, .htaccess corruption, and mod_rewrite issues that only affect inner pages. Here is how to set it up.
        </p>

        <h3>Step 1: Identify your most important pages</h3>

        <p>
          Open Google Search Console or your analytics tool. Find the pages that receive the most organic traffic. These are the pages that will hurt the most if they start returning 404. Typically this includes:
        </p>

        <ul>
          <li>Your top 5 to 10 blog posts by organic traffic</li>
          <li>Your main service or product pages</li>
          <li>Your contact page</li>
          <li>Any page that ranks on page 1 of Google for a target keyword</li>
          <li>Any page with significant backlinks from other websites</li>
        </ul>

        <h3>Step 2: Set up HTTP monitors on each page</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter the full URL of one of your important inner pages</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the check interval to <strong>5 minutes</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
          <li>Repeat for each important page</li>
        </ol>

        <p>
          Now if the permalink structure changes, .htaccess is corrupted, or mod_rewrite is disabled, Uptrue detects that these pages are returning 404 instead of 200 and alerts you immediately. You do not find out from a Google Search Console report days later — you know within minutes.
        </p>

        <h3>Step 3: Add keyword monitoring for content verification</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter the URL of your homepage</li>
          <li>Set the keyword to a visible heading or text on the page</li>
          <li>Set alert condition to <strong>keyword NOT found</strong></li>
          <li>Set the interval to <strong>5 minutes</strong></li>
        </ol>

        <p>
          Keyword monitoring on the homepage catches issues that do not cause 404 errors but still break your site — like Elementor failing to render, a theme conflict showing blank content, or a caching issue serving an empty page. Combined with HTTP monitoring on inner pages, you have comprehensive coverage.
        </p>

        <h3>Step 4: Monitor your sitemap URL</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>HTTP/HTTPS</strong></li>
          <li>Enter your sitemap URL: <code>https://yourdomain.com/sitemap.xml</code></li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the interval to <strong>15 minutes</strong></li>
        </ol>

        <p>
          If a permalink change breaks your sitemap or if .htaccess corruption prevents the sitemap from being served, Google cannot discover your new URL structure. Monitoring the sitemap ensures that Google can always find and crawl your pages.
        </p>

        <h3>Step 5: Configure alerts for rapid response</h3>

        <ul>
          <li><strong>Slack</strong> — instant notification when any monitored page returns 404</li>
          <li><strong>Email</strong> — written record of which pages failed and when</li>
          <li><strong>Microsoft Teams</strong> — visibility for the development and SEO team</li>
          <li><strong>Webhook</strong> — trigger automated checks or rollback workflows</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check if your WordPress pages are returning 404</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if your permalink configuration is causing hidden problems.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>How to change permalink structure safely</h2>

        <p>
          If you genuinely need to change your permalink structure — maybe you are migrating from &quot;Day and name&quot; to &quot;Post name&quot; for cleaner URLs — here is how to do it without destroying your SEO.
        </p>

        <h3>Before the change</h3>

        <ol>
          <li>Export a list of all current URLs. Use a crawler like Screaming Frog or your sitemap to get every URL on the site.</li>
          <li>Take a full backup of your database and files.</li>
          <li>Install a redirect plugin like Redirection or Safe Redirect Manager.</li>
          <li>Set up Uptrue monitors on your top 10 pages before making the change, so you have baseline monitoring in place.</li>
        </ol>

        <h3>Make the change</h3>

        <ol>
          <li>Go to Settings &gt; Permalinks and select the new structure.</li>
          <li>Click Save Changes. WordPress updates the rewrite rules in .htaccess.</li>
          <li>Immediately set up 301 redirects from every old URL pattern to the new URL pattern. Most redirect plugins can do pattern-based redirects, so you do not need to create individual redirects for each page.</li>
        </ol>

        <h3>After the change</h3>

        <ol>
          <li>Test a sample of old URLs in your browser. They should redirect to the new URLs with a 301 status code.</li>
          <li>Submit your updated sitemap to Google Search Console.</li>
          <li>Check your Uptrue dashboard — all monitors should be green. If any page returns 404, the redirect for that URL pattern is missing or incorrect.</li>
          <li>Monitor Google Search Console over the next two weeks for crawl errors. Fix any 404s that appear by adding individual redirects for URLs that the pattern-based redirect missed.</li>
        </ol>

        <h2>The plugin that silently resets your permalinks</h2>

        <p>
          Some WordPress plugins modify the permalink structure during activation, deactivation, or update. They register custom post types or taxonomies with custom rewrite rules, and when the plugin changes, the rewrite rules change. Sometimes the plugin flush rewrite rules as part of its setup, and if there is a conflict, it corrupts the existing rules.
        </p>

        <p>
          The worst offenders are plugins that register custom post types without flushing rewrite rules properly. You install the plugin. It works. You update it. The update changes the custom post type slug. The rewrite rules are flushed and regenerated. But the old URLs for the custom post type content now return 404 because the slug changed. And your regular WordPress pages might also be affected if the rewrite rule flush corrupted .htaccess.
        </p>

        <p>
          This is why monitoring inner pages — not just the homepage — is critical. The homepage is almost never affected by permalink or rewrite issues. It is the inner pages, the blog posts, the custom post type archives, and the category pages that break silently.
        </p>

        <h2>Every URL you have ever shared is a contract with your visitors</h2>

        <p>
          When you publish a URL, it is a promise. You are telling Google, other websites, social media platforms, and your users that this URL will serve this content. When you break that URL, you break that promise. Google penalises you for it. Backlinks become worthless. Visitors see error pages. Trust erodes.
        </p>

        <p>
          Uptrue HTTP monitoring on multiple pages across your site ensures you know the moment any of those promises break. Not when Google notices days later. Not when a customer emails you. Not when your organic traffic has already dropped 40%. Within minutes.
        </p>

        <div className="blog-cta-section">
          <h3>Protect every URL on your WordPress site</h3>
          <p>
            Free plan available. HTTP monitoring on multiple pages catches 404 errors that homepage-only monitoring misses. Two-confirmation alerts. Slack, email, and Teams. No credit card required.
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
            <span className="blog-author-name">Uptrue Team</span>
            <span className="blog-author-role">Website Monitoring Platform</span>
          </div>
        </div>

        <div className="blog-related">
          <h3>Related posts</h3>
          <ul>
            <li><Link href="/blog/wordpress-htaccess-error">WordPress .htaccess File Corrupted: How a Single File Takes Down Your Entire Site</Link></li>
            <li><Link href="/blog/wordpress-too-many-redirects">WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever</Link></li>
            <li><Link href="/blog/wordpress-403-forbidden">WordPress 403 Forbidden Error: Why Your Pages Are Blocked and How to Fix It</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
