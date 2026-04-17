-- Migration 00072: Update monitor limits per plan
-- Builder: 25 → 50  (full suite for 2 websites, 23 types × 2 = 46)
-- Scale:   100 → 250 (full suite for ~10 websites, 23 types × 10 = 230)

UPDATE public.plans SET monitor_limit = 50  WHERE slug = 'builder';
UPDATE public.plans SET monitor_limit = 250 WHERE slug = 'scale';
