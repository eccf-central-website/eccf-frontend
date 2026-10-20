import 'server-only'

/**
 * Environment Variable Guards & Validation — lib/env.ts
 *
 * Implements S1 fail-fast security guard.
 * Prevents execution with missing, empty, or insecure fallback secrets in production.
 */

export function requireEnv(name: string, minLength = 32): string {
  const val = process.env[name]?.trim()
  if (!val || Buffer.byteLength(val, 'utf8') < minLength) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[SECURITY FATAL] Environment variable ${name} is missing or insecure (requires at least ${minLength} bytes in production).`
      )
    }
  }
  return val || ''
}

export function getOptionalEnv(name: string, defaultValue = ''): string {
  return process.env[name]?.trim() || defaultValue
}
