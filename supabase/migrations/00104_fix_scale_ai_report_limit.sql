-- Migration 00104: Fix Scale plan ai_report_limit per KB
-- KB defines: Builder=5/mo, Scale=Unlimited.
-- Migration 00036 incorrectly set ai_report_limit=0 for Scale.
-- Code in checkAiReportLimit treats 0 as "blocked" and -1 as "unlimited".

UPDATE plans SET ai_report_limit = -1 WHERE slug = 'scale';
