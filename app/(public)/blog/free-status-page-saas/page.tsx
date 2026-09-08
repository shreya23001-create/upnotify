import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'How to Set Up a Free Public Status Page for Your SaaS',
  description:
    'Learn why every SaaS needs a public status page, what to include, and how to set one up for free in under five minutes with Upnotify. Build trust and reduce support tickets.',
  alternates: { canonical: 'https://uptrue.io/blog/free-status-page-saas' },
  openGraph: {
    title: 'How to Set Up a Free Public Status Page for Your SaaS',
    description:
      'Every SaaS needs a public status page. Learn what to include and how to set one up for free in five minutes.',
    url: 'https://uptrue.io/blog/free-status-page-saas',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Set Up a Free Public Status Page for Your SaaS',
    description:
      'Every SaaS needs a public status page. Learn what to include and how to set one up for free in five minutes.',
  },
}

const FAQ_DATA = [
  {
    question: 'What is a public status page?',
    answer:
      'A public status page is a webpage that shows the real-time operational status of your services. It displays which components are operational, degraded, or experiencing outages. Customers can visit the page anytime to check if your service is working, view historical uptime data, and subscribe to updates. Examples include status pages from GitHub, Slack, and Stripe.',
  },
  {
    question: 'Why does my SaaS need a status page?',
    answer:
      'A status page builds trust with your customers by being transparent about reliability. It reduces support tickets during outages because customers can check the status themselves instead of contacting you. It also demonstrates professionalism — enterprise customers expect a status page and many procurement teams require one before signing contracts.',
  },
  {
    question: 'What should I include on my status page?',
    answer:
      'At minimum, include: individual component status for each critical part of your service (API, dashboard, authentication, etc.), current incident information with updates, historical uptime data showing reliability over time, and a subscription option so users can get notified of changes. Optionally, include response time graphs and scheduled maintenance windows.',
  },
  {
    question: 'How much does a status page cost?',
    answer:
      'Dedicated status page providers charge between $29 and $399 per month. Upnotify includes a public status page on the free plan at no cost. The status page is connected to your monitors and updates automatically — no manual updating required during incidents.',
  },
  {
    question: 'Can I use a custom domain for my status page?',
    answer:
      'Yes. With Upnotify, you can point a custom subdomain like status.yourdomain.com to your status page using a CNAME record. This keeps your branding consistent and makes the page look like a native part of your product rather than a third-party service.',
  },
  {
    question: 'Does the status page update automatically during outages?',
    answer:
      'Yes. When your Upnotify monitors detect a failure, the status page updates automatically to reflect the incident. When the monitors confirm recovery, the page updates again. You can also add manual incident updates with custom messages to keep your customers informed about what is happening and what you are doing about it.',
  },
  {
    question: 'How do I handle scheduled maintenance on my status page?',
    answer:
      'You can create scheduled maintenance windows in Upnotify that appear on your status page in advance. Subscribed users are notified before the maintenance starts. During the window, the affected components show as under maintenance rather than as an outage, setting correct expectations for your customers.',
  },
  {
    question: 'What do enterprise customers expect from a status page?',
    answer:
      'Enterprise customers expect: individual component monitoring (not just a single status), historical uptime percentage data (typically 90 days), incident history with resolution details, subscription options for email or webhook notifications, and an SLA-compliant uptime display. Many procurement and security teams check for a status page during vendor evaluation.',
  },
]

export default function FreeStatusPageSaasPage(): React.ReactElement {
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
          headline: 'How to Set Up a Free Public Status Page for Your SaaS',
          description: 'Why every SaaS needs a public status page and how to set one up for free in under five minutes.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
          url: 'https://uptrue.io/blog/free-status-page-saas',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">Guide</span>
          <span>3 April 2026</span>
          <span>11 min read</span>
        </div>
        <h1 className="blog-article-title">How to Set Up a Free Public Status Page for Your SaaS</h1>
        <p className="blog-article-subtitle">
          When your service goes down, your customers have two options: panic and email you, or check your status page. Only one of those options scales.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The moment you need a status page and do not have one</h2>

        <p>
          It is 2pm on a Tuesday. Your API goes down. Within five minutes, your support inbox has 47 emails all asking the same question: &quot;Is the service down?&quot;
        </p>

        <p>
          Your team stops working on the fix to answer support tickets. Your social media fills with complaints. Customers who cannot reach your support channels assume the worst and start evaluating competitors. The outage lasts 20 minutes. The support backlog lasts three hours.
        </p>

        <p>
          Now imagine the same scenario with a status page. Your monitoring detects the outage. The status page updates automatically. Customers visit <code>status.yourdomain.com</code>, see the incident, and know you are aware of it. Your team focuses entirely on fixing the problem. Support tickets drop by 80%. The outage lasts 20 minutes. The cleanup lasts 20 minutes.
        </p>

        <p>
          That is the difference a status page makes. It is not a nice-to-have. For any SaaS product with paying customers, it is infrastructure.
        </p>

        <h2>What a status page actually is</h2>

        <p>
          A public status page is a dedicated webpage that shows the real-time operational status of your service. It has three jobs:
        </p>

        <ol>
          <li><strong>Show current status</strong> — is each component of your service operational, degraded, or down?</li>
          <li><strong>Communicate during incidents</strong> — what happened, what is being done, and when it will be resolved?</li>
          <li><strong>Show historical reliability</strong> — what is your uptime track record over the last 30, 60, or 90 days?</li>
        </ol>

        <p>
          Companies like{' '}
          <a href="https://www.githubstatus.com/" target="_blank" rel="noopener noreferrer">GitHub</a>,{' '}
          <a href="https://status.stripe.com/" target="_blank" rel="noopener noreferrer">Stripe</a>,{' '}
          and <a href="https://status.slack.com/" target="_blank" rel="noopener noreferrer">Slack</a>{' '}
          all maintain public status pages. It has become the standard that customers expect from any SaaS product they rely on.
        </p>

        <h2>Why your SaaS needs one — even if you are small</h2>

        <h3>It reduces support tickets dramatically</h3>

        <p>
          During an outage, the majority of support tickets are not asking for help — they are asking &quot;is it down?&quot; A status page answers that question before the customer ever contacts you. According to{' '}
          <a href="https://www.atlassian.com/incident-management/handbook/status-pages" target="_blank" rel="noopener noreferrer">Atlassian&apos;s incident management handbook</a>,{' '}
          status pages can reduce incident-related support volume by up to 80%.
        </p>

        <p>
          For a small team where founders handle support, this is the difference between fixing the problem and drowning in &quot;is it down?&quot; messages while the problem gets worse.
        </p>

        <h3>It builds trust through transparency</h3>

        <p>
          Every service has downtime. The companies that earn trust are the ones that communicate openly about it. A status page says: &quot;We take reliability seriously. We monitor our service. We are transparent when things go wrong.&quot;
        </p>

        <p>
          Hiding outages erodes trust. Customers know when something is not working. If they check your site, see the problem, and then visit your Twitter where you have said nothing — they assume you either do not know or do not care. Neither is good.
        </p>

        <h3>Enterprise customers require it</h3>

        <p>
          If you sell to businesses — especially mid-market or enterprise — their procurement and security teams will look for a status page. It is part of vendor due diligence. They want to see your uptime history, how you handle incidents, and whether you have monitoring in place.
        </p>

        <p>
          Not having a status page does not just look unprofessional — it can disqualify you from enterprise deals. Having one, even a simple one, demonstrates operational maturity.
        </p>

        <h3>It is better than Twitter for incident communication</h3>

        <p>
          Many SaaS companies use Twitter to communicate during outages. The problem: not all your customers follow you on Twitter. Twitter&apos;s algorithm may not show your tweet. And mixing incident updates with marketing tweets is messy.
        </p>

        <p>
          A status page is a dedicated, predictable location your customers can always check. You can link to it from your docs, your app, your error pages, and your email signatures. It becomes the single source of truth during incidents.
        </p>

        <h2>What to include on your status page</h2>

        <h3>Individual component status</h3>

        <p>
          Do not just show one green or red light for your entire service. Break it into components that your customers care about. For a typical SaaS, this might be:
        </p>

        <ul>
          <li><strong>API</strong> — your core service endpoint</li>
          <li><strong>Dashboard</strong> — the web application</li>
          <li><strong>Authentication</strong> — login and signup</li>
          <li><strong>Webhooks</strong> — outbound event delivery</li>
          <li><strong>Email notifications</strong> — transactional emails</li>
        </ul>

        <p>
          This way, if your email notifications are delayed but your API is running fine, customers can see exactly what is affected. It prevents a minor issue from looking like a total outage.
        </p>

        <h3>Uptime history bars</h3>

        <p>
          Show a visual bar for each component showing uptime over the last 90 days. Each day is a bar segment — green for fully operational, yellow for degraded, red for outage. This gives customers and prospects an instant view of your reliability track record.
        </p>

        <h3>Current incident details</h3>

        <p>
          During an active incident, show: what is affected, when it started, what you are doing about it, and estimated time to resolution. Update this regularly — even if the update is &quot;we are still investigating.&quot; Silence during an outage is worse than admitting you have not found the cause yet.
        </p>

        <h3>Incident history</h3>

        <p>
          Keep a log of past incidents with start time, end time, what happened, and what you did to fix it. This serves two purposes: it shows customers you are transparent, and it helps your own team learn from past failures.
        </p>

        <h3>Subscribe functionality</h3>

        <p>
          Let visitors subscribe to status updates via email. When an incident occurs, subscribed users get notified automatically. This is the proactive alternative to customers discovering outages on their own and contacting support.
        </p>

        <h2>How to set up a free status page with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify</Link> includes public status pages on the free plan. The status page connects directly to your monitors — when a monitor detects a failure, the status page updates automatically. No manual intervention required.
        </p>

        <h3>Step 1: Set up your monitors</h3>

        <p>
          Before creating the status page, add monitors for each component of your service. For a typical SaaS:
        </p>

        <ol>
          <li><strong>HTTP monitor</strong> for your API endpoint — checks response code and response time</li>
          <li><strong>HTTP monitor</strong> for your dashboard/web app — checks it loads correctly</li>
          <li><strong>Keyword monitor</strong> for your login page — verifies the login form renders properly</li>
          <li><strong>SSL monitor</strong> for your domain — catches certificate issues before they affect users</li>
        </ol>

        <p>
          Each monitor becomes a component on your status page. Read our{' '}
          <Link href="/blog/what-is-uptime-monitoring">uptime monitoring guide</Link>{' '}
          if you are new to setting up monitors.
        </p>

        <h3>Step 2: Create the status page</h3>

        <ol>
          <li>Go to <strong>Status Pages</strong> in your Upnotify dashboard</li>
          <li>Click <strong>Create Status Page</strong></li>
          <li>Name your status page — use your product name</li>
          <li>Select which monitors to display as components</li>
          <li>Choose a slug — this becomes <code>uptrue.io/status/your-slug</code></li>
          <li>Optionally set a custom domain — <code>status.yourdomain.com</code></li>
        </ol>

        <h3>Step 3: Add a CNAME for your custom domain (optional)</h3>

        <p>
          If you want to use <code>status.yourdomain.com</code>, add a CNAME record in your DNS that points to the status page URL. This keeps the branding consistent — your customers see your domain, not a third-party service.
        </p>

        <h3>Step 4: Link to it everywhere</h3>

        <p>
          Your status page only works if customers can find it. Add links to it in:
        </p>

        <ul>
          <li>Your application footer</li>
          <li>Your documentation</li>
          <li>Your error pages (especially 500 and 503 pages)</li>
          <li>Your support email template</li>
          <li>Your email signatures</li>
          <li>Your onboarding emails</li>
        </ul>

        <p>
          The goal is that when a customer experiences an issue, the status page is the first thing they think to check — not your support inbox.
        </p>

        <div className="blog-cta-section">
          <h3>Check your SaaS health for free</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See where your service stands.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>How to communicate during incidents</h2>

        <p>
          Having a status page is step one. Using it well during incidents is what actually builds trust. Here are the rules.
        </p>

        <h3>Acknowledge fast</h3>
        <p>
          The moment your monitoring detects an issue, acknowledge it on the status page. Even if you do not know the cause yet, post: &quot;We are investigating reports of [issue]. We will update this page as we learn more.&quot; Fast acknowledgement tells customers you are on it.
        </p>

        <h3>Update regularly</h3>
        <p>
          Post an update every 15 to 30 minutes during an active incident, even if nothing has changed. &quot;We are still investigating. No further information at this time.&quot; is better than silence. Silence makes customers assume you have abandoned the problem.
        </p>

        <h3>Be specific about what is affected</h3>
        <p>
          &quot;We are experiencing issues&quot; is useless. &quot;The API is returning 503 errors for approximately 30% of requests. The dashboard and authentication are unaffected.&quot; is useful. Specificity reduces panic.
        </p>

        <h3>Post a resolution summary</h3>
        <p>
          When the incident is resolved, post what happened, what caused it, how it was fixed, and what you are doing to prevent it from happening again. This is the post-mortem summary. It builds enormous trust because it shows accountability and continuous improvement.
        </p>

        <h2>The cost of not having a status page</h2>

        <p>
          Dedicated status page services like Statuspage (by Atlassian) cost $29 to $399 per month. For early-stage SaaS companies watching every pound, that feels hard to justify.
        </p>

        <p>
          But the cost of not having one is higher. Every outage without a status page means:
        </p>

        <ul>
          <li>Dozens of support tickets that distract from fixing the problem</li>
          <li>Customer frustration from lack of communication</li>
          <li>Potential churn from customers who assume you are unreliable</li>
          <li>Lost enterprise deals from prospects who check for operational maturity</li>
        </ul>

        <p>
          <Link href="/signup">Upnotify</Link> includes public status pages on the free plan because we believe every SaaS — from day one — should have one. Monitor your service and communicate transparently without spending a penny.
        </p>

        <h2>Your customers already expect this</h2>

        <p>
          In 2026, a public status page is as expected as HTTPS. Your customers use Slack, GitHub, Stripe, AWS — all of which have status pages. When your service has an issue, they instinctively look for <code>status.yourdomain.com</code>. If it is not there, they assume you are not monitoring your own service.
        </p>

        <p>
          Set it up once. It takes five minutes. It runs forever. And the first time your service has an outage and your support inbox stays quiet because customers checked the status page instead — you will wonder why you did not do it sooner.
        </p>

        <div className="blog-cta-section">
          <h3>Create your free status page in 5 minutes</h3>
          <p>
            Free monitoring + free status page. Automatic incident detection. Custom domain support. No credit card required.
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
            <li><Link href="/blog/public-status-page-guide">How to Create a Public Status Page for Your Website (Free)</Link></li>
            <li><Link href="/blog/what-is-uptime-monitoring">What Is Uptime Monitoring and Why Every Website Needs It</Link></li>
            <li><Link href="/blog/website-monitoring-guide">Website Monitoring in 2026: The Complete Guide</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
