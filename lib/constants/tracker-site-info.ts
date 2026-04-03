/**
 * SEO content data for tracker detail pages.
 * Provides rich "About" descriptions, downtime reasons, impact statements,
 * official status page URLs, and related sites for the top 50 tracked sites.
 *
 * For sites not in this file, the tracker page renders generic fallback content.
 * Ready for future migration to admin CMS (page_sections table).
 */

export interface SiteInfo {
  name: string
  description: string
  founded: string
  category: string
  users: string
  statusPageUrl: string | null
  alternatives: string[]
}

export const SITE_INFO: Record<string, SiteInfo> = {
  // ── Search & Ads ──────────────────────────────────────────────

  'google.com': {
    name: 'Google',
    description: 'Google is the world\'s most popular search engine, processing over 8.5 billion searches per day. Beyond search, Google provides email (Gmail), cloud computing (Google Cloud Platform), productivity tools (Google Workspace), advertising (Google Ads), and the Android mobile operating system. It is the backbone of how billions of people navigate the internet.',
    founded: '1998',
    category: 'Search & Ads',
    users: '4.3 billion daily users',
    statusPageUrl: 'https://www.google.com/appsstatus/dashboard/',
    alternatives: ['bing.com', 'duckduckgo.com'],
  },
  'bing.com': {
    name: 'Bing',
    description: 'Bing is Microsoft\'s search engine, powering billions of queries monthly and serving as the default search provider on Windows, Edge, and Cortana. Bing also underpins the AI-powered Copilot experience across Microsoft products. It is a significant source of organic traffic for websites worldwide.',
    founded: '2009',
    category: 'Search & Ads',
    users: '1.3 billion monthly visits',
    statusPageUrl: 'https://status.cloud.microsoft.com/',
    alternatives: ['google.com', 'duckduckgo.com'],
  },
  'duckduckgo.com': {
    name: 'DuckDuckGo',
    description: 'DuckDuckGo is a privacy-focused search engine that does not track users or personalise search results. It has grown rapidly among privacy-conscious users and is the default search option in several browsers\' private modes. DuckDuckGo also offers a privacy-first browser and email protection service.',
    founded: '2008',
    category: 'Search & Ads',
    users: '100+ million daily searches',
    statusPageUrl: null,
    alternatives: ['google.com', 'bing.com'],
  },

  // ── Social Media ──────────────────────────────────────────────

  'facebook.com': {
    name: 'Facebook',
    description: 'Facebook is the world\'s largest social network with over 3 billion monthly active users. It connects people through personal profiles, groups, pages, Marketplace, and Messenger. For businesses, Facebook is a critical advertising and customer engagement platform. Downtime affects social connections, commerce, and digital marketing campaigns globally.',
    founded: '2004',
    category: 'Social Media',
    users: '3+ billion monthly active users',
    statusPageUrl: 'https://developers.facebook.com/status/dashboard/',
    alternatives: ['instagram.com', 'twitter.com', 'linkedin.com'],
  },
  'instagram.com': {
    name: 'Instagram',
    description: 'Instagram is a visual social media platform owned by Meta, focused on photo and video sharing. With over 2 billion monthly users, it is a key channel for influencer marketing, brand building, and social commerce. Features include Stories, Reels, Shopping, and direct messaging.',
    founded: '2010',
    category: 'Social Media',
    users: '2+ billion monthly active users',
    statusPageUrl: 'https://developers.facebook.com/status/dashboard/',
    alternatives: ['tiktok.com', 'pinterest.com', 'facebook.com'],
  },
  'twitter.com': {
    name: 'X (Twitter)',
    description: 'X, formerly Twitter, is a real-time social media platform used for news, public conversation, and cultural discourse. It is where breaking news surfaces first, brands engage with audiences, and public figures communicate directly with followers. The platform supports text posts, images, video, Spaces (live audio), and long-form articles.',
    founded: '2006',
    category: 'Social Media',
    users: '500+ million monthly active users',
    statusPageUrl: 'https://api.twitterstat.us/',
    alternatives: ['facebook.com', 'reddit.com', 'linkedin.com'],
  },
  'linkedin.com': {
    name: 'LinkedIn',
    description: 'LinkedIn is the world\'s largest professional networking platform, owned by Microsoft. With over 1 billion members, it is the primary destination for job searching, recruitment, B2B marketing, and professional content. LinkedIn outages disrupt hiring workflows, sales pipelines, and professional networking.',
    founded: '2003',
    category: 'Social Media',
    users: '1+ billion members',
    statusPageUrl: null,
    alternatives: ['twitter.com', 'facebook.com'],
  },
  'reddit.com': {
    name: 'Reddit',
    description: 'Reddit is a community-driven platform organised into thousands of topic-specific forums called subreddits. It is one of the most visited websites globally, serving as a hub for discussion, news aggregation, Q&A, and niche communities. Reddit is also an increasingly important source of user-generated content for search engines.',
    founded: '2005',
    category: 'Social Media',
    users: '1.7+ billion monthly visits',
    statusPageUrl: 'https://www.redditstatus.com/',
    alternatives: ['twitter.com', 'facebook.com'],
  },
  'tiktok.com': {
    name: 'TikTok',
    description: 'TikTok is a short-form video platform that has transformed social media and digital marketing. With over 1 billion monthly active users, it is the fastest-growing social network and a major driver of trends, music discovery, and influencer culture. Businesses use TikTok for organic reach and paid advertising.',
    founded: '2016',
    category: 'Social Media',
    users: '1+ billion monthly active users',
    statusPageUrl: null,
    alternatives: ['instagram.com', 'youtube.com'],
  },
  'pinterest.com': {
    name: 'Pinterest',
    description: 'Pinterest is a visual discovery and bookmarking platform where users find inspiration for projects, recipes, fashion, home decor, and more. With over 480 million monthly active users, it is a valuable channel for ecommerce brands and content creators. Pinterest drives significant referral traffic to external websites.',
    founded: '2010',
    category: 'Social Media',
    users: '480+ million monthly active users',
    statusPageUrl: 'https://www.pintereststatus.com/',
    alternatives: ['instagram.com', 'canva.com'],
  },

  // ── Video & Streaming ─────────────────────────────────────────

  'youtube.com': {
    name: 'YouTube',
    description: 'YouTube is the world\'s largest video platform, hosting over 800 million videos and serving more than 2 billion logged-in users monthly. It is the second-largest search engine after Google and the primary platform for video content creators, advertisers, and live streaming. YouTube downtime impacts content creators\' revenue, live events, and educational resources.',
    founded: '2005',
    category: 'Video & Streaming',
    users: '2+ billion monthly logged-in users',
    statusPageUrl: 'https://www.google.com/appsstatus/dashboard/',
    alternatives: ['twitch.tv', 'tiktok.com'],
  },
  'netflix.com': {
    name: 'Netflix',
    description: 'Netflix is the world\'s leading streaming entertainment service with over 260 million paid subscribers across 190 countries. It offers a vast library of original and licensed TV shows, films, and documentaries. Netflix outages affect millions of viewers and are among the most reported service disruptions globally.',
    founded: '1997',
    category: 'Video & Streaming',
    users: '260+ million paid subscribers',
    statusPageUrl: 'https://help.netflix.com/en/is-netflix-down',
    alternatives: ['disneyplus.com', 'youtube.com'],
  },
  'twitch.tv': {
    name: 'Twitch',
    description: 'Twitch is the dominant live streaming platform, primarily for gaming but expanding into music, talk shows, and creative content. Owned by Amazon, it attracts over 140 million monthly unique viewers. Twitch downtime directly impacts streamers\' income and disrupts live events watched by millions.',
    founded: '2011',
    category: 'Video & Streaming',
    users: '140+ million monthly unique viewers',
    statusPageUrl: 'https://status.twitch.tv/',
    alternatives: ['youtube.com', 'tiktok.com'],
  },
  'spotify.com': {
    name: 'Spotify',
    description: 'Spotify is the world\'s most popular audio streaming platform with over 620 million users, including 240 million premium subscribers. It offers music, podcasts, and audiobooks. Spotify is essential for artists, podcasters, and listeners alike. Outages disrupt listening habits and affect artists\' streaming revenue.',
    founded: '2006',
    category: 'Video & Streaming',
    users: '620+ million users',
    statusPageUrl: 'https://downdetector.com/status/spotify/',
    alternatives: ['youtube.com', 'netflix.com'],
  },
  'disneyplus.com': {
    name: 'Disney+',
    description: 'Disney+ is a streaming service from The Walt Disney Company, featuring content from Disney, Pixar, Marvel, Star Wars, and National Geographic. With over 150 million subscribers, it is one of the fastest-growing streaming platforms. Outages are especially impactful during major content releases.',
    founded: '2019',
    category: 'Video & Streaming',
    users: '150+ million subscribers',
    statusPageUrl: 'https://help.disneyplus.com/',
    alternatives: ['netflix.com', 'youtube.com'],
  },

  // ── Cloud & Hosting ───────────────────────────────────────────

  'aws.amazon.com': {
    name: 'AWS',
    description: 'Amazon Web Services (AWS) is the world\'s largest cloud computing platform, powering millions of businesses from startups to Fortune 500 enterprises. AWS provides compute, storage, database, machine learning, and hundreds of other services. An AWS outage can cascade across the internet, taking down thousands of websites and apps that depend on its infrastructure.',
    founded: '2006',
    category: 'Cloud & Hosting',
    users: 'Millions of active customers',
    statusPageUrl: 'https://health.aws.amazon.com/health/status',
    alternatives: ['azure.microsoft.com', 'cloud.google.com'],
  },
  'azure.microsoft.com': {
    name: 'Microsoft Azure',
    description: 'Microsoft Azure is a comprehensive cloud platform used by over 95% of Fortune 500 companies. It provides cloud computing, AI, DevOps, and hybrid infrastructure services. Azure outages can affect enterprise applications, Microsoft 365, Teams, and thousands of SaaS products built on its infrastructure.',
    founded: '2010',
    category: 'Cloud & Hosting',
    users: '95% of Fortune 500 companies',
    statusPageUrl: 'https://status.azure.com/',
    alternatives: ['aws.amazon.com', 'cloud.google.com'],
  },
  'cloud.google.com': {
    name: 'Google Cloud',
    description: 'Google Cloud Platform (GCP) provides cloud computing, data analytics, machine learning, and enterprise collaboration tools. It powers major companies like Spotify, PayPal, and Twitter. GCP outages can affect Google Workspace, Firebase, and the many applications built on Google\'s infrastructure.',
    founded: '2008',
    category: 'Cloud & Hosting',
    users: 'Millions of organisations',
    statusPageUrl: 'https://status.cloud.google.com/',
    alternatives: ['aws.amazon.com', 'azure.microsoft.com'],
  },
  'vercel.com': {
    name: 'Vercel',
    description: 'Vercel is the platform for frontend developers, providing hosting and serverless functions optimised for Next.js and modern web frameworks. It powers hundreds of thousands of websites with its global edge network. Vercel downtime affects deployed web applications and developer workflows.',
    founded: '2015',
    category: 'Cloud & Hosting',
    users: 'Hundreds of thousands of deployments',
    statusPageUrl: 'https://www.vercel-status.com/',
    alternatives: ['netlify.com', 'cloudflare.com'],
  },
  'netlify.com': {
    name: 'Netlify',
    description: 'Netlify is a popular web hosting and automation platform for modern web projects. It offers continuous deployment, serverless functions, edge handlers, and form handling. Developers use Netlify to deploy static sites, Jamstack apps, and full-stack web applications.',
    founded: '2014',
    category: 'Cloud & Hosting',
    users: 'Millions of developers',
    statusPageUrl: 'https://www.netlifystatus.com/',
    alternatives: ['vercel.com', 'cloudflare.com'],
  },
  'heroku.com': {
    name: 'Heroku',
    description: 'Heroku is a cloud platform-as-a-service (PaaS) owned by Salesforce. It simplifies deploying, managing, and scaling web applications. While Heroku\'s free tier was retired, it remains popular for small to mid-size applications, prototyping, and developer education.',
    founded: '2007',
    category: 'Cloud & Hosting',
    users: 'Hundreds of thousands of apps',
    statusPageUrl: 'https://status.heroku.com/',
    alternatives: ['vercel.com', 'digitalocean.com'],
  },
  'digitalocean.com': {
    name: 'DigitalOcean',
    description: 'DigitalOcean is a cloud infrastructure provider focused on simplicity for developers and small to medium businesses. It offers virtual machines (Droplets), managed databases, Kubernetes, and app hosting. DigitalOcean is known for straightforward pricing and developer-friendly documentation.',
    founded: '2011',
    category: 'Cloud & Hosting',
    users: 'Millions of developers',
    statusPageUrl: 'https://status.digitalocean.com/',
    alternatives: ['heroku.com', 'aws.amazon.com'],
  },

  // ── Developer Tools ───────────────────────────────────────────

  'github.com': {
    name: 'GitHub',
    description: 'GitHub is the world\'s largest code hosting platform, home to over 100 million developers and 300 million repositories. Owned by Microsoft, it provides Git-based version control, CI/CD (GitHub Actions), code review, project management, and Copilot AI. A GitHub outage disrupts software development workflows across the entire industry.',
    founded: '2008',
    category: 'Developer Tools',
    users: '100+ million developers',
    statusPageUrl: 'https://www.githubstatus.com/',
    alternatives: ['gitlab.com', 'bitbucket.org'],
  },
  'gitlab.com': {
    name: 'GitLab',
    description: 'GitLab is a complete DevSecOps platform delivered as a single application. It provides source code management, CI/CD pipelines, security scanning, and project planning. GitLab is widely used by enterprises for its self-hosted option and comprehensive built-in DevOps toolchain.',
    founded: '2011',
    category: 'Developer Tools',
    users: '30+ million registered users',
    statusPageUrl: 'https://status.gitlab.com/',
    alternatives: ['github.com', 'bitbucket.org'],
  },
  'bitbucket.org': {
    name: 'Bitbucket',
    description: 'Bitbucket is a Git-based code hosting and collaboration platform owned by Atlassian. It integrates deeply with Jira, Confluence, and the Atlassian ecosystem. Bitbucket is popular among teams already using Atlassian tools for project management and issue tracking.',
    founded: '2008',
    category: 'Developer Tools',
    users: '10+ million developers',
    statusPageUrl: 'https://bitbucket.status.atlassian.com/',
    alternatives: ['github.com', 'gitlab.com'],
  },
  'stackoverflow.com': {
    name: 'Stack Overflow',
    description: 'Stack Overflow is the largest Q&A community for programmers, with over 58 million questions and answers. It is an essential resource for developers of all experience levels. Stack Overflow outages slow down development teams globally who depend on it for troubleshooting and learning.',
    founded: '2008',
    category: 'Developer Tools',
    users: '100+ million monthly visitors',
    statusPageUrl: 'https://stackstatus.net/',
    alternatives: ['github.com', 'reddit.com'],
  },
  'npmjs.com': {
    name: 'npm',
    description: 'npm is the world\'s largest software registry, hosting over 2 million JavaScript packages. It is the default package manager for Node.js and is critical to the JavaScript ecosystem. An npm outage blocks developers from installing dependencies and deploying applications.',
    founded: '2010',
    category: 'Developer Tools',
    users: '17+ million developers',
    statusPageUrl: 'https://status.npmjs.org/',
    alternatives: ['github.com', 'gitlab.com'],
  },

  // ── Communication ─────────────────────────────────────────────

  'slack.com': {
    name: 'Slack',
    description: 'Slack is the leading business messaging platform, used by millions of organisations for team communication, file sharing, and workflow automation. Owned by Salesforce, Slack integrates with thousands of third-party apps. Slack outages halt internal communications and disrupt productivity across entire companies.',
    founded: '2013',
    category: 'Communication',
    users: '200+ thousand paid customers',
    statusPageUrl: 'https://status.slack.com/',
    alternatives: ['teams.microsoft.com', 'discord.com'],
  },
  'discord.com': {
    name: 'Discord',
    description: 'Discord is a communication platform originally built for gamers that has expanded to communities of all types. It offers text channels, voice calls, video calls, and screen sharing. Discord is used by over 150 million monthly active users for gaming, education, content creation, and professional communities.',
    founded: '2015',
    category: 'Communication',
    users: '150+ million monthly active users',
    statusPageUrl: 'https://discordstatus.com/',
    alternatives: ['slack.com', 'teams.microsoft.com'],
  },
  'zoom.us': {
    name: 'Zoom',
    description: 'Zoom is a video conferencing platform that became essential for remote work, education, and personal communication. It supports video meetings, webinars, phone calls, and team chat. Zoom downtime disrupts meetings, classes, and telehealth appointments for millions of users.',
    founded: '2011',
    category: 'Communication',
    users: '300+ million daily meeting participants',
    statusPageUrl: 'https://status.zoom.us/',
    alternatives: ['teams.microsoft.com', 'slack.com'],
  },
  'teams.microsoft.com': {
    name: 'Microsoft Teams',
    description: 'Microsoft Teams is a collaboration platform integrated with Microsoft 365, used by over 300 million monthly active users. It combines chat, video meetings, file storage, and app integration. Teams outages affect enterprise productivity, remote work, and education institutions worldwide.',
    founded: '2017',
    category: 'Communication',
    users: '300+ million monthly active users',
    statusPageUrl: 'https://status.cloud.microsoft.com/',
    alternatives: ['slack.com', 'zoom.us'],
  },
  'whatsapp.com': {
    name: 'WhatsApp',
    description: 'WhatsApp is the world\'s most popular messaging app with over 2 billion users across 180 countries. Owned by Meta, it provides end-to-end encrypted messaging, voice and video calls, and business communication tools. WhatsApp outages have significant global impact, particularly in regions where it is the primary communication channel.',
    founded: '2009',
    category: 'Communication',
    users: '2+ billion monthly active users',
    statusPageUrl: null,
    alternatives: ['facebook.com', 'discord.com'],
  },

  // ── E-commerce ────────────────────────────────────────────────

  'amazon.com': {
    name: 'Amazon',
    description: 'Amazon is the world\'s largest online retailer and a major player in cloud computing, streaming, and AI. With hundreds of millions of active customer accounts, Amazon processes billions of dollars in transactions. Downtime on Amazon affects consumers, third-party sellers, and the vast ecosystem of businesses that depend on its marketplace.',
    founded: '1994',
    category: 'E-commerce',
    users: '300+ million active customer accounts',
    statusPageUrl: null,
    alternatives: ['ebay.com', 'shopify.com'],
  },
  'shopify.com': {
    name: 'Shopify',
    description: 'Shopify is the leading ecommerce platform, powering over 4.6 million online stores worldwide. It provides everything merchants need to sell online, in-store, and everywhere in between: storefront, checkout, payments, shipping, and marketing tools. Shopify outages directly impact merchant revenue and customer checkout experiences.',
    founded: '2006',
    category: 'E-commerce',
    users: '4.6+ million stores',
    statusPageUrl: 'https://www.shopifystatus.com/',
    alternatives: ['amazon.com', 'ebay.com'],
  },
  'ebay.com': {
    name: 'eBay',
    description: 'eBay is a global online marketplace connecting millions of buyers and sellers. It facilitates consumer-to-consumer and business-to-consumer sales through auction-style and fixed-price listings. eBay is especially important for second-hand goods, collectibles, and niche products.',
    founded: '1995',
    category: 'E-commerce',
    users: '130+ million active buyers',
    statusPageUrl: null,
    alternatives: ['amazon.com', 'shopify.com'],
  },
  'stripe.com': {
    name: 'Stripe',
    description: 'Stripe is a financial technology platform that powers online payments for millions of businesses, from startups to Fortune 500 companies. It processes hundreds of billions of dollars annually. Stripe outages can halt checkout flows, subscription billing, and payouts for businesses that depend on its payment infrastructure.',
    founded: '2010',
    category: 'E-commerce',
    users: 'Millions of businesses',
    statusPageUrl: 'https://status.stripe.com/',
    alternatives: ['paypal.com', 'shopify.com'],
  },
  'paypal.com': {
    name: 'PayPal',
    description: 'PayPal is one of the world\'s largest digital payment platforms, used by over 430 million active accounts. It enables online payments, money transfers, and merchant checkout solutions. PayPal outages affect ecommerce transactions, freelancer payments, and peer-to-peer money transfers globally.',
    founded: '1998',
    category: 'E-commerce',
    users: '430+ million active accounts',
    statusPageUrl: 'https://www.paypal-status.com/product/production',
    alternatives: ['stripe.com', 'shopify.com'],
  },

  // ── Productivity ──────────────────────────────────────────────

  'notion.so': {
    name: 'Notion',
    description: 'Notion is an all-in-one workspace for notes, documents, project management, and knowledge bases. Used by teams and individuals worldwide, Notion combines wikis, databases, kanban boards, and calendars in a single tool. Outages disrupt team documentation, project tracking, and internal knowledge sharing.',
    founded: '2013',
    category: 'Productivity',
    users: '30+ million users',
    statusPageUrl: 'https://status.notion.so/',
    alternatives: ['docs.google.com', 'trello.com', 'asana.com'],
  },
  'figma.com': {
    name: 'Figma',
    description: 'Figma is the leading collaborative design tool used by product teams for UI/UX design, prototyping, and design systems. Its browser-based, real-time collaboration model has made it the industry standard for digital product design. Figma outages halt design workflows and delay product development cycles.',
    founded: '2012',
    category: 'Productivity',
    users: '4+ million users',
    statusPageUrl: 'https://status.figma.com/',
    alternatives: ['canva.com', 'notion.so'],
  },
  'canva.com': {
    name: 'Canva',
    description: 'Canva is an online design platform that makes graphic design accessible to everyone. With over 170 million monthly active users, it is used for social media graphics, presentations, posters, videos, and more. Canva outages affect marketing teams, content creators, and educators who depend on it for daily design work.',
    founded: '2012',
    category: 'Productivity',
    users: '170+ million monthly active users',
    statusPageUrl: 'https://www.canvastatus.com/',
    alternatives: ['figma.com', 'docs.google.com'],
  },
  'docs.google.com': {
    name: 'Google Docs',
    description: 'Google Docs is a free, web-based document editor that is part of Google Workspace. It enables real-time collaborative writing, editing, and commenting. Used by students, professionals, and organisations worldwide, Google Docs outages disrupt workflows for teams that rely on it as their primary document tool.',
    founded: '2006',
    category: 'Productivity',
    users: 'Billions of documents created',
    statusPageUrl: 'https://www.google.com/appsstatus/dashboard/',
    alternatives: ['notion.so', 'canva.com'],
  },
  'trello.com': {
    name: 'Trello',
    description: 'Trello is a visual project management tool built around kanban boards, lists, and cards. Owned by Atlassian, it is used by millions of teams for task tracking, workflow management, and collaboration. Trello\'s simplicity makes it popular across non-technical teams and small businesses.',
    founded: '2011',
    category: 'Productivity',
    users: '50+ million users',
    statusPageUrl: 'https://trello.status.atlassian.com/',
    alternatives: ['asana.com', 'notion.so'],
  },
  'asana.com': {
    name: 'Asana',
    description: 'Asana is a work management platform that helps teams organise, track, and manage their work. It offers project views including lists, boards, timelines, and calendars. Asana is used by over 150,000 paying organisations for cross-functional project coordination and goal tracking.',
    founded: '2008',
    category: 'Productivity',
    users: '150,000+ paying organisations',
    statusPageUrl: 'https://status.asana.com/',
    alternatives: ['trello.com', 'notion.so'],
  },

  // ── Email & Marketing ─────────────────────────────────────────

  'mail.google.com': {
    name: 'Gmail',
    description: 'Gmail is the world\'s most popular email service with over 1.8 billion active users. It is a core part of Google Workspace and is used for personal, business, and educational email. Gmail outages disrupt communication for billions of people and can halt business operations that depend on email.',
    founded: '2004',
    category: 'Email & Marketing',
    users: '1.8+ billion active users',
    statusPageUrl: 'https://www.google.com/appsstatus/dashboard/',
    alternatives: ['outlook.com', 'mailchimp.com'],
  },
  'outlook.com': {
    name: 'Outlook',
    description: 'Outlook is Microsoft\'s email and calendar service, used by hundreds of millions of people for personal and business communication. It is integrated with Microsoft 365 and is the primary email client for enterprise environments. Outlook outages affect email delivery, calendar scheduling, and business productivity.',
    founded: '2012',
    category: 'Email & Marketing',
    users: '400+ million active users',
    statusPageUrl: 'https://status.cloud.microsoft.com/',
    alternatives: ['mail.google.com', 'mailchimp.com'],
  },
  'mailchimp.com': {
    name: 'Mailchimp',
    description: 'Mailchimp is a leading email marketing and automation platform used by millions of businesses. It offers email campaigns, audience management, marketing automation, and analytics. Owned by Intuit, Mailchimp outages delay marketing campaigns and disrupt customer communication for businesses of all sizes.',
    founded: '2001',
    category: 'Email & Marketing',
    users: '12+ million active users',
    statusPageUrl: 'https://status.mailchimp.com/',
    alternatives: ['mail.google.com', 'outlook.com'],
  },

  // ── CDN & Infrastructure ──────────────────────────────────────

  'cloudflare.com': {
    name: 'Cloudflare',
    description: 'Cloudflare is a global cloud platform that provides CDN, DDoS protection, DNS, and security services. It sits in front of approximately 20% of all websites, making it one of the most critical pieces of internet infrastructure. Cloudflare outages can take down millions of websites simultaneously.',
    founded: '2009',
    category: 'CDN & Infrastructure',
    users: '20% of all websites',
    statusPageUrl: 'https://www.cloudflarestatus.com/',
    alternatives: ['fastly.com', 'aws.amazon.com'],
  },
  'fastly.com': {
    name: 'Fastly',
    description: 'Fastly is an edge cloud platform that provides CDN, edge computing, security, and video streaming services. It powers content delivery for major websites and apps including news outlets, ecommerce platforms, and streaming services. Fastly outages have historically caused widespread internet disruptions.',
    founded: '2011',
    category: 'CDN & Infrastructure',
    users: 'Thousands of enterprise customers',
    statusPageUrl: 'https://status.fastly.com/',
    alternatives: ['cloudflare.com', 'aws.amazon.com'],
  },

  // ── AI ────────────────────────────────────────────────────────

  'openai.com': {
    name: 'OpenAI',
    description: 'OpenAI is the creator of ChatGPT, GPT-4, and DALL-E, making it one of the most influential AI companies in the world. ChatGPT alone has over 200 million weekly active users. OpenAI outages affect developers building AI-powered applications, businesses using its API, and millions of individual users.',
    founded: '2015',
    category: 'AI',
    users: '200+ million weekly active users',
    statusPageUrl: 'https://status.openai.com/',
    alternatives: ['anthropic.com', 'huggingface.co'],
  },
  'anthropic.com': {
    name: 'Anthropic',
    description: 'Anthropic is an AI safety company and the creator of Claude, a family of large language models. Claude is used by developers, businesses, and individuals for writing, analysis, coding, and reasoning tasks. Anthropic focuses on building reliable and safe AI systems.',
    founded: '2021',
    category: 'AI',
    users: 'Millions of users',
    statusPageUrl: 'https://status.anthropic.com/',
    alternatives: ['openai.com', 'huggingface.co'],
  },
  'huggingface.co': {
    name: 'Hugging Face',
    description: 'Hugging Face is the leading open-source AI community and platform, hosting over 500,000 models, 100,000 datasets, and thousands of AI demos. It is the GitHub of machine learning, where researchers and developers share, discover, and deploy AI models. Outages affect the global ML community\'s ability to access and deploy models.',
    founded: '2016',
    category: 'AI',
    users: '500,000+ models hosted',
    statusPageUrl: 'https://status.huggingface.co/',
    alternatives: ['openai.com', 'anthropic.com'],
  },
}

/**
 * Category-specific downtime reasons.
 * Written to sound natural and informative for SEO content.
 */
export const CATEGORY_DOWNTIME_REASONS: Record<string, string[]> = {
  'Search & Ads': [
    'Indexing infrastructure overload during large-scale crawl operations',
    'Data centre connectivity issues affecting specific regions',
    'DNS resolution failures during infrastructure migrations',
    'Distributed denial-of-service attacks targeting search APIs',
    'Database replication lag causing stale or missing search results',
    'Load balancer misconfigurations after deployment updates',
  ],
  'Social Media': [
    'Server overload during viral events or breaking news',
    'Database replication failures causing inconsistent feeds',
    'Content delivery network outages affecting media loading',
    'API rate limiting during traffic spikes from third-party apps',
    'Mobile app backend failures after platform updates',
    'Authentication service disruptions blocking user logins',
  ],
  'Video & Streaming': [
    'Transcoding pipeline failures causing playback errors',
    'CDN edge node saturation during peak viewing hours',
    'Content licensing system errors blocking regional access',
    'Live streaming infrastructure overload during major events',
    'Payment and subscription verification service outages',
    'Video player software bugs introduced in recent updates',
  ],
  'Cloud & Hosting': [
    'Hardware failures in data centre infrastructure',
    'Network partition events isolating availability zones',
    'API rate limiting during peak deployment windows',
    'DNS propagation issues after infrastructure changes',
    'Cascading failures when dependent services go offline',
    'Certificate renewal failures disrupting TLS connections',
  ],
  'Developer Tools': [
    'Git server overload during high-commit periods',
    'CI/CD pipeline infrastructure failures blocking builds',
    'Package registry database corruption or replication lag',
    'DDoS attacks targeting developer-facing APIs',
    'Storage system failures affecting repository access',
    'Authentication service disruptions blocking code pushes',
  ],
  'Communication': [
    'WebSocket connection failures disrupting real-time messaging',
    'Voice and video relay server saturation during peak hours',
    'Message queue backlog causing delayed message delivery',
    'Authentication system overload during login surges',
    'File storage backend failures blocking uploads and downloads',
    'Push notification infrastructure failures on mobile platforms',
  ],
  'E-commerce': [
    'Payment gateway integration failures blocking checkout',
    'Platform outages during high-traffic sales events',
    'Database overload from flash sale traffic spikes',
    'SSL certificate issues on custom merchant domains',
    'Inventory synchronisation failures causing stock errors',
    'CDN failures affecting product images and page load times',
  ],
  'Productivity': [
    'Real-time collaboration server failures during peak hours',
    'Document sync conflicts causing data loss or corruption',
    'Authentication provider outages blocking user access',
    'Database migration errors during platform updates',
    'File storage service failures affecting uploads and access',
    'API gateway saturation from integration overuse',
  ],
  'Email & Marketing': [
    'Mail delivery infrastructure overload during campaign sends',
    'Spam filter system failures causing false positive blocks',
    'SMTP relay failures affecting outbound delivery',
    'Authentication service disruptions blocking inbox access',
    'Storage quota enforcement errors causing bounce-backs',
    'DNS record issues (SPF, DKIM, DMARC) causing delivery failures',
  ],
  'CDN & Infrastructure': [
    'Edge node failures in specific geographic regions',
    'BGP routing leaks affecting global traffic distribution',
    'DDoS mitigation system overload during large attacks',
    'TLS handshake failures from certificate chain issues',
    'Configuration deployment errors propagating to edge nodes',
    'Upstream provider outages affecting backbone connectivity',
  ],
  'AI': [
    'GPU cluster failures during high-demand inference periods',
    'Model serving infrastructure overload from usage spikes',
    'API rate limiting during viral adoption or new model launches',
    'Training pipeline failures affecting model availability',
    'Load balancer misconfigurations after scaling events',
    'Token processing pipeline bottlenecks during peak hours',
  ],
}

/**
 * Category-specific downtime impact descriptions.
 * Written in second person to be relatable and SEO-rich.
 */
export const CATEGORY_IMPACT: Record<string, string[]> = {
  'Search & Ads': [
    'Search traffic to your website drops to zero while the search engine is unavailable.',
    'Paid advertising campaigns stop serving, wasting budget and losing visibility.',
    'Businesses that depend on search-driven leads experience immediate revenue impact.',
    'Webmasters cannot access analytics or search console during outages.',
  ],
  'Social Media': [
    'Marketing campaigns and scheduled posts are disrupted or delayed.',
    'Customer engagement drops and brand mentions go unanswered.',
    'Social commerce transactions are blocked, causing lost sales.',
    'Influencer partnerships and time-sensitive promotions lose effectiveness.',
  ],
  'Video & Streaming': [
    'Content creators lose ad revenue for every minute of downtime.',
    'Live events and premieres are disrupted, frustrating audiences.',
    'Subscribers question the value of their paid plans.',
    'Educational institutions lose access to learning content.',
  ],
  'Cloud & Hosting': [
    'Websites and applications hosted on the platform go offline for end users.',
    'Deployment pipelines are blocked, delaying releases and hotfixes.',
    'Cascading failures affect multiple downstream services and businesses.',
    'Database-dependent operations halt, causing data processing backlogs.',
  ],
  'Developer Tools': [
    'Engineering teams cannot push, pull, or review code changes.',
    'CI/CD pipelines fail, blocking automated testing and deployment.',
    'Open-source community contributions and collaboration are paused.',
    'Dependency installation fails, preventing new project setups and builds.',
  ],
  'Communication': [
    'Internal team communication halts, stalling decision-making.',
    'Remote workers lose their primary collaboration channel.',
    'Scheduled meetings and calls are disrupted or missed entirely.',
    'Customer support response times increase when chat systems go down.',
  ],
  'E-commerce': [
    'Checkout flows are broken, resulting in abandoned carts and lost sales.',
    'Merchants cannot process orders, fulfil shipments, or update inventory.',
    'Customer trust erodes with every minute of a visible outage.',
    'Promotional events and flash sales lose their window of opportunity.',
  ],
  'Productivity': [
    'Team members lose access to shared documents and project boards.',
    'Work-in-progress edits may be lost if sync fails during an outage.',
    'Deadlines are missed when planning and tracking tools go offline.',
    'Cross-team collaboration stalls, creating bottlenecks across projects.',
  ],
  'Email & Marketing': [
    'Critical business communications are delayed or bounced.',
    'Marketing campaign sends fail, missing optimal delivery windows.',
    'Password resets and transactional emails stop reaching users.',
    'Business operations that depend on email workflows are paralysed.',
  ],
  'CDN & Infrastructure': [
    'Websites behind the CDN become slow or completely unreachable.',
    'SSL termination failures cause browser security warnings for visitors.',
    'Media-heavy sites see broken images and failed asset loading.',
    'API-dependent applications fail when edge services go offline.',
  ],
  'AI': [
    'AI-powered features in your products stop working for end users.',
    'Development teams cannot iterate on prompts or fine-tune models.',
    'Customer-facing chatbots and assistants go silent.',
    'Automated workflows that depend on AI processing are blocked.',
  ],
}

/**
 * Official status page links for known sites.
 * Used in the "What to do when X is down" section.
 */
export function getStatusPageUrl(domain: string): string | null {
  return SITE_INFO[domain]?.statusPageUrl ?? null
}

/**
 * Get related sites from the same category for internal linking.
 */
export function getRelatedSites(
  domain: string,
  category: string,
  allDomains: Array<{ domain: string; display_name: string; category: string }>,
  limit: number = 5
): Array<{ domain: string; display_name: string }> {
  return allDomains
    .filter((s) => s.category === category && s.domain !== domain)
    .slice(0, limit)
    .map((s) => ({ domain: s.domain, display_name: s.display_name }))
}
