/**
 * Name token extraction and normalization utilities for executive matching.
 */

export function cleanHonorifics(s: string): string {
  return s
    .replace(/\b(bro|brother|sis|sister|pastor|pst|evang|evangelist|mr|mrs|miss|dr|engr)\b\.?/gi, ' ')
    .replace(/[-_.,;:/\\()\[\]{}'"`]/g, ' ')
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

/**
 * Determine if an appointment name matches a worker's full name.
 *
 * Robust against Nigerian and international naming conventions:
 * - Word order invariance (Surname first vs. First name first, e.g. "Bello Gift" vs "Gift Bello")
 * - Native / middle name inclusion/omission (e.g. "Timothy Igbinovia" vs "Efosa Timothy Igbinovia")
 * - Bidirectional token subset matching (at least 2 tokens must match, preventing single-name hijacking)
 */
export function appointmentNameMatchesWorker(appName: string, workerName: string): boolean {
  const appTokens = extractNameTokens(appName)
  const workerTokens = extractNameTokens(workerName)

  if (appTokens.length < 2 || workerTokens.length < 2) return false

  // Exact token match (order independent)
  if (normalizeTokensKey(appTokens) === normalizeTokensKey(workerTokens)) {
    return true
  }

  // Bidirectional subset match:
  // e.g. "Timothy Igbinovia" (appointment) in "Efosa Timothy Igbinovia" (worker)
  // or "Bello Omonigho Gift" (worker) containing "Gift Bello" (appointment)
  const appSubsetOfWorker = appTokens.every((t) => workerTokens.includes(t))
  const workerSubsetOfApp = workerTokens.every((t) => appTokens.includes(t))

  return appSubsetOfWorker || workerSubsetOfApp
}
