-- Migration 00109: Postgres RPC for uptime slot aggregation
-- Fixes #120 — 90-day graph silently truncates data for 1-min monitors
-- because the JS implementation fetches raw rows with a 50k limit.
-- This function pushes all aggregation into Postgres via generate_series
-- + LEFT JOIN, returning exactly p_slot_count rows regardless of row count.
--
-- Index dependency: idx_check_results_monitor_checked_at on
-- check_results (monitor_id, checked_at DESC) — created in 00082.

CREATE OR REPLACE FUNCTION get_uptime_slots(
  p_monitor_id   uuid,
  p_since        timestamptz,
  p_slot_minutes integer,
  p_slot_count   integer
)
RETURNS TABLE (
  slot_index  integer,
  slot_start  timestamptz,
  status      text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    idx::integer                                                             AS slot_index,
    p_since + (idx * p_slot_minutes * interval '1 minute')                  AS slot_start,
    CASE
      WHEN bool_or(cr.status = 'down')     THEN 'down'
      WHEN bool_or(cr.status = 'degraded') THEN 'degraded'
      WHEN count(cr.id) > 0               THEN 'up'
      ELSE                                     'none'
    END                                                                      AS status
  FROM generate_series(0, p_slot_count - 1) AS idx
  LEFT JOIN check_results cr
    ON  cr.monitor_id = p_monitor_id
    AND cr.checked_at >= p_since + (idx       * p_slot_minutes * interval '1 minute')
    AND cr.checked_at <  p_since + ((idx + 1) * p_slot_minutes * interval '1 minute')
  GROUP BY idx
  ORDER BY idx
$$;
