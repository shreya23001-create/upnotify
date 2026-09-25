-- Let an alert channel be scoped to whole websites (target_domain values),
-- in addition to the existing monitor_ids scope. NULL/empty means
-- "all websites" (unchanged default behaviour).
--
-- Dynamic domain matching: a channel scoped to a website automatically
-- covers every monitor whose target_domain matches, including monitors
-- created after the channel was saved — no need to re-save the channel
-- when a new monitor is added to an already-selected website.
--
-- monitor_ids is left in place for channels saved before this column
-- existed; the dispatcher checks target_domains first and only falls back
-- to monitor_ids when target_domains is unset.
alter table public.alert_channels
  add column target_domains text[] default null;

comment on column public.alert_channels.target_domains is
  'Optional website scope for this channel (target_domain values). NULL or empty array = applies to all websites/monitors in the org. Non-empty = only fires for incidents on monitors whose target_domain is in this list — matched dynamically at dispatch time, so future monitors on a selected website are covered automatically.';
