import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don\'t Even Know',
  description:
    'The Japanese keyword hack injects thousands of spam pages into your WordPress site that only appear in Google search results. You cannot see them from wp-admin. Learn how it works, how to detect it, and how keyword monitoring catches what you cannot see.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-japanese-keyword-hack' },
  openGraph: {
    title: 'Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don\'t Even Know',
    description:
      'How the Japanese keyword hack works, why you cannot see it from wp-admin, how to clean your site, and how Upnotify keyword monitoring detects Japanese characters on English pages automatically.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-japanese-keyword-hack',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don\'t Even Know',
    description:
      'How the Japanese keyword hack works, why you cannot see it from wp-admin, how to clean your site, and how Upnotify keyword monitoring detects Japanese characters on English pages automatically.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is the Japanese keyword hack on WordPress?',
    answer:
      'The Japanese keyword hack is a type of SEO spam attack where hackers inject thousands of pages with Japanese text into your WordPress site. These pages are designed to rank in Google for Japanese search queries — typically for counterfeit luxury goods, pharmaceuticals, or gambling sites. The pages generate affiliate revenue for the attacker through redirects to spam stores. The hack is cloaked so that you cannot see the spam pages from wp-admin or when browsing your site — they only appear in Google search results.',
  },
  {
    question: 'How do I know if my site has the Japanese keyword hack?',
    answer:
      'The easiest way to check is to search Google for: site:yourdomain.com. If you see pages with Japanese characters in the titles and descriptions that you did not create, your site is hacked. You can also check Google Search Console for a sudden spike in indexed pages or for pages with Japanese text in the Coverage or Performance reports. The hack is invisible from wp-admin because it uses cloaking — it shows spam content to search engine crawlers but normal content to logged-in administrators.',
  },
  {
    question: 'Can uptime monitoring detect the Japanese keyword hack?',
    answer:
      'Standard HTTP uptime monitoring will not detect this hack because the server continues to return 200 OK responses. The hack is specifically designed to be invisible to normal visitors and site administrators. However, keyword monitoring can detect it. By setting up a monitor that checks for Japanese characters on your English-language pages, or that verifies your expected content is present and unmodified, you can catch the hack when the cloaking fails or when spam content bleeds into your normal pages.',
  },
  {
    question: 'How do I remove the Japanese keyword hack from WordPress?',
    answer:
      'Start by making a full backup. Then remove any unrecognised admin accounts from Users. Check for and delete any unfamiliar plugins or themes. Scan all files for recently modified PHP files, especially in wp-includes and wp-content. Look for base64-encoded content and eval() calls in theme and plugin files. Reset your .htaccess to the WordPress default. Resubmit a clean sitemap in Google Search Console and request removal of the spam URLs. After cleaning, change all passwords — WordPress admin, FTP, database, and hosting panel. Install a reputable security plugin and enable two-factor authentication.',
  },
]

export default function WordPressJapaneseKeywordHackPage(): React.ReactElement {
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
          headline: 'Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don\'t Even Know',
          description: 'How the Japanese keyword hack works, why you cannot see it from wp-admin, how to clean your site, and how keyword monitoring detects Japanese characters on English pages.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-22',
          dateModified: '2026-03-22',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-japanese-keyword-hack',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>22 March 2026</span>
          <span>15 min read</span>
        </div>
        <h1 className="blog-article-title">Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don&apos;t Even Know</h1>
        <p className="blog-article-subtitle">
          You search your own domain on Google and see pages you never created. The titles are in Japanese. The descriptions advertise handbags and watches. And somehow, these pages are indexed under your domain name.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>Your site looks fine. Google tells a different story.</h2>

        <p>
          Log into WordPress. Check your pages. Check your posts. Everything is exactly as you left it. Your homepage loads correctly. Your contact form works. Your blog posts are intact. There is absolutely no sign that anything is wrong.
        </p>

        <p>
          Now open Google and type <code>site:yourdomain.com</code>. Scroll past your normal pages. And then you see them. Hundreds — sometimes thousands — of pages you never created. The titles are in Japanese. The URLs contain random strings or are nested deep in subdirectories you did not create. The descriptions reference counterfeit designer goods, gambling sites, or pharmaceutical spam.
        </p>

        <p>
          This is the Japanese keyword hack. And it is one of the most damaging attacks a WordPress site can suffer, because it specifically targets the one thing you cannot easily monitor from inside your own dashboard: how your site appears in search results.
        </p>

        <p>
          The hacker is not interested in your site itself. They do not want your data, your customer list, or your content. They want your domain authority. They are using the trust that Google places in your domain to rank their spam pages. Every day those pages stay indexed, your domain reputation takes damage. And you have no idea it is happening.
        </p>

        <h2>How the Japanese keyword hack actually works</h2>

        <p>
          This is not a simple defacement where someone replaces your homepage with a message. The Japanese keyword hack is sophisticated, deliberate, and designed to stay hidden for as long as possible.
        </p>

        <h3>Stage 1: Getting in</h3>

        <p>
          The attackers need a way into your WordPress installation. The most common entry points are:
        </p>

        <ul>
          <li><strong>Vulnerable plugins:</strong> Plugins with known security vulnerabilities that have not been patched. The attacker scans thousands of sites for specific plugin versions with known exploits. If you are running an outdated version of a popular plugin, your site is a target.</li>
          <li><strong>Weak passwords:</strong> Brute-force attacks against wp-login.php using common passwords. If your admin password is &quot;admin123&quot; or &quot;password1&quot; or your business name followed by a year, automated tools will crack it in minutes.</li>
          <li><strong>Vulnerable themes:</strong> Themes from untrusted sources — especially nulled (pirated) premium themes — often contain built-in backdoors. The theme works fine, but it also gives the attacker remote access to your file system.</li>
          <li><strong>Compromised hosting accounts:</strong> If another site on the same shared hosting is compromised, the attacker can sometimes pivot to your site through shared server resources.</li>
        </ul>

        <h3>Stage 2: Installing the payload</h3>

        <p>
          Once inside, the attacker does not modify your existing pages. Instead, they:
        </p>

        <ul>
          <li>Add themselves as a hidden admin user (often with a legitimate-looking username)</li>
          <li>Install PHP backdoor files in locations you rarely check — deep inside <code>/wp-includes/</code>, <code>/wp-content/uploads/</code>, or disguised as legitimate plugin files</li>
          <li>Modify your <code>.htaccess</code> file to create URL rewrite rules that serve spam content for specific URL patterns</li>
          <li>Generate a sitemap containing thousands of spam URLs and submit it to{' '}
            <a href="https://search.google.com/search-console/about" target="_blank" rel="noopener noreferrer">Google Search Console</a>
            {' '}(if they also gained Search Console access through a verification file or meta tag)
          </li>
        </ul>

        <h3>Stage 3: Cloaking — why you cannot see it</h3>

        <p>
          This is the key to the hack&apos;s longevity. The injected code checks who is making the request before deciding what to show:
        </p>

        <ul>
          <li><strong>If the visitor is a search engine crawler</strong> (identified by user agent string) — serve the Japanese spam content</li>
          <li><strong>If the visitor is a logged-in WordPress admin</strong> — serve the normal page, as if nothing is wrong</li>
          <li><strong>If the visitor is a regular user</strong> — sometimes serve a redirect to a spam store, sometimes serve the normal page</li>
        </ul>

        <p>
          This cloaking means you can browse your entire site, logged in as admin, and see nothing unusual. Your pages look normal. Your posts look normal. The spam content only appears when Google&apos;s crawler visits — which is exactly why it ends up in search results but not in your browser.
        </p>

        <p>
          The attackers know that most WordPress site owners never search <code>site:theirdomain.com</code> on Google. They know most site owners do not regularly check Google Search Console. And they know that by the time the hack is discovered, it has often been running for weeks or months.
        </p>

        <h2>The real damage: it is not just spam pages</h2>

        <p>
          The visible damage is thousands of spam pages indexed under your domain. But the deeper damage is to your domain&apos;s reputation.
        </p>

        <p>
          <strong>Google penalises your entire domain.</strong> When Google detects spam content on your site — and it will eventually — it can apply a manual action that suppresses all of your pages in search results. Not just the spam pages. Your legitimate blog posts, your product pages, your homepage — everything drops. Recovering from a manual action takes weeks even after you have cleaned the hack and submitted a reconsideration request.
        </p>

        <p>
          <strong>Your brand reputation takes a hit.</strong> A potential customer searches your business name and sees Japanese spam in the results alongside your real pages. They do not know what a Japanese keyword hack is. They just think your site is dodgy, unprofessional, or compromised. And they are right about the last part.
        </p>

        <p>
          <strong>Backdoors persist after cleaning.</strong> The attacker almost certainly installed multiple backdoors. If you clean the visible spam but miss a single backdoor file, they get back in within days and the whole cycle starts again. This is why thorough cleaning is critical, and why monitoring for reinfection is just as important as the initial cleanup.
        </p>

        <h2>How to check if your site is infected right now</h2>

        <h3>Google site: search</h3>
        <p>
          Open Google and search for <code>site:yourdomain.com</code>. Look through all the results. If you see pages with Japanese characters (or any language you do not publish in), your site is compromised. Also try <code>site:yourdomain.com intitle:cheap</code> or <code>site:yourdomain.com intitle:buy</code> — common words used in the spam pages.
        </p>

        <h3>Google Search Console</h3>
        <p>
          Log into{' '}
          <a href="https://search.google.com/search-console/about" target="_blank" rel="noopener noreferrer">Google Search Console</a>
          {' '}and check: the Coverage report for a sudden spike in indexed pages, the Performance report for impressions on queries you did not target (especially Japanese queries), the Security Issues section for any manual actions or detected hacks, and the Sitemaps section for sitemaps you did not submit.
        </p>

        <h3>File system inspection</h3>
        <p>
          Connect via SSH or FTP and look for recently modified files. Run <code>find /path/to/wordpress -name &quot;*.php&quot; -mtime -7</code> to find PHP files modified in the last seven days. Look for files with suspicious names in <code>/wp-includes/</code> and <code>/wp-content/uploads/</code>. Open suspicious files and search for <code>base64_decode</code>, <code>eval(</code>, <code>gzinflate</code>, and <code>str_rot13</code> — these are common obfuscation techniques used in malware.
        </p>

        <h3>Check your .htaccess</h3>
        <p>
          Download your <code>.htaccess</code> file and review it line by line. The hack typically adds rewrite rules that intercept requests from search engine crawlers and serve spam content. If you see rules referencing user agents like Googlebot, or conditions that check the HTTP referer for search engine domains, those are almost certainly part of the hack.
        </p>

        <h2>How to clean the Japanese keyword hack</h2>

        <p>
          Cleaning this hack requires thoroughness. Miss one backdoor and the attacker returns within days. Follow every step.
        </p>

        <h3>Step 1: Take a full backup first</h3>
        <p>
          Before you change anything, back up your entire site — files and database. If something goes wrong during cleaning, you need to be able to restore. Store the backup off-server.
        </p>

        <h3>Step 2: Remove unknown admin users</h3>
        <p>
          Go to Users in wp-admin and look for any admin accounts you do not recognise. The attacker often creates an account with a normal-looking username. Delete any user you did not create. Also check the database directly — query the <code>wp_users</code> and <code>wp_usermeta</code> tables for users with the <code>administrator</code> role.
        </p>

        <h3>Step 3: Remove backdoor files</h3>
        <p>
          Search your file system for recently modified or suspicious PHP files. Common locations for backdoors include <code>/wp-includes/</code> (look for files that do not belong in a standard WordPress installation), <code>/wp-content/uploads/</code> (PHP files should never be in the uploads directory), and inside plugin directories (extra files that are not part of the original plugin). Delete or replace any modified core files with fresh copies from{' '}
          <a href="https://wordpress.org/download/" target="_blank" rel="noopener noreferrer">wordpress.org</a>.
        </p>

        <h3>Step 4: Clean your .htaccess</h3>
        <p>
          Replace your .htaccess with the default WordPress rules. If you had custom rules (caching, security, redirects), add them back one at a time, verifying each one is legitimate.
        </p>

        <h3>Step 5: Reset all credentials</h3>
        <p>
          Change every password: WordPress admin password, FTP password, database password (and update wp-config.php to match), hosting control panel password. Generate new WordPress security salts from the{' '}
          <a href="https://api.wordpress.org/secret-key/1.1/salt/" target="_blank" rel="noopener noreferrer">WordPress salt generator</a>
          {' '}and replace the old ones in wp-config.php. This invalidates all existing sessions.
        </p>

        <h3>Step 6: Update everything</h3>
        <p>
          Update WordPress core, all plugins, and all themes to the latest versions. Delete any plugins or themes you are not actively using — they are attack surface with no benefit.
        </p>

        <h3>Step 7: Clean up in Google Search Console</h3>
        <p>
          Submit a clean sitemap. Use the URL Removal tool to request removal of the spam URLs. If you have a manual action, submit a reconsideration request explaining what you found and what you did to fix it. Google&apos;s review can take days to weeks. Refer to the{' '}
          <a href="https://developers.google.com/search/docs/monitor-debug/security/hacked-site" target="_blank" rel="noopener noreferrer">Google hacked site documentation</a>
          {' '}for the full reconsideration process.
        </p>

        <h3>Step 8: Harden your site</h3>
        <p>
          Install a reputable security plugin (Wordfence or Sucuri). Enable two-factor authentication for all admin accounts. Disable the WordPress file editor. Set correct file permissions. Consider a web application firewall. These measures do not just protect against reinfection — they prevent the initial compromise from happening again.
        </p>

        <h2>How Upnotify keyword monitoring detects the hack</h2>

        <p>
          The Japanese keyword hack is designed to be invisible to site owners. But <Link href="/signup">Upnotify&apos;s keyword monitoring</Link> can catch the signs that human eyes miss.
        </p>

        <h3>Step 1: Monitor for unexpected Japanese characters</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to common Japanese characters that should never appear on your English-language site</li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          While the hack uses cloaking to hide from admins, cloaking is not perfect. It can fail, show partial content to non-crawlers, or leak spam content into page elements like meta tags, sitemaps, or JavaScript-rendered sections. When it does, keyword monitoring catches it.
        </p>

        <h3>Step 2: Monitor your expected content is intact</h3>

        <ol>
          <li>Add another <strong>Keyword</strong> monitor for your homepage</li>
          <li>Set the keyword to your site name, tagline, or a phrase that always appears on your homepage</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          If the hack modifies your homepage content, replaces your meta tags, or breaks your page in any way, this monitor detects the change. It is a safety net that catches not just the Japanese keyword hack but any form of content injection or defacement.
        </p>

        <h3>Step 3: Monitor multiple pages across your site</h3>

        <p>
          The hack typically creates new URLs rather than modifying existing ones, but it can also inject content into existing pages — especially through modified theme files or plugin output. Monitor your most important pages:
        </p>

        <ul>
          <li>Homepage</li>
          <li>Top landing pages by organic traffic</li>
          <li>Contact and conversion pages</li>
          <li>Blog post pages</li>
        </ul>

        <h3>Step 4: Set up alerts that wake you up</h3>

        <p>
          The Japanese keyword hack does its damage over time. Every day it runs, more spam pages get indexed and your domain reputation degrades further. Fast detection means fast cleanup means less long-term damage.
        </p>

        <ul>
          <li><strong>Slack</strong> — instant alert in a dedicated security channel</li>
          <li><strong>Microsoft Teams</strong> — immediate visibility for your team</li>
          <li><strong>Email</strong> — backup notification with a written record</li>
          <li><strong>Webhook</strong> — trigger automated incident response workflows</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check if your WordPress site has been compromised</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and content integrity. Catch hacks before Google does.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing the Japanese keyword hack</h2>

        <h3>Keep everything updated</h3>
        <p>
          The number one entry point is vulnerable plugins. Update WordPress core, plugins, and themes the day updates are available. Enable auto-updates for minor releases. Delete any plugin or theme you are not actively using.
        </p>

        <h3>Use strong, unique passwords</h3>
        <p>
          Every WordPress admin account should have a password that is at least 16 characters, randomly generated, and unique to that site. Use a password manager. Never reuse a password across sites.
        </p>

        <h3>Enable two-factor authentication</h3>
        <p>
          Even if an attacker gets your password, two-factor authentication stops them from logging in. This one measure prevents the majority of credential-based attacks.
        </p>

        <h3>Never install nulled themes or plugins</h3>
        <p>
          Nulled (pirated) premium themes and plugins are the easiest way for an attacker to get a backdoor onto your site. The theme works as advertised — but it also phones home to the attacker. Only install plugins and themes from the official{' '}
          <a href="https://wordpress.org/plugins/" target="_blank" rel="noopener noreferrer">WordPress plugin directory</a>
          {' '}or directly from the developer&apos;s verified website.
        </p>

        <h3>Regularly check Google Search Console</h3>
        <p>
          Make it a weekly habit to check your Search Console for unexpected pages, unusual traffic spikes from countries you do not target, and any security notifications. This is your early warning system for SEO-based attacks.
        </p>

        <h2>Your site might be hacked right now and you would not know</h2>

        <p>
          That is the entire point of the Japanese keyword hack. It is built to be invisible from wp-admin. It cloaks its content from logged-in users. It targets search engines, not your visitors. By the time you notice — by the time a customer says &quot;I searched your brand name and saw Japanese text&quot; — the hack has been running for weeks and Google has already started penalising your domain.
        </p>

        <p>
          Upnotify monitors your pages from the outside, the way search engines and visitors see them. If unexpected content appears — Japanese characters, spam keywords, anything that should not be on your English-language site — you know in under a minute. Not in weeks. Not when a customer tells you. In under a minute.
        </p>

        <div className="blog-cta-section">
          <h3>Detect content injection and SEO hacks automatically</h3>
          <p>
            Free plan available. Keyword monitoring that checks your actual page content. Instant alerts. No credit card required.
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
            <li><Link href="/blog/wordpress-malware-redirect">WordPress Malware Redirect: Why Your Visitors Are Being Sent to Spam Sites</Link></li>
            <li><Link href="/blog/wordpress-403-forbidden">WordPress 403 Forbidden Error: Why Your Pages Are Blocked and How to Fix It</Link></li>
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
