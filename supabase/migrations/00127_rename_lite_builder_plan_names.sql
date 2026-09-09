-- Rename displayed plan names per request: Lite -> "Pre Plan", Builder ->
-- "Pro Plan". Only the display name changes — slugs (lite/builder) stay
-- the same since they're used as stable keys throughout the codebase.
UPDATE public.plans SET name = 'Pre Plan' WHERE slug = 'lite';
UPDATE public.plans SET name = 'Pro Plan' WHERE slug = 'builder';
