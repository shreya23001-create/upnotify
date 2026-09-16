import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WordPress Site Down on Shared Hosting: Why CPU Limits Are Throttling Your Site',
  description:
    'Shared hosting providers silently throttle your WordPress site when you hit CPU limits. Traffic spikes, noisy neighbours, and resource suspensions cause slowdowns and outages you never see coming. Learn what happens and how HTTP monitoring catches the throttling.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wordpress-shared-hosting-slow' },
  openGraph: {
    title: 'WordPress Site Down on Shared Hosting: Why CPU Limits Are Throttling Your Site',
    description:
      'Why shared hosting silently throttles your WordPress site during traffic spikes, how the noisy neighbour effect works, and how response time monitoring catches slowdowns before they become outages.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-shared-hosting-slow',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Site Down on Shared Hosting: Why CPU Limits Are Throttling Your Site',
    description:
      'Why shared hosting silently throttles your WordPress site during traffic spikes, how the noisy neighbour effect works, and how response time monitoring catches slowdowns before they become outages.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why is my WordPress site slow on shared hosting?',
    answer:
      'Shared hosting places hundreds of websites on a single physical server, all sharing the same CPU, RAM, and disk I/O. Each account has invisible resource limits. When your site uses too much CPU — during a traffic spike, a plugin running heavy PHP processes, or a WooCommerce sale — the hosting provider throttles your account. Your pages load in 8, 12, or 20 seconds instead of 2. The site is technically up but practically unusable. The throttling happens at the server level and there is no notification sent to you.',
  },
  {
    question: 'What is the noisy neighbour effect in shared hosting?',
    answer:
      'The noisy neighbour effect occurs when another website on the same physical server consumes excessive resources. Even if your site is well-optimised, if another site on the shared server gets a traffic spike, runs a poorly coded plugin, or gets hit by a bot attack, their resource usage can degrade the performance of every other site on that server — including yours. Your site slows down or goes offline because of someone else\'s problem. You cannot see or control it.',
  },
  {
    question: 'Can shared hosting suspend my WordPress site without warning?',
    answer:
      'Yes. Most shared hosting terms of service allow the provider to suspend accounts that exceed resource limits. Some hosts throttle first and suspend later. Others suspend immediately during peak usage. The suspension page typically shows a generic message like "This site is temporarily unavailable" or "Account suspended." You receive an email notification, but it may take hours to arrive and often lands in spam. Your site is down and your visitors see a suspension notice until you contact support.',
  },
  {
    question: 'How does Upnotify detect shared hosting throttling?',
    answer:
      'Upnotify\'s HTTP monitor checks your site every 60 seconds and records the response time for each check. When your host throttles your CPU, response times spike from normal levels (under 2 seconds) to 5, 10, or 20+ seconds. Upnotify detects this spike and alerts you via Slack, email, Microsoft Teams, or webhook. You can set response time thresholds so you are alerted when pages take longer than a specific number of seconds — catching the slowdown before it becomes a complete outage.',
  },
]

export default function WordPressSharedHostingSlowPage(): React.ReactElement {
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
          headline: 'WordPress Site Down on Shared Hosting: Why CPU Limits Are Throttling Your Site',
          description: 'Why shared hosting silently throttles your WordPress site during traffic spikes, how the noisy neighbour effect works, and how response time monitoring catches slowdowns.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Crozent Techlabs Private Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
          url: 'https://upnotify-monitoring.vercel.app/blog/wordpress-shared-hosting-slow',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>3 April 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Site Down on Shared Hosting: Why CPU Limits Are Throttling Your Site</h1>
        <p className="blog-article-subtitle">
          Your WordPress site loaded in 2 seconds yesterday. Today it takes 15. Nothing changed on your end. No plugin update, no content change, no traffic surge. Your hosting provider silently throttled your CPU — and they did not tell you.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The slowdown that looks like an outage</h2>

        <p>
          You share a link to your latest blog post on social media. Traffic starts flowing. Your website loads fine for the first few hundred visitors. Then it slows down. Pages take 8 seconds to load. Then 12. Then visitors start seeing 503 errors. By the time you check, the traffic spike has passed and your site is loading normally again.
        </p>

        <p>
          You check your uptime monitor — it shows green. Your hosting dashboard shows no alerts. You might think it was a one-off. It was not. Your hosting provider throttled your CPU because you exceeded the invisible limits of your shared hosting plan.
        </p>

        <p>
          Shared hosting is the most common type of WordPress hosting. It is affordable, easy to set up, and works well for small sites with predictable traffic. But the moment your traffic grows, or the moment something unexpected happens on the server, the limitations become painfully clear.
        </p>

        <p>
          The problem is not that shared hosting is bad. The problem is that the failure mode is invisible. Your site does not crash — it degrades. And unless you are monitoring response times, you have no idea it is happening.
        </p>

        <h2>How shared hosting actually works</h2>

        <p>
          A shared hosting server is a single physical machine running hundreds of websites. Every account on that server shares the same CPU, RAM, disk space, and network bandwidth. Your hosting provider uses software — typically CloudLinux with LVE containers — to enforce resource limits on each account.
        </p>

        <p>
          Your &quot;unlimited&quot; hosting plan is not actually unlimited. The terms of service — which almost nobody reads — specify CPU seconds per hour, concurrent PHP processes, and memory limits. When your site exceeds any of these limits, the hosting provider throttles your account.
        </p>

        <p>
          Throttling means your PHP processes are slowed down or queued. Instead of executing immediately, your page requests wait in line. The server is not down — it is artificially slowing your site to protect the other accounts on the same machine.
        </p>

        <p>
          From your visitor&apos;s perspective, the site loads in 15 seconds instead of 2. Or it shows a 503 Service Unavailable error. Or it shows a partial page with missing images and broken CSS. The experience is terrible, but your hosting dashboard shows no problem.
        </p>

        <h2>The four ways shared hosting kills your site</h2>

        <h3>1. CPU throttling during traffic spikes</h3>

        <p>
          Every page load on a WordPress site requires PHP to execute. PHP queries the database, processes template files, runs plugin hooks, and generates the HTML that gets sent to the browser. Each page load consumes CPU time.
        </p>

        <p>
          On shared hosting, you are allocated a certain number of CPU seconds per hour. Under normal traffic, you stay well below this limit. But when traffic spikes — a social media post goes viral, you send an email campaign, or a search engine starts indexing your site aggressively — you blow through your CPU allocation.
        </p>

        <p>
          The hosting provider does not send you a warning. They do not email you saying &quot;you are approaching your CPU limit.&quot; They throttle your account silently. Your site slows to a crawl. When the traffic subsides, the throttling lifts and your site returns to normal speed. You might never know it happened unless a visitor complains.
        </p>

        <p>
          For WooCommerce sites, this is especially dangerous during sales events. The exact moment you are driving the most traffic — when you have the highest chance of converting visitors into customers — is the moment your hosting throttles your site into unusability.
        </p>

        <h3>2. The noisy neighbour effect</h3>

        <p>
          Your website is not the only one on that server. There might be 200 other sites sharing the same machine. If one of those sites gets a bot attack, runs a broken cron job that loops infinitely, or has a plugin that consumes excessive memory, it affects every other site on the server.
        </p>

        <p>
          The hosting provider&apos;s resource isolation is supposed to prevent this. In practice, it is imperfect. Disk I/O is the hardest resource to isolate — when one account hammers the disk with large database queries, every other account on the same physical disk feels the slowdown.
        </p>

        <p>
          You have no visibility into this. You cannot see who the noisy neighbour is. You cannot see what they are doing. All you know is that your site is slow and nothing you do on your end fixes it.
        </p>

        <h3>3. Resource limit suspension</h3>

        <p>
          Throttling is the first response. If your site continues to consume excessive resources despite throttling — or if the resource usage spikes too high too fast — many hosting providers escalate to account suspension.
        </p>

        <p>
          Account suspension means your entire site goes offline. Visitors see a generic &quot;Account suspended&quot; page or a blank page. Your files, database, and emails are all inaccessible. The hosting provider sends you an email explaining that you violated their resource usage policy and need to &quot;optimise your site&quot; before they will reinstate it.
        </p>

        <p>
          The suspension email might arrive in minutes. It might arrive in hours. It might go to spam. Meanwhile, your site is completely down and you have no way to fix it until the hosting provider responds to your support ticket.
        </p>

        <p>
          According to the{' '}
          <a href="https://wordpress.org/documentation/" target="_blank" rel="noopener noreferrer">WordPress documentation</a>, WordPress itself recommends at minimum PHP 7.4, MySQL 5.7 or MariaDB 10.4, and HTTPS support. But the documentation does not address the CPU and memory limits that shared hosting providers impose — limits that determine whether your site actually performs under real-world conditions.
        </p>

        <h3>4. Silent throttling during off-peak maintenance</h3>

        <p>
          Hosting providers run maintenance tasks on their servers — backups, security scans, software updates, disk defragmentation. These tasks consume server resources. When maintenance runs during business hours, every site on the server experiences a performance dip.
        </p>

        <p>
          Most hosts schedule maintenance for off-peak hours. But &quot;off-peak&quot; depends on where the server is located, not where your customers are. If your server is in the US and your customers are in Europe, &quot;off-peak&quot; maintenance at 3am US time might be 9am in London — right when your European visitors are arriving.
        </p>

        <p>
          The maintenance is invisible to you. The performance dip looks like your site is just having a slow day. Without response time monitoring, you never connect the dots.
        </p>

        <h2>Why standard uptime monitoring misses throttling</h2>

        <p>
          A standard uptime monitor sends an HTTP request and checks if the server responds with a 200 status code. If it does, the site is &quot;up.&quot; If it does not, the site is &quot;down.&quot;
        </p>

        <p>
          When your shared hosting provider throttles your CPU, the server still responds. It just takes 10 seconds instead of 1 second. Most uptime monitors have a generous timeout — 30 seconds or more — so the request eventually succeeds and reports your site as &quot;up.&quot;
        </p>

        <p>
          But a site that takes 10 seconds to load is not &quot;up&quot; in any meaningful sense. Visitors leave after 3 seconds. Google penalises slow sites in search rankings. Conversion rates drop by 7% for every additional second of load time. Your uptime monitor says 100% uptime while your site is effectively unusable.
        </p>

        <p>
          This is why response time monitoring is essential. It does not just check whether the server responded — it checks how fast it responded.
        </p>

        <h2>How to detect hosting throttling with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s HTTP monitoring</Link> records the response time on every check. When your hosting provider throttles your site, the response time spikes — and Upnotify alerts you immediately.
        </p>

        <h3>Step 1: Set up an HTTP monitor with response time alerting</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (paid plans from ₹999/year)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Set a <strong>response time threshold</strong> — alert if response time exceeds <strong>3 seconds</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          Now, every time your site takes longer than 3 seconds to respond, you get an alert. This catches throttling, noisy neighbour slowdowns, database performance issues, and any other cause of degraded performance — not just complete outages.
        </p>

        <h3>Step 2: Monitor multiple pages for partial throttling</h3>

        <p>
          Throttling does not always affect every page equally. Your homepage might be cached and load quickly while your WooCommerce shop page, which runs heavy database queries, gets throttled into unusability. Set up monitors for:
        </p>

        <ul>
          <li>Homepage</li>
          <li>Shop or product category page (if WooCommerce)</li>
          <li>Contact page</li>
          <li>Any page running resource-heavy plugins</li>
          <li>Your most popular blog post</li>
        </ul>

        <h3>Step 3: Track response time trends over time</h3>

        <p>
          Upnotify records the response time of every check. Over days and weeks, you build a clear picture of your site&apos;s performance. You can see:
        </p>

        <ul>
          <li>Whether response times are gradually increasing — a sign you are outgrowing your hosting plan</li>
          <li>Specific times of day when throttling occurs — which often correlates with server maintenance or peak usage periods</li>
          <li>Sudden spikes that correspond to traffic events or plugin activity</li>
          <li>Whether a hosting provider change actually improved performance</li>
        </ul>

        <h3>Step 4: Set up a keyword monitor as a backup</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set the keyword to your site title or a phrase that always appears on your homepage</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          If throttling escalates to a full suspension and your host replaces your site with a &quot;suspended&quot; page, the keyword monitor catches it. Your expected content is gone, replaced by the suspension notice.
        </p>

        <h3>Step 5: Configure alerts that reach you during business hours</h3>

        <p>
          Throttling is a performance problem, not necessarily an emergency. Configure your alerts appropriately:
        </p>

        <ul>
          <li><strong>Slack</strong> — response time threshold alerts go to a performance channel for visibility</li>
          <li><strong>Email</strong> — summary alerts for response time trends</li>
          <li><strong>Webhook</strong> — pipe response time data into your own analytics or dashboards</li>
          <li><strong>Microsoft Teams</strong> — for teams using the Microsoft ecosystem</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site speed right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if your hosting is throttling you.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>What to do when you confirm throttling</h2>

        <p>
          Once you have the data showing that your hosting is throttling your site, you have three options.
        </p>

        <h3>Optimise your site to stay within limits</h3>
        <p>
          Install a caching plugin to reduce PHP execution. Optimise your database. Remove plugins you are not actively using. Lazy-load images. Move static assets to a CDN. These changes reduce the CPU and memory your site consumes per page load, keeping you within your hosting limits for longer.
        </p>

        <h3>Upgrade your hosting plan</h3>
        <p>
          Most shared hosting providers offer tiered plans with different resource limits. Upgrading gives you more CPU seconds, more PHP workers, and more memory. This buys time but does not solve the fundamental problem — you are still on shared infrastructure with noisy neighbours and invisible limits.
        </p>

        <h3>Move to managed WordPress hosting or a VPS</h3>
        <p>
          If your site is generating revenue, the cost of better hosting is trivial compared to the revenue lost during throttling episodes. Managed WordPress hosts provide dedicated resources, server-level caching, and proactive performance optimisation. A VPS gives you guaranteed CPU and RAM that no other site can consume. Either option eliminates the noisy neighbour problem entirely.
        </p>

        <h2>Stop guessing why your site is slow</h2>

        <p>
          Shared hosting throttling is invisible by design. Your hosting provider does not alert you when they throttle your CPU. Your uptime monitor says the site is up. Your hosting dashboard shows no warnings. Meanwhile, your visitors wait 15 seconds for a page to load and leave.
        </p>

        <p>
          Upnotify checks your site every 60 seconds and tracks the response time on every check. When your hosting provider throttles your site, you see it in the data. When response times exceed your threshold, you get an alert. You stop guessing and start knowing.
        </p>

        <div className="blog-cta-section">
          <h3>Detect hosting throttling before your visitors leave</h3>
          <p>
            Start monitoring in minutes. HTTP monitoring with response time tracking. AI-powered reports.
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
            <li><Link href="/blog/wordpress-504-gateway-timeout">504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail</Link></li>
            <li><Link href="/blog/wordpress-slow-ttfb">WordPress TTFB Over 3 Seconds: Why Your Site Feels Dead</Link></li>
            <li><Link href="/blog/wordpress-502-bad-gateway">502 Bad Gateway on WordPress: What It Means and How to Fix It</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
