/**
 * Name token extraction and normalization utilities for executive matching.
 */

export function cleanHonorifics(s: string): string {
  return s
    .replace(/\b(bro|brother|sis|sister|pastor|pst|evang|evangelist|mr|mrs|miss|dr|engr)\b\.?/gi, ' ')
    .replace(/[,;:/\\()\[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractNameTokens(nameStr: string): string[] {
  const cleaned = cleanHonorifics(nameStr)
  return cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length >= 2)
}

export function normalizeTokensKey(tokens: string[]): string {
  return tokens.slice().sort().join(' ')
}
