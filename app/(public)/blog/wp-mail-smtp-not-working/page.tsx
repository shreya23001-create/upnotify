import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'WP Mail SMTP Not Sending Emails: Why Your WordPress Site Is Silently Broken',
  description:
    'WP Mail SMTP can stop sending emails without any visible error. Contact form submissions vanish, order confirmations never arrive, and password resets fail silently. Learn what causes it and how to monitor for it.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/wp-mail-smtp-not-working' },
  openGraph: {
    title: 'WP Mail SMTP Not Sending Emails: Why Your WordPress Site Is Silently Broken',
    description:
      'What causes WP Mail SMTP to silently stop sending emails, how to fix SMTP credential expiry and OAuth token failures, and how Upnotify heartbeat monitoring detects broken email delivery.',
    url: 'https://upnotify-monitoring.vercel.app/blog/wp-mail-smtp-not-working',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WP Mail SMTP Not Sending Emails: Why Your WordPress Site Is Silently Broken',
    description:
      'What causes WP Mail SMTP to silently stop sending emails, how to fix SMTP credential expiry and OAuth token failures, and how Upnotify heartbeat monitoring detects broken email delivery.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why did WP Mail SMTP stop sending emails without any error?',
    answer:
      'WP Mail SMTP can fail silently for several reasons: your SMTP credentials expired or were revoked, your OAuth token expired and could not auto-refresh, your hosting provider started blocking the SMTP port, another plugin is conflicting with the mail function, or your sending provider suspended your account for exceeding limits. WordPress does not display email failures to visitors or admins in the dashboard — the form shows a success message even when the email was never sent.',
  },
  {
    question: 'How do I know if my WordPress emails are actually being delivered?',
    answer:
      'You cannot know from within WordPress alone. The wp_mail() function returns true if it hands the message to the server, not if the email actually reaches the recipient. To verify delivery, send a test email from WP Mail SMTP settings, check your SMTP provider dashboard for delivery logs, and set up external monitoring that submits a form on a schedule and verifies receipt. Upnotify heartbeat monitoring can detect when expected pings from your forms stop arriving.',
  },
  {
    question: 'Can I use WP Mail SMTP with Gmail or Google Workspace?',
    answer:
      'Yes, but Google OAuth tokens expire and require periodic re-authentication. If the token refresh fails — which happens after password changes, security reviews, or Google policy updates — WP Mail SMTP silently stops sending. You will not see an error unless you check the plugin settings page. Google also enforces daily sending limits (500 for Gmail, 2,000 for Workspace) that can cause silent failures on high-volume sites.',
  },
  {
    question: 'Will switching SMTP providers fix the problem permanently?',
    answer:
      'Switching to a dedicated transactional email service like SendGrid, Mailgun, Postmark, or Amazon SES improves reliability significantly compared to Gmail or your hosting SMTP. These services are designed for automated email and have better deliverability, higher sending limits, and detailed logs. However, credentials can still expire, API keys can still be revoked, and accounts can still be suspended. Monitoring is still essential regardless of which provider you use.',
  },
]

export default function WpMailSmtpNotWorkingPage(): React.ReactElement {
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
          headline: 'WP Mail SMTP Not Sending Emails: Why Your WordPress Site Is Silently Broken',
          description: 'What causes WP Mail SMTP to stop sending emails silently, how to fix credential and OAuth failures, and how heartbeat monitoring detects broken email delivery.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-03-20',
          dateModified: '2026-03-20',
          url: 'https://upnotify-monitoring.vercel.app/blog/wp-mail-smtp-not-working',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>20 March 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">WP Mail SMTP Not Sending Emails: Why Your WordPress Site Is Silently Broken</h1>
        <p className="blog-article-subtitle">
          Your contact form says &quot;Message sent successfully.&quot; Your customer sees the confirmation. But the email never arrives. No bounce. No error. No warning. Your leads are disappearing into a black hole, and nobody knows.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The most dangerous kind of failure</h2>

        <p>
          A website that crashes shows you an error. A website that loads slowly shows you a spinner. But a website with broken email shows you absolutely nothing. The form works. The success message displays. The visitor leaves, confident their message was received. And on your end — silence. The email was never sent.
        </p>

        <p>
          WP Mail SMTP is the most popular WordPress email plugin, with over five million active installations. It replaces WordPress&apos;s unreliable default <code>mail()</code> function with a proper SMTP connection to services like Gmail, SendGrid, Mailgun, or Amazon SES. When it works, it works brilliantly. When it stops working, it stops silently.
        </p>

        <p>
          There is no dashboard warning. There is no admin notification. There is no banner saying &quot;Email delivery has stopped.&quot; WordPress continues to accept form submissions, generate order confirmations, and process password resets — it just cannot deliver any of them. Your WooCommerce customers never receive their order emails. Your leads never get a response because you never saw their enquiry. Password reset links never arrive.
        </p>

        <p>
          You only find out when a customer complains. Or when you notice that you have not received a contact form submission in two weeks and wonder if business is just slow. It is not slow. Your email has been broken the entire time.
        </p>

        <h2>What causes WP Mail SMTP to stop sending</h2>

        <p>
          WP Mail SMTP connects WordPress to an external email service. That connection has multiple components, and any one of them failing breaks email delivery completely. Here are the causes, ordered by how frequently they occur.
        </p>

        <h3>1. SMTP credentials have expired or been revoked</h3>

        <p>
          SMTP connections require authentication — a username and password, or an API key. These credentials can expire, be rotated, or be revoked without notice. If you use your hosting provider&apos;s SMTP server, they might reset credentials during a server migration. If you use a third-party service, they might expire API keys after a certain period or revoke them for exceeding sending limits.
        </p>

        <p>
          When the credentials fail, WP Mail SMTP cannot authenticate with the mail server. Every email it tries to send is rejected at the authentication step. But WordPress does not know this — it calls <code>wp_mail()</code>, the function hands the message to WP Mail SMTP, and the plugin fails to connect. The form still shows &quot;success&quot; because WordPress considers the handoff successful, even though delivery failed.
        </p>

        <p>
          <strong>How to fix it:</strong> Go to WP Mail SMTP &gt; Settings in your WordPress dashboard. Check your SMTP credentials. If you use an API key, verify it is still active in your email provider&apos;s dashboard. If you use username and password authentication, confirm they are current. Send a test email from the plugin&apos;s settings page. Check the{' '}
          <a href="https://wordpress.org/plugins/wp-mail-smtp/" target="_blank" rel="noopener noreferrer">WP Mail SMTP plugin page</a>
          {' '}for documentation specific to your email provider.
        </p>

        <h3>2. OAuth token refresh failure</h3>

        <p>
          If you configured WP Mail SMTP to use Gmail or Google Workspace via OAuth, the plugin stores an access token and a refresh token. The access token expires after one hour. The refresh token is used to obtain a new access token automatically. This works seamlessly — until it does not.
        </p>

        <p>
          Google can invalidate your refresh token for several reasons: you changed your Google password, you revoked access in your Google security settings, Google performed a security review on your account, or Google updated its OAuth policies. When the refresh token is invalidated, WP Mail SMTP cannot obtain a new access token and email delivery stops completely.
        </p>

        <p>
          The plugin does not alert you when this happens. There is no email notification (because the email system is the thing that is broken). There is no dashboard warning unless you navigate to the WP Mail SMTP settings page and notice the OAuth status has changed. The failure is completely silent.
        </p>

        <p>
          <strong>How to fix it:</strong> Go to WP Mail SMTP &gt; Settings and look at the OAuth connection status. If it says disconnected or shows an error, click the button to re-authorise. You will be redirected to Google to grant access again. Once re-authorised, send a test email to confirm delivery works. Consider switching from Gmail OAuth to a dedicated transactional email service for critical business email.
        </p>

        <h3>3. Port blocking by hosting provider</h3>

        <p>
          SMTP uses specific ports to connect to the mail server: port 25 (legacy, often blocked), port 465 (SSL), port 587 (TLS, the most common), or port 2525 (alternative). Many hosting providers block outbound connections on some or all of these ports to prevent spam.
        </p>

        <p>
          This blocking can happen without warning. Your hosting provider might change their firewall rules during a security update. A shared hosting provider might block SMTP ports for all tenants because one tenant was sending spam. Your email was working yesterday, and today the port is closed.
        </p>

        <p>
          <strong>How to fix it:</strong> Check which port WP Mail SMTP is configured to use. Contact your hosting provider and ask which SMTP ports are open. If port 587 is blocked, try 465 or 2525. Some hosting providers require you to explicitly request SMTP port access. If your host blocks all SMTP ports, switch to an email provider that offers an HTTP API instead of SMTP — services like SendGrid, Mailgun, and Postmark all support API-based sending that does not require SMTP ports.
        </p>

        <h3>4. Conflict with other mail plugins</h3>

        <p>
          If you have more than one email plugin active — WP Mail SMTP and Fluent SMTP, or WP Mail SMTP and Post SMTP, or any combination — they can conflict by both trying to hook into WordPress&apos;s <code>wp_mail()</code> function. The result is unpredictable: emails might be sent twice, sent through the wrong service, or not sent at all.
        </p>

        <p>
          Contact form plugins like Contact Form 7, WPForms, and Gravity Forms also interact with the mail system. A conflict between your form plugin and your SMTP plugin can cause form submissions to fail silently while other WordPress emails (like user registration confirmations) continue to work.
        </p>

        <p>
          <strong>How to fix it:</strong> Deactivate all email-related plugins except WP Mail SMTP. Send a test email. If it works, reactivate your other plugins one by one. After each activation, send another test email. When the test fails, you have found the conflicting plugin. You may need to configure the form plugin to use the default WordPress mail function and let WP Mail SMTP handle the actual delivery.
        </p>

        <h3>5. Sending limits exceeded</h3>

        <p>
          Every email provider enforces sending limits. Gmail allows 500 emails per day (2,000 for Google Workspace). SendGrid free tier allows 100 per day. Even paid plans have hourly and daily caps. If your site exceeds these limits — which can happen if you have a sudden spike in form submissions, a WooCommerce sale, or a plugin that triggers excessive notification emails — the provider rejects further emails until the limit resets.
        </p>

        <p>
          Once again, WP Mail SMTP does not surface this error prominently. The emails fail, but the forms continue to show success messages.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your email provider&apos;s dashboard for sending statistics and error logs. If you are hitting limits, upgrade your plan or switch to a provider with higher limits. Review your WordPress notifications to reduce unnecessary emails — do you really need an email for every comment, every login, every plugin update? Disable notifications you do not need to preserve your sending quota for emails that matter.
        </p>

        <h3>6. DNS records changed or missing</h3>

        <p>
          Email providers require DNS records to verify your domain. SPF, DKIM, and DMARC records tell receiving servers that your email provider is authorised to send email on behalf of your domain. If these DNS records are removed, changed, or expire — which can happen during a DNS migration or a domain registrar change — your emails start failing delivery.
        </p>

        <p>
          The emails might still be &quot;sent&quot; from WP Mail SMTP&apos;s perspective, but they are rejected or filtered as spam by the receiving server. Your forms show success. The email provider accepted the message. But the recipient never sees it.
        </p>

        <p>
          <strong>How to fix it:</strong> Check your DNS records in your domain registrar or DNS provider. Verify that SPF, DKIM, and DMARC records match what your email provider requires. Most email providers have a DNS verification tool in their dashboard that checks your records automatically.
        </p>

        <h2>Why this is worse than a website crash</h2>

        <p>
          When your website goes down, everyone knows immediately. Visitors see an error page. Monitoring tools fire alerts. You get notifications. The problem is obvious and urgent.
        </p>

        <p>
          When your email breaks, nobody knows. The website keeps working. Forms keep accepting submissions. Customers keep seeing success messages. The problem is invisible, and it can persist for days or weeks before anyone notices. By then, you have lost an unknown number of leads, frustrated an unknown number of customers, and damaged trust with an unknown number of people who think you are ignoring them.
        </p>

        <p>
          <Link href="/blog/wordpress-contact-form-not-sending">Contact Form 7</Link> and other form plugins are particularly vulnerable because they show a green success message to the visitor regardless of whether the email was actually delivered. The visitor walks away satisfied. You never receive their message.
        </p>

        <h2>How to detect broken email delivery with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s heartbeat and keyword monitoring</Link> can detect when your WordPress email system stops working — even when everything else on your site looks perfectly fine.
        </p>

        <h3>Step 1: Set up a heartbeat monitor on your contact form</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>Heartbeat</strong> as the monitor type</li>
          <li>Configure your contact form (or a test form) to send a ping to the Upnotify heartbeat URL after successful email delivery</li>
          <li>Set the expected interval — for example, <strong>every 24 hours</strong></li>
          <li>If the heartbeat ping does not arrive within the expected window, Upnotify alerts you</li>
        </ol>

        <p>
          A heartbeat monitor works on the principle of &quot;if I do not hear from you, something is wrong.&quot; You configure a scheduled task or a monitoring form that sends a ping to Upnotify after successfully delivering an email. If WP Mail SMTP breaks and emails stop sending, the ping stops arriving, and Upnotify alerts you.
        </p>

        <h3>Step 2: Set up a keyword monitor on your form confirmation page</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter the URL of your contact form page</li>
          <li>Set the keyword to the text of your form — a label like <strong>&quot;Send Message&quot;</strong> or <strong>&quot;Get in Touch&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>5 minutes</strong></li>
        </ol>

        <p>
          This does not detect email failure directly, but it ensures your contact form page is loading correctly. If a plugin conflict crashes the form page entirely — replacing it with an error or a blank page — this monitor catches it. Combined with the heartbeat monitor, you cover both the form display and the email delivery.
        </p>

        <h3>Step 3: Set up keyword monitoring to detect error messages</h3>

        <ol>
          <li>Add a <strong>Keyword</strong> monitor for your contact form page</li>
          <li>Set the keyword to <strong>&quot;There has been a critical error&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          If a plugin conflict between WP Mail SMTP and another plugin causes a PHP fatal error, your contact page might display the WordPress critical error message instead of your form. This monitor catches that scenario immediately.
        </p>

        <h3>Step 4: Monitor your WooCommerce order flow (if applicable)</h3>

        <p>
          If you run a WooCommerce store, broken email means customers do not receive order confirmations, shipping notifications, or download links. Set up monitors on:
        </p>

        <ul>
          <li>Your checkout page — keyword monitor for the form elements</li>
          <li>Your order confirmation page — keyword monitor for expected content</li>
          <li>Your account page — HTTP monitor for uptime</li>
        </ul>

        <h3>Step 5: Configure alerts that actually reach you</h3>

        <p>
          The irony of email monitoring is that if your email is broken, email alerts about the breakage might also be unreliable. Use multiple alert channels:
        </p>

        <ul>
          <li><strong>Slack</strong> — instant notification, not dependent on your WordPress email</li>
          <li><strong>Microsoft Teams</strong> — same benefit, different platform</li>
          <li><strong>Webhook</strong> — send alerts to PagerDuty, Opsgenie, or a custom endpoint</li>
          <li><strong>Email</strong> — Upnotify sends from its own servers, not from your WordPress site, so even if your site email is broken, Upnotify alerts still arrive</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress site health right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See your vulnerabilities before they become outages.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing WP Mail SMTP failures</h2>

        <p>
          You cannot prevent every failure, but you can reduce the chances dramatically.
        </p>

        <h3>Use a dedicated transactional email service</h3>
        <p>
          Gmail and hosting SMTP are not designed for automated email. Services like SendGrid, Mailgun, Postmark, and Amazon SES are built specifically for this purpose. They offer higher sending limits, better deliverability, detailed delivery logs, and dedicated support for transactional email. They cost money, but losing leads costs more.
        </p>

        <h3>Send a test email weekly</h3>
        <p>
          Go to WP Mail SMTP &gt; Tools &gt; Email Test every week. Send a test email to yourself. Verify it arrives. This takes 30 seconds and catches credential expiry, OAuth failures, and port blocks before they affect real submissions. Better yet, set a calendar reminder so you do not forget.
        </p>

        <h3>Check your email provider dashboard regularly</h3>
        <p>
          Every email provider has a dashboard showing delivery stats, bounce rates, and errors. If your delivery rate drops or your bounce rate spikes, something is wrong. Most providers also send email alerts about account issues — make sure these go to an address you actually check.
        </p>

        <h3>Only run one email plugin</h3>
        <p>
          Do not install WP Mail SMTP alongside Fluent SMTP, Post SMTP, or Easy WP SMTP. Pick one and deactivate the others. Multiple email plugins hooking into <code>wp_mail()</code> is a guaranteed conflict waiting to happen.
        </p>

        <h3>Set up DNS records properly from the start</h3>
        <p>
          When configuring your email provider, add all required DNS records — SPF, DKIM, and DMARC — and verify them in the provider&apos;s dashboard. Document which records you added and where, so if you change DNS providers in the future, you know exactly what needs to be recreated.
        </p>

        <h2>Stop finding out from your customers</h2>

        <p>
          Broken email is the silent killer of WordPress businesses. No error message. No visible symptom. No alert from WordPress. Your forms work perfectly — they just do not deliver the emails they promise to send.
        </p>

        <p>
          By the time a customer complains that they never received a reply, you have already lost every lead that submitted a form since the failure started. You do not know how many. You do not know who they were. They are gone.
        </p>

        <p>
          Upnotify&apos;s heartbeat monitoring detects when expected pings stop arriving. Keyword monitoring confirms your forms are loading correctly. Combined, they catch both visible crashes and invisible email failures. One minute checks. Alerts on Slack, Teams, email, and webhook. From outside your server, so WordPress email failures do not affect your monitoring.
        </p>

        <div className="blog-cta-section">
          <h3>Detect silent email failures before your customers do</h3>
          <p>
            Free plan available. Heartbeat monitoring for email delivery. Keyword monitoring for form pages. No credit card required.
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
            <li><Link href="/blog/wordpress-contact-form-not-sending">Contact Form 7 Not Sending Emails: Your Leads Are Disappearing and You Don&apos;t Know</Link></li>
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
            <li><Link href="/blog/wordpress-recovery-mode">WordPress Recovery Mode: What Triggers It, What It Means, and How to Respond</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
