/**
 * Shared helpers for merging executive positions without duplicating a role.
 *
 * CSV imports, appointment claims and registration all write to the same
 * `positions` array, so a role can otherwise be appended twice (e.g. importing
 * the roster, then claiming the reserved appointment for the same office).
 */

type PositionLike = Record<string, unknown>

function referenceId(value: unknown): string | undefined {
  if (value && typeof value === 'object' && '_ref' in (value as Record<string, unknown>)) {
    const ref = (value as Record<string, unknown>)._ref
    return typeof ref === 'string' ? ref : undefined
  }
  return undefined
}

/**
 * Stable identity for an executive role. Two positions with the same signature
 * describe the same appointment, regardless of when they were created.
 */
export function executivePositionSignature(position: PositionLike): string {
  const kind = String(position.kind ?? 'unknown').toLowerCase()

  if (kind === 'csgb') {
    return `csgb|${referenceId(position.csgbRole) ?? String(position.office ?? '').trim().toLowerCase()}`
  }
  if (kind === 'hall') {
    return `hall|${referenceId(position.hallRef) ?? String(position.hall ?? '').trim().toLowerCase()}`
  }
  if (kind === 'team') {
    return `team|${referenceId(position.team) ?? String(position.teamName ?? '').trim().toLowerCase()}`
  }

  return `${kind}|${JSON.stringify(position)}`
}

/**
 * Append `incoming` positions to `existing`, skipping roles that are already
 * held. The first occurrence wins so existing approved positions are preserved.
 */
export function mergeExecutivePositions(
  existing: PositionLike[],
  incoming: PositionLike[]
): PositionLike[] {
  const merged = [...existing]
  const seen = new Set(merged.map(executivePositionSignature))

  for (const position of incoming) {
    const signature = executivePositionSignature(position)
    if (seen.has(signature)) continue
    seen.add(signature)
    merged.push(position)
  }

  return merged
}
