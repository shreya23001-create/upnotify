-- Replace placeholder/stale Stripe Price IDs (from migration 00121 and the
-- old Stripe account referenced in 00061) with real IDs created under the
-- current Stripe test-mode account. Fixes checkout 500ing with "Stripe
-- pricing not configured for this plan" for lite/builder/scale.
UPDATE public.plans SET
  stripe_price_id_monthly = 'price_1UDNIZ0ys1XYSDxRTY9ry0UQ',
  stripe_price_id_annual  = 'price_1UDNIa0ys1XYSDxRzb033wtp'
WHERE slug = 'lite';

UPDATE public.plans SET
  stripe_price_id_monthly = 'price_1UDNIn0ys1XYSDxRBOzC7z2E',
  stripe_price_id_annual  = 'price_1UDNIo0ys1XYSDxRGwEL9u8w'
WHERE slug = 'builder';

UPDATE public.plans SET
  stripe_price_id_monthly = 'price_1UDNIq0ys1XYSDxR4tF2Ymnq',
  stripe_price_id_annual  = 'price_1UDNIr0ys1XYSDxRhEtWIuca'
WHERE slug = 'scale';
