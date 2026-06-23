-- Migration 00102: Fix data_retention_days to match KB
-- KB defines: Free=7d, Lite=30d, Builder=90d, Scale=365d
-- Previous migration 00011 set wrong values (Free=30, Lite=90) and NULL for Builder/Scale.

UPDATE plans SET data_retention_days = 7   WHERE slug = 'free';
UPDATE plans SET data_retention_days = 30  WHERE slug = 'lite';
UPDATE plans SET data_retention_days = 90  WHERE slug = 'builder';
UPDATE plans SET data_retention_days = 365 WHERE slug = 'scale';
