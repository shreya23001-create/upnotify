/**
 * Defensive sanitisation for user-supplied strings that get embedded in
 * AI prompts. Stripping these doesn't make prompt injection impossible —
 * model alignment is the real boundary — but it removes the easy newline +
 * role-override attack and the common LLM delimiter tokens.
 *
 * Used by /api/ai-visibility/{citation-check, profile-check, generate-llms}.
 *   engineering-app#81 (domain field)
 *   engineering-app#83 (keywords field)
 */

const CONTROL_AND_DELIMITER = /[\r\n\t<>"'`]/g

/**
 * Clean a domain string before passing into an AI prompt.
 * Strips protocols, paths, ports, control chars, and LLM-delimiter chars.
 * Caps at RFC 1035 max length (253 chars).
 */
export function cleanDomainForAi(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(CONTROL_AND_DELIMITER, '')
    .toLowerCase()
    .trim()
    .slice(0, 253)
}

/**
 * Clean a keyword string before passing into an AI prompt.
 * More permissive than domain (allows spaces and a wider character set)
 * but still strips the prompt-injection vectors.
 * Capped at 200 chars per keyword — anything longer is almost certainly
 * not a real search query.
 */
export function cleanKeywordForAi(raw: string): string {
  return raw
    .replace(CONTROL_AND_DELIMITER, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}
