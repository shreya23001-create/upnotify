import Anthropic from '@anthropic-ai/sdk'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import type { Monitor } from '@/lib/types'
import type { WpFinding, WpSnapshot, WpPlugin } from '@/lib/db/wp-monitors'

function getClient(): Anthropic | null {
  const { anthropic } = getServerConfig()
  if (!anthropic.apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set — WP AI report disabled')
    return null
  }
  return new Anthropic({ apiKey: anthropic.apiKey })
}

export async function generateWpAiReport(input: {
  monitor: Monitor
  snapshot: WpSnapshot | null
  findings: WpFinding[]
}): Promise<string> {
  const client = getClient()
  if (!client) return 'AI report unavailable — API key not configured.'

  const { monitor, snapshot, findings } = input

  if (findings.length === 0) {
    return `✅ No open security issues found on ${monitor.name}.\n\nYour WordPress site appears healthy. Keep plugins and themes updated regularly and review this dashboard weekly.`
  }

  const outdatedPlugins = snapshot
    ? (snapshot.active_plugins as WpPlugin[]).filter(p => p.update_available).map(p => `${p.name} (${p.version} → ${p.new_version ?? 'latest'})`)
    : []

  const findingsSummary = findings.map(f =>
    `- [${f.severity.toUpperCase()}] ${f.title} (detected: ${f.first_detected_at})`
  ).join('\n')

  const prompt = `You are a WordPress security expert. Analyse the following security findings for a WordPress site and provide:
1. A plain-English summary of what is wrong and how serious it is
2. Step-by-step fix instructions for each issue (ordered by severity)
3. Prevention advice to stop this happening again

Site: ${monitor.name} (${monitor.target})
WordPress version: ${snapshot?.wp_version ?? 'unknown'}
PHP version: ${snapshot?.php_version ?? 'unknown'}
Health score: ${snapshot?.health_score ?? 'unknown'}/100

Open issues:
${findingsSummary}

${outdatedPlugins.length > 0 ? `Outdated plugins:\n${outdatedPlugins.map(p => `- ${p}`).join('\n')}` : ''}

Write in clear, practical language. Assume the reader is a business owner, not a developer.
Keep each fix instruction numbered and actionable. Be concise — no marketing language.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return 'Unexpected response from AI.'
    return content.text
  } catch (error) {
    logger.error('Failed to generate WP AI report', { error: String(error) })
    return 'Failed to generate AI report. Please try again in a few minutes.'
  }
}
