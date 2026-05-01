-- Migration 00084: Outage blog configuration tables
-- Adds: priority monitor whitelist, admin-configurable RSS feeds per category
-- Updated columns on public_incidents for service group deduplication + resolution tracking

-- High-priority monitor whitelist (opt-in for outage blog generation)
CREATE TABLE IF NOT EXISTS public.outage_priority_monitors (
  id BIGSERIAL PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES public.public_monitors(id) ON DELETE CASCADE,
  service_group TEXT NOT NULL, -- e.g. "stripe" — groups related monitors (stripe.com, api.stripe.com)
  priority INTEGER NOT NULL DEFAULT 1, -- 1=critical, 2=high
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS outage_priority_monitors_monitor_id_idx ON public.outage_priority_monitors(monitor_id);
CREATE INDEX IF NOT EXISTS outage_priority_monitors_service_group_idx ON public.outage_priority_monitors(service_group);

-- Admin-configurable RSS feeds for outage blog research
CREATE TABLE IF NOT EXISTS public.outage_rss_feeds (
  id BIGSERIAL PRIMARY KEY,
  source_name TEXT NOT NULL, -- e.g. "Hacker News", "AWS Status Blog"
  feed_url TEXT NOT NULL,
  category_slug TEXT, -- pmb_categories.slug — NULL means applies to all categories
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS outage_rss_feeds_url_idx ON public.outage_rss_feeds(feed_url);
CREATE INDEX IF NOT EXISTS outage_rss_feeds_category_idx ON public.outage_rss_feeds(category_slug) WHERE is_enabled = true;

-- Add columns to public_incidents for service-group deduplication + resolution tracking
ALTER TABLE public.public_incidents ADD COLUMN IF NOT EXISTS service_group TEXT;
ALTER TABLE public.public_incidents ADD COLUMN IF NOT EXISTS blog_updated_at TIMESTAMPTZ;
ALTER TABLE public.public_incidents ADD COLUMN IF NOT EXISTS blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL;

-- Index for service group deduplication queries
CREATE INDEX IF NOT EXISTS public_incidents_service_group_open_idx
  ON public.public_incidents(service_group)
  WHERE resolved_at IS NULL AND blog_generated_at IS NOT NULL;

-- RLS policies
ALTER TABLE public.outage_priority_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outage_rss_feeds ENABLE ROW LEVEL SECURITY;

-- Only service role (admin) can read/write
CREATE POLICY "outage_priority_monitors_admin_only" ON public.outage_priority_monitors
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "outage_rss_feeds_admin_only" ON public.outage_rss_feeds
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at on outage_priority_monitors
CREATE OR REPLACE FUNCTION public.set_updated_at_outage_priority_monitors()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS outage_priority_monitors_set_updated_at ON public.outage_priority_monitors;
CREATE TRIGGER outage_priority_monitors_set_updated_at
  BEFORE UPDATE ON public.outage_priority_monitors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_outage_priority_monitors();

-- Trigger to update updated_at on outage_rss_feeds
CREATE OR REPLACE FUNCTION public.set_updated_at_outage_rss_feeds()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS outage_rss_feeds_set_updated_at ON public.outage_rss_feeds;
CREATE TRIGGER outage_rss_feeds_set_updated_at
  BEFORE UPDATE ON public.outage_rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_outage_rss_feeds();
