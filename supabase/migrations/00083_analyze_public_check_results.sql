-- Migration 00083: Analyze public_check_results to optimize query planner
-- Updates table statistics so the planner uses the indexes on public_check_results

ANALYZE public_check_results;
ANALYZE check_results;
