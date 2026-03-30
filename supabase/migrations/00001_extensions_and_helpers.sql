-- Migration 1: Extensions and reusable trigger function
-- =================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- =================================================================
-- Reusable updated_at trigger function
-- =================================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
