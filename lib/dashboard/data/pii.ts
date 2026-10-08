/**
 * PII guard (SDD §7.2 "response stripping"). Dashboard projections already
 * never select these fields; this is the second safeguard in case a query
 * is edited carelessly. Runs on every row returned by lib/dashboard/data.
 */

const PII_FIELDS = ['phoneNumber', 'roomNumber', 'passwordHash'] as const

type WithoutPII<T> = T extends object ? Omit<T, (typeof PII_FIELDS)[number]> : T

export function stripPII<T extends object>(rows: T[]): WithoutPII<T>[] {
  return rows.map((row) => {
    const copy = { ...row } as Record<string, unknown>
    for (const field of PII_FIELDS) delete copy[field]
    return copy as WithoutPII<T>
  })
}
