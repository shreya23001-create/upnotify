import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'WordPress Core Web Vitals Failing: How LCP, FID, and CLS Failures Hurt Your Traffic',
  description:
    'Your WordPress site is failing Core Web Vitals — LCP over 2.5 seconds, poor FID from heavy plugins, and CLS from ads and lazy loading. Google uses these metrics for ranking. Learn what causes each failure, how to fix them, and how Uptrue HTTP monitoring tracks TTFB as the server component of LCP.',
  alternates: { canonical: 'https://uptrue.io/blog/wordpress-core-web-vitals' },
  openGraph: {
    title: 'WordPress Core Web Vitals Failing: How LCP, FID, and CLS Failures Hurt Your Traffic',
    description:
      'Why WordPress sites fail Core Web Vitals, how LCP, FID, and CLS failures hurt Google rankings, and how Uptrue HTTP monitoring tracks server-side performance.',
    url: 'https://uptrue.io/blog/wordpress-core-web-vitals',
    type: 'article',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordPress Core Web Vitals Failing: How LCP, FID, and CLS Failures Hurt Your Traffic',
    description:
      'Why WordPress sites fail Core Web Vitals, how LCP, FID, and CLS failures hurt Google rankings, and how Uptrue HTTP monitoring tracks server-side performance.',
  },
}

const FAQ_DATA = [
  {
    question: 'What are Core Web Vitals and why do they matter for WordPress?',
    answer:
      'Core Web Vitals are three performance metrics that Google uses as ranking signals: Largest Contentful Paint (LCP) measures how quickly the main content loads — the threshold is 2.5 seconds. First Input Delay (FID), being replaced by Interaction to Next Paint (INP), measures how quickly the page responds to user interaction — the threshold is 100 milliseconds for FID and 200 milliseconds for INP. Cumulative Layout Shift (CLS) measures visual stability — how much the page layout moves unexpectedly during loading, with a threshold of 0.1. Google confirmed in 2021 that Core Web Vitals are a ranking factor, meaning pages that fail these thresholds may rank lower than competitors with better scores. WordPress sites are particularly vulnerable to poor Core Web Vitals due to heavy plugin loads, unoptimised images, and themes with excessive JavaScript.',
  },
  {
    question: 'Why does my WordPress site have a high LCP score?',
    answer:
      'LCP on WordPress sites is most commonly caused by slow server response time (TTFB), unoptimised hero images, render-blocking CSS and JavaScript, and missing browser caching. When your server takes 2 seconds to respond (TTFB), the LCP clock has already used most of its 2.5-second budget before the browser even starts downloading the page content. Large hero images without proper sizing, modern format (WebP/AVIF), or lazy loading add further delay. Render-blocking scripts from plugins force the browser to download and execute JavaScript before it can display the main content. Each factor adds time to LCP, and on a typical WordPress site with 20-30 plugins, they compound quickly.',
  },
  {
    question: 'How do WordPress plugins affect Core Web Vitals?',
    answer:
      'WordPress plugins degrade Core Web Vitals in three ways. First, every plugin that adds JavaScript increases the total JavaScript payload — sliders, analytics tools, chat widgets, social sharing buttons, and page builders all add scripts that compete for CPU time, increasing FID and INP. Second, plugins that inject above-the-fold content without reserved dimensions — cookie consent banners, notification bars, email popup overlays — cause layout shifts that increase CLS. Third, plugins that add database queries to every page load increase server response time (TTFB), which directly affects LCP. The average WordPress site loads scripts from 10-15 different plugins on every page. Removing or replacing even a few heavy plugins can dramatically improve all three Core Web Vitals metrics.',
  },
  {
    question: 'Can Uptrue monitor Core Web Vitals on my WordPress site?',
    answer:
      'Uptrue HTTP monitoring tracks Time to First Byte (TTFB) on every check — the server-side component that directly affects LCP. TTFB measures how long it takes your server to start sending the response after receiving the request. If your TTFB climbs from 400ms to 2 seconds due to a plugin conflict, database issue, or hosting problem, Uptrue detects the increase and alerts you. While full Core Web Vitals measurement requires real browser rendering (which tools like Google PageSpeed Insights and Chrome UX Report provide), TTFB monitoring catches the server-side performance problems that are the most common root cause of LCP failures on WordPress sites.',
  },
]

export default function WordPressCoreWebVitalsPage(): React.ReactElement {
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
          headline: 'WordPress Core Web Vitals Failing: How LCP, FID, and CLS Failures Hurt Your Traffic',
          description: 'Why WordPress sites fail Core Web Vitals, how to fix each metric, and how Uptrue HTTP monitoring tracks TTFB as the server component of LCP.',
          author: { '@type': 'Organization', name: 'Uptrue' },
          publisher: { '@type': 'Organization', name: 'Vision Software Solutions Limited', url: 'https://uptrue.io' },
          datePublished: '2026-04-04',
          dateModified: '2026-04-04',
          url: 'https://uptrue.io/blog/wordpress-core-web-vitals',
        }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          <span className="blog-post-category">WordPress</span>
          <span>4 April 2026</span>
          <span>15 min read</span>
        </div>
        <h1 className="blog-article-title">WordPress Core Web Vitals Failing: How LCP, FID, and CLS Failures Hurt Your Traffic</h1>
        <p className="blog-article-subtitle">
          You check Google Search Console and see a wall of red. &quot;Poor URLs&quot; across all three Core Web Vitals metrics. Your pages are slow to load, slow to respond, and the layout jumps around while visitors try to read. Google is measuring all of this — and using it to decide whether your pages deserve to rank.
        </p>
      </header>

      <div className="blog-article-body">

        <h2>The performance metrics Google uses to rank your pages</h2>

        <p>
          In 2021, Google made{' '}
          <a href="https://developers.google.com/search/docs/appearance/core-web-vitals" target="_blank" rel="noopener noreferrer">Core Web Vitals a ranking factor</a>. Three metrics now directly influence where your pages appear in search results:
        </p>

        <p>
          <strong>Largest Contentful Paint (LCP)</strong> — how quickly the largest visible element on the page loads. Google&apos;s threshold is 2.5 seconds. Anything slower is classified as &quot;Poor.&quot;
        </p>

        <p>
          <strong>First Input Delay (FID)</strong> — how quickly the page responds when a visitor clicks, taps, or presses a key for the first time. The threshold is 100 milliseconds. Google is transitioning to Interaction to Next Paint (INP) with a 200ms threshold, which measures responsiveness throughout the entire page visit, not just the first interaction.
        </p>

        <p>
          <strong>Cumulative Layout Shift (CLS)</strong> — how much the page layout moves unexpectedly while loading. The threshold is 0.1. Anything above means your page content is jumping around — buttons moving, text shifting, images pushing content down.
        </p>

        <p>
          These are not abstract technical metrics. They measure what your visitors experience. A page with poor LCP feels slow. A page with poor FID feels unresponsive. A page with poor CLS feels broken. Google is using these metrics as a proxy for user experience — and rewarding pages that feel fast and stable.
        </p>

        <p>
          WordPress sites are disproportionately affected. The average WordPress site runs 20 to 30 plugins, each adding JavaScript, CSS, database queries, and DOM elements. The theme adds its own layer of complexity. The result is a page that takes 4 seconds to show its main content, freezes for 300ms when a visitor clicks a button, and shifts the layout three times while ads and images load.
        </p>

        <h2>Why WordPress sites fail LCP</h2>

        <p>
          LCP measures how long it takes for the largest visible element — usually a hero image, a featured image, or a large heading — to finish rendering in the viewport. Google wants this to happen within 2.5 seconds. Most WordPress sites on shared hosting fail this threshold.
        </p>

        <h3>1. Slow server response time (TTFB)</h3>

        <p>
          Before the browser can even start rendering your page, it needs to receive the first byte of data from your server. This is Time to First Byte (TTFB) — the time between the browser sending the request and receiving the first byte of the response. On a well-optimised WordPress site, TTFB should be under 400ms. On shared hosting with a heavy plugin load, TTFB regularly exceeds 1.5 to 2 seconds.
        </p>

        <p>
          If your server takes 2 seconds to respond, you have used 80% of your LCP budget before the browser has downloaded a single byte of your page content. The browser still needs to download the HTML, parse it, download the CSS, download the images, and render the layout. With only 500ms of LCP budget remaining after TTFB, it is mathematically impossible to pass.
        </p>

        <p>
          TTFB on WordPress is driven by: the number of database queries on each page load (more plugins = more queries), the PHP execution time for WordPress core and all active plugins, the server hardware and hosting tier, and whether object caching (Redis or Memcached) is active. See our detailed guide on{' '}
          <Link href="/blog/wordpress-slow-ttfb">WordPress TTFB optimisation</Link>{' '}
          for a complete breakdown.
        </p>

        <h3>2. Unoptimised hero images</h3>

        <p>
          The largest visible element on most WordPress pages is an image — a hero banner, a featured image, or a product photo. If that image is a 2MB JPEG uploaded directly from a camera, the browser needs to download 2MB before it can display the largest element. On a typical mobile connection, that takes 3 to 5 seconds.
        </p>

        <p>
          Common image problems on WordPress: uploading full-resolution images without resizing, using JPEG or PNG instead of WebP or AVIF, not specifying <code>width</code> and <code>height</code> attributes (which also causes CLS), not using responsive <code>srcset</code> to serve appropriately sized images for each device, and applying lazy loading to above-the-fold images (which delays loading of the very element LCP is measuring).
        </p>

        <h3>3. Render-blocking JavaScript and CSS</h3>

        <p>
          Every plugin that enqueues a JavaScript file or stylesheet in the <code>&lt;head&gt;</code> blocks rendering. The browser must download and parse each file before it can display anything. On a site with 15 plugins each adding one script and one stylesheet, the browser downloads and parses 30 files before rendering the first pixel.
        </p>

        <p>
          Slider plugins are particularly bad — they load large JavaScript libraries and multiple stylesheets to create an animated carousel that visitors have to wait for before seeing any content. Social sharing plugins add scripts from Facebook, Twitter, and Pinterest. Analytics plugins add scripts from Google and various third-party services. Each one adds to the render-blocking queue.
        </p>

        <h3>4. No page caching</h3>

        <p>
          Without a caching plugin, every page visit triggers a full WordPress bootstrap — loading PHP, initialising WordPress core, running all plugin hooks, querying the database, and assembling the HTML. This can take 1 to 3 seconds on shared hosting. A caching plugin (WP Super Cache, W3 Total Cache, WP Rocket) stores the pre-built HTML and serves it directly, reducing TTFB to under 100ms.
        </p>

        <p>
          If you have a caching plugin but your cache is not being built or is being invalidated too aggressively, your pages are still being generated dynamically on every visit. See our guide on{' '}
          <Link href="/blog/wp-rocket-cache-issues">WP Rocket cache issues</Link>{' '}
          for common caching problems.
        </p>

        <h2>Why WordPress sites fail FID and INP</h2>

        <p>
          FID and INP measure how quickly your page responds to user interaction. When a visitor clicks a link, taps a button, or selects a form field, the browser needs to process the event. If the browser&apos;s main thread is busy executing JavaScript — parsing plugin scripts, running analytics code, initialising sliders — it cannot respond to the user&apos;s input until the current task finishes.
        </p>

        <h3>Heavy JavaScript from plugins</h3>

        <p>
          The primary cause of poor FID on WordPress is excessive JavaScript. Every plugin that adds interactive functionality — sliders, lightboxes, forms, chat widgets, analytics, social sharing — adds JavaScript that competes for main thread time. When a visitor clicks a button while the browser is parsing a 200KB slider script, the click is delayed until the script finishes.
        </p>

        <p>
          Page builders like Elementor, Divi, and WPBakery add significant JavaScript overhead. Their front-end rendering engines load substantial JavaScript bundles to handle dynamic layouts, animations, and responsive behaviour. A page built with Elementor can load 500KB+ of JavaScript before counting any additional plugin scripts.
        </p>

        <h3>Third-party scripts</h3>

        <p>
          Google Analytics, Facebook Pixel, Google Tag Manager, live chat widgets (Intercom, Drift, Zendesk), advertising scripts, and A/B testing tools all load external JavaScript that executes on the main thread. Each script competes for CPU time. When multiple third-party scripts are initialising simultaneously — which happens on every page load — the main thread can be blocked for 500ms or more.
        </p>

        <h3>Long tasks from WordPress core</h3>

        <p>
          WordPress itself generates some long tasks, particularly around the Heartbeat API (which runs AJAX requests every 15-60 seconds in the admin and sometimes on the front end) and jQuery initialisation. These are usually not the primary cause of poor FID, but they contribute to the total main thread blocking time.
        </p>

        <h2>Why WordPress sites fail CLS</h2>

        <p>
          CLS measures visual stability — how much the page layout shifts unexpectedly while loading. A CLS score above 0.1 means your page content is jumping around. Visitors are trying to read text that moves, click buttons that shift position, or fill in forms that suddenly push down the page.
        </p>

        <h3>1. Images without dimensions</h3>

        <p>
          When an <code>&lt;img&gt;</code> tag does not have <code>width</code> and <code>height</code> attributes, the browser does not know how much space to reserve for the image before it loads. The text renders first, then the image loads and pushes the text down. This is a layout shift. Every image on the page without dimensions is a potential layout shift.
        </p>

        <p>
          WordPress adds width and height attributes to images inserted through the media library, but images added via custom fields, page builder widgets, or directly in HTML may be missing these attributes. Theme header images, logo images, and background images loaded via CSS are also common culprits.
        </p>

        <h3>2. Ads and embeds without reserved space</h3>

        <p>
          Display advertising — Google AdSense, programmatic ad networks — injects ad units dynamically after the page loads. If the ad container does not have a fixed height, the ad pushes content down when it loads. This causes some of the worst CLS scores because ad units can be 250px or 600px tall, shifting everything below them significantly.
        </p>

        <p>
          The same applies to embedded content — YouTube videos, Twitter embeds, Instagram posts — that load their own iframes after the page content has rendered. Without a container with pre-defined dimensions, each embed causes a layout shift.
        </p>

        <h3>3. Late-loading fonts and FOUT/FOIT</h3>

        <p>
          When a custom web font loads after the page content has rendered, the browser either shows invisible text until the font loads (Flash of Invisible Text — FOIT) or shows the page in a fallback font and then swaps to the custom font (Flash of Unstyled Text — FOUT). The font swap changes text dimensions — line height, character width, word spacing — causing text to reflow and shift surrounding elements.
        </p>

        <h3>4. Cookie consent banners and notification bars</h3>

        <p>
          Cookie consent popups that slide in from the bottom or top of the page can cause layout shifts if they push page content instead of overlaying it. Notification bars at the top of the page that load after the initial render push all content down. If these elements are not part of the initial page layout, they cause CLS.
        </p>

        <h3>5. Lazy loading above-the-fold images</h3>

        <p>
          Lazy loading is designed for images below the fold — loading them only when they are about to scroll into view. But when lazy loading is applied to above-the-fold images (hero banners, featured images), the browser initially renders the page without the image, then loads and inserts it a moment later. This causes a layout shift and paradoxically increases LCP as well, because the largest element is being deliberately delayed.
        </p>

        <h2>How to fix each Core Web Vital on WordPress</h2>

        <h3>Fixing LCP</h3>

        <ol>
          <li><strong>Reduce TTFB</strong> — install a page caching plugin, enable object caching (Redis/Memcached), upgrade from shared hosting to a managed WordPress host, and audit plugins for excessive database queries</li>
          <li><strong>Optimise images</strong> — convert to WebP using ShortPixel, Imagify, or EWWW Image Optimizer. Resize images to the maximum display size. Add width and height attributes. Use responsive srcset</li>
          <li><strong>Remove render-blocking resources</strong> — defer non-critical JavaScript, inline critical CSS, and async-load plugin stylesheets that are not needed for above-the-fold rendering</li>
          <li><strong>Preload the LCP image</strong> — add <code>&lt;link rel=&quot;preload&quot; as=&quot;image&quot;&gt;</code> for your hero image so the browser starts downloading it immediately instead of waiting to discover it in the CSS or HTML</li>
          <li><strong>Do not lazy-load above-the-fold images</strong> — exclude hero images and featured images from lazy loading. WordPress 5.5+ adds native lazy loading to all images; use the <code>wp_img_tag_add_loading_attr</code> filter to exclude above-the-fold images</li>
        </ol>

        <h3>Fixing FID / INP</h3>

        <ol>
          <li><strong>Audit and remove unnecessary plugins</strong> — every plugin adds JavaScript. Deactivate plugins you do not actively use. Replace heavy plugins with lighter alternatives</li>
          <li><strong>Defer non-critical JavaScript</strong> — add <code>defer</code> or <code>async</code> attributes to scripts that are not needed for initial rendering. WP Rocket and Autoptimize can do this automatically</li>
          <li><strong>Reduce third-party scripts</strong> — do you really need five analytics tools? Consolidate tracking into Google Tag Manager and load it asynchronously</li>
          <li><strong>Break up long tasks</strong> — if custom JavaScript runs for more than 50ms, it blocks the main thread. Use <code>requestIdleCallback</code> or <code>setTimeout</code> to break long tasks into smaller chunks</li>
          <li><strong>Use a Web Worker for heavy computation</strong> — move non-UI JavaScript processing off the main thread entirely</li>
        </ol>

        <h3>Fixing CLS</h3>

        <ol>
          <li><strong>Add width and height to all images</strong> — every <code>&lt;img&gt;</code> tag needs explicit dimensions so the browser can reserve space before the image loads</li>
          <li><strong>Reserve space for ads</strong> — set a fixed <code>min-height</code> on ad containers that matches the expected ad size. This prevents content from shifting when the ad loads</li>
          <li><strong>Preload fonts</strong> — add <code>&lt;link rel=&quot;preload&quot; as=&quot;font&quot;&gt;</code> for custom fonts and use <code>font-display: swap</code> with a fallback font that closely matches the custom font&apos;s metrics</li>
          <li><strong>Overlay instead of push for banners</strong> — cookie consent banners and notification bars should use <code>position: fixed</code> so they overlay content instead of pushing it down</li>
          <li><strong>Do not inject content above existing content</strong> — dynamically injected elements (popups, banners, promotions) should appear below the fold or as overlays, never above or between existing content</li>
        </ol>

        <p>
          The{' '}
          <a href="https://web.dev/vitals/" target="_blank" rel="noopener noreferrer">web.dev Core Web Vitals documentation</a>{' '}
          provides detailed guidance on measuring and improving each metric, including field data analysis and lab testing techniques.
        </p>

        <h2>How Uptrue monitors the server side of Core Web Vitals</h2>

        <p>
          Core Web Vitals are measured in the browser — they reflect what real visitors experience on real devices. Tools like Google PageSpeed Insights, Chrome UX Report, and Lighthouse measure the full rendering pipeline. But the server side is where many of the root causes live.
        </p>

        <p>
          <Link href="/signup">Uptrue&apos;s HTTP monitoring</Link> tracks TTFB on every check — how long your server takes to start sending the response. TTFB is the foundation that LCP is built on. If your server response time doubles because a plugin conflict is generating slow queries, or your hosting provider is throttling your CPU, or your cache is not building, Uptrue detects it immediately.
        </p>

        <h3>Step 1: Set up an HTTP monitor to track TTFB</h3>

        <ol>
          <li>Sign up at <Link href="/signup">uptrue.io/signup</Link> (free plan available)</li>
          <li>Click <strong>Add Monitor</strong> from your dashboard</li>
          <li>Select <strong>HTTP/HTTPS</strong> as the monitor type</li>
          <li>Enter your homepage URL</li>
          <li>Set expected status to <strong>200</strong></li>
          <li>Set the check interval to <strong>1 minute</strong></li>
          <li>Configure alerts — Slack, email, or Microsoft Teams</li>
        </ol>

        <p>
          Uptrue records response time on every check and displays it on your dashboard graph. You can see TTFB trends over time — whether your server is getting slower day by day, whether there are spikes at specific times, and whether a change you made (installing a plugin, updating WordPress, changing hosting) improved or degraded server response time.
        </p>

        <h3>Step 2: Monitor critical landing pages individually</h3>

        <p>
          Your homepage and your top landing pages may have different performance characteristics. A product page with dozens of images behaves differently from a blog post. A WooCommerce shop page that queries hundreds of products has different TTFB than a static About page. Set up individual monitors for your highest-traffic pages to track their TTFB separately.
        </p>

        <h3>Step 3: Monitor after every change</h3>

        <p>
          Core Web Vitals on WordPress change every time you install a plugin, update a theme, add a script, or change your hosting configuration. After any change, watch your Uptrue response time graph for the next 24 hours. If TTFB increased, the change made your server slower. If TTFB decreased, the change helped. This data-driven approach replaces guessing with measurement.
        </p>

        <h3>Step 4: Set response time thresholds</h3>

        <p>
          Configure Uptrue to alert you when response time exceeds a threshold that matters for your LCP target. If you need LCP under 2.5 seconds and your page content takes 500ms to render after receiving the first byte, your TTFB budget is 2 seconds. Set an alert for when TTFB exceeds 1.5 seconds — giving you a warning buffer before it impacts your Core Web Vitals score.
        </p>

        <div className="blog-cta-section">
          <h3>Check your server response time right now</h3>
          <p>
            Instant health score including response time, SSL, DNS, and security headers. See if your server is fast enough for good Core Web Vitals.
          </p>
          <Link href="/score" className="btn btn-primary btn-lg">
            Check Your Website Score
          </Link>
        </div>

        <h2>The relationship between TTFB and LCP</h2>

        <p>
          LCP is made up of four components: TTFB (server response time), resource load delay (time between receiving the HTML and starting to download the LCP resource), resource load duration (time to download the LCP image or render the LCP text), and element render delay (time between the resource loading and the element actually rendering on screen).
        </p>

        <p>
          TTFB is the only component that is entirely server-side. The other three depend on the browser, the network, and the page structure. But TTFB sets the starting point. If your server is slow, every subsequent step starts late and LCP fails regardless of how well-optimised your front-end is.
        </p>

        <p>
          This is why server-side monitoring is essential for Core Web Vitals. Google PageSpeed Insights tells you that your LCP is 4.2 seconds. Uptrue tells you that 2.1 seconds of that is TTFB — immediately pointing you to the server as the root cause instead of spending hours optimising images and CSS that account for the other 2.1 seconds.
        </p>

        <h2>Stop losing Google rankings to slow server response</h2>

        <p>
          Core Web Vitals are not optional. They are a Google ranking factor. Pages that fail LCP, FID, and CLS rank lower than equivalent pages with better scores. Your WordPress site&apos;s plugin load, image handling, and server performance are directly affecting your search visibility.
        </p>

        <p>
          The fixes are known and documented. Optimise images, defer JavaScript, add image dimensions, cache aggressively, and keep your server fast. But &quot;keep your server fast&quot; requires continuous monitoring — because plugins update, traffic fluctuates, hosting providers throttle, and cache invalidations happen. A TTFB that was 400ms last month can be 2 seconds this month without any change you initiated.
        </p>

        <p>
          Uptrue tracks your server response time every 60 seconds. When TTFB increases — whether from a plugin conflict, a hosting issue, or a traffic spike — you know immediately. You fix the server-side component of LCP before Google&apos;s next crawl measures the degradation and adjusts your rankings.
        </p>

        <div className="blog-cta-section">
          <h3>Track your server speed continuously</h3>
          <p>
            Free plan available. HTTP monitoring with response time tracking. TTFB trends and alerts. No credit card required.
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
            <li><Link href="/blog/wordpress-slow-ttfb">WordPress TTFB Over 3 Seconds: Why Your Site Feels Dead</Link></li>
            <li><Link href="/blog/wordpress-shared-hosting-slow">WordPress Site Down on Shared Hosting</Link></li>
            <li><Link href="/blog/wp-rocket-cache-issues">WP Rocket Cache Serving Stale Pages</Link></li>
          </ul>
        </div>
      </footer>
    </article>
  )
}
