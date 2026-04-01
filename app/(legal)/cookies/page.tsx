import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Uptrue Cookie Policy. Understand what cookies and similar technologies we use on our website and monitoring platform.',
  alternates: { canonical: 'https://uptrue.io/cookies' },
}

export default function CookiePolicyPage(): React.ReactElement {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className="legal-updated">Last updated: 30 March 2026</p>

      <p>
        This Cookie Policy explains how Vision Software Solutions Limited (&quot;Uptrue&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses
        cookies and similar technologies on our website at uptrue.io and our monitoring platform
        (the &quot;Service&quot;). This policy should be read alongside our
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files that are placed on your device (computer, tablet, or mobile phone)
        when you visit a website. They are widely used to make websites work efficiently, to remember
        your preferences, and to provide information to the site operator. Cookies may be set by the
        website you are visiting (&quot;first-party cookies&quot;) or by third parties whose services the website
        uses (&quot;third-party cookies&quot;).
      </p>
      <p>
        In addition to cookies, we may also use similar technologies such as local storage (localStorage
        and sessionStorage) to store small amounts of data in your browser.
      </p>

      <h2>2. Cookies We Use</h2>

      <h3>2.1 Strictly Necessary Cookies</h3>
      <p>
        These cookies are essential for the operation of the Service. Without them, core functionality
        such as authentication and session management would not be possible. Because they are strictly
        necessary, they do not require your consent under applicable law. They cannot be disabled without
        breaking the Service.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie Name</th>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-access-token</td>
            <td>Supabase (first-party)</td>
            <td>Stores your authenticated session access token. Required for you to remain logged in and for the Service to verify your identity on each request.</td>
            <td>1 hour (refreshed automatically)</td>
          </tr>
          <tr>
            <td>sb-refresh-token</td>
            <td>Supabase (first-party)</td>
            <td>Stores a refresh token used to obtain a new access token when the current one expires, maintaining your session without requiring you to log in again.</td>
            <td>7 days</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Functional Storage</h3>
      <p>
        We use browser localStorage (not cookies) to remember certain interface preferences so that
        your experience is consistent across visits. This data remains entirely on your device and is
        never transmitted to our servers.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Technology</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>uptrue-workspace-preference</td>
            <td>localStorage</td>
            <td>Remembers your most recently selected workspace so the Service opens to the correct view.</td>
            <td>Persistent (until cleared)</td>
          </tr>
          <tr>
            <td>uptrue-sidebar-collapsed</td>
            <td>localStorage</td>
            <td>Remembers whether you prefer the sidebar navigation collapsed or expanded.</td>
            <td>Persistent (until cleared)</td>
          </tr>
        </tbody>
      </table>

      <h3>2.3 Analytics Cookies</h3>
      <p>
        At present, Uptrue does not set any analytics cookies on the platform. We do not use Google
        Analytics, Facebook Pixel, or any other third-party analytics tracker on the core Service.
      </p>
      <p>
        <strong>Agency white-label pages:</strong> Agencies using the Service may optionally configure
        their own Google Tag Manager (GTM) container, Google Analytics (GA4) property, or Meta Pixel
        on their white-labelled monitoring pages. If an Agency has configured such tracking, those
        third-party cookies will be set by the respective third party (Google, Meta, etc.) and are
        governed by that third party&apos;s privacy and cookie policies, not by Uptrue. Uptrue&apos;s own
        analytics are never injected on white-label pages.
      </p>

      <h3>2.4 Third-Party Cookies</h3>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>When Set</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stripe</td>
            <td>During payment and checkout flows</td>
            <td>Stripe may set cookies to facilitate secure payment processing, prevent fraud, and
              comply with financial regulations. These cookies are governed by
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>3. How to Manage Cookies</h2>
      <p>
        You can manage or delete cookies through your browser settings. Most browsers allow you to:
      </p>
      <ul>
        <li>View the cookies stored on your device</li>
        <li>Delete individual cookies or all cookies</li>
        <li>Block cookies from specific or all websites</li>
        <li>Set preferences for first-party and third-party cookies separately</li>
      </ul>
      <p>
        Please note that if you block or delete the strictly necessary cookies listed above
        (sb-access-token and sb-refresh-token), you will not be able to log in or use the authenticated
        features of the Service.
      </p>
      <p>
        Instructions for managing cookies in common browsers:
      </p>
      <ul>
        <li>
          <strong>Google Chrome:</strong>{' '}
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
            Manage cookies in Chrome
          </a>
        </li>
        <li>
          <strong>Mozilla Firefox:</strong>{' '}
          <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">
            Clear cookies in Firefox
          </a>
        </li>
        <li>
          <strong>Apple Safari:</strong>{' '}
          <a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
            Manage cookies in Safari
          </a>
        </li>
        <li>
          <strong>Microsoft Edge:</strong>{' '}
          <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
            Delete cookies in Edge
          </a>
        </li>
      </ul>
      <p>
        To clear localStorage data, use your browser&apos;s developer tools (usually accessible via F12)
        and navigate to the Application or Storage tab.
      </p>

      <h2>4. Cookie Consent</h2>
      <p>
        When you first visit uptrue.io, we display a cookie consent banner informing you of the cookies
        in use. Because we currently use only strictly necessary cookies for the core Service, consent
        is not required under the UK Privacy and Electronic Communications Regulations (PECR) or the
        EU ePrivacy Directive for those cookies. However, we display the banner for transparency.
      </p>
      <p>
        If we introduce non-essential cookies in the future (such as analytics or marketing cookies),
        we will update this policy, display an updated consent banner, and obtain your explicit consent
        before setting those cookies.
      </p>

      <h2>5. Do Not Track</h2>
      <p>
        Some browsers offer a &quot;Do Not Track&quot; (DNT) setting. As we currently do not use tracking or
        analytics cookies on the core Service, the DNT signal does not change the behaviour of the
        Service. If we introduce tracking in the future, we will update this section accordingly.
      </p>

      <h2>6. Changes to This Cookie Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. When we make material changes, we will
        update the &quot;Last updated&quot; date at the top of this page and, where appropriate, notify you via
        email or a notice within the Service.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        If you have any questions about this Cookie Policy, please contact us at:
      </p>
      <ul>
        <li><strong>Email:</strong> privacy@uptrue.io</li>
        <li><strong>Post:</strong> Vision Software Solutions Limited, C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW</li>
      </ul>
    </>
  )
}
