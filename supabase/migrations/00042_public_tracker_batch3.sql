-- Public Tracker — Batch 3 (100 sites)
-- ON CONFLICT DO NOTHING prevents duplicates

INSERT INTO public_monitors (domain, display_name, category, is_active) VALUES
  -- Social (5)
  ('youtube.com',       'YouTube',        'Social',         true),
  ('reddit.com',        'Reddit',         'Social',         true),
  ('pinterest.com',     'Pinterest',      'Social',         true),
  ('snapchat.com',      'Snapchat',       'Social',         true),
  ('threads.net',       'Threads',        'Social',         true),

  -- Cloud & Hosting (8)
  ('azure.microsoft.com', 'Microsoft Azure', 'Cloud & Hosting', true),
  ('linode.com',        'Linode',         'Cloud & Hosting', true),
  ('vultr.com',         'Vultr',          'Cloud & Hosting', true),
  ('hetzner.com',       'Hetzner',        'Cloud & Hosting', true),
  ('ovhcloud.com',      'OVHcloud',       'Cloud & Hosting', true),
  ('ionos.com',         'IONOS',          'Cloud & Hosting', true),
  ('bluehost.com',      'Bluehost',       'Cloud & Hosting', true),
  ('godaddy.com',       'GoDaddy',        'Cloud & Hosting', true),

  -- Dev Tools (8)
  ('jira.atlassian.com',       'Jira',          'Dev Tools', true),
  ('confluence.atlassian.com', 'Confluence',    'Dev Tools', true),
  ('linear.app',               'Linear',        'Dev Tools', true),
  ('replit.com',               'Replit',        'Dev Tools', true),
  ('codepen.io',               'CodePen',       'Dev Tools', true),
  ('codesandbox.io',           'CodeSandbox',   'Dev Tools', true),
  ('dev.to',                   'DEV Community', 'Dev Tools', true),
  ('hashnode.com',             'Hashnode',      'Dev Tools', true),

  -- E-commerce (6)
  ('bigcommerce.com',   'BigCommerce',    'E-commerce', true),
  ('magento.com',       'Magento',        'E-commerce', true),
  ('flipkart.com',      'Flipkart',       'E-commerce', true),
  ('myntra.com',        'Myntra',         'E-commerce', true),
  ('rakuten.com',       'Rakuten',        'E-commerce', true),
  ('prestashop.com',    'PrestaShop',     'E-commerce', true),

  -- Finance (8)
  ('monzo.com',           'Monzo',          'Finance', true),
  ('n26.com',             'N26',            'Finance', true),
  ('crypto.com',          'Crypto.com',     'Finance', true),
  ('etoro.com',           'eToro',          'Finance', true),
  ('trading212.com',      'Trading 212',    'Finance', true),
  ('americanexpress.com', 'Amex',           'Finance', true),
  ('mastercard.com',      'Mastercard',     'Finance', true),
  ('visa.com',            'Visa',           'Finance', true),

  -- Education (6)
  ('skillshare.com',    'Skillshare',     'Education', true),
  ('pluralsight.com',   'Pluralsight',    'Education', true),
  ('edx.org',           'edX',            'Education', true),
  ('codecademy.com',    'Codecademy',     'Education', true),
  ('freecodecamp.org',  'freeCodeCamp',   'Education', true),
  ('wikipedia.org',     'Wikipedia',      'Education', true),

  -- Healthcare (5)
  ('nhs.uk',            'NHS',            'Healthcare', true),
  ('zocdoc.com',        'Zocdoc',         'Healthcare', true),
  ('webmd.com',         'WebMD',          'Healthcare', true),
  ('healthline.com',    'Healthline',     'Healthcare', true),
  ('babylon.com',       'Babylon Health', 'Healthcare', true),

  -- Travel (6)
  ('skyscanner.net',    'Skyscanner',     'Travel', true),
  ('kayak.com',         'Kayak',          'Travel', true),
  ('hotels.com',        'Hotels.com',     'Travel', true),
  ('marriott.com',      'Marriott',       'Travel', true),
  ('hilton.com',        'Hilton',         'Travel', true),
  ('ryanair.com',       'Ryanair',        'Travel', true),

  -- Productivity (5)
  ('miro.com',          'Miro',           'Productivity', true),
  ('clickup.com',       'ClickUp',        'Productivity', true),
  ('basecamp.com',      'Basecamp',       'Productivity', true),
  ('todoist.com',       'Todoist',        'Productivity', true),
  ('evernote.com',      'Evernote',       'Productivity', true),

  -- Streaming & Video (7)
  ('netflix.com',       'Netflix',        'Streaming & Video', true),
  ('disneyplus.com',    'Disney+',        'Streaming & Video', true),
  ('hulu.com',          'Hulu',           'Streaming & Video', true),
  ('primevideo.com',    'Prime Video',    'Streaming & Video', true),
  ('max.com',           'Max',            'Streaming & Video', true),
  ('tv.apple.com',      'Apple TV+',      'Streaming & Video', true),
  ('crunchyroll.com',   'Crunchyroll',    'Streaming & Video', true),

  -- CMS & Headless (4)
  ('contentful.com',    'Contentful',     'CMS', true),
  ('sanity.io',         'Sanity',         'CMS', true),
  ('storyblok.com',     'Storyblok',      'CMS', true),
  ('drupal.org',        'Drupal',         'CMS', true),

  -- Monitoring & Observability (5)
  ('datadog.com',       'Datadog',        'Dev Tools', true),
  ('newrelic.com',      'New Relic',      'Dev Tools', true),
  ('pagerduty.com',     'PagerDuty',      'Dev Tools', true),
  ('betteruptime.com',  'Better Uptime',  'Dev Tools', true),
  ('pingdom.com',       'Pingdom',        'Dev Tools', true),

  -- HR & Business (5)
  ('workday.com',       'Workday',        'Business', true),
  ('bamboohr.com',      'BambooHR',       'Business', true),
  ('gusto.com',         'Gusto',          'Business', true),
  ('rippling.com',      'Rippling',       'Business', true),
  ('deel.com',          'Deel',           'Business', true),

  -- Customer Support (4)
  ('zendesk.com',       'Zendesk',        'Business', true),
  ('intercom.com',      'Intercom',       'Business', true),
  ('freshdesk.com',     'Freshdesk',      'Business', true),
  ('helpscout.com',     'Help Scout',     'Business', true),

  -- Security (4)
  ('1password.com',     '1Password',      'Security', true),
  ('lastpass.com',      'LastPass',       'Security', true),
  ('nordvpn.com',       'NordVPN',        'Security', true),
  ('crowdstrike.com',   'CrowdStrike',    'Security', true),

  -- Crypto & Web3 (3)
  ('opensea.io',        'OpenSea',        'Finance', true),
  ('uniswap.org',       'Uniswap',        'Finance', true),
  ('ledger.com',        'Ledger',         'Finance', true),

  -- Food & Dining (3)
  ('opentable.com',     'OpenTable',      'Food & Delivery', true),
  ('grubhub.com',       'Grubhub',        'Food & Delivery', true),
  ('yelp.com',          'Yelp',           'Food & Delivery', true),

  -- UK Retail (3)
  ('johnlewis.com',         'John Lewis',       'E-commerce', true),
  ('marksandspencer.com',   'M&S',              'E-commerce', true),
  ('tesco.com',             'Tesco',            'E-commerce', true),

  -- Big Tech (5)
  ('apple.com',         'Apple',          'Other', true),
  ('microsoft.com',     'Microsoft',      'Other', true),
  ('samsung.com',       'Samsung',        'Other', true),
  ('meta.com',          'Meta',           'Other', true),
  ('tesla.com',         'Tesla',          'Other', true)

ON CONFLICT (domain) DO NOTHING;
