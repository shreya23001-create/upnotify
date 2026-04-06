'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface BlogPostMeta {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
}

const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: 'website-monitoring-guide',
    title: 'Website Monitoring in 2026: The Complete Guide',
    excerpt:
      'Everything you need to know about monitoring your website — from basic uptime checks to advanced performance tracking. Learn why monitoring matters and how to pick the right tool for your needs.',
    date: '5 March 2026',
    readTime: '12 min read',
    category: 'Guide',
  },
  {
    slug: 'public-status-page-guide',
    title: 'How to Create a Public Status Page for Your Website (Free)',
    excerpt:
      'Your customers deserve to know when something is wrong. Learn what status pages are, why they build trust, and how to set one up in under five minutes — without writing any code.',
    date: '6 March 2026',
    readTime: '10 min read',
    category: 'Guide',
  },
  {
    slug: 'uptime-monitoring-agencies',
    title: 'Uptime Monitoring for Agencies: Managing 100+ Client Sites',
    excerpt:
      'Generic monitoring tools were built for one-site teams. If you are an agency managing dozens or hundreds of client websites, you need a different approach entirely.',
    date: '7 March 2026',
    readTime: '11 min read',
    category: 'Agency',
  },
  {
    slug: 'ssl-certificate-monitoring',
    title: 'SSL Certificate Monitoring: Why Auto-Renew Isn\'t Enough',
    excerpt:
      'Auto-renew sounds foolproof, but SSL certificates still fail in production every single day. Here is why it happens, what goes wrong, and how monitoring catches what automation misses.',
    date: '8 March 2026',
    readTime: '10 min read',
    category: 'Security',
  },
  {
    slug: 'competitor-analysis-ecommerce',
    title: 'Website Competitor Analysis Tools for Ecommerce in 2026',
    excerpt:
      'Your competitors\' website performance directly affects your bottom line. Learn what to track, which tools actually help, and how to turn competitive intelligence into a business advantage.',
    date: '10 March 2026',
    readTime: '11 min read',
    category: 'Ecommerce',
  },
  {
    slug: 'wordpress-database-connection-error',
    title: 'Error Establishing a Database Connection in WordPress: Complete Fix and Monitoring Guide',
    excerpt:
      'The scariest page your WordPress site can show. Learn what causes the database connection error, how to fix each cause, and how to monitor for it so you never discover it from a customer again.',
    date: '11 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-contact-form-not-sending',
    title: 'Contact Form 7 Not Sending Emails: Your Leads Are Disappearing and You Don\'t Know',
    excerpt:
      'Contact Form 7 can silently stop sending emails while still showing a success message. Your leads vanish and you have no idea. Here is why it happens and how to catch it.',
    date: '12 March 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-white-screen-of-death',
    title: 'WordPress White Screen of Death: How to Detect It Before Your Visitors Do',
    excerpt:
      'The WSOD shows a blank page instead of your website — and most monitoring tools report it as "up." Learn what causes it, how to fix it, and how keyword monitoring catches what HTTP checks miss.',
    date: '13 March 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-critical-error',
    title: 'There Has Been a Critical Error on This Website: What It Means and How to Fix It',
    excerpt:
      'WordPress 5.2 replaced the White Screen of Death with a critical error message — but its built-in recovery email is unreliable. Learn what triggers it, how to fix it, and how keyword monitoring catches it automatically.',
    date: '14 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-too-many-redirects',
    title: 'WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever',
    excerpt:
      'The redirect loop locks you out of your entire site — including wp-admin. Learn what causes it (SSL stacking, Cloudflare Flexible SSL, .htaccess conflicts) and how HTTP monitoring detects it automatically.',
    date: '15 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-php-memory-exhausted',
    title: 'PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide',
    excerpt:
      'The PHP memory exhausted error crashes your site with a white screen or 500 error. Learn what causes it, four ways to fix it, and how to monitor for the crashes it causes.',
    date: '17 March 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-redirect-loop',
    title: 'WordPress Login Redirect Loop: Why wp-admin Keeps Sending You Back to the Login Page',
    excerpt:
      'You enter the correct password, click Log In, and land right back on the same login screen. No error message. No explanation. Learn what causes the wp-admin redirect loop and how to fix it.',
    date: '18 March 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-recovery-mode',
    title: 'WordPress Recovery Mode: What Triggers It, What It Means, and How to Respond',
    excerpt:
      'WordPress recovery mode is supposed to email you when a fatal error crashes your site. In practice, that email almost never arrives. Learn what triggers it, what your visitors see, and how to monitor for it externally.',
    date: '19 March 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wp-mail-smtp-not-working',
    title: 'WP Mail SMTP Not Sending Emails: Why Your WordPress Site Is Silently Broken',
    excerpt:
      'WP Mail SMTP can stop sending emails without any visible error. Contact form submissions vanish, order confirmations never arrive, and you have no idea. Learn what causes it and how to detect it.',
    date: '20 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-403-forbidden',
    title: 'WordPress 403 Forbidden Error: Why Your Pages Are Blocked and How to Fix It',
    excerpt:
      'Your server is actively refusing to serve your pages — but you might not know because the block can be IP-specific. Learn what causes 403 errors and how HTTP monitoring catches them instantly.',
    date: '21 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-japanese-keyword-hack',
    title: 'Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don\'t Even Know',
    excerpt:
      'Thousands of spam pages in Japanese appear in Google under your domain — but you cannot see them from wp-admin. Learn how the hack works, how to clean it, and how keyword monitoring catches what cloaking hides.',
    date: '22 March 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-malware-redirect',
    title: 'WordPress Malware Redirect: Why Your Visitors Are Being Sent to Spam Sites',
    excerpt:
      'Your visitors are being redirected to spam sites — but only on mobile, only from Google, and only on the first visit. Learn how conditional redirect hacks work and how HTTP monitoring detects them automatically.',
    date: '23 March 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-504-gateway-timeout',
    title: '504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail',
    excerpt:
      'Your page loads for 60 seconds and then fails. The 504 is the final stage of a performance problem that has been building for weeks. Learn what causes it and how response time monitoring catches the slowdown before it becomes an outage.',
    date: '24 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-pharma-hack',
    title: 'WordPress Pharma Hack: Hidden Viagra Links in Your Site That Only Google Sees',
    excerpt:
      'Hidden pharmaceutical spam is injected directly into your existing pages — invisible to you but fully visible to Google. Learn how the pharma hack works, how to clean it, and how keyword monitoring catches what your eyes cannot see.',
    date: '25 March 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-cron-not-working',
    title: 'WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop',
    excerpt:
      'WordPress cron depends on traffic to fire. On low-traffic sites, scheduled posts publish late, backups stop running, and emails never send. Learn why wp-cron fails and how heartbeat monitoring keeps it firing on schedule.',
    date: '26 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'elementor-not-loading',
    title: 'Elementor Not Loading After Update? Fix the White Screen Before You Lose Traffic',
    excerpt:
      'Elementor can break after a WordPress, PHP, or plugin update — showing a white screen, missing widgets, or a 500 error. Learn what causes it and how HTTP and keyword monitoring catches broken pages automatically.',
    date: '27 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-htaccess-error',
    title: 'WordPress .htaccess File Corrupted: How a Single File Takes Down Your Entire Site',
    excerpt:
      'A single misplaced character in .htaccess returns a 500 Internal Server Error on every page. Learn what causes corruption, how to regenerate the file, and how HTTP monitoring catches it instantly.',
    date: '28 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-permalinks-not-working',
    title: 'WordPress Permalink Changes Breaking All URLs: How to Prevent SEO Disaster',
    excerpt:
      'Changing your permalink structure breaks every URL on your site. Every indexed page returns 404, every backlink leads nowhere, and Google starts deranking you within days. Learn how to fix it and how monitoring multiple pages catches widespread 404s.',
    date: '29 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wp-rocket-cache-issues',
    title: 'WP Rocket Cache Serving Stale Pages: Why Your Updates Aren\'t Showing to Visitors',
    excerpt:
      'You updated the page an hour ago but visitors still see old content. Object cache conflicts, CDN cache layering, and preload bot timing all cause WP Rocket to serve stale pages. Learn what causes it and how keyword monitoring checks what real visitors see.',
    date: '30 March 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-site-hacked',
    title: 'WordPress Site Defaced: How Hackers Replace Your Homepage and How to Detect It Instantly',
    excerpt:
      'Hackers can replace your homepage with their own message while your uptime monitor says the site is fine. Admin credential compromise, vulnerable plugins, and theme file injection are the attack vectors. Learn how to detect defacement in 60 seconds with keyword monitoring.',
    date: '31 March 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'updraftplus-backup-failed',
    title: 'UpdraftPlus Backup Failed: When Your Safety Net Has a Hole in It',
    excerpt:
      'UpdraftPlus can silently stop backing up your site for months. Disk space exhaustion from partial backups, PHP timeouts, and expired remote storage credentials are the most common causes. Learn what makes backups fail and how HTTP monitoring catches the 500 errors that follow.',
    date: '1 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-slow-ttfb',
    title: 'WordPress TTFB Over 3 Seconds: Why Your Site Feels Dead Even When It\'s Technically Up',
    excerpt:
      'A WordPress site with Time to First Byte over 3 seconds feels broken to visitors even when uptime monitors say it is fine. Slow database queries, missing object cache, bloated plugins, and cheap hosting all cause high TTFB. Learn what drives TTFB up and how HTTP monitoring tracks it on every check.',
    date: '1 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-javascript-errors',
    title: 'JavaScript Errors Breaking WordPress Page Functionality: When Your Site Is Up But Broken',
    excerpt:
      'JavaScript errors on WordPress can break forms, buttons, sliders, and navigation while the page still loads and returns 200 OK. jQuery conflicts, plugin JS errors, and minification breaking code cause invisible functionality failures. Learn what causes them and how keyword monitoring catches broken pages.',
    date: '2 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'gravity-forms-not-working',
    title: 'Gravity Forms Conditional Logic Not Working: Why Your Forms Are Broken After Update',
    excerpt:
      'Gravity Forms conditional logic can silently break after updates due to jQuery conflicts, JavaScript minification, PHP 8.x compatibility issues, and payment integration failures. Fields that should show or hide stop responding. Learn what causes it and how keyword monitoring catches broken forms.',
    date: '2 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordfence-blocking-traffic',
    title: 'Wordfence Blocking Real Users: When Your Security Plugin Becomes Your Biggest Problem',
    excerpt:
      'Wordfence can silently block legitimate visitors, paying customers, and even Googlebot through aggressive rate limiting, country blocking, and learning mode misconfiguration. Your site is technically up but unreachable for real users. Learn what causes it and how multi-location HTTP monitoring detects blocked traffic.',
    date: '2 April 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-brute-force-attack',
    title: 'WordPress Brute Force Attack Slowing Your Site: How Thousands of Login Attempts Cause Downtime',
    excerpt:
      'WordPress brute force attacks flood wp-login.php and xmlrpc.php with thousands of login attempts, exhausting CPU, memory, and PHP workers until your site crashes. Learn what causes the performance impact and how HTTP monitoring catches response time spikes from active attacks.',
    date: '3 April 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'yoast-seo-sitemap-404',
    title: 'Yoast SEO Sitemap Returning 404: How This Quietly Tanks Your Google Rankings',
    excerpt:
      'Your Yoast SEO sitemap can return a 404 due to broken permalinks, .htaccess rewrite conflicts, and plugin conflicts. Google cannot find your pages, crawl budget is wasted, and rankings silently decline. Learn what causes it and how HTTP monitoring on /sitemap_index.xml catches it instantly.',
    date: '3 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-ssl-expired',
    title: 'WordPress SSL Certificate Expired? Here\'s How to Never Let It Happen Again',
    excerpt:
      'Let\'s Encrypt auto-renew fails silently more often than you think. DNS changes, server misconfigurations, and hosting migrations all break automatic renewal. Learn what happens when your SSL expires and how SSL monitoring warns you 30, 14, and 7 days before expiry.',
    date: '3 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-shared-hosting-slow',
    title: 'WordPress Site Down on Shared Hosting: Why CPU Limits Are Throttling Your Site',
    excerpt:
      'Shared hosting providers silently throttle your WordPress site when you hit CPU limits. Traffic spikes, noisy neighbours, and resource suspensions cause slowdowns and outages you never see coming. Learn how HTTP monitoring catches the throttling.',
    date: '3 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-auto-update-broke-site',
    title: 'WordPress Auto-Update Broke My Site: How to Recover and Prevent It From Happening Again',
    excerpt:
      'WordPress auto-updates can break your site silently — theme incompatibility, PHP version mismatch, and file permission errors during update all cause white screens, critical errors, and 500 errors. Learn how to recover and how HTTP monitoring catches the break within 60 seconds.',
    date: '3 April 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-mixed-content',
    title: 'WordPress Mixed Content Errors: Why Your Site Shows \'Not Secure\' After Installing SSL',
    excerpt:
      'You installed an SSL certificate but your browser still shows "Not Secure." Hardcoded HTTP URLs in your database, plugin assets loading over HTTP, CDN misconfigurations, and images with absolute HTTP paths all cause mixed content errors. Learn how to find and fix every source.',
    date: '4 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-xmlrpc-attack',
    title: 'WordPress XML-RPC Brute Force Attack: How Hackers Slow Down Your Site Without You Knowing',
    excerpt:
      'WordPress xmlrpc.php allows attackers to try hundreds of passwords in a single request using system.multicall. Your site slows to a crawl while uptime monitors say it is fine. Learn how XML-RPC attacks work and how to disable xmlrpc.php properly.',
    date: '4 April 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-core-web-vitals',
    title: 'WordPress Core Web Vitals Failing: How LCP, FID, and CLS Failures Hurt Your Traffic',
    excerpt:
      'Your WordPress site is failing Core Web Vitals — LCP over 2.5 seconds, poor FID from heavy plugins, and CLS from ads and lazy loading. Google uses these metrics for ranking. Learn what causes each failure, how to fix them, and how HTTP monitoring tracks TTFB.',
    date: '4 April 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'monitor-wordpress-free',
    title: 'How to Monitor Your WordPress Site for Free in 2026',
    excerpt:
      'Your WordPress site could be down right now and you would not know. Learn how to set up free monitoring covering uptime, SSL, performance, and keyword checks — in under five minutes.',
    date: '10 March 2026',
    readTime: '12 min read',
    category: 'WordPress',
  },
  {
    slug: 'website-downtime-warning-signs',
    title: '10 Warning Signs Your Website Is About to Go Down',
    excerpt:
      'Websites rarely crash without warning. Slow TTFB, expiring SSL certificates, rising error rates, and disk space exhaustion are all red flags. Here are the 10 signs that downtime is coming — and how to catch them early.',
    date: '18 March 2026',
    readTime: '13 min read',
    category: 'Guide',
  },
  {
    slug: 'what-is-uptime-monitoring',
    title: 'What Is Uptime Monitoring and Why Every Website Needs It',
    excerpt:
      'Uptime monitoring checks your website every 60 seconds and alerts you when it goes down. Learn what it is, how it works, why your hosting guarantee is not enough, and how to set it up for free.',
    date: '25 March 2026',
    readTime: '11 min read',
    category: 'Guide',
  },
  {
    slug: 'dns-monitoring-explained',
    title: 'DNS Monitoring Explained: Why Your Domain Records Matter More Than You Think',
    excerpt:
      'Your DNS records control where your website and email point. When they change — accidentally or maliciously — everything breaks. Learn what DNS monitoring catches and why it is essential.',
    date: '30 March 2026',
    readTime: '12 min read',
    category: 'Guide',
  },
  {
    slug: 'free-status-page-saas',
    title: 'How to Set Up a Free Public Status Page for Your SaaS',
    excerpt:
      'When your service goes down, customers have two options: panic and email you, or check your status page. Learn why every SaaS needs one and how to set it up for free in five minutes.',
    date: '3 April 2026',
    readTime: '11 min read',
    category: 'Guide',
  },
  {
    slug: 'cheap-hosting-hidden-costs',
    title: 'Why Cheap Hosting Is the Most Expensive Mistake You Can Make',
    excerpt:
      'Shared hosting overselling, CPU throttling, noisy neighbours, and the hidden costs of downtime. That 3 pound per month hosting plan is costing you thousands in lost revenue, damaged SEO, and customers who never come back.',
    date: '12 March 2026',
    readTime: '13 min read',
    category: 'Hosting',
  },
  {
    slug: 'budget-hosting-outages',
    title: 'GoDaddy Down Again? Why Budget Hosts Have the Most Outages',
    excerpt:
      'GoDaddy, Bluehost, and HostGator dominate shared hosting — and hosting forums. Real complaints from real users reveal a pattern of overselling, poor support, and outages that never make the news.',
    date: '16 March 2026',
    readTime: '14 min read',
    category: 'Hosting',
  },
  {
    slug: 'hosting-wont-tell-you-slow',
    title: 'Your Hosting Provider Won\'t Tell You When Your Site Is Slow',
    excerpt:
      'Your hosting provider monitors their server, not your website. TTFB spikes, shared resource contention, and CPU throttling happen silently. The only way to know what your visitors experience is external monitoring.',
    date: '22 March 2026',
    readTime: '13 min read',
    category: 'Hosting',
  },
  {
    slug: 'server-migration-checklist',
    title: 'Server Migration Checklist: How to Move Hosts Without Losing Your Site',
    excerpt:
      'DNS propagation, SSL certificate transfer, database migration, email continuity, and monitoring during the switch. The complete step-by-step checklist for moving hosting providers without downtime or data loss.',
    date: '28 March 2026',
    readTime: '15 min read',
    category: 'Hosting',
  },
  {
    slug: 'cdn-vs-better-hosting',
    title: 'CDN vs Better Hosting: What Actually Makes Your Site Faster?',
    excerpt:
      'Someone says "just add Cloudflare." Someone else says "upgrade your hosting." They solve different problems. Learn when a CDN helps, when you need better hosting, and how to diagnose which one your site actually needs.',
    date: '2 April 2026',
    readTime: '14 min read',
    category: 'Hosting',
  },
  {
    slug: 'woocommerce-checkout-not-working',
    title: "WooCommerce Checkout Not Working? Here's Why Your Store Is Losing Sales Right Now",
    excerpt:
      'WooCommerce checkout failures are silent revenue killers. Payment gateway errors, SSL issues, JavaScript conflicts, caching misconfigurations, and session problems all cause checkout to break while the rest of your store appears normal.',
    date: '21 March 2026',
    readTime: '14 min read',
    category: 'Ecommerce',
  },
  {
    slug: 'wordpress-maintenance-mode',
    title: 'WordPress Stuck in Maintenance Mode: How to Fix It and Never Get Stuck Again',
    excerpt:
      'WordPress gets stuck in maintenance mode when an update fails mid-process — leaving a .maintenance file that shows "Briefly unavailable" to every visitor indefinitely. Learn how to fix it in 60 seconds.',
    date: '22 March 2026',
    readTime: '12 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-502-bad-gateway',
    title: '502 Bad Gateway on WordPress: What It Means and How to Fix It Fast',
    excerpt:
      "A 502 Bad Gateway means your web server received an invalid response from an upstream server — typically PHP-FPM crashing, Nginx misconfiguration, or your host's load balancer timing out. Learn what causes each scenario.",
    date: '23 March 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-wpml-404-errors',
    title: 'WPML Breaking URLs After Update: How Multilingual Plugins Cause 404 Errors Across Your Site',
    excerpt:
      'WPML updates can break URL structures across all your language versions simultaneously — 404 errors on every translated page, incorrect language redirects, and broken hreflang tags. Learn what triggers it and how to fix the full site damage.',
    date: '3 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'ithemes-security-locked-out',
    title: 'iThemes Security Locked Me Out of WordPress: How to Regain Access and Prevent It',
    excerpt:
      'iThemes Security can lock you out of your own WordPress site through aggressive brute force protection, IP banning, and two-factor authentication failures. Learn how to regain access via FTP or database and configure it to stop blocking legitimate users.',
    date: '3 April 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'woocommerce-payment-gateway-error',
    title: 'WooCommerce Payment Gateway Error: Why Stripe, PayPal, and Square Randomly Stop Working',
    excerpt:
      'Payment gateway errors in WooCommerce can be caused by expired API keys, SSL certificate issues, webhook failures, plugin conflicts, and gateway-side outages. Every failed transaction is lost revenue. Learn how to diagnose and fix each cause.',
    date: '3 April 2026',
    readTime: '14 min read',
    category: 'Ecommerce',
  },
  {
    slug: 'woocommerce-down',
    title: 'WooCommerce Down? How to Diagnose and Fix a Broken WooCommerce Store',
    excerpt:
      'Your WooCommerce store is not working and every minute is lost revenue. This step-by-step guide covers plugin conflicts, database errors, PHP memory exhaustion, hosting failures, and payment gateway outages — with a clear path to diagnosing each one.',
    date: '6 April 2026',
    readTime: '15 min read',
    category: 'Ecommerce',
  },
  {
    slug: 'shopify-down',
    title: 'Is Shopify Down? How to Check Shopify Status and Protect Your Store',
    excerpt:
      'Your Shopify store is not loading. Here is how to find out in 60 seconds whether it is a Shopify platform issue or something specific to your store — and what to do in either case.',
    date: '6 April 2026',
    readTime: '14 min read',
    category: 'Ecommerce',
  },
  {
    slug: 'website-response-time',
    title: 'What Is a Good Website Response Time? (And How to Fix a Slow Server)',
    excerpt:
      'Under 200ms is excellent, under 800ms is acceptable, above 2 seconds is damaging. Learn what drives high TTFB, how to fix slow server response times, and how to monitor response time continuously.',
    date: '6 April 2026',
    readTime: '13 min read',
    category: 'Performance',
  },
  {
    slug: 'uptime-monitoring-tools',
    title: 'Best Uptime Monitoring Tools in 2026: What to Look For',
    excerpt:
      'Not all uptime monitoring tools are created equal. Check frequency, multi-region checks, SSL monitoring, alert channels, status pages, and response time tracking all matter. Here is what separates tools that protect your business from ones that just add a green checkmark.',
    date: '6 April 2026',
    readTime: '13 min read',
    category: 'Guide',
  },
  {
    slug: 'ssl-certificate-expired',
    title: 'SSL Certificate Expired: What It Means and How to Fix It in 10 Minutes',
    excerpt:
      'Visitors see "Your connection is not private" and leave immediately. Learn what the warning means, why certificates expire despite auto-renew, how to renew for free with Let\'s Encrypt or cPanel, and how to prevent it from ever happening again.',
    date: '6 April 2026',
    readTime: '12 min read',
    category: 'Security',
  },
]

const POSTS_PER_PAGE = 6

export default function BlogIndexPage(): React.ReactElement {
  const searchParams = useSearchParams()
  const pageParam = searchParams.get('page')
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(BLOG_POSTS.length / POSTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * POSTS_PER_PAGE
  const visiblePosts = BLOG_POSTS.slice(startIdx, startIdx + POSTS_PER_PAGE)

  return (
    <div className="blog-index">
      <div className="blog-index-header">
        <h1 className="blog-index-title">Uptrue Blog</h1>
        <p className="blog-index-subtitle">
          Guides, tutorials, and practical insights on website monitoring, uptime, and infrastructure reliability.
        </p>
      </div>

      <div className="blog-posts-grid">
        {visiblePosts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="blog-post-card">
            <div className="blog-post-card-body">
              <span className="blog-post-category">{post.category}</span>
              <h2 className="blog-post-card-title">{post.title}</h2>
              <p className="blog-post-card-excerpt">{post.excerpt}</p>
              <div className="blog-post-card-meta">
                <span>{post.date}</span>
                <span className="blog-post-card-dot" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="blog-pagination">
          {safePage > 1 ? (
            <Link href={`/blog?page=${safePage - 1}`} className="btn btn-secondary btn-sm">
              {'\u2190'} Newer Posts
            </Link>
          ) : (
            <span />
          )}

          <span className="blog-pagination-info">
            Page {safePage} of {totalPages}
          </span>

          {safePage < totalPages ? (
            <Link href={`/blog?page=${safePage + 1}`} className="btn btn-secondary btn-sm">
              Older Posts {'\u2192'}
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}
