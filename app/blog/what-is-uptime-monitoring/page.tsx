import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'What Is Uptime Monitoring and Why Every Website Needs It',
  description:
    'Uptime monitoring checks if your website is online and alerts you when it goes down. Learn how it works, what it checks, and why every website needs it in 2026.',
  alternates: { canonical: 'https://uptrue.io/blog/what-is-uptime-monitoring' },
  openGraph: {
    title: 'What Is Uptime Monitoring and Why Every Website Needs It',
    description:
      'Learn what uptime monitoring is, how it works, and why your website needs it to stay online and trustworthy.',
    url: 'https://uptrue.io/blog/what-is-uptime-monitoring',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Is Uptime Monitoring and Why Every Website Needs It',
    description:
      'Learn what uptime monitoring is, how it works, and why your website needs it to stay online and trustworthy.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is uptime monitoring in simple terms?',
    answer:
      'Uptime monitoring is a service that checks your website regularly — usually every 60 seconds — to make sure it is online and working. If the check fails, it sends you an alert so you can fix the problem before your visitors notice. Think of it as a smoke detector for your website.',
  },
  {
    question: 'How does uptime monitoring work technically?',
    answer:
      'An uptime monitoring service sends an HTTP request to your website from an external server at regular intervals. It checks the response status code (expecting 200 OK), the response time, and optionally the page content. If the response indicates a problem — a 500 error, a timeout, or missing content — it triggers an alert to your chosen channel.',
  },
  {
    question: 'How often should my website be monitored?',
    answer:
      'For any website that generates revenue, serves customers, or affects your business reputation, one-minute check intervals are the standard. This means you know about a problem within 60 seconds of it occurring. Less critical sites can use 5-minute intervals, but one-minute monitoring catches problems before most visitors are affected.',
  },
  {
    question: 'Is uptime monitoring the same as a ping test?',
    answer:
      'No. A ping test only checks if the server is reachable at the network level. Uptime monitoring sends an actual HTTP request and checks the response, which catches application-level failures that a ping would miss — like a web server returning a 500 error, a database crash showing an error page, or a misconfiguration returning the wrong content.',
  },
  {
    question: 'What is the difference between uptime monitoring and performance monitoring?',
    answer:
      'Uptime monitoring checks whether your site is up or down. Performance monitoring measures how fast it responds and loads. Good monitoring tools do both — they check if the site is online and track response time on every check. Uptrue records Time to First Byte on every HTTP check, giving you both uptime and performance data.',
  },
  {
    question: 'Do I need uptime monitoring if my hosting provider guarantees 99.9% uptime?',
    answer:
      'Yes, absolutely. A 99.9% uptime guarantee still allows 8.7 hours of downtime per year. The guarantee does not prevent outages — it only promises a refund (usually as hosting credit) if uptime drops below the threshold. You still need to know when your site goes down so you can fix it or contact your host. The refund does not cover lost revenue or damaged reputation.',
  },
  {
    question: 'What should I do when I get a downtime alert?',
    answer:
      'First, verify the alert by checking your site yourself. Good monitoring tools use two-step confirmation to reduce false positives. If the site is genuinely down, check your hosting control panel for resource issues or maintenance notices. Check your server error logs for specific errors. If you cannot diagnose it quickly, contact your hosting provider immediately.',
  },
  {
    question: 'Can uptime monitoring prevent my website from going down?',
    answer:
      'Monitoring cannot prevent outages directly, but it dramatically reduces their impact. By catching the problem within 60 seconds instead of hours or days, you minimise the number of visitors affected, the revenue lost, and the SEO damage caused. Trend monitoring also helps you see warning signs — like gradually increasing response times — so you can fix problems before they become full outages.',
  },
]

export default function WhatIsUptimeMonitoringPage(): React.ReactElement {
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
          headline: 'What Is Uptime Monitoring and Why Every Website Needs It',
          description: 'Uptime monitoring checks if your website is online and working. Learn what it is, how it works, and why every website needs it.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-25',
          dateModified: '2026-03-25',
          url: 'https://uptrue.io/blog/what-is-uptime-monitoring',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Guide</span>
          <span>25 March 2026</span>
          <span>11 min read</span>
        </div>
        <h1 className="blog-article-title">What Is Uptime Monitoring and Why Every Website Needs It</h1>
        <p className="blog-article-subtitle">
          Your website is either making you money or losing you money. Uptime monitoring tells you which one is happening right now.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The problem nobody thinks about until it is too late</h2>

        <p>
          Here is a question most website owners cannot answer: is your website working right now?
        </p>

        <p>
          Not &quot;was it working when I last checked.&quot; Not &quot;my hosting provider says it is up.&quot; Right now, at this exact moment, can a visitor in London or New York or Sydney load your homepage and see what they are supposed to see?
        </p>

        <p>
          If you do not have uptime monitoring, the honest answer is: you do not know.
        </p>

        <p>
          Your website could be down right now. It could have been down for an hour. A plugin update could have crashed it at 3am. Your SSL certificate could have expired. Your hosting provider could be throttling your database. And you would not know until someone — a customer, a colleague, a friend — happens to visit your site and tells you.
        </p>

        <p>
          That is the problem uptime monitoring solves.
        </p>

        <h2>What uptime monitoring actually is</h2>

        <p>
          Uptime monitoring is a service that checks your website at regular intervals — typically every 60 seconds — and alerts you immediately if something is wrong.
        </p>

        <p>
          The concept is simple. An external server sends an HTTP request to your website, just like a real visitor would. It checks three things:
        </p>

        <ol>
          <li><strong>Did the server respond at all?</strong> If the request times out, your site is completely down.</li>
          <li><strong>What status code did it return?</strong> A healthy site returns 200 OK. A 500 means a server error. A 403 means access is blocked. A 503 means the server is overloaded.</li>
          <li><strong>How long did it take?</strong> The response time — specifically the Time to First Byte (TTFB) — tells you how fast your server is processing requests.</li>
        </ol>

        <p>
          If any of these checks fail, the monitoring service sends you an alert. Email, Slack, SMS, Microsoft Teams, webhook — however you want to be notified.
        </p>

        <p>
          That is the basic version. Modern monitoring tools like <Link href="/signup">Uptrue</Link> go further with additional check types that catch failures a simple HTTP check would miss.
        </p>

        <h2>The different types of monitoring and what each one catches</h2>

        <h3>HTTP/HTTPS monitoring</h3>

        <p>
          This is the foundation. It sends a request to your URL and checks the response code and response time. It catches: complete server outages, web server crashes, hosting suspension, firewall blocks, and severe performance degradation.
        </p>

        <p>
          What it does not catch: your site returning a 200 OK status code but showing an error page in the body. This is more common than you would think — especially with{' '}
          <Link href="/blog/wordpress-database-connection-error">WordPress database errors</Link>{' '}
          and <Link href="/blog/wordpress-white-screen-of-death">white screens</Link>.
        </p>

        <h3>Keyword monitoring</h3>

        <p>
          Keyword monitoring checks the actual content of your page. You set a word or phrase that should always appear on your site — like your site name, your tagline, or a menu item — and the monitor verifies it is there on every check.
        </p>

        <p>
          If WordPress replaces your content with an error message, if a hacker{' '}
          <Link href="/blog/wordpress-site-hacked">defaces your homepage</Link>,{' '}
          if a plugin crash shows a white screen, or if a{' '}
          <Link href="/blog/wordpress-pharma-hack">pharma hack injects hidden spam</Link>{' '}
          — keyword monitoring catches it. This is the most important monitor type for WordPress sites.
        </p>

        <h3>SSL certificate monitoring</h3>

        <p>
          SSL monitoring checks your certificate&apos;s expiry date and alerts you weeks in advance. When an SSL certificate expires, browsers show a full-screen &quot;Not Secure&quot; warning that scares away virtually every visitor. Auto-renewal{' '}
          <Link href="/blog/ssl-certificate-monitoring">fails more often than you think</Link>,{' '}
          so proactive monitoring is essential.
        </p>

        <h3>DNS monitoring</h3>

        <p>
          DNS monitoring verifies that your domain&apos;s DNS records have not changed. If someone accidentally (or maliciously) modifies your A record, CNAME, or MX records, your domain stops working or points to the wrong server. DNS monitoring catches changes the moment they happen. Learn more in our{' '}
          <Link href="/blog/dns-monitoring-explained">DNS monitoring guide</Link>.
        </p>

        <h3>Port monitoring</h3>

        <p>
          Port monitoring checks that specific services on your server are accessible. Your web server runs on ports 80 and 443. Your email server runs on port 25. Your database might be on port 3306. If a service crashes or a firewall rule blocks it, port monitoring catches it.
        </p>

        <h2>Why every website needs monitoring — no exceptions</h2>

        <h3>You cannot check your site manually</h3>

        <p>
          You sleep eight hours a night. You work on things other than staring at your website. You go on holiday. You have weekends. Your website runs 24 hours a day, 7 days a week, 365 days a year. The idea that you can manually verify it is working is a fantasy.
        </p>

        <p>
          Most website outages happen outside business hours — at night, on weekends, or during maintenance windows. By the time you check your site in the morning, it could have been down for eight hours. That is eight hours of lost visitors, lost revenue, and lost search engine trust.
        </p>

        <h3>Your hosting uptime guarantee means less than you think</h3>

        <p>
          &quot;99.9% uptime guaranteed.&quot; Sounds reassuring. Let us do the maths.
        </p>

        <p>
          99.9% uptime means your hosting provider promises no more than 8 hours and 45 minutes of downtime per year. That is a full working day of your website being offline — and the &quot;guarantee&quot; usually means a partial refund of your hosting fee, not compensation for lost business.
        </p>

        <p>
          More importantly, the uptime guarantee only covers infrastructure the host controls. If a WordPress plugin crashes your site, that is not a hosting outage. If your SSL certificate expires, that is not a hosting outage. If a database query locks up your pages, that is not a hosting outage. The guarantee does not cover most of the things that actually take websites down.
        </p>

        <p>
          According to{' '}
          <a href="https://www.pingdom.com/outages/" target="_blank" rel="noopener noreferrer">Pingdom&apos;s research</a>,{' '}
          the average website experiences several outages per month, with many lasting 30 minutes or longer. Without monitoring, most of these go completely unnoticed by the site owner.
        </p>

        <h3>Downtime costs real money</h3>

        <p>
          Every minute your website is down, you are losing potential customers. For an ecommerce site, the maths is straightforward: no site means no orders. For a lead generation site, it means missed contact form submissions. For a content site, it means lost ad revenue and search engine rankings.
        </p>

        <p>
          But the hidden cost is worse. Google crawls your site regularly. If Googlebot visits during an outage and gets a 500 error, it notes that. If it happens repeatedly, your search rankings drop. The{' '}
          <a href="https://developers.google.com/search/docs/crawling-indexing/http-network-errors" target="_blank" rel="noopener noreferrer">Google Search Central documentation</a>{' '}
          explains how server errors affect crawling and indexing.
        </p>

        <p>
          Recovering lost rankings takes weeks or months. The cost of monitoring is zero on a free plan.
        </p>

        <h3>Trust is fragile</h3>

        <p>
          When a visitor arrives at your site and sees an error page, they do not bookmark it and come back later. They leave and go to a competitor. If it happens twice, they never come back.
        </p>

        <p>
          For SaaS products, the stakes are even higher. Your customers depend on your service. Downtime means they cannot do their work. Repeated outages mean they start looking for alternatives. A{' '}
          <Link href="/blog/free-status-page-saas">public status page</Link>{' '}
          helps with transparency, but only if you know about the outage quickly enough to communicate about it.
        </p>

        <h2>How to set up uptime monitoring in 60 seconds</h2>

        <p>
          You do not need to install anything on your server. You do not need technical expertise. Here is the complete setup with <Link href="/signup">Uptrue</Link>:
        </p>

        <ol>
          <li>Go to <Link href="/signup">uptrue.io/signup</Link> and create a free account</li>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>HTTP/HTTPS</strong></li>
          <li>Enter your website URL</li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Choose your alert channel — email, Slack, or Teams</li>
          <li>Click <strong>Save</strong></li>
        </ol>

        <p>
          That is it. Your site is now being checked every 60 seconds. If it goes down, you know within a minute.
        </p>

        <p>
          For WordPress sites, add a keyword monitor as well — set it to check for your site name or a phrase from your homepage. This catches the content-level failures that HTTP monitoring alone misses.
        </p>

        <div className="blog-cta-section">
          <h3>Check your website health right now</h3>
          <p>
            Free instant health score covering uptime, SSL, DNS, security headers, and performance. No account needed.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>What to look for in a monitoring tool</h2>

        <p>
          Not all monitoring tools are equal. Here is what matters:
        </p>

        <h3>Check frequency</h3>
        <p>
          One-minute intervals are the standard for any site that matters to your business. Five-minute intervals mean you could be down for 4 minutes and 59 seconds before the check even runs. For free tools, check what interval they actually provide — many advertise &quot;free monitoring&quot; but only check every 5 or 10 minutes.
        </p>

        <h3>Multiple check types</h3>
        <p>
          HTTP monitoring alone is not enough. You need keyword monitoring to catch content failures, SSL monitoring to catch certificate problems, and DNS monitoring to catch record changes. The best tools offer all of these.
        </p>

        <h3>Two-step confirmation</h3>
        <p>
          A single failed check does not necessarily mean your site is down — it could be a network blip. Good monitoring tools run a second confirmation check from a different location before alerting you. This dramatically reduces false positives.
        </p>

        <h3>Alert channels</h3>
        <p>
          Email is the minimum. Slack, Microsoft Teams, and webhooks are essential for teams. The alert should reach you where you actually look — not buried in an inbox you check once a day.
        </p>

        <h3>Public status pages</h3>
        <p>
          A <Link href="/blog/public-status-page-guide">public status page</Link> lets your customers check your service status themselves. When an outage happens, they can see it is acknowledged and being worked on — instead of flooding your support inbox asking &quot;is the site down?&quot;
        </p>

        <h2>Common objections — and why they are wrong</h2>

        <h3>&quot;My hosting provider monitors my site&quot;</h3>
        <p>
          Your hosting provider monitors their infrastructure, not your application. If their server is running but your WordPress is crashed, they report &quot;all systems operational.&quot; External monitoring checks your site the way your visitors experience it.
        </p>

        <h3>&quot;I have a small site, it does not matter&quot;</h3>
        <p>
          Small sites are more likely to be on shared hosting, which means more frequent outages. Small sites also take longer to recover rankings after downtime because they have less search authority. Monitoring matters more for small sites, not less.
        </p>

        <h3>&quot;I will just check it manually&quot;</h3>
        <p>
          You will not. Not at 3am. Not on Saturday. Not on holiday. And even when you do check, you are checking from one location — your monitoring tool checks from external infrastructure that catches regional outages you would never see.
        </p>

        <h2>Start monitoring now — it takes 60 seconds</h2>

        <p>
          Your website is either making you money or losing you money right now. Uptime monitoring tells you which one it is. If your site is down, you know in 60 seconds. If it is slow, you see the trend. If your SSL is expiring, you know weeks in advance.
        </p>

        <p>
          The setup takes a minute. The free plan costs nothing. There is no reason not to do this right now.
        </p>

        <div className="blog-cta-section">
          <h3>Start monitoring your website for free</h3>
          <p>
            Free plan. One-minute checks. HTTP, keyword, SSL, and DNS monitoring. Public status pages. No credit card required.
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
            <li><Link href="/blog/website-monitoring-guide">Website Monitoring in 2026: The Complete Guide</Link></li>
            <li><Link href="/blog/public-status-page-guide">How to Create a Public Status Page for Your Website (Free)</Link></li>
            <li><Link href="/blog/monitor-wordpress-free">How to Monitor Your WordPress Site for Free in 2026</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
