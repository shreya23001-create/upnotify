-- Migration 8: Seed initial plans
-- Prices stored in pence (GBP). Annual = monthly * 12 * 0.8 (20% discount).
-- =================================================================

insert into public.plans (name, slug, type, price_monthly_gbp, price_annual_gbp, onboarding_fee_gbp, monitor_limit, check_interval_seconds, client_workspace_limit, data_retention_days, has_api_access, has_ai_predictive, has_status_page_custom_domain, has_white_label, has_voice_calls, voice_call_monthly_limit) values

-- Usage-based: £0/mo base + £1 per monitor. 5-min intervals. 1 workspace. 30-day retention.
('Usage-based', 'usage-based', 'direct', 0, null, 0, null, 300, 1, 30, false, false, false, false, false, 0),

-- Starter: £19/mo (£182.40/yr). 20 monitors. 3-min intervals. 3 workspaces. Unlimited retention.
('Starter', 'starter', 'direct', 1900, 18240, 0, 20, 180, 3, null, false, false, false, false, false, 0),

-- Pro: £49/mo (£470.40/yr). 100 monitors. 1-min intervals. 10 workspaces. API + AI.
('Pro', 'pro', 'direct', 4900, 47040, 0, 100, 60, 10, null, true, true, true, false, false, 0),

-- Agency: £149 one-time. Unlimited monitors. 1-min intervals. Unlimited workspaces. Full features.
('Agency', 'agency', 'agency', 0, null, 14900, null, 60, null, null, true, true, true, true, true, 100);
