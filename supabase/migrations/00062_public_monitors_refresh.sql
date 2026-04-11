-- Migration 62: Public monitors refresh
-- Remove: IP-blocking sites, false positives, low "is X down?" search volume
-- Add: All major Indian sites + missing high-volume global sites

-- =============================================================================
-- REMOVE — IP blockers, false positives, low consumer search volume
-- =============================================================================
DELETE FROM public_monitors WHERE domain IN (
  -- IP blockers (Vercel/AWS ranges blocked)
  'netflix.com', 'spotify.com', 'disneyplus.com', 'hulu.com',
  'primevideo.com', 'peacocktv.com', 'paramountplus.com',
  'tiktok.com', 'airbnb.com', 'amazon.com',

  -- False positives from April 10-11 incident
  'azure.microsoft.com', 'adobe.com', 'magento.com', 'mdn.web.docs',
  'height.app', 'stormwind.io', 'opentable.com', 'bupa.co.uk',
  'g2a.com', 'servicenow.com', 'open.ac.uk',

  -- Infrastructure / not consumer-facing
  'fastly.com', 'akamai.com', 'bunny.net', 'cloudfront.net',
  'aws.amazon.com', 'cloud.google.com',

  -- Hosting providers (low "is X down?" searches)
  'linode.com', 'vultr.com', 'hetzner.com', 'ovhcloud.com',
  'ionos.com', 'siteground.com', 'bluehost.com', 'hostinger.com',
  'wpengine.com', 'kinsta.com', 'cloudways.com', 'flyio.com', 'railway.app',

  -- Dev tools with low consumer volume
  'bitbucket.org', 'packagist.org', 'travis-ci.com', 'jenkins.io',
  'sonarcloud.io', 'swagger.io', 'planetscale.com', 'neon.tech',
  'codepen.io',

  -- Low volume streaming/music
  'dailymotion.com', 'tidal.com', 'deezer.com', 'bandcamp.com', 'audiomack.com',

  -- Low volume social
  'mastodon.social', 'tumblr.com',

  -- Low volume comms
  'whereby.com', 'webex.com',

  -- Low volume email tools
  'mailgun.com', 'brevo.com', 'drip.com',

  -- Low volume ecommerce
  'gumroad.com', 'paddle.com', 'lemonsqueezy.com',

  -- Low volume finance
  'trading212.com', 'freshbooks.com',

  -- Low volume productivity
  'basecamp.com', 'craft.do', 'obsidian.md', 'todoist.com', 'box.com',

  -- Low volume SaaS
  'crisp.chat', 'tawk.to', 'gorgias.com', 'segment.com', 'amplitude.com', 'posthog.com',

  -- Low volume CMS
  'drupal.org', 'joomla.org', 'storyblok.com', 'strapi.io', 'sanity.io',

  -- Low volume AI
  'stability.ai', 'runway.ml', 'replicate.com',

  -- Low volume gaming
  'ubisoft.com', 'battle.net',

  -- Low volume education
  'skillshare.com', 'pluralsight.com', 'brilliant.org', 'edx.org',

  -- Low volume food
  'grubhub.com',

  -- Low volume travel
  'tripadvisor.com', 'kayak.com', 'hotels.com',

  -- Low volume design
  'invisionapp.com', 'zeplin.io', 'sketch.com',

  -- Competitors (monitoring tools)
  'statuspage.io', 'pingdom.com', 'betteruptime.com', 'uptimerobot.com',

  -- Low volume security
  'haveibeenpwned.com', 'dashlane.com',

  -- Not "is X down?" content sites
  'wired.com', 'hn.algolia.com', 'dev.to',

  -- Low volume search tools
  'semrush.com', 'ahrefs.com'
);

-- =============================================================================
-- ADD — Indian sites (all major platforms)
-- =============================================================================
INSERT INTO public_monitors (domain, display_name, category) VALUES

  -- Travel & Govt (highest search volume in India)
  ('irctc.co.in',           'IRCTC',                  'Travel'),
  ('makemytrip.com',        'MakeMyTrip',             'Travel'),
  ('redbus.in',             'RedBus',                  'Travel'),
  ('ixigo.com',             'Ixigo',                   'Travel'),
  ('yatra.com',             'Yatra',                   'Travel'),

  -- Government portals (crash on deadline days)
  ('incometax.gov.in',      'Income Tax Portal',       'Government'),
  ('digilocker.gov.in',     'DigiLocker',              'Government'),
  ('epfindia.gov.in',       'EPFO',                    'Government'),
  ('passportindia.gov.in',  'Passport Seva',           'Government'),
  ('uidai.gov.in',          'Aadhaar (UIDAI)',         'Government'),
  ('cowin.gov.in',          'CoWIN',                   'Government'),
  ('umang.gov.in',          'UMANG',                   'Government'),

  -- Banking (high anxiety searches)
  ('onlinesbi.sbi',         'SBI Online Banking',      'Banking'),
  ('hdfcbank.com',          'HDFC Bank',               'Banking'),
  ('icicibank.com',         'ICICI Bank',              'Banking'),
  ('axisbank.com',          'Axis Bank',               'Banking'),
  ('kotakbank.com',         'Kotak Bank',              'Banking'),
  ('pnbindia.in',           'Punjab National Bank',    'Banking'),
  ('bankofbaroda.in',       'Bank of Baroda',          'Banking'),
  ('canarabank.com',        'Canara Bank',             'Banking'),
  ('indusind.com',          'IndusInd Bank',           'Banking'),
  ('yesbank.in',            'Yes Bank',                'Banking'),

  -- UPI & Payments
  ('phonepe.com',           'PhonePe',                 'Payments'),
  ('paytm.com',             'Paytm',                   'Payments'),
  ('razorpay.com',          'Razorpay',                'Payments'),
  ('mobikwik.com',          'MobiKwik',                'Payments'),

  -- Telecom
  ('jio.com',               'Jio',                     'Telecom'),
  ('airtel.in',             'Airtel',                  'Telecom'),
  ('bsnl.co.in',            'BSNL',                    'Telecom'),
  ('myvi.in',               'Vi (Vodafone Idea)',       'Telecom'),

  -- Streaming (IPL/cricket spikes)
  ('jiocinema.com',         'JioCinema',               'Streaming'),
  ('hotstar.com',           'Disney+ Hotstar',         'Streaming'),
  ('sonyliv.com',           'SonyLIV',                 'Streaming'),
  ('zee5.com',              'ZEE5',                    'Streaming'),
  ('mxplayer.in',           'MX Player',               'Streaming'),
  ('voot.com',              'Voot',                    'Streaming'),

  -- Ecommerce
  ('amazon.in',             'Amazon India',            'E-commerce'),
  ('flipkart.com',          'Flipkart',                'E-commerce'),
  ('myntra.com',            'Myntra',                  'E-commerce'),
  ('meesho.com',            'Meesho',                  'E-commerce'),
  ('nykaa.com',             'Nykaa',                   'E-commerce'),
  ('snapdeal.com',          'Snapdeal',                'E-commerce'),
  ('bigbasket.com',         'BigBasket',               'E-commerce'),
  ('zepto.in',              'Zepto',                   'E-commerce'),

  -- Food & Delivery
  ('zomato.com',            'Zomato',                  'Food & Delivery'),
  ('swiggy.com',            'Swiggy',                  'Food & Delivery'),
  ('blinkit.com',           'Blinkit',                 'Food & Delivery'),
  ('dunzo.com',             'Dunzo',                   'Food & Delivery'),

  -- Transport
  ('olacabs.com',           'Ola',                     'Transport'),
  ('rapido.bike',           'Rapido',                  'Transport'),

  -- Gaming & Fantasy
  ('dream11.com',           'Dream11',                 'Gaming'),
  ('mpl.live',              'MPL',                     'Gaming'),

  -- Education
  ('byjus.com',             'BYJU''S',                 'Education'),
  ('unacademy.com',         'Unacademy',               'Education'),
  ('vedantu.com',           'Vedantu',                 'Education'),

  -- Jobs
  ('naukri.com',            'Naukri',                  'Jobs'),
  ('shine.com',             'Shine',                   'Jobs'),

  -- Insurance & Finance
  ('policybazaar.com',      'PolicyBazaar',            'Finance'),
  ('zerodha.com',           'Zerodha',                 'Finance'),
  ('groww.in',              'Groww',                   'Finance'),
  ('upstox.com',            'Upstox',                  'Finance')

ON CONFLICT (domain) DO NOTHING;

-- =============================================================================
-- ADD — Missing high-volume global sites
-- =============================================================================
INSERT INTO public_monitors (domain, display_name, category) VALUES

  -- Payments (very high "is X down?" searches)
  ('cash.app',              'Cash App',                'Payments'),
  ('venmo.com',             'Venmo',                   'Payments'),

  -- Apple (iCloud down = massive search spike)
  ('icloud.com',            'iCloud',                  'Cloud & Hosting'),
  ('apple.com',             'Apple Services',          'Technology'),

  -- UK Telecom (top UK searches)
  ('virginmedia.com',       'Virgin Media',            'Telecom'),
  ('bt.com',                'BT',                      'Telecom'),
  ('sky.com',               'Sky',                     'Telecom'),
  ('vodafone.com',          'Vodafone',                'Telecom'),
  ('o2.co.uk',              'O2',                      'Telecom'),
  ('ee.co.uk',              'EE',                      'Telecom'),

  -- UK Banking
  ('barclays.co.uk',        'Barclays',                'Banking'),
  ('lloydsbank.com',        'Lloyds Bank',             'Banking'),
  ('hsbc.com',              'HSBC',                    'Banking'),
  ('natwest.com',           'NatWest',                 'Banking'),
  ('santander.co.uk',       'Santander',               'Banking'),
  ('halifax.co.uk',         'Halifax',                 'Banking'),

  -- Delivery
  ('fedex.com',             'FedEx',                   'Delivery'),
  ('royalmail.com',         'Royal Mail',              'Delivery'),
  ('dhl.com',               'DHL',                     'Delivery'),
  ('ups.com',               'UPS',                     'Delivery'),
  ('hermes.com',            'Evri (Hermes)',            'Delivery'),

  -- Airlines (high search volume after outages)
  ('southwest.com',         'Southwest Airlines',      'Airlines'),
  ('aa.com',                'American Airlines',       'Airlines'),
  ('united.com',            'United Airlines',         'Airlines'),
  ('delta.com',             'Delta Airlines',          'Airlines'),
  ('ryanair.com',           'Ryanair',                 'Airlines'),
  ('easyjet.com',           'easyJet',                 'Airlines'),
  ('britishairways.com',    'British Airways',         'Airlines'),
  ('jet2.com',              'Jet2',                    'Airlines'),
  ('emirates.com',          'Emirates',                'Airlines'),
  ('lufthansa.com',         'Lufthansa',               'Airlines'),
  ('indigoair.in',          'IndiGo',                  'Airlines'),
  ('airindia.in',           'Air India',               'Airlines'),

  -- UK Streaming
  ('bbc.co.uk',             'BBC iPlayer',             'Streaming'),
  ('channel4.com',          'Channel 4',               'Streaming'),
  ('itv.com',               'ITVX',                    'Streaming'),

  -- Gaming (very high search volume)
  ('playvalorant.com',      'Valorant',                'Gaming'),
  ('leagueoflegends.com',   'League of Legends',       'Gaming'),
  ('callofduty.com',        'Call of Duty',            'Gaming'),
  ('genshin.hoyoverse.com', 'Genshin Impact',         'Gaming'),

  -- Transport
  ('uber.com',              'Uber',                    'Transport'),
  ('lyft.com',              'Lyft',                    'Transport'),

  -- Crypto (spikes during market volatility)
  ('crypto.com',            'Crypto.com',              'Crypto'),
  ('bybit.com',             'Bybit',                   'Crypto'),
  ('okx.com',               'OKX',                     'Crypto')

ON CONFLICT (domain) DO NOTHING;
