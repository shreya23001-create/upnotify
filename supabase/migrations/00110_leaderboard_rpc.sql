-- Migration 00110: Postgres RPC for the public uptime leaderboard
-- Fixes the /leaderboard build-time timeout (engineering-app#65 / #69).
--
-- The page uses ISR (revalidate = 300, added in #69), so Next.js prerenders it
-- at build time. The previous JS implementation (lib/db/leaderboard.ts) ran an
-- N+1 query: one query per active public monitor, each pulling 30 days of raw
-- public_check_results rows and aggregating uptime in JavaScript. As the
-- public-tracker data grew, that serial loop crossed Next.js's 60s static-
-- generation budget and broke the build.
--
-- This pushes the whole aggregation into a single indexed GROUP BY query — the
-- same pattern as get_uptime_slots (migration 00109) and the documented KB
-- query in technical/sql-queries.md.
--
-- Index dependency: idx_public_check_results_monitor_status_checked_at
-- (monitor_id, status, checked_at DESC) — created in migration 00082.

CREATE OR REPLACE FUNCTION get_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id                    uuid,
  domain                text,
  display_name          text,
  category              text,
  last_status           text,
  last_response_time_ms integer,
  uptime_pct            double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.domain,
    m.display_name,
    COALESCE(m.category, 'Other')                                    AS category,
    m.last_status,
    m.last_response_time_ms,
    round(
      100.0 * count(*) FILTER (WHERE r.status = 'up') / count(*),
      2
    )::double precision                                              AS uptime_pct
  FROM public_monitors m
  JOIN public_check_results r
    ON  r.monitor_id = m.id
    AND r.checked_at >= now() - interval '30 days'
  WHERE m.is_active = true
  GROUP BY m.id, m.domain, m.display_name, m.category,
           m.last_status, m.last_response_time_ms
  ORDER BY uptime_pct DESC, m.last_response_time_ms ASC NULLS LAST
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard(integer) TO anon, authenticated, service_role;
