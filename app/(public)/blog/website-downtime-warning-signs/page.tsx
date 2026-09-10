import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: '10 Warning Signs Your Website Is About to Go Down',
  description:
    'Your website shows warning signs before it crashes. Slow TTFB, SSL expiry, database errors, disk space, and more. Learn the 10 signs and how to catch them early.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/website-downtime-warning-signs' },
  openGraph: {
    title: '10 Warning Signs Your Website Is About to Go Down',
    description:
      'Your website shows warning signs before it crashes. Learn the 10 signs and how to catch them before your visitors do.',
    url: 'https://upnotify-monitoring.vercel.app/blog/website-downtime-warning-signs',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '10 Warning Signs Your Website Is About to Go Down',
    description:
      'Your website shows warning signs before it crashes. Learn the 10 signs and how to catch them before your visitors do.',
  },
}

const FAQ_DATA = [
  {
    question: 'How far in advance can you detect that a website is about to go down?',
    answer:
      'Most downtime events have warning signs hours or days before they happen. Response time increases, SSL certificate expiry dates, disk space trends, and error rate spikes all appear well before a full outage. With proper monitoring, you can catch these signals and fix the problem before it becomes a crash.',
  },
  {
    question: 'What is TTFB and why does it predict downtime?',
    answer:
      'TTFB stands for Time to First Byte — the time between a browser requesting your page and receiving the first byte of the response. When TTFB gradually increases over days or weeks, it indicates growing server strain from database bloat, memory exhaustion, or hosting throttling. If left unchecked, the server eventually cannot handle requests and crashes.',
  },
  {
    question: 'Can an SSL certificate expiring actually take my site down?',
    answer:
      'Not technically — your server still responds. But browsers show a full-screen warning that says "Your connection is not private" and most visitors will not click through it. Effectively, your site is unreachable to almost all visitors. Google also flags the site as insecure, which can impact rankings.',
  },
  {
    question: 'How do I know if my hosting provider is throttling my site?',
    answer:
      'Response time monitoring is the clearest indicator. If your site is fast at low-traffic times and slow during peaks, your hosting provider is likely throttling CPU or memory during high-demand periods. Shared hosting is especially prone to this. Track TTFB over time and look for patterns that correlate with traffic spikes.',
  },
  {
    question: 'What percentage of downtime is preventable?',
    answer:
      'Industry estimates suggest that 60 to 80 percent of downtime events have detectable warning signs before they occur. Certificate expiry, disk space exhaustion, memory leaks, and gradual performance degradation are all predictable. The key is continuous monitoring that tracks trends, not just up-or-down status.',
  },
  {
    question: 'How often should I check my website for warning signs?',
    answer:
      'Manually checking is not reliable — you will miss things. Automated monitoring every 60 seconds is the standard for business-critical sites. Upnotify checks your site every minute for HTTP status, response time, SSL validity, keyword presence, and DNS records, and alerts you the moment anything changes.',
  },
  {
    question: 'What is the most common cause of unexpected website downtime?',
    answer:
      'For WordPress sites, plugin and theme updates are the number one cause. For all websites, server resource exhaustion (CPU, memory, disk space) is the most common. SSL certificate expiry is the most common preventable cause — because it happens on a known schedule and monitoring can warn you weeks in advance.',
  },
  {
    question: 'Can monitoring actually prevent downtime or just detect it faster?',
    answer:
      'Both. Monitoring detects active outages within 60 seconds, dramatically reducing the time your site is down without you knowing. But trend monitoring — tracking response time, SSL expiry dates, and error rates over time — gives you early warning to fix problems before they cause downtime. Prevention is the real value.',
  },
]

export default function WebsiteDowntimeWarningSignsPage(): React.ReactElement {
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
          headline: '10 Warning Signs Your Website Is About to Go Down',
          description: 'Learn the 10 warning signs that precede website downtime and how to catch them early with monitoring.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-18',
          dateModified: '2026-03-18',
          url: 'https://upnotify-monitoring.vercel.app/blog/website-downtime-warning-signs',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Guide</span>
          <span>18 March 2026</span>
          <span>13 min read</span>
        </div>
        <h1 className="blog-article-title">10 Warning Signs Your Website Is About to Go Down</h1>
        <p className="blog-article-subtitle">
          Websites rarely crash without warning. The signs are there — you are just not looking for them. Here are the 10 red flags that mean downtime is coming.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>Downtime does not happen out of nowhere</h2>

        <p>
          When your website goes down, it feels sudden. One minute it is working, the next it is not. But in almost every case, the crash was coming for hours or days. The server was getting slower. The disk was filling up. The certificate was expiring. The database was bloating.
        </p>

        <p>
          The warning signs were there. You just were not watching for them.
        </p>

        <p>
          Here are the 10 most common warning signs that your website is about to go down — and what to do about each one before it becomes an outage.
        </p>

        <h2>1. Response time is creeping up</h2>

        <p>
          This is the single most reliable predictor of an impending outage. Your site used to respond in 400 milliseconds. Now it takes 1.2 seconds. Next week it will take 2.5 seconds. The week after that, it times out entirely.
        </p>

        <p>
          Gradual response time increases mean your server is under growing strain. The cause could be database tables filling with unoptimised queries, memory leaks in a plugin, increasing traffic that your hosting plan cannot handle, or a background process consuming CPU.
        </p>

        <p>
          <strong>What to do:</strong> Track your{' '}
          <Link href="/blog/wordpress-slow-ttfb">Time to First Byte (TTFB)</Link>{' '}
          over time. If it is trending upward over days or weeks, investigate before it plateaus at a timeout. HTTP monitoring with <Link href="/signup">Upnotify</Link> records TTFB on every check, so you can see the trend in your dashboard.
        </p>

        <h2>2. SSL certificate is approaching expiry</h2>

        <p>
          This one is entirely predictable and entirely preventable — and yet it takes down thousands of sites every month.
        </p>

        <p>
          Let&apos;s Encrypt certificates expire every 90 days. Paid certificates expire annually. Auto-renewal sounds foolproof, but it fails when DNS records change, when your hosting provider updates their panel, when you migrate servers, or when Cloudflare configuration changes break the validation challenge.
        </p>

        <p>
          When the certificate expires, every browser shows a full-screen &quot;Your connection is not private&quot; warning. Your visitors leave. Google flags your site as insecure. The{' '}
          <a href="https://letsencrypt.org/docs/faq/" target="_blank" rel="noopener noreferrer">Let&apos;s Encrypt documentation</a>{' '}
          covers why auto-renewal fails more often than you expect.
        </p>

        <p>
          <strong>What to do:</strong> Set up <Link href="/blog/ssl-certificate-monitoring">SSL certificate monitoring</Link>{' '}
          that alerts you 30, 14, and 7 days before expiry. Fix the renewal before the deadline, not after the warning screen appears.
        </p>

        <h2>3. Disk space is running low</h2>

        <p>
          When your server runs out of disk space, everything breaks at once. The database cannot write. Log files cannot rotate. Temporary files cannot be created. Your site crashes with cryptic errors — 500 Internal Server Error, database connection failures, or blank pages.
        </p>

        <p>
          Disk space fills gradually from log files that are not rotated, backup files stored locally, WordPress post revisions accumulating in the database, uploaded media, and temporary cache files. On shared hosting, you might only have 10 to 20 GB, and a few months of unrotated logs can consume all of it.
        </p>

        <p>
          <strong>What to do:</strong> Monitor your hosting panel&apos;s disk usage weekly. Set up automated log rotation. Clean up old backups. For WordPress specifically, limit post revisions and schedule regular database cleanup with a plugin like WP-Optimize.
        </p>

        <h2>4. Database queries are getting slower</h2>

        <p>
          Every WordPress page load runs dozens of database queries. When those queries slow down, your pages slow down. When they slow down enough, they time out and your site shows a{' '}
          <Link href="/blog/wordpress-504-gateway-timeout">504 Gateway Timeout</Link>{' '}
          or a <Link href="/blog/wordpress-database-connection-error">database connection error</Link>.
        </p>

        <p>
          Slow queries happen when database tables grow without proper indexing, when plugins run inefficient queries on every page load, when the MySQL query cache fills up, or when a table becomes fragmented after thousands of inserts and deletes.
        </p>

        <p>
          <strong>What to do:</strong> Enable the MySQL slow query log on your server. Any query taking more than 1 second needs investigation. Keep your WordPress database optimised and remove plugins that run heavy queries on every page.
        </p>

        <h2>5. Error rates are spiking in server logs</h2>

        <p>
          Before a full outage, your server logs fill with warnings. PHP errors, MySQL connection warnings, memory allocation failures, and permission denied messages all appear hours or days before the crash.
        </p>

        <p>
          The problem is that most site owners never look at their server logs. They are buried in a hosting panel, require SSH access, or generate so much noise that the real warnings are invisible.
        </p>

        <p>
          <strong>What to do:</strong> Check your PHP error log and MySQL error log at least weekly. Look for patterns — repeated errors from the same plugin, increasing frequency of memory warnings, or connection timeout messages. Better yet, set up error tracking with a tool like{' '}
          <a href="https://sentry.io/" target="_blank" rel="noopener noreferrer">Sentry</a>{' '}
          that alerts you when error rates spike.
        </p>

        <h2>6. Your hosting provider sent a resource warning</h2>

        <p>
          If you are on shared hosting and you receive an email about CPU limits, memory usage, or &quot;resource abuse&quot; — take it seriously. That email means you are close to being throttled or suspended.
        </p>

        <p>
          Shared hosting providers{' '}
          <Link href="/blog/wordpress-shared-hosting-slow">silently throttle your site</Link>{' '}
          when you hit resource limits. First your site slows down. Then requests start timing out. Then the hosting provider suspends your account entirely. The throttling phase can last hours or days before the suspension, and during that time your site is effectively broken but technically &quot;up.&quot;
        </p>

        <p>
          <strong>What to do:</strong> If you are hitting resource limits regularly, upgrade your hosting plan or move to a VPS. In the meantime, optimise your site — install caching, reduce plugin count, and optimise your database.
        </p>

        <h2>7. DNS records have changed unexpectedly</h2>

        <p>
          Your DNS records tell the internet where your website lives. If they change — because of an accidental edit in your domain registrar, a compromised account, or a migration that was not completed properly — your domain stops resolving to your server.
        </p>

        <p>
          DNS changes can take up to 48 hours to propagate, which means the problem gets worse over time. Some visitors can reach your site while others cannot, depending on their location and DNS resolver. Read our{' '}
          <Link href="/blog/dns-monitoring-explained">DNS monitoring guide</Link>{' '}
          for a deep dive on what can go wrong.
        </p>

        <p>
          <strong>What to do:</strong> Set up DNS monitoring that checks your A, AAAA, CNAME, and MX records daily. Any unexpected change triggers an alert. This catches both accidental edits and malicious DNS hijacking.
        </p>

        <h2>8. Third-party services are failing</h2>

        <p>
          Your website depends on more services than you realise. Your CDN, your payment processor, your email service, your analytics script, your font provider. If any of these fail, parts of your site break.
        </p>

        <p>
          A CDN outage can make your CSS and JavaScript unavailable, breaking your entire layout. A payment gateway timeout can kill your checkout page. A third-party script that hangs can block your page from loading entirely if it is in the <code>&lt;head&gt;</code>.
        </p>

        <p>
          <strong>What to do:</strong> Load third-party scripts asynchronously so they cannot block your page. Set timeouts on all external API calls. Monitor your critical third-party services by checking their status pages — or better yet, monitor the pages on your site that depend on them.
        </p>

        <h2>9. Traffic is unusually high</h2>

        <p>
          A traffic spike is great for your business and terrible for your infrastructure. If your hosting cannot handle the load, response times increase, database connections exhaust, and your site crashes.
        </p>

        <p>
          This happens after viral social media posts, email campaigns, product launches, or seasonal events. It also happens during{' '}
          <Link href="/blog/wordpress-brute-force-attack">brute force attacks</Link>{' '}
          and <Link href="/blog/wordpress-xmlrpc-attack">XML-RPC attacks</Link>{' '}
          that flood your server with fake requests.
        </p>

        <p>
          <strong>What to do:</strong> Know your site&apos;s capacity limits. If you expect a traffic event, scale up before it happens. Use caching aggressively. Block obvious attack traffic with a{' '}
          <a href="https://www.cloudflare.com/learning/ddos/glossary/web-application-firewall-waf/" target="_blank" rel="noopener noreferrer">web application firewall</a>. And monitor response time continuously so you see the strain before it becomes a crash.
        </p>

        <h2>10. You have not updated anything in months</h2>

        <p>
          This sounds counterintuitive because updates themselves can cause crashes. But an outdated server stack is a ticking time bomb. Unpatched WordPress core, expired PHP versions, outdated database engines, and vulnerable plugins all accumulate risk over time.
        </p>

        <p>
          An unpatched plugin with a known vulnerability will eventually be exploited. An outdated PHP version will eventually stop receiving security fixes from your host. WordPress core security releases close vulnerabilities that attackers are actively scanning for.
        </p>

        <p>
          <strong>What to do:</strong> Update WordPress core, plugins, and themes regularly. Test updates on a staging site first. Keep your PHP version current. And monitor your site after every update — <Link href="/blog/wordpress-auto-update-broke-site">auto-updates can break things</Link> and you need to know within a minute, not a day.
        </p>

        <h2>How monitoring catches all 10 warning signs</h2>

        <p>
          You cannot manually check for all 10 of these warning signs every day. But monitoring can. Here is how each one maps to a specific monitoring type:
        </p>

        <ul>
          <li><strong>Response time creep</strong> — HTTP monitoring tracks TTFB on every check</li>
          <li><strong>SSL expiry</strong> — SSL monitoring alerts 30/14/7 days before</li>
          <li><strong>Disk space</strong> — results in 500 errors caught by HTTP monitoring</li>
          <li><strong>Slow database</strong> — increases TTFB, caught by response time trends</li>
          <li><strong>Error rate spikes</strong> — intermittent 500s caught by HTTP monitoring</li>
          <li><strong>Hosting throttling</strong> — TTFB increase caught by response time trends</li>
          <li><strong>DNS changes</strong> — DNS monitoring checks records daily</li>
          <li><strong>Third-party failures</strong> — keyword monitoring catches missing content</li>
          <li><strong>Traffic spikes</strong> — response time increase caught by HTTP monitoring</li>
          <li><strong>Outdated software</strong> — resulting crashes caught by HTTP + keyword monitoring</li>
        </ul>

        <p>
          Three monitors — HTTP, keyword, and SSL — cover all ten warning signs. Set them up once and they watch for you 24/7.
        </p>

        <div className="blog-cta-section">
          <h3>Check your site for warning signs right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See exactly where your site is vulnerable.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Stop reacting to downtime — start predicting it</h2>

        <p>
          Every hour of downtime costs you visitors, revenue, and Google rankings. Most of it is preventable. The warning signs are always there — you just need something watching for them.
        </p>

        <p>
          <Link href="/signup">Upnotify</Link> monitors your site every 60 seconds for HTTP status, response time, SSL validity, keyword presence, and DNS records. You see trends before they become outages. You get alerts before your visitors notice anything is wrong.
        </p>

        <p>
          Stop discovering downtime from your customers. Start catching the warning signs before they become crashes.
        </p>

        <div className="blog-cta-section">
          <h3>Start monitoring your site in 60 seconds</h3>
          <p>
            Free plan available. One-minute checks. HTTP, keyword, SSL, and DNS monitoring. No credit card required.
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
            <li><Link href="/blog/website-monitoring-guide">Website Monitoring in 2026: The Complete Guide</Link></li>
            <li><Link href="/blog/wordpress-slow-ttfb">WordPress TTFB Over 3 Seconds: Why Your Site Feels Dead</Link></li>
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
