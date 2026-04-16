-- Migration: per-topic source assignment
-- Each topic can have its own set of RSS sources instead of using the global pool.

create table if not exists autoblog_topic_sources (
  id         uuid        primary key default gen_random_uuid(),
  topic_id   uuid        not null references autoblog_topics(id) on delete cascade,
  source_id  uuid        not null references autoblog_sources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(topic_id, source_id)
);

comment on table autoblog_topic_sources is
  'Maps autoblog topics to their assigned RSS sources. topic-runner uses these instead of the global keyword filter.';
