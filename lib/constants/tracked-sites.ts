/**
 * Seed data for tracked sites on the public tracker.
 * The admin panel is the real source of truth — this is only used
 * for initial population via the admin UI or a seed script.
 */

export interface TrackedSiteSeed {
  domain: string
  display_name: string
  category: string
}

export const TRACKED_SITES: TrackedSiteSeed[] = [

  // -------------------------------------------------------------------------
  // Search & Ads
  // -------------------------------------------------------------------------
  { domain: 'google.com',          display_name: 'Google',           category: 'Search & Ads' },
  { domain: 'bing.com',            display_name: 'Bing',             category: 'Search & Ads' },
  { domain: 'duckduckgo.com',      display_name: 'DuckDuckGo',       category: 'Search & Ads' },
  { domain: 'yahoo.com',           display_name: 'Yahoo',            category: 'Search & Ads' },
  { domain: 'ads.google.com',      display_name: 'Google Ads',       category: 'Search & Ads' },
  { domain: 'semrush.com',         display_name: 'SEMrush',          category: 'Search & Ads' },
  { domain: 'ahrefs.com',          display_name: 'Ahrefs',           category: 'Search & Ads' },

  // -------------------------------------------------------------------------
  // Social Media
  // -------------------------------------------------------------------------
  { domain: 'facebook.com',        display_name: 'Facebook',         category: 'Social Media' },
  { domain: 'instagram.com',       display_name: 'Instagram',        category: 'Social Media' },
  { domain: 'twitter.com',         display_name: 'X (Twitter)',       category: 'Social Media' },
  { domain: 'linkedin.com',        display_name: 'LinkedIn',         category: 'Social Media' },
  { domain: 'reddit.com',          display_name: 'Reddit',           category: 'Social Media' },
  { domain: 'tiktok.com',          display_name: 'TikTok',           category: 'Social Media' },
  { domain: 'pinterest.com',       display_name: 'Pinterest',        category: 'Social Media' },
  { domain: 'snapchat.com',        display_name: 'Snapchat',         category: 'Social Media' },
  { domain: 'threads.net',         display_name: 'Threads',          category: 'Social Media' },
  { domain: 'mastodon.social',     display_name: 'Mastodon',         category: 'Social Media' },
  { domain: 'tumblr.com',          display_name: 'Tumblr',           category: 'Social Media' },

  // -------------------------------------------------------------------------
  // Video & Streaming
  // -------------------------------------------------------------------------
  { domain: 'youtube.com',         display_name: 'YouTube',          category: 'Video & Streaming' },
  { domain: 'netflix.com',         display_name: 'Netflix',          category: 'Video & Streaming' },
  { domain: 'twitch.tv',           display_name: 'Twitch',           category: 'Video & Streaming' },
  { domain: 'spotify.com',         display_name: 'Spotify',          category: 'Video & Streaming' },
  { domain: 'disneyplus.com',      display_name: 'Disney+',          category: 'Video & Streaming' },
  { domain: 'hulu.com',            display_name: 'Hulu',             category: 'Video & Streaming' },
  { domain: 'primevideo.com',      display_name: 'Amazon Prime Video', category: 'Video & Streaming' },
  { domain: 'peacocktv.com',       display_name: 'Peacock',          category: 'Video & Streaming' },
  { domain: 'paramountplus.com',   display_name: 'Paramount+',       category: 'Video & Streaming' },
  { domain: 'crunchyroll.com',     display_name: 'Crunchyroll',      category: 'Video & Streaming' },
  { domain: 'vimeo.com',           display_name: 'Vimeo',            category: 'Video & Streaming' },
  { domain: 'dailymotion.com',     display_name: 'Dailymotion',      category: 'Video & Streaming' },

  // -------------------------------------------------------------------------
  // Music & Audio
  // -------------------------------------------------------------------------
  { domain: 'music.apple.com',     display_name: 'Apple Music',      category: 'Music & Audio' },
  { domain: 'soundcloud.com',      display_name: 'SoundCloud',       category: 'Music & Audio' },
  { domain: 'tidal.com',           display_name: 'Tidal',            category: 'Music & Audio' },
  { domain: 'deezer.com',          display_name: 'Deezer',           category: 'Music & Audio' },
  { domain: 'bandcamp.com',        display_name: 'Bandcamp',         category: 'Music & Audio' },
  { domain: 'audiomack.com',       display_name: 'Audiomack',        category: 'Music & Audio' },

  // -------------------------------------------------------------------------
  // Cloud & Hosting
  // -------------------------------------------------------------------------
  { domain: 'aws.amazon.com',      display_name: 'AWS',              category: 'Cloud & Hosting' },
  { domain: 'azure.microsoft.com', display_name: 'Microsoft Azure',  category: 'Cloud & Hosting' },
  { domain: 'cloud.google.com',    display_name: 'Google Cloud',     category: 'Cloud & Hosting' },
  { domain: 'vercel.com',          display_name: 'Vercel',           category: 'Cloud & Hosting' },
  { domain: 'netlify.com',         display_name: 'Netlify',          category: 'Cloud & Hosting' },
  { domain: 'heroku.com',          display_name: 'Heroku',           category: 'Cloud & Hosting' },
  { domain: 'digitalocean.com',    display_name: 'DigitalOcean',     category: 'Cloud & Hosting' },
  { domain: 'linode.com',          display_name: 'Linode (Akamai)',  category: 'Cloud & Hosting' },
  { domain: 'vultr.com',           display_name: 'Vultr',            category: 'Cloud & Hosting' },
  { domain: 'hetzner.com',         display_name: 'Hetzner',          category: 'Cloud & Hosting' },
  { domain: 'ovhcloud.com',        display_name: 'OVHcloud',         category: 'Cloud & Hosting' },
  { domain: 'ionos.com',           display_name: 'IONOS',            category: 'Cloud & Hosting' },
  { domain: 'siteground.com',      display_name: 'SiteGround',       category: 'Cloud & Hosting' },
  { domain: 'bluehost.com',        display_name: 'Bluehost',         category: 'Cloud & Hosting' },
  { domain: 'godaddy.com',         display_name: 'GoDaddy',          category: 'Cloud & Hosting' },
  { domain: 'hostinger.com',       display_name: 'Hostinger',        category: 'Cloud & Hosting' },
  { domain: 'wpengine.com',        display_name: 'WP Engine',        category: 'Cloud & Hosting' },
  { domain: 'kinsta.com',          display_name: 'Kinsta',           category: 'Cloud & Hosting' },
  { domain: 'cloudways.com',       display_name: 'Cloudways',        category: 'Cloud & Hosting' },
  { domain: 'flyio.com',           display_name: 'Fly.io',           category: 'Cloud & Hosting' },
  { domain: 'render.com',          display_name: 'Render',           category: 'Cloud & Hosting' },
  { domain: 'railway.app',         display_name: 'Railway',          category: 'Cloud & Hosting' },

  // -------------------------------------------------------------------------
  // CDN & Infrastructure
  // -------------------------------------------------------------------------
  { domain: 'cloudflare.com',      display_name: 'Cloudflare',       category: 'CDN & Infrastructure' },
  { domain: 'fastly.com',          display_name: 'Fastly',           category: 'CDN & Infrastructure' },
  { domain: 'akamai.com',          display_name: 'Akamai',           category: 'CDN & Infrastructure' },
  { domain: 'bunny.net',           display_name: 'BunnyCDN',         category: 'CDN & Infrastructure' },
  { domain: 'cloudfront.net',      display_name: 'AWS CloudFront',   category: 'CDN & Infrastructure' },

  // -------------------------------------------------------------------------
  // Developer Tools
  // -------------------------------------------------------------------------
  { domain: 'github.com',          display_name: 'GitHub',           category: 'Developer Tools' },
  { domain: 'gitlab.com',          display_name: 'GitLab',           category: 'Developer Tools' },
  { domain: 'bitbucket.org',       display_name: 'Bitbucket',        category: 'Developer Tools' },
  { domain: 'stackoverflow.com',   display_name: 'Stack Overflow',   category: 'Developer Tools' },
  { domain: 'npmjs.com',           display_name: 'npm',              category: 'Developer Tools' },
  { domain: 'pypi.org',            display_name: 'PyPI',             category: 'Developer Tools' },
  { domain: 'packagist.org',       display_name: 'Packagist',        category: 'Developer Tools' },
  { domain: 'hub.docker.com',      display_name: 'Docker Hub',       category: 'Developer Tools' },
  { domain: 'circleci.com',        display_name: 'CircleCI',         category: 'Developer Tools' },
  { domain: 'travis-ci.com',       display_name: 'Travis CI',        category: 'Developer Tools' },
  { domain: 'jenkins.io',          display_name: 'Jenkins',          category: 'Developer Tools' },
  { domain: 'sentry.io',           display_name: 'Sentry',           category: 'Developer Tools' },
  { domain: 'sonarcloud.io',       display_name: 'SonarCloud',       category: 'Developer Tools' },
  { domain: 'postman.com',         display_name: 'Postman',          category: 'Developer Tools' },
  { domain: 'swagger.io',          display_name: 'Swagger',          category: 'Developer Tools' },
  { domain: 'supabase.com',        display_name: 'Supabase',         category: 'Developer Tools' },
  { domain: 'firebase.google.com', display_name: 'Firebase',         category: 'Developer Tools' },
  { domain: 'planetscale.com',     display_name: 'PlanetScale',      category: 'Developer Tools' },
  { domain: 'neon.tech',           display_name: 'Neon',             category: 'Developer Tools' },
  { domain: 'codepen.io',          display_name: 'CodePen',          category: 'Developer Tools' },
  { domain: 'replit.com',          display_name: 'Replit',           category: 'Developer Tools' },
  { domain: 'codesandbox.io',      display_name: 'CodeSandbox',      category: 'Developer Tools' },

  // -------------------------------------------------------------------------
  // Communication & Collaboration
  // -------------------------------------------------------------------------
  { domain: 'slack.com',           display_name: 'Slack',            category: 'Communication' },
  { domain: 'discord.com',         display_name: 'Discord',          category: 'Communication' },
  { domain: 'zoom.us',             display_name: 'Zoom',             category: 'Communication' },
  { domain: 'teams.microsoft.com', display_name: 'Microsoft Teams',  category: 'Communication' },
  { domain: 'whatsapp.com',        display_name: 'WhatsApp',         category: 'Communication' },
  { domain: 'telegram.org',        display_name: 'Telegram',         category: 'Communication' },
  { domain: 'signal.org',          display_name: 'Signal',           category: 'Communication' },
  { domain: 'meet.google.com',     display_name: 'Google Meet',      category: 'Communication' },
  { domain: 'webex.com',           display_name: 'Webex',            category: 'Communication' },
  { domain: 'whereby.com',         display_name: 'Whereby',          category: 'Communication' },
  { domain: 'loom.com',            display_name: 'Loom',             category: 'Communication' },

  // -------------------------------------------------------------------------
  // Email & Marketing
  // -------------------------------------------------------------------------
  { domain: 'mail.google.com',     display_name: 'Gmail',            category: 'Email & Marketing' },
  { domain: 'outlook.com',         display_name: 'Outlook',          category: 'Email & Marketing' },
  { domain: 'mailchimp.com',       display_name: 'Mailchimp',        category: 'Email & Marketing' },
  { domain: 'sendgrid.com',        display_name: 'SendGrid',         category: 'Email & Marketing' },
  { domain: 'resend.com',          display_name: 'Resend',           category: 'Email & Marketing' },
  { domain: 'mailgun.com',         display_name: 'Mailgun',          category: 'Email & Marketing' },
  { domain: 'klaviyo.com',         display_name: 'Klaviyo',          category: 'Email & Marketing' },
  { domain: 'convertkit.com',      display_name: 'ConvertKit',       category: 'Email & Marketing' },
  { domain: 'activecampaign.com',  display_name: 'ActiveCampaign',   category: 'Email & Marketing' },
  { domain: 'brevo.com',           display_name: 'Brevo',            category: 'Email & Marketing' },
  { domain: 'drip.com',            display_name: 'Drip',             category: 'Email & Marketing' },

  // -------------------------------------------------------------------------
  // E-commerce & Payments
  // -------------------------------------------------------------------------
  { domain: 'amazon.com',          display_name: 'Amazon',           category: 'E-commerce' },
  { domain: 'shopify.com',         display_name: 'Shopify',          category: 'E-commerce' },
  { domain: 'ebay.com',            display_name: 'eBay',             category: 'E-commerce' },
  { domain: 'stripe.com',          display_name: 'Stripe',           category: 'E-commerce' },
  { domain: 'paypal.com',          display_name: 'PayPal',           category: 'E-commerce' },
  { domain: 'etsy.com',            display_name: 'Etsy',             category: 'E-commerce' },
  { domain: 'woocommerce.com',     display_name: 'WooCommerce',      category: 'E-commerce' },
  { domain: 'bigcommerce.com',     display_name: 'BigCommerce',      category: 'E-commerce' },
  { domain: 'magento.com',         display_name: 'Adobe Commerce',   category: 'E-commerce' },
  { domain: 'squareup.com',        display_name: 'Square',           category: 'E-commerce' },
  { domain: 'gumroad.com',         display_name: 'Gumroad',          category: 'E-commerce' },
  { domain: 'paddle.com',          display_name: 'Paddle',           category: 'E-commerce' },
  { domain: 'lemonsqueezy.com',    display_name: 'Lemon Squeezy',    category: 'E-commerce' },
  { domain: 'wix.com',             display_name: 'Wix',              category: 'E-commerce' },

  // -------------------------------------------------------------------------
  // Finance & Banking
  // -------------------------------------------------------------------------
  { domain: 'wise.com',            display_name: 'Wise',             category: 'Finance' },
  { domain: 'revolut.com',         display_name: 'Revolut',          category: 'Finance' },
  { domain: 'coinbase.com',        display_name: 'Coinbase',         category: 'Finance' },
  { domain: 'binance.com',         display_name: 'Binance',          category: 'Finance' },
  { domain: 'robinhood.com',       display_name: 'Robinhood',        category: 'Finance' },
  { domain: 'monzo.com',           display_name: 'Monzo',            category: 'Finance' },
  { domain: 'starlingbank.com',    display_name: 'Starling Bank',    category: 'Finance' },
  { domain: 'trading212.com',      display_name: 'Trading 212',      category: 'Finance' },
  { domain: 'etoro.com',           display_name: 'eToro',            category: 'Finance' },
  { domain: 'kraken.com',          display_name: 'Kraken',           category: 'Finance' },
  { domain: 'quickbooks.com',      display_name: 'QuickBooks',       category: 'Finance' },
  { domain: 'xero.com',            display_name: 'Xero',             category: 'Finance' },
  { domain: 'freshbooks.com',      display_name: 'FreshBooks',       category: 'Finance' },

  // -------------------------------------------------------------------------
  // Productivity & Project Management
  // -------------------------------------------------------------------------
  { domain: 'notion.so',           display_name: 'Notion',           category: 'Productivity' },
  { domain: 'figma.com',           display_name: 'Figma',            category: 'Productivity' },
  { domain: 'canva.com',           display_name: 'Canva',            category: 'Productivity' },
  { domain: 'docs.google.com',     display_name: 'Google Docs',      category: 'Productivity' },
  { domain: 'trello.com',          display_name: 'Trello',           category: 'Productivity' },
  { domain: 'asana.com',           display_name: 'Asana',            category: 'Productivity' },
  { domain: 'monday.com',          display_name: 'Monday.com',       category: 'Productivity' },
  { domain: 'airtable.com',        display_name: 'Airtable',         category: 'Productivity' },
  { domain: 'clickup.com',         display_name: 'ClickUp',          category: 'Productivity' },
  { domain: 'basecamp.com',        display_name: 'Basecamp',         category: 'Productivity' },
  { domain: 'linear.app',          display_name: 'Linear',           category: 'Productivity' },
  { domain: 'miro.com',            display_name: 'Miro',             category: 'Productivity' },
  { domain: 'craft.do',            display_name: 'Craft',            category: 'Productivity' },
  { domain: 'obsidian.md',         display_name: 'Obsidian',         category: 'Productivity' },
  { domain: 'todoist.com',         display_name: 'Todoist',          category: 'Productivity' },
  { domain: 'dropbox.com',         display_name: 'Dropbox',          category: 'Productivity' },
  { domain: 'box.com',             display_name: 'Box',              category: 'Productivity' },
  { domain: 'drive.google.com',    display_name: 'Google Drive',     category: 'Productivity' },
  { domain: 'onedrive.live.com',   display_name: 'OneDrive',         category: 'Productivity' },

  // -------------------------------------------------------------------------
  // SaaS / CRM / Support
  // -------------------------------------------------------------------------
  { domain: 'hubspot.com',         display_name: 'HubSpot',          category: 'SaaS' },
  { domain: 'salesforce.com',      display_name: 'Salesforce',       category: 'SaaS' },
  { domain: 'zendesk.com',         display_name: 'Zendesk',          category: 'SaaS' },
  { domain: 'intercom.com',        display_name: 'Intercom',         category: 'SaaS' },
  { domain: 'freshdesk.com',       display_name: 'Freshdesk',        category: 'SaaS' },
  { domain: 'jira.atlassian.com',  display_name: 'Jira',             category: 'SaaS' },
  { domain: 'jira.com',            display_name: 'Jira',             category: 'SaaS' },
  { domain: 'confluence.atlassian.com', display_name: 'Confluence',  category: 'SaaS' },
  { domain: 'pipedrive.com',       display_name: 'Pipedrive',        category: 'SaaS' },
  { domain: 'zoho.com',            display_name: 'Zoho',             category: 'SaaS' },
  { domain: 'crisp.chat',          display_name: 'Crisp',            category: 'SaaS' },
  { domain: 'tawk.to',             display_name: 'Tawk.to',          category: 'SaaS' },
  { domain: 'helpscout.com',       display_name: 'Help Scout',       category: 'SaaS' },
  { domain: 'gorgias.com',         display_name: 'Gorgias',          category: 'SaaS' },
  { domain: 'typeform.com',        display_name: 'Typeform',         category: 'SaaS' },
  { domain: 'surveymonkey.com',    display_name: 'SurveyMonkey',     category: 'SaaS' },
  { domain: 'hotjar.com',          display_name: 'Hotjar',           category: 'SaaS' },
  { domain: 'mixpanel.com',        display_name: 'Mixpanel',         category: 'SaaS' },
  { domain: 'segment.com',         display_name: 'Segment',          category: 'SaaS' },
  { domain: 'amplitude.com',       display_name: 'Amplitude',        category: 'SaaS' },
  { domain: 'posthog.com',         display_name: 'PostHog',          category: 'SaaS' },

  // -------------------------------------------------------------------------
  // CMS & Website Builders
  // -------------------------------------------------------------------------
  { domain: 'wordpress.com',       display_name: 'WordPress.com',    category: 'CMS' },
  { domain: 'wordpress.org',       display_name: 'WordPress.org',    category: 'CMS' },
  { domain: 'squarespace.com',     display_name: 'Squarespace',      category: 'CMS' },
  { domain: 'webflow.com',         display_name: 'Webflow',          category: 'CMS' },
  { domain: 'ghost.org',           display_name: 'Ghost',            category: 'CMS' },
  { domain: 'drupal.org',          display_name: 'Drupal',           category: 'CMS' },
  { domain: 'joomla.org',          display_name: 'Joomla',           category: 'CMS' },
  { domain: 'contentful.com',      display_name: 'Contentful',       category: 'CMS' },
  { domain: 'sanity.io',           display_name: 'Sanity',           category: 'CMS' },
  { domain: 'strapi.io',           display_name: 'Strapi',           category: 'CMS' },
  { domain: 'storyblok.com',       display_name: 'Storyblok',        category: 'CMS' },
  { domain: 'framer.com',          display_name: 'Framer',           category: 'CMS' },

  // -------------------------------------------------------------------------
  // AI
  // -------------------------------------------------------------------------
  { domain: 'openai.com',          display_name: 'OpenAI',           category: 'AI' },
  { domain: 'anthropic.com',       display_name: 'Anthropic',        category: 'AI' },
  { domain: 'huggingface.co',      display_name: 'Hugging Face',     category: 'AI' },
  { domain: 'midjourney.com',      display_name: 'Midjourney',       category: 'AI' },
  { domain: 'stability.ai',        display_name: 'Stability AI',     category: 'AI' },
  { domain: 'perplexity.ai',       display_name: 'Perplexity',       category: 'AI' },
  { domain: 'claude.ai',           display_name: 'Claude',           category: 'AI' },
  { domain: 'gemini.google.com',   display_name: 'Gemini',           category: 'AI' },
  { domain: 'copilot.microsoft.com', display_name: 'Microsoft Copilot', category: 'AI' },
  { domain: 'cursor.sh',           display_name: 'Cursor',           category: 'AI' },
  { domain: 'runway.ml',           display_name: 'Runway',           category: 'AI' },
  { domain: 'elevenlabs.io',       display_name: 'ElevenLabs',       category: 'AI' },
  { domain: 'replicate.com',       display_name: 'Replicate',        category: 'AI' },

  // -------------------------------------------------------------------------
  // Gaming
  // -------------------------------------------------------------------------
  { domain: 'store.steampowered.com', display_name: 'Steam',         category: 'Gaming' },
  { domain: 'epicgames.com',       display_name: 'Epic Games',       category: 'Gaming' },
  { domain: 'roblox.com',          display_name: 'Roblox',           category: 'Gaming' },
  { domain: 'playstation.com',     display_name: 'PlayStation',      category: 'Gaming' },
  { domain: 'xbox.com',            display_name: 'Xbox',             category: 'Gaming' },
  { domain: 'ea.com',              display_name: 'EA',               category: 'Gaming' },
  { domain: 'ubisoft.com',         display_name: 'Ubisoft',          category: 'Gaming' },
  { domain: 'battle.net',          display_name: 'Battle.net',       category: 'Gaming' },
  { domain: 'minecraft.net',       display_name: 'Minecraft',        category: 'Gaming' },
  { domain: 'fortnite.com',        display_name: 'Fortnite',         category: 'Gaming' },

  // -------------------------------------------------------------------------
  // Education
  // -------------------------------------------------------------------------
  { domain: 'coursera.org',        display_name: 'Coursera',         category: 'Education' },
  { domain: 'udemy.com',           display_name: 'Udemy',            category: 'Education' },
  { domain: 'duolingo.com',        display_name: 'Duolingo',         category: 'Education' },
  { domain: 'khanacademy.org',     display_name: 'Khan Academy',     category: 'Education' },
  { domain: 'skillshare.com',      display_name: 'Skillshare',       category: 'Education' },
  { domain: 'pluralsight.com',     display_name: 'Pluralsight',      category: 'Education' },
  { domain: 'brilliant.org',       display_name: 'Brilliant',        category: 'Education' },
  { domain: 'edx.org',             display_name: 'edX',              category: 'Education' },
  { domain: 'codecademy.com',      display_name: 'Codecademy',       category: 'Education' },
  { domain: 'freecodecamp.org',    display_name: 'freeCodeCamp',     category: 'Education' },

  // -------------------------------------------------------------------------
  // Food & Delivery
  // -------------------------------------------------------------------------
  { domain: 'zepto.com',           display_name: 'Zepto',            category: 'Food & Delivery' },
  { domain: 'ubereats.com',        display_name: 'Uber Eats',        category: 'Food & Delivery' },
  { domain: 'deliveroo.com',       display_name: 'Deliveroo',        category: 'Food & Delivery' },
  { domain: 'doordash.com',        display_name: 'DoorDash',         category: 'Food & Delivery' },
  { domain: 'justeat.com',         display_name: 'Just Eat',         category: 'Food & Delivery' },
  { domain: 'grubhub.com',         display_name: 'Grubhub',          category: 'Food & Delivery' },
  { domain: 'instacart.com',       display_name: 'Instacart',        category: 'Food & Delivery' },

  // -------------------------------------------------------------------------
  // Travel
  // -------------------------------------------------------------------------
  { domain: 'booking.com',         display_name: 'Booking.com',      category: 'Travel' },
  { domain: 'airbnb.com',          display_name: 'Airbnb',           category: 'Travel' },
  { domain: 'expedia.com',         display_name: 'Expedia',          category: 'Travel' },
  { domain: 'tripadvisor.com',     display_name: 'TripAdvisor',      category: 'Travel' },
  { domain: 'skyscanner.net',      display_name: 'Skyscanner',       category: 'Travel' },
  { domain: 'kayak.com',           display_name: 'Kayak',            category: 'Travel' },
  { domain: 'hotels.com',          display_name: 'Hotels.com',       category: 'Travel' },
  { domain: 'ryanair.com',         display_name: 'Ryanair',          category: 'Travel' },
  { domain: 'easyjet.com',         display_name: 'easyJet',          category: 'Travel' },
  { domain: 'britishairways.com',  display_name: 'British Airways',  category: 'Travel' },

  // -------------------------------------------------------------------------
  // Security & Identity
  // -------------------------------------------------------------------------
  { domain: 'nordvpn.com',         display_name: 'NordVPN',          category: 'Security' },
  { domain: '1password.com',       display_name: '1Password',        category: 'Security' },
  { domain: 'lastpass.com',        display_name: 'LastPass',         category: 'Security' },
  { domain: 'bitwarden.com',       display_name: 'Bitwarden',        category: 'Security' },
  { domain: 'dashlane.com',        display_name: 'Dashlane',         category: 'Security' },
  { domain: 'auth0.com',           display_name: 'Auth0',            category: 'Security' },
  { domain: 'okta.com',            display_name: 'Okta',             category: 'Security' },
  { domain: 'expressvpn.com',      display_name: 'ExpressVPN',       category: 'Security' },
  { domain: 'haveibeenpwned.com',  display_name: 'Have I Been Pwned', category: 'Security' },

  // -------------------------------------------------------------------------
  // News & Media
  // -------------------------------------------------------------------------
  { domain: 'bbc.com',             display_name: 'BBC',              category: 'News & Media' },
  { domain: 'cnn.com',             display_name: 'CNN',              category: 'News & Media' },
  { domain: 'theguardian.com',     display_name: 'The Guardian',     category: 'News & Media' },
  { domain: 'nytimes.com',         display_name: 'New York Times',   category: 'News & Media' },
  { domain: 'techcrunch.com',      display_name: 'TechCrunch',       category: 'News & Media' },
  { domain: 'theverge.com',        display_name: 'The Verge',        category: 'News & Media' },
  { domain: 'wired.com',           display_name: 'Wired',            category: 'News & Media' },
  { domain: 'hn.algolia.com',      display_name: 'Hacker News',      category: 'News & Media' },
  { domain: 'medium.com',          display_name: 'Medium',           category: 'News & Media' },
  { domain: 'dev.to',              display_name: 'DEV Community',    category: 'News & Media' },

  // -------------------------------------------------------------------------
  // Design & Creative
  // -------------------------------------------------------------------------
  { domain: 'dribbble.com',        display_name: 'Dribbble',         category: 'Design' },
  { domain: 'behance.net',         display_name: 'Behance',          category: 'Design' },
  { domain: 'unsplash.com',        display_name: 'Unsplash',         category: 'Design' },
  { domain: 'pexels.com',          display_name: 'Pexels',           category: 'Design' },
  { domain: 'adobe.com',           display_name: 'Adobe',            category: 'Design' },
  { domain: 'sketch.com',          display_name: 'Sketch',           category: 'Design' },
  { domain: 'invisionapp.com',     display_name: 'InVision',         category: 'Design' },
  { domain: 'zeplin.io',           display_name: 'Zeplin',           category: 'Design' },

  // -------------------------------------------------------------------------
  // Monitoring & DevOps
  // -------------------------------------------------------------------------
  { domain: 'datadog.com',         display_name: 'Datadog',          category: 'Monitoring' },
  { domain: 'newrelic.com',        display_name: 'New Relic',        category: 'Monitoring' },
  { domain: 'grafana.com',         display_name: 'Grafana',          category: 'Monitoring' },
  { domain: 'pagerduty.com',       display_name: 'PagerDuty',        category: 'Monitoring' },
  { domain: 'statuspage.io',       display_name: 'Statuspage',       category: 'Monitoring' },
  { domain: 'pingdom.com',         display_name: 'Pingdom',          category: 'Monitoring' },
  { domain: 'betteruptime.com',    display_name: 'Better Uptime',    category: 'Monitoring' },
  { domain: 'uptimerobot.com',     display_name: 'UptimeRobot',      category: 'Monitoring' },

]
