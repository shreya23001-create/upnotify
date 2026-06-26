-- KB data retention per plan:
--   Free: 7 days, Lite: 30 days, Builder: 90 days, Scale: 365 days
-- Previous migration 00011 had wrong values (Free=30, Lite=90, Builder/Scale=NULL).
-- Step 1 fix: align DB with KB so per-plan cron job (#103) has correct values to enforce.

UPDATE plans SET data_retention_days = 7   WHERE slug = 'free';
UPDATE plans SET data_retention_days = 30  WHERE slug = 'lite';
UPDATE plans SET data_retention_days = 90  WHERE slug = 'builder';
UPDATE plans SET data_retention_days = 365 WHERE slug = 'scale';
