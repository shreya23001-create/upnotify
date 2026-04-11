-- =============================================================================
-- Migration 00064: Autoblog Engine
-- Creates tables for the self-running blogging system
-- =============================================================================

-- ── System channels (predefined pipelines) ───────────────────────────────────
CREATE TABLE autoblog_channels (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  is_enabled  BOOLEAN     NOT NULL DEFAULT false,
  post_to_social BOOLEAN  NOT NULL DEFAULT true,
  cron_path   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RSS / API sources ─────────────────────────────────────────────────────────
CREATE TABLE autoblog_sources (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  url             TEXT        UNIQUE NOT NULL,
  type            TEXT        NOT NULL DEFAULT 'rss',
  category        TEXT,
  is_enabled      BOOLEAN     NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  item_count      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Cached feed items ─────────────────────────────────────────────────────────
CREATE TABLE autoblog_feed_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    UUID        NOT NULL REFERENCES autoblog_sources(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  url          TEXT        UNIQUE NOT NULL,
  summary      TEXT,
  published_at TIMESTAMPTZ,
  is_processed BOOLEAN     NOT NULL DEFAULT false,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Custom user-defined topics ────────────────────────────────────────────────
CREATE TABLE autoblog_topics (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  prompt         TEXT        NOT NULL,
  schedule       TEXT        NOT NULL DEFAULT 'weekly_mon',
  keywords       TEXT[]      NOT NULL DEFAULT '{}',
  is_enabled     BOOLEAN     NOT NULL DEFAULT true,
  post_to_social BOOLEAN     NOT NULL DEFAULT true,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Generation run log ────────────────────────────────────────────────────────
CREATE TABLE autoblog_runs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_key      TEXT,
  topic_id         UUID        REFERENCES autoblog_topics(id) ON DELETE SET NULL,
  blog_post_id     UUID        REFERENCES blog_posts(id) ON DELETE SET NULL,
  title            TEXT,
  status           TEXT        NOT NULL DEFAULT 'generated',
  confidence_score INT,
  sources_count    INT         NOT NULL DEFAULT 0,
  source_key       TEXT,
  post_to_social   BOOLEAN     NOT NULL DEFAULT false,
  error_message    TEXT,
  ran_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_autoblog_feed_items_published  ON autoblog_feed_items(published_at DESC);
CREATE INDEX idx_autoblog_feed_items_processed  ON autoblog_feed_items(is_processed) WHERE is_processed = false;
CREATE INDEX idx_autoblog_runs_ran_at           ON autoblog_runs(ran_at DESC);
CREATE INDEX idx_autoblog_runs_source_key       ON autoblog_runs(source_key) WHERE source_key IS NOT NULL;
CREATE INDEX idx_autoblog_topics_enabled        ON autoblog_topics(is_enabled) WHERE is_enabled = true;

-- ── RLS (admin client bypasses via service role) ──────────────────────────────
ALTER TABLE autoblog_channels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoblog_sources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoblog_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoblog_topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoblog_runs      ENABLE ROW LEVEL SECURITY;

-- ── Seed: system channels ─────────────────────────────────────────────────────
INSERT INTO autoblog_channels (key, name, description, cron_path, is_enabled) VALUES
  (
    'outage_alerts',
    'Outage Alerts',
    'Auto-generates a blog post when a tracked public site goes down. Fires 15 minutes after an incident starts and re-confirms the site is still down before generating.',
    '/api/cron/public-incident-cleanup',
    true
  ),
  (
    'llm_launches',
    'LLM Launches',
    'Scans 20+ news sources daily for new AI model launches. Generates a crawlability and citation guide for each new model found.',
    '/api/cron/autoblog/llm-detector',
    false
  );

-- ── Seed: RSS / API sources ───────────────────────────────────────────────────
INSERT INTO autoblog_sources (name, url, type, category) VALUES
  -- Press wires
  ('PR Newswire',      'https://www.prnewswire.com/rss/news-releases-list.rss',          'rss', 'press_wire'),
  ('Business Wire',    'https://www.businesswire.com/rss/home/?rss=g1',                  'rss', 'press_wire'),
  ('GlobeNewswire',    'https://www.globenewswire.com/RssFeed/industry/9144',             'rss', 'press_wire'),
  ('EIN Presswire',    'https://www.einpresswire.com/rss/all',                            'rss', 'press_wire'),
  -- Tech news
  ('TechCrunch',       'https://techcrunch.com/feed',                                     'rss', 'tech_news'),
  ('VentureBeat AI',   'https://venturebeat.com/category/ai/feed',                        'rss', 'tech_news'),
  ('The Verge',        'https://www.theverge.com/rss/index.xml',                          'rss', 'tech_news'),
  ('Wired',            'https://www.wired.com/feed/rss',                                  'rss', 'tech_news'),
  ('Ars Technica',     'https://feeds.arstechnica.com/arstechnica/technology-lab',        'rss', 'tech_news'),
  ('ZDNet',            'https://www.zdnet.com/news/rss.xml',                              'rss', 'tech_news'),
  ('MIT Tech Review',  'https://www.technologyreview.com/feed',                           'rss', 'tech_news'),
  -- AI specific
  ('Hugging Face Blog','https://huggingface.co/blog/feed.xml',                            'rss', 'ai_specific'),
  ('arXiv cs.AI',      'https://arxiv.org/rss/cs.AI',                                    'rss', 'ai_specific'),
  ('arXiv cs.CL',      'https://arxiv.org/rss/cs.CL',                                    'rss', 'ai_specific'),
  ('Papers With Code', 'https://paperswithcode.com/latest.xml',                           'rss', 'ai_specific'),
  ('OpenAI Blog',      'https://openai.com/blog/rss.xml',                                 'rss', 'ai_specific'),
  ('Google DeepMind',  'https://deepmind.google/blog/rss',                                'rss', 'ai_specific'),
  -- Community
  ('Hacker News',      'https://hnrss.org/frontpage',                                     'rss', 'community'),
  ('Reddit ML',        'https://www.reddit.com/r/MachineLearning/.rss',                   'rss', 'community'),
  ('Reddit LocalLLaMA','https://www.reddit.com/r/LocalLLaMA/.rss',                        'rss', 'community'),
  ('Reddit Artificial','https://www.reddit.com/r/artificial/.rss',                        'rss', 'community'),
  ('Product Hunt',     'https://www.producthunt.com/feed',                                'rss', 'community');
