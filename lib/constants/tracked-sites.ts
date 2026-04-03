/**
 * Seed data for the initial 50 tracked sites.
 * The admin panel is the real source of truth — this is only used
 * for initial population via the admin UI or a seed script.
 */

export interface TrackedSiteSeed {
  domain: string
  display_name: string
  category: string
}

export const TRACKED_SITES: TrackedSiteSeed[] = [
  // Search & Ads
  { domain: 'google.com', display_name: 'Google', category: 'Search & Ads' },
  { domain: 'bing.com', display_name: 'Bing', category: 'Search & Ads' },
  { domain: 'duckduckgo.com', display_name: 'DuckDuckGo', category: 'Search & Ads' },

  // Social Media
  { domain: 'facebook.com', display_name: 'Facebook', category: 'Social Media' },
  { domain: 'instagram.com', display_name: 'Instagram', category: 'Social Media' },
  { domain: 'twitter.com', display_name: 'X (Twitter)', category: 'Social Media' },
  { domain: 'linkedin.com', display_name: 'LinkedIn', category: 'Social Media' },
  { domain: 'reddit.com', display_name: 'Reddit', category: 'Social Media' },
  { domain: 'tiktok.com', display_name: 'TikTok', category: 'Social Media' },
  { domain: 'pinterest.com', display_name: 'Pinterest', category: 'Social Media' },

  // Video & Streaming
  { domain: 'youtube.com', display_name: 'YouTube', category: 'Video & Streaming' },
  { domain: 'netflix.com', display_name: 'Netflix', category: 'Video & Streaming' },
  { domain: 'twitch.tv', display_name: 'Twitch', category: 'Video & Streaming' },
  { domain: 'spotify.com', display_name: 'Spotify', category: 'Video & Streaming' },
  { domain: 'disneyplus.com', display_name: 'Disney+', category: 'Video & Streaming' },

  // Cloud & Hosting
  { domain: 'aws.amazon.com', display_name: 'AWS', category: 'Cloud & Hosting' },
  { domain: 'azure.microsoft.com', display_name: 'Microsoft Azure', category: 'Cloud & Hosting' },
  { domain: 'cloud.google.com', display_name: 'Google Cloud', category: 'Cloud & Hosting' },
  { domain: 'vercel.com', display_name: 'Vercel', category: 'Cloud & Hosting' },
  { domain: 'netlify.com', display_name: 'Netlify', category: 'Cloud & Hosting' },
  { domain: 'heroku.com', display_name: 'Heroku', category: 'Cloud & Hosting' },
  { domain: 'digitalocean.com', display_name: 'DigitalOcean', category: 'Cloud & Hosting' },

  // Developer Tools
  { domain: 'github.com', display_name: 'GitHub', category: 'Developer Tools' },
  { domain: 'gitlab.com', display_name: 'GitLab', category: 'Developer Tools' },
  { domain: 'bitbucket.org', display_name: 'Bitbucket', category: 'Developer Tools' },
  { domain: 'stackoverflow.com', display_name: 'Stack Overflow', category: 'Developer Tools' },
  { domain: 'npmjs.com', display_name: 'npm', category: 'Developer Tools' },

  // Communication
  { domain: 'slack.com', display_name: 'Slack', category: 'Communication' },
  { domain: 'discord.com', display_name: 'Discord', category: 'Communication' },
  { domain: 'zoom.us', display_name: 'Zoom', category: 'Communication' },
  { domain: 'teams.microsoft.com', display_name: 'Microsoft Teams', category: 'Communication' },
  { domain: 'whatsapp.com', display_name: 'WhatsApp', category: 'Communication' },

  // E-commerce
  { domain: 'amazon.com', display_name: 'Amazon', category: 'E-commerce' },
  { domain: 'shopify.com', display_name: 'Shopify', category: 'E-commerce' },
  { domain: 'ebay.com', display_name: 'eBay', category: 'E-commerce' },
  { domain: 'stripe.com', display_name: 'Stripe', category: 'E-commerce' },
  { domain: 'paypal.com', display_name: 'PayPal', category: 'E-commerce' },

  // Productivity
  { domain: 'notion.so', display_name: 'Notion', category: 'Productivity' },
  { domain: 'figma.com', display_name: 'Figma', category: 'Productivity' },
  { domain: 'canva.com', display_name: 'Canva', category: 'Productivity' },
  { domain: 'docs.google.com', display_name: 'Google Docs', category: 'Productivity' },
  { domain: 'trello.com', display_name: 'Trello', category: 'Productivity' },
  { domain: 'asana.com', display_name: 'Asana', category: 'Productivity' },

  // Email & Marketing
  { domain: 'mail.google.com', display_name: 'Gmail', category: 'Email & Marketing' },
  { domain: 'outlook.com', display_name: 'Outlook', category: 'Email & Marketing' },
  { domain: 'mailchimp.com', display_name: 'Mailchimp', category: 'Email & Marketing' },

  // CDN & Infrastructure
  { domain: 'cloudflare.com', display_name: 'Cloudflare', category: 'CDN & Infrastructure' },
  { domain: 'fastly.com', display_name: 'Fastly', category: 'CDN & Infrastructure' },

  // AI
  { domain: 'openai.com', display_name: 'OpenAI', category: 'AI' },
  { domain: 'anthropic.com', display_name: 'Anthropic', category: 'AI' },
  { domain: 'huggingface.co', display_name: 'Hugging Face', category: 'AI' },
  { domain: 'midjourney.com', display_name: 'Midjourney', category: 'AI' },
  { domain: 'stability.ai', display_name: 'Stability AI', category: 'AI' },
  { domain: 'perplexity.ai', display_name: 'Perplexity', category: 'AI' },

  // Gaming
  { domain: 'store.steampowered.com', display_name: 'Steam', category: 'Gaming' },
  { domain: 'epicgames.com', display_name: 'Epic Games', category: 'Gaming' },
  { domain: 'roblox.com', display_name: 'Roblox', category: 'Gaming' },
  { domain: 'playstation.com', display_name: 'PlayStation', category: 'Gaming' },
  { domain: 'xbox.com', display_name: 'Xbox', category: 'Gaming' },
  { domain: 'twitch.tv', display_name: 'Twitch', category: 'Gaming' },
  { domain: 'ea.com', display_name: 'EA', category: 'Gaming' },

  // Finance & Crypto
  { domain: 'wise.com', display_name: 'Wise', category: 'Finance' },
  { domain: 'revolut.com', display_name: 'Revolut', category: 'Finance' },
  { domain: 'coinbase.com', display_name: 'Coinbase', category: 'Finance' },
  { domain: 'binance.com', display_name: 'Binance', category: 'Finance' },
  { domain: 'robinhood.com', display_name: 'Robinhood', category: 'Finance' },

  // CMS & Website Builders
  { domain: 'wordpress.com', display_name: 'WordPress.com', category: 'CMS' },
  { domain: 'wix.com', display_name: 'Wix', category: 'CMS' },
  { domain: 'squarespace.com', display_name: 'Squarespace', category: 'CMS' },
  { domain: 'webflow.com', display_name: 'Webflow', category: 'CMS' },
  { domain: 'ghost.org', display_name: 'Ghost', category: 'CMS' },

  // Education
  { domain: 'coursera.org', display_name: 'Coursera', category: 'Education' },
  { domain: 'udemy.com', display_name: 'Udemy', category: 'Education' },
  { domain: 'duolingo.com', display_name: 'Duolingo', category: 'Education' },
  { domain: 'khanacademy.org', display_name: 'Khan Academy', category: 'Education' },

  // Music & Audio
  { domain: 'spotify.com', display_name: 'Spotify', category: 'Music' },
  { domain: 'soundcloud.com', display_name: 'SoundCloud', category: 'Music' },
  { domain: 'music.apple.com', display_name: 'Apple Music', category: 'Music' },

  // Food & Delivery
  { domain: 'ubereats.com', display_name: 'Uber Eats', category: 'Food & Delivery' },
  { domain: 'deliveroo.com', display_name: 'Deliveroo', category: 'Food & Delivery' },
  { domain: 'doordash.com', display_name: 'DoorDash', category: 'Food & Delivery' },
  { domain: 'justeat.com', display_name: 'Just Eat', category: 'Food & Delivery' },

  // Travel
  { domain: 'booking.com', display_name: 'Booking.com', category: 'Travel' },
  { domain: 'airbnb.com', display_name: 'Airbnb', category: 'Travel' },
  { domain: 'expedia.com', display_name: 'Expedia', category: 'Travel' },

  // SaaS / Business Tools
  { domain: 'hubspot.com', display_name: 'HubSpot', category: 'SaaS' },
  { domain: 'salesforce.com', display_name: 'Salesforce', category: 'SaaS' },
  { domain: 'zendesk.com', display_name: 'Zendesk', category: 'SaaS' },
  { domain: 'intercom.com', display_name: 'Intercom', category: 'SaaS' },
  { domain: 'freshdesk.com', display_name: 'Freshdesk', category: 'SaaS' },
  { domain: 'monday.com', display_name: 'Monday.com', category: 'SaaS' },
  { domain: 'airtable.com', display_name: 'Airtable', category: 'SaaS' },
  { domain: 'jira.atlassian.com', display_name: 'Jira', category: 'SaaS' },
  { domain: 'confluence.atlassian.com', display_name: 'Confluence', category: 'SaaS' },

  // Security & VPN
  { domain: 'nordvpn.com', display_name: 'NordVPN', category: 'Security' },
  { domain: '1password.com', display_name: '1Password', category: 'Security' },
  { domain: 'lastpass.com', display_name: 'LastPass', category: 'Security' },
]
