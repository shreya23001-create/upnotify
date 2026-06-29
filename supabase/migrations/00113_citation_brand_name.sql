-- Add brand_name to citation_check_runs so users can label runs with
-- their product/brand name. Nullable — existing runs and the API remain
-- backward-compatible (brand defaults to NULL when not provided).
ALTER TABLE public.citation_check_runs
  ADD COLUMN IF NOT EXISTS brand_name TEXT;
