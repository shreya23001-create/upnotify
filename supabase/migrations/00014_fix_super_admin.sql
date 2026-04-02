-- Fix super admin: match case-insensitively and also match by auth.users email
-- First try exact match
UPDATE public.users SET is_super_admin = true WHERE email = 'sachindiwaker@gmail.com';

-- Then try case-insensitive match
UPDATE public.users SET is_super_admin = true WHERE LOWER(email) = 'sachindiwaker@gmail.com';

-- Also try matching via auth.users table (in case email in public.users is different)
UPDATE public.users SET is_super_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE LOWER(email) = 'sachindiwaker@gmail.com'
);

-- Log what we have for debugging
DO $$
DECLARE
  user_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE is_super_admin = true;
  RAISE NOTICE 'Total users: %, Super admins: %', user_count, admin_count;
END $$;
