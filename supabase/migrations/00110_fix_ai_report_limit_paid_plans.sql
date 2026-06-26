-- KB §7 REPORTING & AI: "On-demand (all paid plans)"
-- The PRD does not specify a monthly cap for any paid plan.
-- Set ai_report_limit = -1 (unlimited) for Lite and Builder
-- so all paid plans can generate on-demand reports without restriction.
-- Scale was already set to -1 in migration 00104.

UPDATE plans SET ai_report_limit = -1 WHERE slug = 'lite';
UPDATE plans SET ai_report_limit = -1 WHERE slug = 'builder';
