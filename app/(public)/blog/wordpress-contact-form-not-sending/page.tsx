import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'Contact Form 7 Not Sending Emails: Your Leads Are Disappearing and You Don\'t Know',
  description:
    'Contact Form 7 silently stops sending emails and you lose leads without knowing. Learn why it happens, how to fix it, and how to monitor your forms so you catch broken submissions before your prospects give up.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-contact-form-not-sending' },
  openGraph: {
    title: 'Contact Form 7 Not Sending Emails: Your Leads Are Disappearing and You Don\'t Know',
    description:
      'Why Contact Form 7 stops sending emails, how to fix it, and how to set up monitoring so you never lose leads to a broken form again.',
    url: 'https://uptrue.io/blog/wordpress-contact-form-not-sending',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Form 7 Not Sending Emails: Your Leads Are Disappearing',
    description:
      'Why Contact Form 7 stops sending emails, how to fix it, and how to monitor your forms so you never lose leads again.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why is Contact Form 7 not sending emails?',
    answer:
      'The most common reason is that your hosting provider blocks the PHP mail() function. Contact Form 7 uses mail() by default, and many shared hosts disable it to prevent spam. Other causes include incorrect SMTP configuration, reCAPTCHA blocking legitimate submissions, plugin conflicts, and incorrect "From" email addresses that fail SPF/DKIM checks.',
  },
  {
    question: 'How do I test if my Contact Form 7 is actually sending emails?',
    answer:
      'Submit a test message and wait. If you do not receive it within a few minutes, check your spam folder. If it is not there either, install WP Mail Logging to see if WordPress is even attempting to send. You can also set up a keyword monitor on your thank-you page with Uptrue — if the confirmation text stops appearing after form submission, you will know immediately.',
  },
  {
    question: 'Do I need an SMTP plugin for Contact Form 7?',
    answer:
      'In most cases, yes. The PHP mail() function that Contact Form 7 uses by default is unreliable on many hosts and often lands in spam even when it works. An SMTP plugin like WP Mail SMTP routes your emails through a proper email service (Gmail, SendGrid, Mailgun, etc.) with authentication, which dramatically improves deliverability.',
  },
  {
    question: 'Can I monitor whether my contact form is working without submitting test messages manually?',
    answer:
      'Yes. With Uptrue keyword monitoring, you can monitor your contact form page and thank-you page automatically every 60 seconds. If the form page stops loading correctly, or if the confirmation message disappears, you get an alert on Slack, email, or Teams. This catches broken forms, plugin conflicts, and page errors without any manual testing.',
  },
]

export default function WordPressContactFormNotSendingPage(): React.ReactElement {
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
          headline: 'Contact Form 7 Not Sending Emails: Your Leads Are Disappearing and You Don\'t Know',
          description: 'Why Contact Form 7 stops sending emails, how to fix it, and how to set up monitoring so you catch broken forms before you lose leads.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-03-12',
          dateModified: '2026-03-12',
          url: 'https://uptrue.io/blog/wordpress-contact-form-not-sending',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>12 March 2026</span>
          <span>13 min read</span>
        </div>
        <h1 className="blog-article-title">Contact Form 7 Not Sending Emails: Your Leads Are Disappearing and You Don&apos;t Know</h1>
        <p className="blog-article-subtitle">
          Someone filled out your contact form today. They were ready to buy. The form said &quot;Thank you, your message has been sent.&quot; But you never received it. And neither of you knows.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The silent lead killer on your WordPress site</h2>

        <p>
          Here is a scenario that plays out on thousands of WordPress sites every single day. A potential customer lands on your contact page. They fill out the form carefully — their name, email, phone number, a message explaining exactly what they need. They hit submit.
        </p>

        <p>
          The form shows a nice green confirmation message: &quot;Thank you for your message. It has been sent.&quot;
        </p>

        <p>
          They close the tab, confident that you will get back to them soon. But you never received that message. It vanished. And you have absolutely no idea it ever existed.
        </p>

        <p>
          The prospect waits a day, maybe two. Then they go to your competitor. They never contact you again. They do not send you a follow-up saying &quot;hey, your form is broken.&quot; They just leave.
        </p>

        <p>
          <a href="https://wordpress.org/plugins/contact-form-7/" target="_blank" rel="noopener noreferrer">Contact Form 7</a> is the most popular WordPress form plugin, with over 5 million active installations. It is simple, reliable, and free. But it has a dirty secret: it can silently stop sending emails, and it will still tell your visitors that their message was sent successfully.
        </p>

        <p>
          The form is not broken from your visitor&apos;s perspective. It submits. It shows a success message. Everything looks fine. But the email never arrives in your inbox. And unless you are testing your own form regularly — which nobody does — you will not find out until someone complains. Or worse, until you notice that leads have mysteriously dried up.
        </p>

        <h2>Why Contact Form 7 stops sending emails</h2>

        <p>
          There are five common reasons this happens, and at least one of them probably applies to your site right now.
        </p>

        <h3>1. Your hosting provider blocks PHP mail()</h3>

        <p>
          Contact Form 7 uses PHP&apos;s built-in <code>mail()</code> function by default. This is the simplest way to send email from a server, but it is also the least reliable. Many shared hosting providers either completely block <code>mail()</code> or severely throttle it to prevent spam abuse.
        </p>

        <p>
          When <code>mail()</code> is blocked, Contact Form 7 tries to send the email, fails silently, and still shows the success message to your visitor. There is no error. No warning. Just a missing email.
        </p>

        <p>
          <strong>How to fix it:</strong> Install{' '}
          <a href="https://wordpress.org/plugins/wp-mail-smtp/" target="_blank" rel="noopener noreferrer">WP Mail SMTP</a>
          {' '}and configure it to send emails through a proper SMTP service. Gmail, SendGrid, Mailgun, Amazon SES, or your hosting provider&apos;s SMTP server all work. This bypasses <code>mail()</code> entirely and sends authenticated, deliverable emails.
        </p>

        <h3>2. SMTP is misconfigured</h3>

        <p>
          Even if you have installed an SMTP plugin, a single wrong setting will break email delivery. Common mistakes include: wrong SMTP port (use 587 for TLS or 465 for SSL), wrong encryption type, expired app passwords, or incorrect &quot;From&quot; email address.
        </p>

        <p>
          <strong>How to fix it:</strong> In WP Mail SMTP, use the &quot;Email Test&quot; feature to send a test email. If it fails, the plugin will show you exactly what went wrong. Double-check your SMTP credentials against your email provider&apos;s documentation. If you are using Gmail, make sure you are using an App Password — Gmail no longer accepts regular passwords for SMTP.
        </p>

        <h3>3. reCAPTCHA is blocking real users</h3>

        <p>
          Contact Form 7 supports reCAPTCHA to prevent spam. But reCAPTCHA v3 assigns a score to every visitor, and sometimes it scores legitimate users as bots. When this happens, the form submission is silently rejected. No email is sent, and depending on your configuration, the user might not even see an error message.
        </p>

        <p>
          <strong>How to fix it:</strong> In Contact Form 7 settings, check your reCAPTCHA threshold. The default threshold of 0.5 is often too aggressive. Lower it to 0.3 and see if deliverability improves. You can also check your{' '}
          <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">reCAPTCHA admin console</a>
          {' '}to see how many submissions are being blocked.
        </p>

        <h3>4. Plugin or theme conflict</h3>

        <p>
          WordPress plugins can interfere with each other in unpredictable ways. A security plugin might block outgoing email connections. A caching plugin might serve a cached version of your form that no longer has a valid nonce token. A theme update might break the page layout in a way that hides the form or breaks its JavaScript.
        </p>

        <p>
          <strong>How to fix it:</strong> Deactivate all plugins except Contact Form 7 and your SMTP plugin. Switch to a default WordPress theme (like Twenty Twenty-Four). Send a test submission. If it works, reactivate plugins one by one until you find the conflict.
        </p>

        <h3>5. The &quot;From&quot; address fails authentication checks</h3>

        <p>
          Modern email systems check SPF, DKIM, and DMARC records to verify that the sending server is authorised to send email from the claimed domain. If Contact Form 7 sends email &quot;from&quot; an address like <code>wordpress@yoursite.com</code>, but your DNS records do not authorise your hosting server to send email for <code>yoursite.com</code>, the email gets rejected or sent to spam.
        </p>

        <p>
          <strong>How to fix it:</strong> In your SMTP settings, set the &quot;From&quot; address to an email address on a domain you control and have properly configured SPF and DKIM records for. If you are using a service like SendGrid or Mailgun, follow their domain verification steps to add the required DNS records.
        </p>

        <h2>The deeper problem: you have no visibility</h2>

        <p>
          All five of these problems share one thing in common: they are invisible. Your form looks fine. Your site is up. Your hosting dashboard shows no errors. The only signal is an absence — the leads that should have arrived but did not.
        </p>

        <p>
          How long has it been since you tested your own contact form? Be honest. If the answer is &quot;I cannot remember,&quot; you are not alone. Most site owners set up their form once, confirm it works, and never test it again. Then a plugin update, hosting change, or server configuration change breaks it silently, and leads disappear for weeks or months.
        </p>

        <h2>How to monitor your contact form with Uptrue</h2>

        <p>
          You cannot test your form manually every day. But you can automate the monitoring so you know the moment something breaks.
        </p>

        <h3>Step 1: Monitor the contact form page itself</h3>

        <p>
          First, make sure your contact page is actually loading correctly. A broken page means a broken form.
        </p>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong></li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter your contact page URL (e.g., <code>yoursite.com/contact</code>)</li>
          <li>Set the keyword to a phrase that always appears on your contact form page — your form title, a field label like &quot;Your Message&quot;, or a submit button text like &quot;Send&quot;</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This catches situations where the form page crashes, a plugin conflict breaks the layout, or the form shortcode stops rendering. If the expected form text disappears from the page, you get an alert immediately.
        </p>

        <h3>Step 2: Monitor for error states</h3>

        <p>
          Add a second keyword monitor to detect WordPress errors on the contact page.
        </p>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong></li>
          <li>Same URL — your contact page</li>
          <li>Set the keyword to <strong>&quot;Fatal error&quot;</strong> or <strong>&quot;Error establishing a database connection&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
        </ol>

        <p>
          If a PHP fatal error or database error replaces your contact form, this monitor fires instantly.
        </p>

        <h3>Step 3: Set up an HTTP monitor as a safety net</h3>

        <ol>
          <li>Add an <strong>HTTP/HTTPS</strong> monitor for your contact page URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set check interval to <strong>1 minute</strong></li>
          <li>Configure alerts to go to Slack, email, or Teams</li>
        </ol>

        <p>
          This catches complete page failures where the server returns a 500 error or times out.
        </p>

        <h3>Step 4: Monitor your SSL certificate</h3>

        <p>
          An expired SSL certificate will show a browser warning on your contact page that stops most visitors from even reaching your form. Add an{' '}
          <Link href="/blog/ssl-certificate-monitoring">SSL certificate monitor</Link>
          {' '}to get alerted weeks before expiry.
        </p>

        <h3>Step 5: Check your site health right now</h3>

        <p>
          Run a free health check to see the current state of your site — uptime, SSL, DNS, and security headers. If there are underlying issues, fixing them now prevents future form failures.
        </p>

        <div className="blog-cta-section">
          <h3>Is your contact form page healthy?</h3>
          <p>
            Get an instant health score for your site. Checks uptime, SSL, DNS, security headers, and performance. No account required.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>What monitoring cannot do (and what you still need to fix)</h2>

        <p>
          Monitoring tells you when your form page breaks. It will not tell you if emails are silently failing to deliver. For that, you need to fix the root cause:
        </p>

        <ul>
          <li><strong>Install an SMTP plugin</strong> —{' '}
            <a href="https://wordpress.org/plugins/wp-mail-smtp/" target="_blank" rel="noopener noreferrer">WP Mail SMTP</a>
            {' '}is the most popular choice</li>
          <li><strong>Enable email logging</strong> — so you have a record of every email WordPress tries to send</li>
          <li><strong>Set up a backup notification</strong> — use Contact Form 7&apos;s Flamingo add-on to save all submissions to your WordPress database, even if email delivery fails</li>
          <li><strong>Test monthly</strong> — even with monitoring, submit a test message through your own form once a month to verify the full pipeline works</li>
        </ul>

        <p>
          Monitoring and SMTP together give you the best protection. SMTP makes your emails actually deliverable. Monitoring makes sure the form itself is always accessible.
        </p>

        <h2>The cost of a broken contact form</h2>

        <p>
          Let us do some quick maths. If your contact form generates just 2 leads per week, and your average deal is worth $500, a broken form costs you $1,000 per week. Four weeks of a silently broken form — which is not unusual — is $4,000 in lost revenue.
        </p>

        <p>
          How much does monitoring cost? Free to start. A few pounds per month for the full setup. The maths is not even close.
        </p>

        <h2>Stop finding out from your customers</h2>

        <p>
          Your WordPress site could be down right now and you would not know.
        </p>

        <p>
          Uptrue monitors your site every 60 seconds and alerts you on Slack, email, or Teams the moment something goes wrong — from full outages to subtle content changes that only a keyword monitor catches.
        </p>

        <p>
          Set up a keyword monitor on your contact form. Catch broken forms before you lose leads.
        </p>

        <div className="blog-cta-section">
          <h3>Protect your contact form and your leads</h3>
          <p>
            Free plan available. Keyword monitoring, HTTP checks, SSL monitoring. No credit card required.
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
            <li><Link href="/blog/wordpress-database-connection-error">Error Establishing a Database Connection in WordPress: Complete Fix Guide</Link></li>
            <li><Link href="/blog/wordpress-white-screen-of-death">WordPress White Screen of Death: How to Detect It Before Your Visitors Do</Link></li>
            <li><Link href="/blog/website-monitoring-guide">Website Monitoring in 2026: The Complete Guide</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
