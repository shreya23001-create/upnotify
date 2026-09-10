import crypto from 'crypto'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocialPostResult {
  success: boolean
  platform: string
  error?: string
  postId?: string
}

interface OutageSocialPost {
  siteDisplayName: string
  blogTitle: string
  blogUrl: string         // full URL e.g. https://upnotify-monitoring.vercel.app/blog/is-github-down-2026-apr-06
  excerpt: string
}

// ---------------------------------------------------------------------------
// X (Twitter) — OAuth 1.0a
// ---------------------------------------------------------------------------

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}

function buildOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  // Combine all params for signature
  const allParams: Record<string, string> = { ...params, ...oauthParams }
  const sortedKeys = Object.keys(allParams).sort()
  const paramString = sortedKeys
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&')

  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&')

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64')

  oauthParams['oauth_signature'] = signature

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')

  return `OAuth ${headerParts}`
}

async function postToX(post: OutageSocialPost): Promise<SocialPostResult> {
  const config = getServerConfig()
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = config.twitter

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    logger.warn('X API credentials not configured — skipping X post')
    return { success: false, platform: 'x', error: 'X API credentials not configured' }
  }

  const tweetText = `🔴 Is ${post.siteDisplayName} down right now?\n\nUptrue detected a possible issue. Check the latest status report:\n${post.blogUrl}\n\n#${post.siteDisplayName.replace(/\s+/g, '')} #outage #downtime`

  const url = 'https://api.twitter.com/2/tweets'
  const body = JSON.stringify({ text: tweetText })

  const oauthHeader = buildOAuthHeader(
    'POST',
    url,
    {},
    consumerKey,
    consumerSecret,
    accessToken,
    accessTokenSecret
  )

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json',
      },
      body,
    })

    const data = await response.json() as { data?: { id: string }; errors?: Array<{ message: string }> }

    if (!response.ok) {
      const errMsg = data.errors?.[0]?.message ?? `HTTP ${response.status}`
      logger.error('X post failed', { error: errMsg, status: response.status })
      return { success: false, platform: 'x', error: errMsg }
    }

    logger.info('X post published', { tweetId: data.data?.id, site: post.siteDisplayName })
    return { success: true, platform: 'x', postId: data.data?.id }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('X post exception', { error: msg })
    return { success: false, platform: 'x', error: msg }
  }
}

// ---------------------------------------------------------------------------
// LinkedIn — OAuth 2.0 Bearer token, UGC Posts API
// ---------------------------------------------------------------------------

async function postToLinkedIn(post: OutageSocialPost): Promise<SocialPostResult> {
  const config = getServerConfig()
  const { accessToken, memberId, organizationId } = config.linkedin

  if (!accessToken || (!memberId && !organizationId)) {
    logger.warn('LinkedIn credentials not configured — skipping LinkedIn post')
    return { success: false, platform: 'linkedin', error: 'LinkedIn credentials not configured' }
  }

  const shareText = `🔴 ${post.siteDisplayName} may be experiencing an issue.\n\nUptrue detected a possible disruption. See the latest status report:\n${post.blogUrl}\n\n#uptime #outage #${post.siteDisplayName.replace(/\s+/g, '')} #monitoring`

  // Posts to company page if LINKEDIN_ORGANIZATION_ID is set, otherwise personal profile.
  const authorUrn = organizationId
    ? `urn:li:organization:${organizationId}`
    : `urn:li:person:${memberId}`

  const payload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: shareText },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            description: { text: post.excerpt.slice(0, 256) },
            originalUrl: post.blogUrl,
            title: { text: post.blogTitle.slice(0, 200) },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errText = await response.text()
      logger.error('LinkedIn post failed', { status: response.status, error: errText })
      return { success: false, platform: 'linkedin', error: `HTTP ${response.status}: ${errText.slice(0, 200)}` }
    }

    const postId = response.headers.get('x-restli-id') ?? 'unknown'
    logger.info('LinkedIn post published', { postId, site: post.siteDisplayName })
    return { success: true, platform: 'linkedin', postId }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('LinkedIn post exception', { error: msg })
    return { success: false, platform: 'linkedin', error: msg }
  }
}

// ---------------------------------------------------------------------------
// Combined: post to both platforms
// ---------------------------------------------------------------------------

/**
 * Posts an outage blog link to X and LinkedIn simultaneously.
 * Failures on either platform are logged but do not throw.
 */
export async function postOutageBlogToSocial(post: OutageSocialPost): Promise<{
  x: SocialPostResult
  linkedin: SocialPostResult
}> {
  const [xResult, linkedinResult] = await Promise.allSettled([
    postToX(post),
    postToLinkedIn(post),
  ])

  const x = xResult.status === 'fulfilled'
    ? xResult.value
    : { success: false, platform: 'x', error: xResult.reason instanceof Error ? xResult.reason.message : 'Unknown' }

  const linkedin = linkedinResult.status === 'fulfilled'
    ? linkedinResult.value
    : { success: false, platform: 'linkedin', error: linkedinResult.reason instanceof Error ? linkedinResult.reason.message : 'Unknown' }

  return { x, linkedin }
}
