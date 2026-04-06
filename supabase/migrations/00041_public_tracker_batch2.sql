-- Public Tracker — Batch 2 (20 sites)
-- Social, Productivity, Travel, Email & Marketing, CDN & Infrastructure
-- ON CONFLICT DO NOTHING prevents duplicates

INSERT INTO public_monitors (domain, display_name, category, is_active) VALUES
  -- Social (5)
  ('facebook.com',    'Facebook',        'Social',                  true),
  ('instagram.com',   'Instagram',       'Social',                  true),
  ('x.com',           'X (Twitter)',     'Social',                  true),
  ('linkedin.com',    'LinkedIn',        'Social',                  true),
  ('tiktok.com',      'TikTok',          'Social',                  true),

  -- Productivity (5)
  ('notion.so',       'Notion',          'Productivity',            true),
  ('figma.com',       'Figma',           'Productivity',            true),
  ('trello.com',      'Trello',          'Productivity',            true),
  ('monday.com',      'Monday.com',      'Productivity',            true),
  ('airtable.com',    'Airtable',        'Productivity',            true),

  -- Travel (4)
  ('booking.com',     'Booking.com',     'Travel',                  true),
  ('airbnb.com',      'Airbnb',          'Travel',                  true),
  ('expedia.com',     'Expedia',         'Travel',                  true),
  ('tripadvisor.com', 'TripAdvisor',     'Travel',                  true),

  -- Email & Marketing (3)
  ('hubspot.com',         'HubSpot',         'Email & Marketing',   true),
  ('activecampaign.com',  'ActiveCampaign',  'Email & Marketing',   true),
  ('convertkit.com',      'ConvertKit',      'Email & Marketing',   true),

  -- CDN & Infrastructure (3)
  ('akamai.com',      'Akamai',          'CDN & Infrastructure',    true),
  ('cloudinary.com',  'Cloudinary',      'CDN & Infrastructure',    true),
  ('bunny.net',       'BunnyCDN',        'CDN & Infrastructure',    true)

ON CONFLICT (domain) DO NOTHING;
