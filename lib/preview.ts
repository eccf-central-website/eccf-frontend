/**
 * Draft preview gate — lib/preview.ts (SERVER-SIDE ONLY)
 *
 * Draft content is only shown when Next.js Draft Mode is enabled. Draft Mode's
 * cookie is signed by Next.js and can only be set by /api/preview after the
 * caller presents SANITY_PREVIEW_SECRET. `?preview=true`, a plain `preview`
 * cookie, request headers or the Referer are NOT trusted: anyone can send
 * them (S13).
 */

import 'server-only'

import { draftMode } from 'next/headers'
import { constantTimeStringEqual } from '@/lib/security/constant-time'

/** True only when Draft Mode was enabled through the secret-checked /api/preview route. */
export function isDraftPreview(): boolean {
  return draftMode().isEnabled
}

/** Constant-time check of a preview token; false when the secret is unset or too short. */
export function isValidPreviewSecret(token: unknown): boolean {
  const secret = process.env.SANITY_PREVIEW_SECRET
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) return false
  if (typeof token !== 'string' || token.length === 0 || token.length > 512) return false
  return constantTimeStringEqual(token, secret)
}

/** Only allow same-site relative redirect targets (blocks //evil.example and /\evil). */
export function safePreviewSlug(slug: string | null): string {
  if (!slug || !slug.startsWith('/') || slug.startsWith('//') || slug.startsWith('/\\')) return '/'
  return slug
}
