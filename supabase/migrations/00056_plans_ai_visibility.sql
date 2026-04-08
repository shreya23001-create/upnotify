-- Migration 00056: Add AI Visibility limits to plans table
-- llms_txt_limit: 0=disabled, 1=one-time lifetime, -1=unlimited
-- citation_check_monthly_limit: 0=disabled, N=monthly runs, -1=unlimited

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS llms_txt_limit               INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS citation_check_monthly_limit  INTEGER NOT NULL DEFAULT 0;

-- Free: 1 lifetime llms.txt generation, no citation checks
UPDATE public.plans SET llms_txt_limit = 1,  citation_check_monthly_limit = 0 WHERE slug = 'free';
-- Lite: unlimited llms.txt, 2 citation checks/month
UPDATE public.plans SET llms_txt_limit = -1, citation_check_monthly_limit = 2 WHERE slug = 'lite';
-- Builder: unlimited llms.txt, 4 citation checks/month
UPDATE public.plans SET llms_txt_limit = -1, citation_check_monthly_limit = 4 WHERE slug = 'builder';
-- Scale: unlimited llms.txt, 4 citation checks/month
UPDATE public.plans SET llms_txt_limit = -1, citation_check_monthly_limit = 4 WHERE slug = 'scale';
