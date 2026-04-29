-- Migration 00082: Data retention indexes for check_results tables
-- Fixes the #1 Disk IO problem: reads on ever-growing check_results tables
-- Adds covering indexes for the two slowest read queries shown in query stats.

-- Index for check_results reads: (monitor_id, checked_at) covers the most common
-- query pattern used by the monitor detail page and check runner history.
CREATE INDEX IF NOT EXISTS idx_check_results_monitor_checked_at
  ON check_results (monitor_id, checked_at DESC);

-- Index for public_check_results status+response_time read (602ms mean query):
-- WHERE monitor_id = $1 AND status = $2 AND checked_at >= $3 AND response_time_ms IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_public_check_results_monitor_status_checked_at
  ON public_check_results (monitor_id, status, checked_at DESC)
  WHERE response_time_ms IS NOT NULL;

-- Index for public_check_results status-only read (186ms mean query):
-- WHERE monitor_id = $1 AND checked_at >= $2
CREATE INDEX IF NOT EXISTS idx_public_check_results_monitor_checked_at
  ON public_check_results (monitor_id, checked_at DESC);

-- Index for blog_posts tags array query (438ms mean, needs GIN):
-- WHERE status = $1 AND tags @> $2 AND tags @> $3
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags_gin
  ON blog_posts USING GIN (tags);
