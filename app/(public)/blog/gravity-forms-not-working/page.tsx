import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'Gravity Forms Conditional Logic Not Working: Why Your Forms Are Broken After Update',
  description:
    'Gravity Forms conditional logic can silently break after updates due to jQuery conflicts, JavaScript minification, PHP 8.x compatibility issues, and payment integration failures. Fields that should show or hide stop responding, calculations break, and payment forms fail to process. Learn what causes it and how keyword monitoring catches broken forms automatically.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/blog/gravity-forms-not-working' },
  openGraph: {
    title: 'Gravity Forms Conditional Logic Not Working: Why Your Forms Are Broken After Update',
    description:
      'What causes Gravity Forms conditional logic to break after updates, how jQuery conflicts and minification destroy form functionality, and how Upnotify keyword monitoring detects broken forms on your WordPress site.',
    url: 'https://upnotify-monitoring.vercel.app/blog/gravity-forms-not-working',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gravity Forms Conditional Logic Not Working: Why Your Forms Are Broken After Update',
    description:
      'What causes Gravity Forms conditional logic to break after updates, how jQuery conflicts and minification destroy form functionality, and how Upnotify keyword monitoring detects broken forms on your WordPress site.',
  },
}

const FAQ_DATA = [
  {
    question: 'Why did Gravity Forms conditional logic stop working after an update?',
    answer:
      'Gravity Forms conditional logic relies on JavaScript to show, hide, and modify form fields in real time. When you update Gravity Forms, WordPress core, PHP, or any other plugin, the JavaScript environment can change. A jQuery version conflict, a minification plugin combining scripts incorrectly, a theme that overrides Gravity Forms JavaScript, or a PHP 8.x incompatibility in an add-on can all break the conditional logic engine. The form still renders and the fields still appear, but the show/hide logic that depends on user selections stops responding. The form looks normal but behaves incorrectly.',
  },
  {
    question: 'Can uptime monitoring detect broken Gravity Forms?',
    answer:
      'Standard HTTP uptime monitoring cannot detect broken Gravity Forms. The page still loads and returns a 200 status code. The form HTML is still on the page. The problem is in the JavaScript layer — conditional logic, calculations, and payment processing all run in the browser. Keyword monitoring provides a practical detection method: monitor for the presence of the submit button text and form title. If a PHP error or JavaScript failure prevents the form from rendering at all, the expected text disappears and you are alerted. For conditional logic failures specifically, the form still renders but malfunctions — which requires functional testing to detect.',
  },
  {
    question: 'How do I fix Gravity Forms not working with PHP 8?',
    answer:
      'Gravity Forms core has been updated for PHP 8.x compatibility, but many Gravity Forms add-ons and third-party extensions have not. Check your PHP error log for deprecation notices and fatal errors related to Gravity Forms files. Common PHP 8 issues include: named arguments breaking in add-ons, null being passed to string functions (str_replace, strlen) that no longer accept null in PHP 8.1+, and removed functions like create_function(). Update Gravity Forms and all add-ons to their latest versions. If an add-on does not support PHP 8, contact the developer or find an alternative. Do not downgrade PHP — fix the compatibility issue.',
  },
  {
    question: 'Why are Gravity Forms calculations showing wrong results?',
    answer:
      'Gravity Forms calculations run in JavaScript in the browser. If a JavaScript error from any other plugin breaks the script execution chain before the Gravity Forms calculation script runs, calculations silently stop working. Fields show zero, NaN, or the last calculated value. JavaScript minification can also break calculations by renaming variables or removing semicolons that the calculation engine depends on. Disable JavaScript minification and combination temporarily, check the browser console for errors, and test the form. If calculations work without minification, exclude Gravity Forms scripts from your performance plugin.',
  },
]

export default function GravityFormsNotWorkingPage(): React.ReactElement {
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
          headline: 'Gravity Forms Conditional Logic Not Working: Why Your Forms Are Broken After Update',
          description: 'What causes Gravity Forms conditional logic failures, how jQuery conflicts and minification break form functionality, and how keyword monitoring catches broken forms.',
          author: { '@type': 'Organization', name: 'Upnotify' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://upnotify-monitoring.vercel.app' },
          datePublished: '2026-04-02',
          dateModified: '2026-04-02',
          url: 'https://upnotify-monitoring.vercel.app/blog/gravity-forms-not-working',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>2 April 2026</span>
          <span>14 min read</span>
        </div>
        <h1 className="blog-article-title">Gravity Forms Conditional Logic Not Working: Why Your Forms Are Broken After Update</h1>
        <p className="blog-article-subtitle">
          You built a multi-step quote request form with conditional logic. When someone selects &quot;Enterprise,&quot; additional fields appear. When they select &quot;Starter,&quot; those fields hide. It worked perfectly for months. Then you updated WordPress, or Gravity Forms, or a completely unrelated plugin — and now the conditional logic is dead. Every field shows at once. Or no fields show. Or the form submits but the conditional fields are missing from the entry.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>Conditional logic breaks silently and stays broken</h2>

        <p>
          Gravity Forms is one of the most widely used form plugins for WordPress, powering everything from simple contact forms to complex multi-page application forms with dozens of conditional rules, calculations, and payment integrations. Conditional logic is its most powerful feature — and its most fragile.
        </p>

        <p>
          Conditional logic runs entirely in the browser using JavaScript. When a user selects an option, JavaScript evaluates the rules you defined in the form builder and shows, hides, enables, or disables fields in real time. When that JavaScript breaks, conditional logic stops working. But the form itself still appears on the page. The server still returns 200. Your uptime monitor still reports the page as healthy. The form just malfunctions — silently, invisibly, for every visitor.
        </p>

        <p>
          The worst scenario is a form where conditional logic controls required fields. A visitor fills out a form where the &quot;Company size&quot; field should only appear when they select &quot;Business&quot; account type. The conditional logic is broken, so the field never appears. But the field is marked as required. The visitor clicks Submit and gets a validation error for a field they cannot see. They try again. Same error. They leave. You never know it happened because no form entry was created.
        </p>

        <h2>What causes Gravity Forms conditional logic to break</h2>

        <h3>1. jQuery conflicts with other plugins</h3>

        <p>
          Gravity Forms depends heavily on jQuery for its frontend functionality. Conditional logic, field calculations, multi-page navigation, and dynamic field population all use jQuery. When another plugin loads a different version of jQuery, removes jQuery, or modifies the jQuery loading order, Gravity Forms&apos; JavaScript can break.
        </p>

        <p>
          The most common conflict is a plugin or theme that loads jQuery from a CDN instead of using the WordPress-bundled version. WordPress loads jQuery in noConflict mode. The CDN version might not. Gravity Forms expects noConflict mode. When it is not available, the <code>gform.initializeOnLoaded</code> function fails silently, and no conditional logic rules are attached to the form fields.
        </p>

        <p>
          Another common conflict is a plugin that dequeues WordPress&apos;s jQuery and replaces it with a newer or older version. Gravity Forms is tested against the jQuery version that ships with WordPress. A different version can have subtle API differences that cause the conditional logic evaluation to fail — returning undefined where it expects a boolean, or triggering events in a different order.
        </p>

        <h3>2. JavaScript minification and combination</h3>

        <p>
          Performance plugins that minify and combine JavaScript files are one of the top causes of Gravity Forms breakage. Gravity Forms loads several JavaScript files that depend on each other in a specific order: the core form scripts, the conditional logic engine, the calculation engine, the multi-page handler, and the payment scripts.
        </p>

        <p>
          When a performance plugin combines these into a single file, the loading order can change. When it minifies them, variable names can collide. A semicolon that was technically optional in a standalone file becomes critical when two files are concatenated. The result is a JavaScript error that breaks the entire conditional logic system.
        </p>

        <p>
          This is particularly insidious because the breakage might not appear immediately. The performance plugin caches the combined file. Your browser caches it. You test the form and it works because you are seeing the pre-combination cached version. Days later, the cache expires, the browser downloads the new combined file, and conditional logic stops working. By the time you notice, you have forgotten that you changed your performance plugin settings a week ago.
        </p>

        <h3>3. PHP 8.x compatibility issues</h3>

        <p>
          PHP 8.0, 8.1, and 8.2 introduced strict type checking and removed several deprecated functions. Gravity Forms core has been updated for PHP 8.x compatibility, but many add-ons have not. A Gravity Forms add-on that worked fine on PHP 7.4 can throw fatal errors on PHP 8.1 — and those errors can be partial, crashing only specific form functionality rather than the entire page.
        </p>

        <p>
          Common PHP 8.x issues with Gravity Forms add-ons include: <code>strlen()</code> no longer accepting null values (PHP 8.1), <code>str_replace()</code> requiring string arguments instead of accepting null, deprecated <code>create_function()</code> calls in older add-ons, and named parameter conflicts. These errors can crash the form rendering process partway through, producing a form that loads but is missing fields, validation rules, or the conditional logic JavaScript.
        </p>

        <p>
          If your hosting provider recently upgraded PHP from 7.4 to 8.x — which many are doing now that PHP 7.4 is end of life — Gravity Forms add-ons that have not been updated for PHP 8 compatibility will break. The form might still render, but the fields controlled by the broken add-on will malfunction.
        </p>

        <h3>4. Payment integration failures</h3>

        <p>
          Gravity Forms integrates with Stripe, PayPal, and other payment processors through add-ons. These add-ons inject additional JavaScript into the form to handle payment field rendering, tokenisation, and submission. When a payment add-on&apos;s JavaScript fails, it can break the entire form — not just the payment fields.
        </p>

        <p>
          The Stripe add-on, for example, loads Stripe.js and attaches it to the form submission process. If{' '}
          <a href="https://docs.gravityforms.com/category/add-ons-gravity-forms/stripe-add-on/" target="_blank" rel="noopener noreferrer">the Stripe add-on</a>
          {' '}encounters an error — an invalid API key, a JavaScript conflict with another plugin, or a Stripe.js version mismatch — the form submission handler breaks. The visitor fills out the form, clicks Submit, and nothing happens. No payment is processed. No form entry is created. The form just sits there.
        </p>

        <p>
          PayPal integrations have their own set of issues. The PayPal Commerce Platform add-on loads PayPal&apos;s JavaScript SDK, which can conflict with other scripts that also load the PayPal SDK (WooCommerce PayPal, for example). Two PayPal SDK instances on the same page cause unpredictable errors.
        </p>

        <h3>5. Theme or page builder conflicts</h3>

        <p>
          Page builders like Elementor, Divi, and WPBakery load their own JavaScript frameworks. These frameworks can interfere with Gravity Forms&apos; JavaScript, especially when forms are embedded inside page builder widgets or modules. Elementor&apos;s frontend JavaScript, for example, initialises widgets after the DOM is loaded. If Gravity Forms initialises its conditional logic before Elementor finishes building the DOM, the form fields that Gravity Forms targets might not exist yet.
        </p>

        <p>
          Themes that include built-in form styling can also cause problems. A theme that applies CSS transforms or display:none to form elements during page load can interfere with Gravity Forms&apos; conditional logic visibility checks. Gravity Forms hides fields by setting <code>display: none</code> via JavaScript. If the theme also sets <code>display: none</code> and then removes it on a different timing, the two compete and fields show or hide at the wrong times.
        </p>

        <h2>How to diagnose broken Gravity Forms</h2>

        <h3>Check the browser console first</h3>

        <p>
          Open the page with your Gravity Form. Press F12 to open developer tools. Click the Console tab. Reload the page. Look for red errors. Any JavaScript error on the page — even from an unrelated plugin — can cascade and break Gravity Forms&apos; conditional logic. The error message tells you which file and line number caused the problem. If the error is in a file that is not part of Gravity Forms, that plugin is the one breaking your form.
        </p>

        <h3>Test with all other plugins deactivated</h3>

        <p>
          Deactivate every plugin except Gravity Forms. Test your form. If conditional logic works, the problem is a conflict with another plugin. Reactivate plugins one at a time, testing the form after each one. When conditional logic breaks, you have found the conflicting plugin.
        </p>

        <h3>Disable JavaScript minification and combination</h3>

        <p>
          If you use WP Rocket, Autoptimize, LiteSpeed Cache, or any other performance plugin that minifies or combines JavaScript, disable those features temporarily. Test your form. If conditional logic works without minification, the performance plugin is breaking it. Exclude Gravity Forms JavaScript files from minification and combination. In WP Rocket, go to File Optimization and add the Gravity Forms script URLs to the excluded JavaScript files list.
        </p>

        <h3>Check PHP error logs</h3>

        <p>
          Enable <code>WP_DEBUG_LOG</code> in wp-config.php and check <code>/wp-content/debug.log</code> for errors. PHP errors in Gravity Forms add-ons can prevent conditional logic rules from being output to the page. The form renders but the JavaScript that defines the conditional rules is missing from the page source. Check for deprecation notices and fatal errors from any file in the <code>gravityforms</code> directory.
        </p>

        <h2>How to fix each type of Gravity Forms failure</h2>

        <h3>jQuery conflict fix</h3>
        <p>
          Identify which plugin is loading a conflicting jQuery version using the browser Network tab — filter by &quot;jquery&quot; and look for multiple jQuery files loading. Deactivate the conflicting plugin or configure it to use the WordPress-bundled jQuery. If a theme is the culprit, contact the theme developer — loading a custom jQuery is a well-known bad practice that breaks many plugins.
        </p>

        <h3>Minification fix</h3>
        <p>
          In your performance plugin, exclude Gravity Forms JavaScript files from minification and combination. The files to exclude typically include any URL containing <code>/gravityforms/</code> or <code>gform</code>. Test the form after excluding. If it works, you have solved the problem without sacrificing overall performance — only the Gravity Forms scripts are excluded, everything else remains optimised.
        </p>

        <h3>PHP 8 fix</h3>
        <p>
          Update Gravity Forms and all add-ons to their latest versions. If an add-on does not support PHP 8, check the Gravity Forms add-on page for an updated version or an alternative. Do not downgrade PHP to fix the issue — PHP 7.4 is end of life and no longer receives security updates. Fix the compatibility at the plugin level.
        </p>

        <h3>Payment integration fix</h3>
        <p>
          Check your payment gateway API keys. Test in Stripe&apos;s or PayPal&apos;s sandbox mode. Check the browser console for JavaScript errors from the payment SDK. Ensure only one instance of the payment SDK loads on the page. Update the payment add-on to its latest version. If the problem persists, disable other plugins that load the same payment SDK.
        </p>

        <h2>How to monitor Gravity Forms with Upnotify</h2>

        <p>
          <Link href="/signup">Upnotify&apos;s keyword monitoring</Link> checks that your form pages contain the expected content. If a PHP error, JavaScript failure, or plugin conflict prevents your Gravity Form from rendering, Upnotify detects the missing content and alerts you immediately.
        </p>

        <h3>Step 1: Set up a keyword monitor on your form page</h3>

        <ol>
          <li>Sign up at <Link href="/signup">upnotify-monitoring.vercel.app/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter the URL of the page containing your Gravity Form</li>
          <li>Set the keyword to your form&apos;s <strong>submit button text</strong> — typically &quot;Submit&quot; or whatever custom text you configured</li>
          <li>Set the check type to <strong>&quot;Page must contain&quot;</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          If a PHP fatal error crashes the form rendering, the submit button text disappears from the page. If a JavaScript error prevents the form from initialising and the form is rendered via JavaScript (AJAX-enabled forms), the form content may be missing. Upnotify detects the missing keyword and alerts you.
        </p>

        <h3>Step 2: Monitor for error text on the form page</h3>

        <ol>
          <li>Click <strong>Add Monitor</strong> again</li>
          <li>Select <strong>Keyword</strong> as the monitor type</li>
          <li>Enter the same form page URL</li>
          <li>Set the keyword to <strong>&quot;fatal error&quot;</strong></li>
          <li>Set the check type to <strong>&quot;Page must NOT contain&quot;</strong></li>
          <li>Set the interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This catches PHP fatal errors that display on the page instead of the form. If WordPress debug display is accidentally enabled, or if the error occurs before output buffering starts, the error message appears on the page. Upnotify catches it immediately.
        </p>

        <h3>Step 3: Add an HTTP monitor for server-level failures</h3>

        <ol>
          <li>Add an <strong>HTTP/HTTPS</strong> monitor for the form page URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set check interval to <strong>1 minute</strong></li>
        </ol>

        <p>
          This catches complete page crashes — 500 errors from PHP fatal errors that kill the entire page, not just the form. Between the keyword monitors and the HTTP monitor, you cover form-level failures, page-level error messages, and server-level crashes.
        </p>

        <h3>Step 4: Monitor every page with a critical form</h3>

        <p>
          If you use Gravity Forms on multiple pages, set up monitors for each one:
        </p>

        <ul>
          <li><strong>Contact page</strong> — check for the submit button text</li>
          <li><strong>Quote request page</strong> — check for form-specific text like &quot;Request a quote&quot;</li>
          <li><strong>Application forms</strong> — check for &quot;Submit application&quot;</li>
          <li><strong>Payment forms</strong> — check for &quot;Pay now&quot; or &quot;Complete purchase&quot;</li>
          <li><strong>Registration forms</strong> — check for &quot;Register&quot; or &quot;Create account&quot;</li>
        </ul>

        <h3>Step 5: Set up alerts that reach you fast</h3>

        <ul>
          <li><strong>Slack</strong> — instant notification when form content disappears</li>
          <li><strong>Microsoft Teams</strong> — visibility for the development team</li>
          <li><strong>Email</strong> — written record of every form failure incident</li>
          <li><strong>Webhook</strong> — trigger automated incident response</li>
        </ul>

        <div className="blog-cta-section">
          <h3>Check your WordPress form pages right now</h3>
          <p>
            Instant health score across uptime, SSL, DNS, security headers, and performance. See if your form pages are vulnerable to silent failures.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>Preventing Gravity Forms breakage</h2>

        <h3>Test forms after every update</h3>
        <p>
          After every Gravity Forms update, WordPress core update, PHP version change, or plugin update, test your forms manually. Open the page. Fill out the form. Test every conditional logic path — select different options and verify that the correct fields show and hide. Submit the form and verify the entry is created correctly. This takes five minutes and prevents days of lost form submissions.
        </p>

        <h3>Use a staging environment</h3>
        <p>
          Always update on staging first. Test all forms. Only push to production when everything works. Most managed WordPress hosts offer one-click staging that copies your entire site including Gravity Forms entries and settings.
        </p>

        <h3>Exclude Gravity Forms from script optimisation</h3>
        <p>
          In your performance plugin, add Gravity Forms scripts to the exclusion list. The small performance cost of unminified Gravity Forms JavaScript is negligible compared to the cost of broken forms losing submissions for days.
        </p>

        <h3>Keep add-ons up to date</h3>
        <p>
          Gravity Forms core and its add-ons are maintained by different teams on different release schedules. When you update Gravity Forms core, check that all your add-ons have compatible versions. An outdated add-on running against a new core version is one of the most common causes of form breakage.
        </p>

        <h2>Your forms are probably losing submissions right now</h2>

        <p>
          That is not an exaggeration. Gravity Forms conditional logic depends on a fragile chain of JavaScript execution. A jQuery conflict from an unrelated plugin. A minification setting you forgot about. A PHP 8 upgrade your host applied. A Stripe API key that expired. Any one of these can silently break your forms while the page continues to load normally and your uptime monitor reports everything as healthy.
        </p>

        <p>
          Visitors fill out your form, click Submit, and nothing happens. They do not call you to report it. They do not email you. They go to your competitor. You check your form submissions at the end of the week and wonder why leads are down. You blame the marketing. You blame the season. You do not check the browser console.
        </p>

        <p>
          Upnotify keyword monitoring checks your form pages every 60 seconds. If the form disappears, if an error message appears, if the submit button text is missing — you know in under a minute. Before the next lead fills out a form that does not work. Before another day of lost submissions.
        </p>

        <div className="blog-cta-section">
          <h3>Stop losing form submissions to silent failures</h3>
          <p>
            Free plan available. Keyword monitoring that watches your form pages and alerts when something breaks. Slack, Teams, email, and webhook alerts. No credit card required.
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
            <li><Link href="/blog/wordpress-javascript-errors">JavaScript Errors Breaking WordPress Page Functionality: When Your Site Is Up But Broken</Link></li>
            <li><Link href="/blog/wordpress-critical-error">There Has Been a Critical Error on This Website: What It Means and How to Fix It</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
