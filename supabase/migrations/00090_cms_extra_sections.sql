-- Migration 69: Add remaining site sections to CMS visibility + content control
-- Covers: pricing, downtime_calculator, blog_preview, ticker, nav, footer

INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES
  ('landing', 'ticker',             'ticker', '{"label": "Live Ticker"}',         5,   true),
  ('landing', 'pricing',            'custom', '{"label": "Pricing Table"}',        120, true),
  ('landing', 'downtime_calculator','custom', '{"label": "Downtime Calculator"}',  130, true),
  ('landing', 'blog_preview',       'custom', '{"label": "Blog Preview"}',         140, true)
ON CONFLICT (page, section_key) DO NOTHING;

-- Nav and footer use page='global' so they apply across all pages
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('global', 'nav', 'nav', $json${
  "links": [
    { "label": "Features", "href": "/#features" },
    { "label": "Pricing",  "href": "/#pricing" },
    { "label": "Score",    "href": "/score",                "badge": "Free" },
    { "label": "Tracker",  "href": "/tracker",              "badge": "Free" },
    { "label": "AI SEO",   "href": "/tools/ai-seo-checker", "badge": "Free" },
    { "label": "Tools",    "href": "/tools",                "badge": "Free" },
    { "label": "Blog",     "href": "/blog" }
  ],
  "cta_primary":   { "text": "Start Free", "href": "/signup" },
  "cta_secondary": { "text": "Log in",     "href": "/login" }
}$json$, 1, true)
ON CONFLICT (page, section_key) DO NOTHING;

INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('global', 'footer', 'footer', $json${
  "description": "Uptime, performance & infrastructure monitoring for agencies and teams.",
  "trust_items": [
    "🔒 Secure Payments via Stripe",
    "🛡️ GDPR Compliant · EU Data (Frankfurt)",
    "⚡ 99.9% SLA"
  ],
  "columns": [
    {
      "title": "Product",
      "links": [
        { "label": "Features",       "href": "/#features" },
        { "label": "Pricing",        "href": "/#pricing" },
        { "label": "Score",          "href": "/score",               "badge": "Free" },
        { "label": "Tracker",        "href": "/tracker",             "badge": "Free" },
        { "label": "AI SEO Checker", "href": "/tools/ai-seo-checker","badge": "Free" },
        { "label": "All Free Tools", "href": "/tools" },
        { "label": "Leaderboard",    "href": "/leaderboard" },
        { "label": "Blog",           "href": "/blog" },
        { "label": "Changelog",      "href": "/changelog" }
      ]
    },
    {
      "title": "Legal",
      "links": [
        { "label": "Terms of Service", "href": "/terms" },
        { "label": "Privacy Policy",   "href": "/privacy" },
        { "label": "Cookie Policy",    "href": "/cookies" },
        { "label": "DPA",              "href": "/dpa" },
        { "label": "Acceptable Use",   "href": "/acceptable-use" },
        { "label": "Refund Policy",    "href": "/refund-policy" },
        { "label": "SLA",              "href": "/sla" },
        { "label": "AI Disclaimer",    "href": "/ai-disclaimer" }
      ]
    },
    {
      "title": "Company",
      "links": [
        { "label": "About",             "href": "/about" },
        { "label": "Contact",           "href": "/contact" },
        { "label": "Referral Program",  "href": "/referrals" },
        { "label": "Community Credits", "href": "/credits" },
        { "label": "X @uptrue_io",      "href": "https://x.com/uptrue_io",                        "external": true },
        { "label": "LinkedIn",          "href": "https://www.linkedin.com/company/uptrue-io/",    "external": true }
      ]
    },
    {
      "title": "Support",
      "links": [
        { "label": "Help Centre",    "href": "/help" },
        { "label": "API Docs",       "href": "/docs" },
        { "label": "Status",         "href": "/status" },
        { "label": "Security",       "href": "/security" },
        { "label": "Sub-processors", "href": "/subprocessors" }
      ]
    }
  ]
}$json$, 2, true)
ON CONFLICT (page, section_key) DO NOTHING;
