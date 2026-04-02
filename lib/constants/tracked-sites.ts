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
]
