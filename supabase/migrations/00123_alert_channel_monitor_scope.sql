-- Let an alert channel be scoped to specific monitors, in addition to the
-- existing severity_filter. NULL/empty means "all monitors" (today's
-- behaviour, unchanged) so this is fully backward compatible with every
-- existing channel row.
alter table public.alert_channels
  add column monitor_ids uuid[] default null;

comment on column public.alert_channels.monitor_ids is
  'Optional monitor scope for this channel. NULL or empty array = applies to all monitors in the org (default/legacy behaviour). Non-empty = only fires for incidents on these monitor IDs.';
