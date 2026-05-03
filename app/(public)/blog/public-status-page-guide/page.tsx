import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'How to Create a Public Status Page for Your Website (Free)',
  description:
    'Learn what public status pages are, why customers expect them, and how to set one up for free. Best practices, real examples, and step-by-step instructions.',
  alternates: { canonical: 'https://uptrue.io/blog/public-status-page-guide' },
  openGraph: {
    title: 'How to Create a Public Status Page for Your Website (Free)',
    description:
      'Learn what public status pages are, why customers expect them, and how to set one up for free.',
    url: 'https://uptrue.io/blog/public-status-page-guide',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Create a Public Status Page for Your Website (Free)',
    description:
      'Learn what public status pages are, why customers expect them, and how to set one up for free.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is a public status page?',
    answer:
      'A public status page is a web page — usually hosted on a subdomain like status.yoursite.com — that shows the real-time operational status of your services. It displays which systems are operational, degraded, or experiencing an outage, along with incident history and uptime percentages. Anyone can visit it without logging in.',
  },
  {
    question: 'Why do I need a status page if I already have monitoring?',
    answer:
      'Monitoring tells you when something is wrong. A status page tells your customers when something is wrong — and what you are doing about it. Without a status page, your support team gets flooded with "is it just me?" messages during every outage. A status page reduces support volume by up to 60% during incidents and builds trust through transparency.',
  },
  {
    question: 'Can I create a free status page?',
    answer:
      'Yes. Several monitoring platforms, including Uptrue, offer free status pages. With Uptrue, you can create a branded public status page that automatically updates based on your monitor data — no coding required. The free plan includes one status page with up to 3 monitors displayed.',
  },
]

export default function PublicStatusPageGuidePage(): React.ReactElement {
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
          headline: 'How to Create a Public Status Page for Your Website (Free)',
          description: 'Learn what public status pages are, why customers expect them, and how to set one up for free.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-06',
          dateModified: '2026-03-06',
          url: 'https://uptrue.io/blog/public-status-page-guide',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Guide</span>
          <span>6 March 2026</span>
          <span>10 min read</span>
        </div>
        <h1 className="blog-article-title">How to Create a Public Status Page for Your Website (Free)</h1>
        <p className="blog-article-subtitle">
          Your customers should never have to wonder whether your site is down. Here is how to give them a clear, always-up-to-date answer.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>What exactly is a status page?</h2>

        <p>
          You have probably seen one before, even if you did not think about it at the time.
          When Slack has an issue, you can visit status.slack.com. When GitHub is slow, there is
          githubstatus.com. When AWS is having a bad day — which affects half the internet — their
          status page is where everyone goes for answers.
        </p>

        <p>
          A status page is a public, standalone web page that shows the current health of your
          services. No login required. No support ticket needed. Your customers visit it and
          instantly see whether your systems are operational, experiencing issues, or currently
          down.
        </p>

        <p>
          The best status pages also show incident history — what happened, when it started,
          how long it lasted, and what was done to fix it. This kind of transparency is not just
          nice to have. In 2026, your customers expect it.
        </p>

        <h2>Why your website needs a status page</h2>

        <h3>It reduces support tickets during outages</h3>

        <p>
          When your site goes down, every customer has the same question: &quot;Is it just me, or
          is the site down?&quot; Without a status page, they all email your support team. With one,
          they check the status page and get their answer immediately. Companies with public
          status pages report 40-60% fewer support tickets during incidents.
        </p>

        <h3>It builds trust through transparency</h3>

        <p>
          Every service has downtime. What separates professional operations from amateur ones is
          how they communicate about it. A status page says: &quot;We know about this, we are
          working on it, and here is the timeline.&quot; That is infinitely better than silence.
        </p>

        <p>
          Interestingly, companies that publish their uptime data publicly — even when it shows
          occasional incidents — tend to be trusted more than companies that claim 100% uptime.
          People know perfection is not real. Transparency is.
        </p>

        <h3>It is good for your business</h3>

        <p>
          For SaaS companies, a status page is increasingly expected during the sales process.
          Enterprise buyers check your status page history before signing contracts. If you do not
          have one, they either assume you are too small to bother — or worse, that you have
          something to hide.
        </p>

        <h3>It helps your team, too</h3>

        <p>
          During an incident, your engineering team should be fixing the problem — not answering
          emails from sales, support, and customers. A status page is a single source of truth
          that keeps everyone informed without taking engineers away from the fix.
        </p>

        <h2>What a good status page includes</h2>

        <p>
          Not all status pages are created equal. Here is what yours should include to be actually
          useful.
        </p>

        <h3>Current status of each service</h3>
        <p>
          Do not just show one big &quot;operational&quot; banner. Break your services into
          components — your main website, your API, your dashboard, your payment system — and
          show the status of each one individually. When your API is down but your website is
          fine, people using your API need to know that specifically.
        </p>

        <h3>Uptime history</h3>
        <p>
          Show uptime bars for the last 30, 60, or 90 days. This gives visitors a visual history
          of your reliability. Green bars mean good days. Anything else shows there was an issue.
          It is honest, it is clear, and it builds confidence when most of those bars are green.
        </p>

        <h3>Incident timeline</h3>
        <p>
          When there is an active incident, show a timeline of updates: when it was detected,
          what the impact is, what is being done, and when it was resolved. Dated, timestamped,
          factual updates. Not vague corporate speak.
        </p>

        <h3>Subscription option</h3>
        <p>
          Let visitors subscribe to updates via email or webhook. When an incident happens, they
          get notified automatically instead of having to refresh the page. This is especially
          important for B2B customers who integrate with your services.
        </p>

        <h2>How to set up a status page (step by step)</h2>

        <p>
          You have two options: build one yourself, or use a monitoring platform that includes
          status pages. Unless you enjoy reinventing wheels, the second option is faster,
          more reliable, and usually free.
        </p>

        <h3>Option 1: Use a monitoring platform (recommended)</h3>

        <p>
          Modern monitoring tools like Uptrue include status pages as part of the platform.
          Here is how it works:
        </p>

        <ol className="blog-steps">
          <li>
            <strong>Sign up and add your monitors.</strong> Add HTTP, SSL, DNS, or any other
            checks for the services you want to display on your status page.
          </li>
          <li>
            <strong>Create a status page.</strong> Pick which monitors to include, choose your
            branding (logo, colours, custom domain), and give it a public URL.
          </li>
          <li>
            <strong>Share the URL.</strong> Add a link in your website footer, your documentation,
            and your support emails. Common patterns include status.yoursite.com or
            yoursite.com/status.
          </li>
          <li>
            <strong>Let it run.</strong> The status page updates automatically based on your
            monitor data. When an incident happens, it shows up on the page without you lifting
            a finger.
          </li>
        </ol>

        <p>
          The whole process takes about five minutes. No code, no hosting, no maintenance.
        </p>

        <h3>Option 2: Build your own</h3>

        <p>
          If you want full control, you can build a status page from scratch. You will need:
          a backend to collect health check data, a database to store incident history, a frontend
          to display it, hosting, SSL, and a notification system for subscribers. It is a
          perfectly viable project — just know that it is a meaningful investment of engineering
          time that you will need to maintain indefinitely.
        </p>

        <p>
          For most teams, the monitoring platform route is the pragmatic choice.
        </p>

        <h2>Status page best practices</h2>

        <h3>Keep it honest</h3>
        <p>
          Do not mark services as &quot;operational&quot; when they are slow or partially broken.
          Your users know better. Use statuses like &quot;degraded performance&quot; or
          &quot;partial outage&quot; when appropriate. Honesty earns more trust than a green
          dashboard that does not match reality.
        </p>

        <h3>Update during incidents — frequently</h3>
        <p>
          During an active incident, update the status page at least every 30 minutes, even if
          the update is &quot;still investigating.&quot; Silence during an outage is worse than
          saying &quot;we are still working on it.&quot; People can handle waiting. They cannot
          handle not knowing if anyone is working on the problem.
        </p>

        <h3>Write clear incident summaries</h3>
        <p>
          After every incident, publish a brief summary: what happened, what the impact was, how
          long it lasted, and what you are doing to prevent it from happening again. Keep it
          factual and jargon-free. Your customers are not reading your Kubernetes logs — they want
          to know if their data is safe and when things will be normal again.
        </p>

        <h3>Make it easy to find</h3>
        <p>
          Put a link to your status page in your website footer, your documentation, your support
          articles, and your error pages. When someone hits an error on your site, a link to the
          status page is the most helpful thing you can show them.
        </p>

        <h3>Brand it properly</h3>
        <p>
          Your status page should look like it belongs to your company. Same logo, same colours,
          same feel. A generic-looking status page feels like an afterthought. A branded one feels
          like a professional operation.
        </p>

        <h2>Real-world examples of great status pages</h2>

        <p>
          Some companies do status pages exceptionally well. Here is what you can learn from them.
        </p>

        <p>
          <strong>Atlassian</strong> breaks their services into granular components (Jira, Confluence,
          Bitbucket, each with sub-components) and provides detailed incident reports with
          timestamps. You always know exactly which part of their platform is affected.
        </p>

        <p>
          <strong>Cloudflare</strong> shows per-region status for their global network. If there
          is an issue in Asia Pacific but Europe is fine, you can see that immediately. This is
          especially useful for services with global infrastructure.
        </p>

        <p>
          <strong>Linear</strong> keeps their status page minimal and clean — just the essentials,
          no clutter. It matches their product design philosophy perfectly.
        </p>

        <h2>Status pages as a marketing tool</h2>

        <p>
          Here is something most people do not realise: a well-maintained status page with strong
          uptime history is actually a selling point. When prospects are evaluating your product,
          they often check your status page. A history of 99.99% uptime with clear, professional
          incident communication says more about your reliability than any sales pitch.
        </p>

        <p>
          Some companies even link to their status page from their pricing and features pages.
          It is a quiet flex that works.
        </p>

        <p>
          If you are interested in using your uptime data for broader visibility, check out
          the{' '}<Link href="/tracker">Uptrue Tracker</Link>{' '}— it lets anyone check the uptime
          status of any website, which is great for transparency and SEO.
        </p>

        <div className="blog-cta-section">
          <h3>Create your free status page</h3>
          <p>
            Set up a branded public status page in under 5 minutes. Automatic updates from your
            monitors. No coding required. Free plan available.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Create Your Status Page
          </Link>
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
            <li><Link href="/blog/uptime-monitoring-agencies">Uptime Monitoring for Agencies: Managing 100+ Client Sites</Link></li>
            <li><Link href="/blog/ssl-certificate-monitoring">SSL Certificate Monitoring: Why Auto-Renew Isn&apos;t Enough</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
