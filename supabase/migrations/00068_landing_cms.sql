-- Migration 68: Full Landing Page CMS
-- Extends page_sections with section_type + theme + audit fields.
-- Adds cms_theme table for global brand colours.
-- Seeds all current hardcoded landing content so the page works immediately.
-- =================================================================

-- ── 1. Extend page_sections ─────────────────────────────────────────────────
ALTER TABLE public.page_sections
  ADD COLUMN IF NOT EXISTS section_type TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS theme        JSONB,
  ADD COLUMN IF NOT EXISTS updated_by   UUID REFERENCES public.users(id);

-- ── 2. Global theme table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cms_theme (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL DEFAULT 'global',
  settings   JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.users(id)
);

ALTER TABLE public.cms_theme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read theme"
  ON public.cms_theme FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Super admin manages theme"
  ON public.cms_theme FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Seed default brand theme
INSERT INTO public.cms_theme (key, settings)
VALUES ('global', $json${
  "colors": {
    "brand_primary":   "#3b82f6",
    "brand_secondary": "#06b6d4",
    "accent":          "#8b5cf6",
    "success":         "#10b981",
    "warning":         "#f59e0b",
    "danger":          "#ef4444"
  },
  "gradient": "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
  "dark_mode_default": true
}$json$)
ON CONFLICT (key) DO NOTHING;

-- ── 3. Seed all landing sections ─────────────────────────────────────────────

-- hero
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'hero', 'hero', $json${
  "eyebrow":        "10 monitor types · 1-minute checks · AI-powered reports",
  "headline_line1": "Know when your sites go down.",
  "headline_line2": "Before your customers do.",
  "subheadline":    "Uptime, performance & infrastructure monitoring for agencies and teams. Multi-channel alerts, public status pages, and AI-powered reports — all in one platform.",
  "cta_primary":    { "text": "Start Monitoring Free", "href": "/signup" },
  "cta_secondary":  { "text": "See How It Works",      "href": "/#how-it-works" },
  "cta_tertiary":   { "text": "Score Your Site Free",  "href": "/score" },
  "trust_items":    [
    "No credit card required",
    "3 monitors free forever",
    "1-minute check intervals",
    "GDPR compliant · EU data"
  ]
}$json$, 10, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- trusted_logos
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'trusted_logos', 'trusted_logos', $json${
  "label": "Tracking uptime for the world's most-used platforms",
  "logos": []
}$json$, 20, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      sort_order   = EXCLUDED.sort_order;

-- stats_bar
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'stats_bar', 'stats_bar', $json${
  "stats": [
    { "value": "10",    "label": "Monitor types" },
    { "value": "1 min", "label": "Fastest check interval" },
    { "value": "99.9%", "label": "Uptime SLA" },
    { "value": "0",     "label": "False alarms (2-region confirm)" }
  ]
}$json$, 30, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- features
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'features', 'features', $json${
  "eyebrow":     "Everything you need",
  "headline":    "Monitoring that actually works",
  "subheadline": "From basic uptime to AI-powered insights. Built for agencies managing hundreds of sites and teams who need reliability."
}$json$, 40, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- how_it_works
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'how_it_works', 'how_it_works', $json${
  "eyebrow":  "Simple by design",
  "headline": "Up and running in 2 minutes",
  "steps": [
    {
      "number":      "1",
      "title":       "Add a Monitor",
      "description": "Enter your URL, choose a monitor type, and set a check interval as low as 1 minute. No config files, no agents, no setup scripts."
    },
    {
      "number":      "2",
      "title":       "Get Alerted Instantly",
      "description": "When something goes wrong, Uptrue confirms from a second region and fires an alert to your preferred channel — Slack, email, Teams, or webhook."
    },
    {
      "number":      "3",
      "title":       "Share Status & Reports",
      "description": "Publish branded status pages your customers can check themselves. Generate AI-powered reports to share uptime SLAs with stakeholders."
    }
  ]
}$json$, 50, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- ai_features
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'ai_features', 'ai_features', $json${
  "eyebrow":     "AI-Powered Intelligence",
  "headline":    "Your monitoring gets smarter over time",
  "subheadline": "Uptrue doesn't just tell you something went down — it tells you why, what it means for your business, and what to do next.",
  "features": [
    {
      "icon":        "🤖",
      "color":       "purple",
      "title":       "Executive AI Reports",
      "description": "One click and Claude analyses 90 days of uptime data, incident patterns, and performance trends — generating a polished summary you can send to clients or stakeholders."
    },
    {
      "icon":        "🔍",
      "color":       "cyan",
      "title":       "Outage Pattern Detection",
      "description": "Uptrue learns your monitor's normal behaviour and flags anomalies before they become incidents. Recurring issues are spotted and surfaced automatically."
    },
    {
      "icon":        "📰",
      "color":       "pink",
      "title":       "AI Outage News & Blog",
      "description": "When a public service goes down, Uptrue researches and publishes an outage report automatically — with your logo and brand. Real-time SEO content on autopilot."
    },
    {
      "icon":        "💡",
      "color":       "blue",
      "title":       "Plain Language Incident Summaries",
      "description": "Every incident automatically gets a human-readable summary. No log-diving, no decoding stack traces. Just \"your checkout was down for 8 minutes on Tuesday.\""
    }
  ]
}$json$, 60, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- agency
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'agency', 'agency', $json${
  "badge":       "Coming Soon · Join Waitlist",
  "headline":    "Monitor hundreds of client sites under your brand",
  "description": "The Agency tier gives you full white-label, multi-tenant workspaces, revenue sharing, custom analytics, and AI reports branded with your agency name. Built for agencies managing dozens of clients.",
  "badges":      [
    "🏷️ Full white-label",
    "👥 Multi-tenant workspaces",
    "💰 Revenue sharing",
    "🤖 Branded AI reports",
    "📊 Custom analytics"
  ],
  "cta_note": "No commitment · Early access pricing"
}$json$, 70, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- faq
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'faq', 'faq', $json${
  "items": [
    {
      "question": "How does the two-region false alarm prevention work?",
      "answer": "When Uptrue detects an issue from its primary check location, it immediately triggers a confirmation check from a second geographic region. Only if both regions agree that the site is down does Uptrue fire an alert. This eliminates false alarms caused by regional network blips."
    },
    {
      "question": "What monitor types does Uptrue support?",
      "answer": "Uptrue supports 10 monitor types: HTTP/HTTPS, SSL certificate expiry, DNS record changes, Ping (ICMP), TCP port checks, Heartbeat (cron job monitoring), Keyword presence/absence, Domain expiry, API endpoint validation, and public status checks."
    },
    {
      "question": "Can I create a public status page?",
      "answer": "Yes — every plan includes at least one public status page. You can add monitors to it, post incident updates, and let your users subscribe to email notifications. Pro and Agency plans support custom domains and full white-label branding."
    },
    {
      "question": "How do the AI-powered reports work?",
      "answer": "Uptrue uses Claude (Anthropic's AI) to analyse up to 90 days of uptime data, incident history, and response-time trends for your monitors. It produces a plain-English executive summary with recommendations — ready to send to clients or stakeholders in one click."
    },
    {
      "question": "Does Uptrue support white-label for agencies?",
      "answer": "The Agency plan (coming soon) includes full white-label: your logo, your domain, your brand colours on all status pages and AI reports. Clients never see the Uptrue brand unless you choose to show it."
    },
    {
      "question": "What alert channels are supported?",
      "answer": "Uptrue supports Email, Slack, Microsoft Teams, Webhooks (any HTTP endpoint), Telegram, and Voice calls. You can configure multiple channels per monitor and set severity filters so you're only woken up for P1 incidents."
    },
    {
      "question": "Is there a free plan?",
      "answer": "Yes. The free plan includes 3 monitors with 1-minute check intervals, email alerts, and one public status page — no credit card required and no time limit. Paid plans start at £10/year."
    },
    {
      "question": "Can I cancel at any time?",
      "answer": "Yes, you can cancel your subscription at any time from the Billing section of your dashboard. You'll keep access to paid features until the end of your billing period. No cancellation fees."
    },
    {
      "question": "What is Watchdog (Compete)?",
      "answer": "Watchdog is Uptrue's competitor intelligence add-on. It tracks your competitors' pricing pages, availability, and product changes — alerting you whenever something changes. Useful for e-commerce and SaaS teams who want to stay ahead."
    },
    {
      "question": "Is my data stored in the EU? Is Uptrue GDPR-compliant?",
      "answer": "Yes. All data is stored on EU-based Supabase infrastructure. Uptrue is fully GDPR-compliant — you can export or delete your data at any time from your account settings. We publish a full list of subprocessors and maintain a DPA for paid customers."
    }
  ]
}$json$, 80, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- testimonials
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'testimonials', 'testimonials', $json${
  "eyebrow":  "Trusted by teams",
  "headline": "What our users say",
  "items": [
    {
      "quote":    "We caught three client outages before their users noticed. Our clients still don't know how close it was. Uptrue paid for itself in the first week.",
      "name":     "Sarah Mitchell",
      "role":     "Founder",
      "company":  "Brightwave Digital Agency",
      "initials": "SM"
    },
    {
      "quote":    "The AI reports are genuinely impressive. I send them to our board every month — they actually read them. It's the first monitoring tool that speaks human.",
      "name":     "James Thornton",
      "role":     "CTO",
      "company":  "Formly SaaS",
      "initials": "JT"
    },
    {
      "quote":    "Switched from UptimeRobot. Zero false alarms since day one. The two-region confirmation alone has saved our on-call team from 3am panic alerts.",
      "name":     "Alex Deacon",
      "role":     "DevOps Lead",
      "company":  "Cartify Commerce",
      "initials": "AD"
    }
  ]
}$json$, 90, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- comparison_table
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'comparison_table', 'comparison_table', $json${
  "eyebrow":     "How we compare",
  "headline":    "Uptrue vs the alternatives",
  "subheadline": "Not all uptime monitoring is equal. Here's how Uptrue stacks up against the most popular tools.",
  "competitors": ["Uptrue", "BetterUptime", "UptimeRobot"],
  "rows": [
    { "feature": "Fastest check interval",                          "values": ["1 minute", "30 seconds", "5 minutes"],    "type": "text",    "highlight": 0 },
    { "feature": "Two-region false alarm prevention",               "values": [true, true, false],                         "type": "boolean" },
    { "feature": "AI-powered reports",                              "values": [true, false, false],                        "type": "boolean" },
    { "feature": "Watchdog (competitor tracking)",                  "values": [true, false, false],                        "type": "boolean" },
    { "feature": "Public uptime leaderboard / tracker",             "values": [true, false, false],                        "type": "boolean" },
    { "feature": "Public status pages",                             "values": [true, true, true],                          "type": "boolean" },
    { "feature": "Monitor types (HTTP, SSL, DNS, Keyword…)",        "values": ["10 types", "7 types", "6 types"],          "type": "text",    "highlight": 0 },
    { "feature": "Free plan monitors",                              "values": ["3 monitors", "3 monitors", "50 monitors"],  "type": "text",    "highlight": 0 },
    { "feature": "Starting price (paid plan)",                      "values": ["£10/yr Lite", "$24/mo", "$7/mo"],          "type": "text",    "highlight": 0 },
    { "feature": "GDPR · EU data storage",                         "values": [true, true, false],                         "type": "boolean" },
    { "feature": "AI outage blog auto-publish",                     "values": [true, false, false],                        "type": "boolean" },
    { "feature": "Free AI SEO Checker (4-category audit)",          "values": [true, false, false],                        "type": "boolean" },
    { "feature": "llms.txt Generator",                              "values": [true, false, false],                        "type": "boolean" },
    { "feature": "AI Citation Monitoring (Perplexity, ChatGPT…)",   "values": [true, false, false],                        "type": "boolean" }
  ],
  "footnote": "Comparison based on publicly available information as of April 2026. Features may vary by plan."
}$json$, 100, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;

-- cta_band
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES ('landing', 'cta_band', 'cta_band', $json${
  "eyebrow":     "Start in 2 minutes",
  "headline":    "Don't find out you're down from a customer tweet.",
  "subheadline": "Uptrue watches your sites, APIs, and infrastructure 24/7 — and tells you first. Free plan included. No credit card required.",
  "cta_primary":   { "text": "Start Monitoring Free", "href": "/signup" },
  "cta_secondary": { "text": "See All Features →",    "href": "/#features" },
  "trust_items": [
    "3 monitors free forever",
    "No credit card required",
    "GDPR compliant · EU data",
    "1-minute check intervals"
  ]
}$json$, 110, true)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order;
