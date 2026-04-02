-- Set super admin flag for the founder
UPDATE public.users SET is_super_admin = true WHERE email = 'sachindiwaker@gmail.com';

-- Also ensure any future admin detection works by matching the ADMIN_EMAILS env var
-- This is a one-time data fix, not a schema change
