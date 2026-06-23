-- Migration 00103: Fix Builder plan has_api_access per KB
-- KB defines API access as Scale-only.
-- Migration 00011 incorrectly set Builder has_api_access = true.

UPDATE plans SET has_api_access = false WHERE slug = 'builder';
