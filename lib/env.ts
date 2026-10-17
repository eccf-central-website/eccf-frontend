/**
 * Required secrets — lib/env.ts
 *
 * Each secret resolves through an ordered chain of env vars so that data
 * already encrypted or indexed under an earlier variable keeps working.
 * There is deliberately NO hardcoded fallback: this repo is public, so a
 * literal default would let anyone forge sessions or decrypt PII.
 *
 * Edge-safe: reads process.env only, no Node built-ins (middleware imports it).
 */

/** Return the first non-empty env var in `names`, or throw naming all of them. */
export function requireEnv(names: readonly string[], purpose: string): string {
  for (const name of names) {
    const value = process.env[name]
    if (value && value.trim()) return value
  }
  throw new Error(
    `[env] Missing secret for ${purpose}: set one of ${names.join(', ')} (checked in that order). ` +
      'See .env.example. There is no built-in default.'
  )
}

/** NextAuth JWT signing secret. Must be 32+ bytes in production. */
export function getAuthSecret(): string {
  const secret = requireEnv(['NEXTAUTH_SECRET', 'AUTH_SECRET'], 'NextAuth session signing')
  // TextEncoder rather than Buffer: this also runs in Edge middleware.
  if (process.env.NODE_ENV === 'production' && new TextEncoder().encode(secret).length < 32) {
    throw new Error('[env] NEXTAUTH_SECRET must be at least 32 bytes in production.')
  }
  return secret
}

/** AES-256-GCM field encryption secret (lib/encryption.ts). */
export function getEncryptionSecret(): string {
  return requireEnv(['ENCRYPTION_KEY', 'NEXTAUTH_SECRET'], 'field encryption')
}

/** HMAC pepper for phone blind indexes (lib/encryption.ts). */
export function getHmacSecret(): string {
  return requireEnv(['HMAC_PEPPER', 'ENCRYPTION_KEY', 'NEXTAUTH_SECRET'], 'blind index HMAC')
}
