-- Fix WordPress monitor limits to agreed values:
-- Free: 0, Lite: 1, Builder: 5, Scale: 10
UPDATE plans SET wp_monitor_limit = 0  WHERE slug = 'free';
UPDATE plans SET wp_monitor_limit = 1  WHERE slug = 'lite';
UPDATE plans SET wp_monitor_limit = 5  WHERE slug = 'builder';
UPDATE plans SET wp_monitor_limit = 10 WHERE slug = 'scale';
