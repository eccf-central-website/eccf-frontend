import 'server-only'

import crypto from 'crypto'
import type { AiSearchFinderResponse } from '@/types'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

interface HotCacheEntry {
  value: AiSearchFinderResponse
  expiresAt: number
}

const HOT_CACHE_TTL_MS = 60_000
const MAX_HOT_CACHE_ENTRIES = 200
const MAX_RATE_BUCKET_KEYS = 5000

const EPHEMERAL_FALLBACK_PEPPER = crypto.randomBytes(32).toString('hex')

const rateBuckets = new Map<string, number[]>()
const hotFinderCache = new Map<string, HotCacheEntry>()

function getIpPepper(): string {
  const configured = process.env.HMAC_PEPPER?.trim() || process.env.ENCRYPTION_KEY?.trim()
  if (configured && Buffer.byteLength(configured, 'utf8') >= 16) {
    return configured
  }
  return process.env.NODE_ENV === 'production'
    ? EPHEMERAL_FALLBACK_PEPPER
    : 'dev_only_rate_limit_pepper_32bytes'
}

/**
 * Compute an irreversible SHA-256 hash of a client IP address using HMAC_PEPPER.
 * Raw IP addresses are never stored or logged.
 */
export function hashClientIp(ip: string): string {
  const normalized = (ip || 'unknown').trim().toLowerCase().replace(/^::ffff:/, '')
  return crypto
    .createHash('sha256')
    .update(`${getIpPepper()}:sermon-finder-ip:${normalized}`)
    .digest('hex')
}

/**
 * Extract client IP from request headers and immediately return its irreversible SHA-256 hash.
 */
export function getClientIpHashFromHeaders(headers: Headers): string {
  const raw =
    headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('cf-connecting-ip')?.trim() ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    'unknown'

  return hashClientIp(raw)
}

function pruneRateBuckets(now: number, windowMs: number): void {
  const cutoff = now - windowMs
  rateBuckets.forEach((timestamps, bucketKey) => {
    const active = timestamps.filter((ts) => ts > cutoff)
    if (active.length === 0) {
      rateBuckets.delete(bucketKey)
    } else if (active.length !== timestamps.length) {
      rateBuckets.set(bucketKey, active)
    }
  })

  // Enforce hard upper bound against high-cardinality flood attacks
  while (rateBuckets.size >= MAX_RATE_BUCKET_KEYS) {
    const oldestKey = rateBuckets.keys().next().value
    if (oldestKey === undefined) break
    rateBuckets.delete(oldestKey)
  }
}

/**
 * In-memory sliding-window rate limiter keyed by hashed visitor identity.
 */
export function checkRateLimit(
  key: string,
  maxPerWindow: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const safeWindow = Math.max(1000, Math.floor(windowMs))
  const safeMax = Math.max(0, Math.floor(maxPerWindow))

  if (safeMax <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + safeWindow,
      retryAfterSeconds: Math.ceil(safeWindow / 1000),
    }
  }

  const cutoff = now - safeWindow
  const existing = rateBuckets.get(key) || []
  const recent = existing.filter((ts) => ts > cutoff)

  if (recent.length >= safeMax) {
    // Refresh insertion order for active key
    rateBuckets.delete(key)
    rateBuckets.set(key, recent)
    const oldestActive = recent[0] ?? now
    const resetAt = oldestActive + safeWindow
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    }
  }

  if (!rateBuckets.has(key) && rateBuckets.size >= MAX_RATE_BUCKET_KEYS) {
    pruneRateBuckets(now, safeWindow)
  }

  recent.push(now)
  rateBuckets.delete(key)
  rateBuckets.set(key, recent)

  const oldestActive = recent[0] ?? now
  return {
    allowed: true,
    remaining: Math.max(0, safeMax - recent.length),
    resetAt: oldestActive + safeWindow,
    retryAfterSeconds: 0,
  }
}

/**
 * Read a hot LRU cached finder response by SHA-256 queryHash (60s TTL, max 200 entries).
 */
export function getHotCachedFinder(queryHash: string): AiSearchFinderResponse | null {
  const entry = hotFinderCache.get(queryHash)
  if (!entry) return null

  const now = Date.now()
  if (now >= entry.expiresAt) {
    hotFinderCache.delete(queryHash)
    return null
  }

  // Promote to most-recently-used tail
  hotFinderCache.delete(queryHash)
  hotFinderCache.set(queryHash, entry)

  return {
    ...entry.value,
    cached: true,
  }
}

/**
 * Store a non-crisis finder response in the bounded 200-entry / 60s hot LRU cache.
 */
export function setHotCachedFinder(queryHash: string, response: AiSearchFinderResponse): void {
  if (!queryHash || response.kind === 'crisis' || response.kind === 'disabled' || response.kind === 'rate_limited') {
    return
  }

  const now = Date.now()
  if (hotFinderCache.has(queryHash)) {
    hotFinderCache.delete(queryHash)
  } else {
    // Evict expired entries first before falling back to oldest LRU eviction
    hotFinderCache.forEach((entry, k) => {
      if (now >= entry.expiresAt) {
        hotFinderCache.delete(k)
      }
    })
    while (hotFinderCache.size >= MAX_HOT_CACHE_ENTRIES) {
      const oldestKey = hotFinderCache.keys().next().value
      if (oldestKey === undefined) break
      hotFinderCache.delete(oldestKey)
    }
  }

  hotFinderCache.set(queryHash, {
    value: { ...response },
    expiresAt: now + HOT_CACHE_TTL_MS,
  })
}

export function clearHotFinderCache(): void {
  hotFinderCache.clear()
}
