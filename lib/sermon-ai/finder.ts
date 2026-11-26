import 'server-only'

import crypto from 'crypto'
import { sanityClient, sanityWriteClient } from '@/lib/sanity'
import { PUBLIC_AI_SEARCH_CONFIG_QUERY, SITE_SETTINGS_QUERY } from '@/lib/queries'
import {
  formatTimestamp,
  getSermonDetailPath,
  getSermonThumbnailUrl,
  getYoutubeVideoId,
  parseDurationToSeconds,
} from '@/lib/sermonUtils'
import { lagosDate } from '@/lib/dashboard/dates'
import {
  DEFAULT_AI_SEARCH_CONFIG,
  mergeAiSearchConfig,
  pickRandomSuggestions,
} from '@/lib/sermon-ai/defaults'
import {
  rerankSermonCandidatesWithAi,
  type RerankCandidate,
} from '@/lib/sermon-ai/provider'
import {
  checkRateLimit,
  clearHotFinderCache,
  getHotCachedFinder,
  setHotCachedFinder,
} from '@/lib/sermon-ai/rate-limit'
import type {
  AiSearchConfig,
  AiSearchFinderRequest,
  AiSearchFinderResponse,
  AiSearchSermonResult,
  SermonSegment,
  SermonVault,
} from '@/types'

interface TimedCache<T> {
  value: T
  expiresAt: number
}

interface EmergencyContact {
  phone?: string
  email?: string
}

interface SegmentQueryRow extends SermonSegment {
  _score?: number
}

interface ScoredCandidate {
  sermon: SermonVault
  bestSegment: {
    startSeconds: number
    timestampLabel: string
    text: string
  }
  lexicalScore: number
  semanticBonus: number
  totalScore: number
}

const CONFIG_CACHE_TTL_MS = 30_000
const CATALOG_CACHE_TTL_MS = 30_000
const CONTACT_CACHE_TTL_MS = 300_000

let publicConfigCache: TimedCache<AiSearchConfig> | null = null
let internalConfigCache: TimedCache<AiSearchConfig> | null = null
let catalogCache: TimedCache<SermonVault[]> | null = null
let emergencyContactCache: TimedCache<EmergencyContact> | null = null

const INTERNAL_AI_SEARCH_CONFIG_QUERY = `
  coalesce(
    *[_type == "aiSearchConfig" && _id == "aiSearchConfig"][0],
    *[_type == "aiSearchConfig"][0]
  ) {
    _id,
    enabled,
    showFloatingButton,
    buttonLabel,
    heading,
    subtitle,
    placeholder,
    greeting,
    excerptWords,
    maxSuggestions,
    suggestions,
    dailyLimit,
    hourlySearchLimit,
    hourlyChatLimit,
    hiddenYears,
    providerPreference,
    dailyUsageDate,
    dailyUsageCount,
    lastContentUpdatedAt,
    contentChangesSinceOldestCache
  }
`

const SERMON_FINDER_CATALOG_QUERY = `
  *[_type == "sermonVault" && coalesce(isPublished, true) == true] | order(datePreached desc) {
    _id,
    title,
    "slug": slug.current,
    preacher,
    series,
    topics,
    datePreached,
    scriptureReference,
    duration,
    durationSeconds,
    "isPublished": coalesce(isPublished, true),
    spotifyUrl,
    youtubeUrl,
    youtubeMusicUrl,
    spotifyEmbedId,
    youtubeVideoId,
    thumbnailUrl,
    notes,
    "aiThemes": coalesce(aiThemes, [])[]{
      _key,
      theme,
      weight
    }
  }
`

const SEMANTIC_SEGMENTS_QUERY = `
  *[_type == "sermonSegment" && coalesce(isPublished, true) == true]
    | score(
        boost([text, sermonTitle, preacher] match text::query($q), 2),
        text::semanticSimilarity($q)
      )
    | order(_score desc)[0...36] {
      _id,
      _score,
      sermonId,
      sermonTitle,
      preacher,
      series,
      datePreached,
      durationSeconds,
      isPublished,
      segmentIndex,
      startSeconds,
      endSeconds,
      timestampLabel,
      text
    }
`

const KEYWORD_SEGMENTS_QUERY = `
  *[_type == "sermonSegment" && coalesce(isPublished, true) == true && (
    text match $patterns ||
    sermonTitle match $patterns ||
    preacher match $patterns
  )][0...48] {
    _id,
    sermonId,
    sermonTitle,
    preacher,
    series,
    datePreached,
    durationSeconds,
    isPublished,
    segmentIndex,
    startSeconds,
    endSeconds,
    timestampLabel,
    text
  }
`

export function invalidatePublicAiConfigCache(): void {
  publicConfigCache = null
  internalConfigCache = null
  catalogCache = null
  clearHotFinderCache()
}

/**
 * Fetch public-safe AI Search configuration (never selects encrypted secrets or provider keys).
 */
export async function getPublicAiSearchConfig(): Promise<AiSearchConfig> {
  const now = Date.now()
  if (publicConfigCache && now < publicConfigCache.expiresAt) {
    return publicConfigCache.value
  }

  try {
    const raw = await sanityClient.fetch<Partial<AiSearchConfig> | null>(
      PUBLIC_AI_SEARCH_CONFIG_QUERY
    )
    const merged = mergeAiSearchConfig(raw)
    publicConfigCache = { value: merged, expiresAt: now + CONFIG_CACHE_TTL_MS }
    return merged
  } catch {
    const fallback = publicConfigCache?.value ?? DEFAULT_AI_SEARCH_CONFIG
    publicConfigCache = { value: fallback, expiresAt: now + 10_000 }
    return fallback
  }
}

async function getInternalAiSearchConfig(): Promise<AiSearchConfig> {
  const now = Date.now()
  if (internalConfigCache && now < internalConfigCache.expiresAt) {
    return internalConfigCache.value
  }

  try {
    const raw = await sanityClient.fetch<Partial<AiSearchConfig> | null>(
      INTERNAL_AI_SEARCH_CONFIG_QUERY
    )
    const merged = mergeAiSearchConfig(raw)
    internalConfigCache = { value: merged, expiresAt: now + CONFIG_CACHE_TTL_MS }
    return merged
  } catch {
    const fallback = internalConfigCache?.value ?? DEFAULT_AI_SEARCH_CONFIG
    internalConfigCache = { value: fallback, expiresAt: now + 10_000 }
    return fallback
  }
}

async function getPublishedSermonCatalog(): Promise<SermonVault[]> {
  const now = Date.now()
  if (catalogCache && now < catalogCache.expiresAt) {
    return catalogCache.value
  }

  try {
    const rows = await sanityClient.fetch<SermonVault[]>(SERMON_FINDER_CATALOG_QUERY)
    const safeRows = Array.isArray(rows) ? rows : []
    catalogCache = { value: safeRows, expiresAt: now + CATALOG_CACHE_TTL_MS }
    return safeRows
  } catch {
    const fallback = catalogCache?.value ?? []
    catalogCache = { value: fallback, expiresAt: now + 10_000 }
    return fallback
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function getEmergencyContact(): Promise<EmergencyContact> {
  const now = Date.now()
  if (emergencyContactCache && now < emergencyContactCache.expiresAt) {
    return emergencyContactCache.value
  }

  try {
    const settings = await sanityClient.fetch<{
      visitWhatsAppNumber?: string
      fellowshipEmail?: string
    } | null>(SITE_SETTINGS_QUERY)

    const contact: EmergencyContact = {
      phone: settings?.visitWhatsAppNumber?.trim() || undefined,
      email: settings?.fellowshipEmail?.trim() || undefined,
    }
    emergencyContactCache = { value: contact, expiresAt: now + CONTACT_CACHE_TTL_MS }
    return contact
  } catch {
    const fallback = emergencyContactCache?.value ?? {}
    emergencyContactCache = { value: fallback, expiresAt: now + 10_000 }
    return fallback
  }
}

// ---------------------------------------------------------------------------
// Deterministic Safety & Intent Guards
// ---------------------------------------------------------------------------

const CRISIS_PATTERNS: RegExp[] = [
  /\b(?:suicid(?:e|al)|self[-\s]?harm)\b/i,
  /\b(?:kill|hurt|cut|harm|hang)\s+(?:myself|my\s*self)\b/i,
  /\b(?:end|take)\s+my\s+(?:own\s+)?life\b/i,
  /\b(?:want|wanna|going|ready|plan(?:ning)?)\s+to\s+(?:die|end\s+it\s+all)\b/i,
  /\b(?:better\s+off\s+dead|no\s+reason\s+to\s+live|don'?t\s+want\s+to\s+live)\b/i,
  /\boverdos(?:e|ing)\s+on\b/i,
]

const SPIRITUAL_ANCHOR_REGEX =
  /\b(god|jesus|christ|lord|holy\s+spirit|bible|scripture|pray(?:er)?|faith|church|fellowship|sin|grace|salvation|heaven|soul|spirit|sermon|message|preach|christian|campus|exam|study|purpose|forgive|peace|anxiety|fear|temptation|healing|breakthrough|relationship)\b/i

const OBVIOUS_OFF_TOPIC_REGEX =
  /\b(python|javascript|typescript|react|next\.js|html|css|sql|regex|algorithm|leetcode|weather\s+forecast|temperature\s+today|stock\s+price|crypto(?:currency)?|bitcoin|football\s+score|premier\s+league|champions\s+league|recipe\s+for|calories\s+in|translate\s+to\s+(?:french|spanish|german))\b/i

function isCrisisQuery(query: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(query))
}

function isObviousOffTopicQuery(query: string): boolean {
  return !SPIRITUAL_ANCHOR_REGEX.test(query) && OBVIOUS_OFF_TOPIC_REGEX.test(query)
}

// ---------------------------------------------------------------------------
// Query Tokenization & Local Scoring
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'doing',
  'feel',
  'feeling',
  'feels',
  'for',
  'from',
  'get',
  'going',
  'have',
  'having',
  'help',
  'how',
  'i',
  'im',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'like',
  'looking',
  'me',
  'message',
  'messages',
  'more',
  'my',
  'need',
  'of',
  'on',
  'or',
  'our',
  'sermon',
  'sermons',
  'should',
  'so',
  'some',
  'something',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'through',
  'to',
  'want',
  'was',
  'we',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
])

const SYNONYM_EXPANSIONS: Record<string, string[]> = {
  exam: ['academic', 'academics', 'study', 'pressure', 'excellence', 'wisdom', 'fear'],
  exams: ['academic', 'academics', 'study', 'pressure', 'excellence', 'wisdom', 'fear'],
  academic: ['academics', 'study', 'exam', 'excellence', 'wisdom', 'pressure', 'student'],
  academics: ['academic', 'study', 'exam', 'excellence', 'wisdom', 'pressure', 'student'],
  pressure: ['stress', 'anxiety', 'academic', 'peace', 'strength', 'overcome'],
  cold: ['passion', 'fire', 'zeal', 'revival', 'devotion', 'prayer', 'hunger'],
  passion: ['fire', 'zeal', 'devotion', 'love', 'revival', 'prayer'],
  temptation: ['sin', 'purity', 'holiness', 'flesh', 'compromise', 'victory', 'repentance'],
  tempted: ['temptation', 'sin', 'purity', 'holiness', 'compromise', 'victory'],
  anxiety: ['worry', 'fear', 'peace', 'calm', 'trust', 'stress', 'emotions'],
  anxious: ['anxiety', 'worry', 'fear', 'peace', 'trust', 'rest'],
  worry: ['anxiety', 'fear', 'peace', 'trust', 'faith'],
  fear: ['afraid', 'courage', 'faith', 'peace', 'trust', 'anxiety'],
  forgive: ['forgiveness', 'mercy', 'grace', 'hurt', 'healing', 'reconciliation'],
  forgiving: ['forgiveness', 'mercy', 'grace', 'hurt', 'healing'],
  hurt: ['forgiveness', 'healing', 'emotions', 'grace', 'pain', 'comfort'],
  setback: ['comeback', 'trial', 'disappointment', 'perseverance', 'lifting', 'overcome'],
  setbacks: ['comeback', 'trial', 'disappointment', 'perseverance', 'lifting', 'overcome'],
  disappointment: ['setback', 'comeback', 'hope', 'lifting', 'encouragement'],
  purpose: ['calling', 'destiny', 'career', 'will', 'leadership', 'gifts', 'vision'],
  career: ['purpose', 'calling', 'wisdom', 'excellence', 'diligence', 'destiny'],
  spirit: ['holy spirit', 'anointing', 'power', 'filled', 'guidance', 'revival'],
  pray: ['prayer', 'intercession', 'communion', 'devotion', 'fasting'],
  prayer: ['pray', 'intercession', 'communion', 'devotion', 'altar'],
  heal: ['healing', 'miracle', 'breakthrough', 'restoration', 'faith'],
  healing: ['heal', 'miracle', 'breakthrough', 'restoration', 'faith'],
  friend: ['friendship', 'relationships', 'fellowship', 'love', 'godly'],
  friendships: ['friendship', 'relationships', 'fellowship', 'love', 'godly'],
  relationship: ['relationships', 'love', 'purity', 'friendship', 'marriage'],
  relationships: ['relationship', 'love', 'purity', 'friendship', 'marriage'],
  bible: ['scripture', 'word', 'study', 'truth', 'doctrine'],
  voice: ['guidance', 'spirit', 'hear', 'direction', 'word'],
  gift: ['gifts', 'service', 'serve', 'calling', 'ministry'],
  gifts: ['gift', 'service', 'serve', 'calling', 'ministry'],
}

function tokenizeQuery(query: string): { coreTerms: string[]; expandedTerms: string[] } {
  const rawTokens = query
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const coreSet = new Set<string>()
  const expandedSet = new Set<string>()

  for (const token of rawTokens) {
    if (token.length < 3 || STOP_WORDS.has(token)) continue
    coreSet.add(token)
    const syns = SYNONYM_EXPANSIONS[token]
    if (syns) {
      for (const syn of syns) {
        if (!coreSet.has(syn)) expandedSet.add(syn)
      }
    }
  }

  // Fallback if user entered only stop words + short word like "god"
  if (coreSet.size === 0) {
    for (const token of rawTokens) {
      if (token.length >= 2) coreSet.add(token)
    }
  }

  return {
    coreTerms: Array.from(coreSet),
    expandedTerms: Array.from(expandedSet),
  }
}

function countTermMatches(haystackLower: string, coreTerms: string[], expandedTerms: string[]): number {
  if (!haystackLower) return 0
  let score = 0
  for (const term of coreTerms) {
    if (haystackLower.includes(term)) score += 2
  }
  for (const term of expandedTerms) {
    if (haystackLower.includes(term)) score += 1
  }
  return score
}

function scoreSermonMetadata(
  sermon: SermonVault,
  coreTerms: string[],
  expandedTerms: string[]
): number {
  let score = 0
  score += countTermMatches((sermon.title || '').toLowerCase(), coreTerms, expandedTerms) * 3
  score += countTermMatches((sermon.topics || []).join(' ').toLowerCase(), coreTerms, expandedTerms) * 2.5
  score += countTermMatches((sermon.series || '').toLowerCase(), coreTerms, expandedTerms) * 2
  score += countTermMatches((sermon.scriptureReference || '').toLowerCase(), coreTerms, expandedTerms) * 1.5
  score += countTermMatches((sermon.preacher || '').toLowerCase(), coreTerms, expandedTerms) * 1.5
  score += countTermMatches((sermon.notes || '').toLowerCase(), coreTerms, expandedTerms) * 1

  if (Array.isArray(sermon.aiThemes)) {
    for (const entry of sermon.aiThemes) {
      const themeLower = (entry?.theme || '').toLowerCase()
      const hits = countTermMatches(themeLower, coreTerms, expandedTerms)
      if (hits > 0) {
        const weightFactor = Math.max(0.1, Math.min(1, (entry.weight || 20) / 100))
        score += hits * 3.5 * weightFactor
      }
    }
  }

  return score
}

// ---------------------------------------------------------------------------
// Output Formatting & Async Persistence
// ---------------------------------------------------------------------------

function formatDurationLabel(seconds: number): string {
  const totalMins = Math.max(1, Math.round(seconds / 60))
  if (totalMins >= 60) {
    const hrs = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`
  }
  return `${totalMins} min`
}

function truncateExcerpt(rawText: string | undefined, maxWords: number): string | undefined {
  if (maxWords <= 0 || !rawText) return undefined
  const words = rawText.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (words.length === 0) return undefined
  if (words.length <= maxWords) return words.join(' ')
  return `${words.slice(0, maxWords).join(' ')}…`
}

function formatSermonResult(
  sermon: SermonVault,
  startSeconds: number,
  excerptSourceText: string | undefined,
  excerptWords: number
): AiSearchSermonResult {
  const safeStart = Math.max(0, Math.floor(startSeconds || 0))
  const effectiveDuration = sermon.durationSeconds ?? parseDurationToSeconds(sermon.duration)
  const youtubeVideoId = getYoutubeVideoId(sermon)
  const excerpt = truncateExcerpt(excerptSourceText, excerptWords)

  return {
    id: sermon._id,
    slug: sermon.slug || sermon._id,
    title: sermon.title,
    preacher: sermon.preacher,
    ...(sermon.series ? { series: sermon.series } : {}),
    ...(sermon.datePreached ? { datePreached: sermon.datePreached } : {}),
    ...(sermon.scriptureReference ? { scriptureReference: sermon.scriptureReference } : {}),
    url: getSermonDetailPath({ _id: sermon._id, slug: sermon.slug }, safeStart),
    thumb: getSermonThumbnailUrl(sermon),
    moment: formatTimestamp(safeStart),
    startSeconds: safeStart,
    ...(sermon.duration || effectiveDuration
      ? { length: sermon.duration || formatDurationLabel(effectiveDuration!) }
      : {}),
    ...(effectiveDuration !== undefined ? { durationSeconds: effectiveDuration } : {}),
    ...(excerpt ? { excerpt } : {}),
    youtubeVideoId,
    hasAudio: Boolean(
      sermon.spotifyEmbedId ||
        sermon.spotifyUrl ||
        sermon.youtubeMusicUrl ||
        youtubeVideoId ||
        sermon.youtubeUrl
    ),
  }
}

function canWriteToSanity(): boolean {
  return Boolean(process.env.SANITY_WRITE_TOKEN?.trim())
}

function bumpCacheHitAsync(cacheDocId: string): void {
  if (!canWriteToSanity()) return
  void sanityWriteClient
    .patch(cacheDocId)
    .setIfMissing({ hitCount: 0 })
    .inc({ hitCount: 1 })
    .set({ lastHitAt: new Date().toISOString() })
    .commit()
    .catch(() => {})
}

function persistSanityCacheAsync(queryHash: string, payload: AiSearchFinderResponse): void {
  if (!canWriteToSanity()) return
  if (payload.kind === 'crisis' || payload.kind === 'disabled' || payload.kind === 'rate_limited') {
    return
  }

  const nowIso = new Date().toISOString()
  const docId = `aiSearchCache-${queryHash.slice(0, 32)}`
  const safePayload: AiSearchFinderResponse = {
    ...payload,
    cached: undefined,
  }

  void sanityWriteClient
    .createOrReplace({
      _id: docId,
      _type: 'aiSearchCache',
      queryHash,
      responseJson: JSON.stringify(safePayload),
      hitCount: 0,
      createdAt: nowIso,
      lastHitAt: nowIso,
    })
    .catch(() => {})
}

function incrementDailyUsageAsync(config: AiSearchConfig, todayLagos: string): void {
  const sameDay = config.dailyUsageDate === todayLagos
  const nextCount = (sameDay ? config.dailyUsageCount ?? 0 : 0) + 1

  // Keep in-memory config cache fresh immediately
  if (internalConfigCache) {
    internalConfigCache.value = {
      ...internalConfigCache.value,
      dailyUsageDate: todayLagos,
      dailyUsageCount: nextCount,
    }
  }
  if (publicConfigCache) {
    publicConfigCache.value = {
      ...publicConfigCache.value,
      dailyUsageDate: todayLagos,
      dailyUsageCount: nextCount,
    }
  }

  if (!canWriteToSanity()) return

  const configDocId = config._id || 'aiSearchConfig'
  const tx = sanityWriteClient.transaction().createIfNotExists({
    _id: configDocId,
    _type: 'aiSearchConfig',
    enabled: config.enabled,
    dailyLimit: config.dailyLimit,
    hourlySearchLimit: config.hourlySearchLimit,
    hourlyChatLimit: config.hourlyChatLimit,
    dailyUsageDate: todayLagos,
    dailyUsageCount: 0,
  })

  if (sameDay) {
    tx.patch(configDocId, (p) =>
      p.setIfMissing({ dailyUsageDate: todayLagos, dailyUsageCount: 0 }).inc({ dailyUsageCount: 1 })
    )
  } else {
    tx.patch(configDocId, (p) =>
      p.set({
        dailyUsageDate: todayLagos,
        dailyUsageCount: 1,
      })
    )
  }

  void tx.commit().catch(() => {})
}

function parseCachedResponse(rawJson?: string | null): AiSearchFinderResponse | null {
  if (!rawJson || typeof rawJson !== 'string') return null
  try {
    const parsed = JSON.parse(rawJson) as Partial<AiSearchFinderResponse>
    if (
      !parsed ||
      typeof parsed.kind !== 'string' ||
      !Array.isArray(parsed.sermons) ||
      !Array.isArray(parsed.preachers)
    ) {
      return null
    }
    return parsed as AiSearchFinderResponse
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Core Finder Engine
// ---------------------------------------------------------------------------

/**
 * Search and rank ECCF sermons with safety checks, SHA-256 caching,
 * Sanity Dataset Embeddings + GROQ fallback, and structured AI reranking.
 */
export async function findSermonsWithAi(
  req: AiSearchFinderRequest,
  options?: { ipHash?: string }
): Promise<AiSearchFinderResponse> {
  const trimmedQuery = (req.query || '').trim()

  if (trimmedQuery.length < 2) {
    const fallbackSuggestions =
      internalConfigCache?.value.suggestions ?? DEFAULT_AI_SEARCH_CONFIG.suggestions
    return {
      kind: 'empty',
      sermons: [],
      preachers: [],
      message: 'Please describe what you are looking for in at least a couple of words.',
      suggestions: pickRandomSuggestions(fallbackSuggestions, 4),
    }
  }

  // 1. Deterministic crisis / self-harm check FIRST (no cache, no AI, no logging, never blocks on CMS)
  if (isCrisisQuery(trimmedQuery)) {
    const contact = await withTimeout(
      getEmergencyContact(),
      1500,
      emergencyContactCache?.value ?? {}
    )
    return {
      kind: 'crisis',
      sermons: [],
      preachers: [],
      message:
        'You are deeply valued by God and by your ECCF family. Please do not walk through this alone — reach out right away to someone who can pray with and support you.',
      contact: {
        ...(contact.phone ? { phone: contact.phone } : {}),
        ...(contact.email ? { email: contact.email } : {}),
        emergencyNumber: '112',
      },
    }
  }

  const config = await getInternalAiSearchConfig()

  // 2. Enforce enabled switch & quotas
  if (!config.enabled) {
    return {
      kind: 'disabled',
      sermons: [],
      preachers: [],
      message: 'AI Message Search is currently paused. Use keyword search below to browse all sermons.',
      fallbackToKeyword: true,
    }
  }

  const mode = req.mode === 'modal' ? 'modal' : 'page'
  if (options?.ipHash) {
    const hourlyLimit = mode === 'modal' ? config.hourlyChatLimit : config.hourlySearchLimit
    const rl = checkRateLimit(`finder:${mode}:${options.ipHash}`, hourlyLimit, 60 * 60 * 1000)
    if (!rl.allowed) {
      return {
        kind: 'rate_limited',
        sermons: [],
        preachers: [],
        message: 'You have reached the hourly search limit. Please try again later or browse messages below.',
        fallbackToKeyword: true,
      }
    }
  }

  const todayLagos = lagosDate()
  const usedToday = config.dailyUsageDate === todayLagos ? (config.dailyUsageCount ?? 0) : 0
  if (config.dailyLimit <= 0 || usedToday >= config.dailyLimit) {
    return {
      kind: 'rate_limited',
      sermons: [],
      preachers: [],
      message: 'Daily AI search capacity has been reached for today. Keyword search remains available below.',
      fallbackToKeyword: true,
    }
  }

  // 3. Deterministic SHA-256 cache lookup (hot LRU + Sanity aiSearchCache)
  const preacherFilter = (req.preacher || '').trim()
  const maxDurationSeconds =
    typeof req.maxDurationSeconds === 'number' &&
    Number.isFinite(req.maxDurationSeconds) &&
    req.maxDurationSeconds > 0
      ? Math.floor(req.maxDurationSeconds)
      : undefined
  const excludeIds = Array.from(
    new Set((req.excludeIds || []).map((id) => id.trim()).filter(Boolean))
  ).sort()
  const limit = Math.min(12, Math.max(1, Math.floor(req.limit ?? 5)))

  const cacheKeyInput = {
    v: 1,
    q: trimmedQuery.toLowerCase().replace(/\s+/g, ' '),
    mode,
    preacher: preacherFilter.toLowerCase(),
    maxDurationSeconds: maxDurationSeconds ?? null,
    excludeIds,
    limit,
    excerptWords: config.excerptWords,
    hiddenYears: config.hiddenYears,
  }
  const queryHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(cacheKeyInput))
    .digest('hex')

  const hotHit = getHotCachedFinder(queryHash)
  if (hotHit) {
    bumpCacheHitAsync(`aiSearchCache-${queryHash.slice(0, 32)}`)
    return { ...hotHit, cached: true }
  }

  try {
    const cachedDoc = await sanityClient.fetch<{ _id: string; responseJson?: string } | null>(
      `*[_type == "aiSearchCache" && queryHash == $hash][0]{ _id, responseJson }`,
      { hash: queryHash }
    )
    const parsedCache = parseCachedResponse(cachedDoc?.responseJson)
    if (cachedDoc?._id && parsedCache) {
      setHotCachedFinder(queryHash, parsedCache)
      bumpCacheHitAsync(cachedDoc._id)
      return { ...parsedCache, cached: true }
    }
  } catch {
    // Cache read failure must never block search
  }

  // 4. Load published catalog & enforce hiddenYears / filters
  const catalog = await getPublishedSermonCatalog()
  const hiddenYearSet = new Set(config.hiddenYears)

  const visibleCatalog = catalog.filter((sermon) => {
    const yearStr = typeof sermon.datePreached === 'string' ? sermon.datePreached.slice(0, 4) : ''
    const yearNum = /^\d{4}$/.test(yearStr) ? Number(yearStr) : NaN
    return !Number.isFinite(yearNum) || !hiddenYearSet.has(yearNum)
  })

  const preachers = Array.from(
    new Set(visibleCatalog.map((s) => (s.preacher || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  if (isObviousOffTopicQuery(trimmedQuery)) {
    const offTopicResponse: AiSearchFinderResponse = {
      kind: 'off_topic',
      cached: false,
      sermons: [],
      preachers,
      message:
        "I'm built to help you find ECCF messages for faith, life, and campus challenges. Try asking about a topic or spiritual question!",
      suggestions: pickRandomSuggestions(config.suggestions, 4),
    }
    setHotCachedFinder(queryHash, offTopicResponse)
    persistSanityCacheAsync(queryHash, offTopicResponse)
    return offTopicResponse
  }

  const excludeSet = new Set(excludeIds)
  const preacherLower = preacherFilter.toLowerCase()
  const eligibleMap = new Map<string, SermonVault>()

  for (const sermon of visibleCatalog) {
    if (excludeSet.has(sermon._id)) continue
    if (preacherLower && !(sermon.preacher || '').toLowerCase().includes(preacherLower)) continue
    const effectiveDur = sermon.durationSeconds ?? parseDurationToSeconds(sermon.duration)
    if (
      maxDurationSeconds !== undefined &&
      (effectiveDur === undefined || effectiveDur > maxDurationSeconds)
    ) {
      continue
    }
    eligibleMap.set(sermon._id, sermon)
  }

  if (eligibleMap.size === 0) {
    return {
      kind: 'empty',
      cached: false,
      sermons: [],
      preachers,
      message: 'No messages matched your current filters. Try clearing a filter or broadening your request.',
      suggestions: pickRandomSuggestions(config.suggestions, 4),
    }
  }

  // 5. Retrieve sermonSegment hits (Sanity Dataset Embeddings hybrid with GROQ keyword fallback)
  const { coreTerms, expandedTerms } = tokenizeQuery(trimmedQuery)
  let segmentHits: SegmentQueryRow[] = []
  let usedSemanticSearch = false

  try {
    const semanticRows = await sanityClient.fetch<SegmentQueryRow[]>(SEMANTIC_SEGMENTS_QUERY, {
      q: trimmedQuery,
    })
    if (Array.isArray(semanticRows)) {
      segmentHits = semanticRows
      usedSemanticSearch = true
    }
  } catch {
    // Dataset Embeddings unavailable or disabled — seamlessly fall back to GROQ keyword matching
    const wildcardPatterns = [...coreTerms, ...expandedTerms]
      .slice(0, 8)
      .map((term) => `${term}*`)
    if (wildcardPatterns.length > 0) {
      try {
        const keywordRows = await sanityClient.fetch<SegmentQueryRow[]>(KEYWORD_SEGMENTS_QUERY, {
          patterns: wildcardPatterns,
        })
        if (Array.isArray(keywordRows)) {
          segmentHits = keywordRows
        }
      } catch {
        segmentHits = []
      }
    }
  }

  // 6. Score and merge segment hits + sermonVault metadata
  const candidateMap = new Map<string, ScoredCandidate>()

  const getOrInitCandidate = (sermon: SermonVault): ScoredCandidate => {
    const existing = candidateMap.get(sermon._id)
    if (existing) return existing
    const metaLexical = scoreSermonMetadata(sermon, coreTerms, expandedTerms)
    const entry: ScoredCandidate = {
      sermon,
      bestSegment: {
        startSeconds: 0,
        timestampLabel: formatTimestamp(0),
        text: sermon.notes || '',
      },
      lexicalScore: metaLexical,
      semanticBonus: 0,
      totalScore: metaLexical,
    }
    candidateMap.set(sermon._id, entry)
    return entry
  }

  eligibleMap.forEach((sermon) => {
    getOrInitCandidate(sermon)
  })

  const bestSegmentScoreBySermon = new Map<string, number>()

  segmentHits.forEach((seg, index) => {
    const sermon = eligibleMap.get(seg.sermonId)
    if (!sermon) return

    const candidate = getOrInitCandidate(sermon)
    const segLexical = countTermMatches((seg.text || '').toLowerCase(), coreTerms, expandedTerms)
    const semanticRankBonus = usedSemanticSearch
      ? Math.max(0.5, (segmentHits.length - index) / Math.max(1, segmentHits.length)) * 4
      : 0
    const segScore = segLexical * 1.5 + semanticRankBonus

    const prevBest = bestSegmentScoreBySermon.get(sermon._id) ?? -1
    if (segScore > prevBest) {
      bestSegmentScoreBySermon.set(sermon._id, segScore)
      const safeStart = Math.max(0, Math.floor(seg.startSeconds || 0))
      candidate.bestSegment = {
        startSeconds: safeStart,
        timestampLabel: seg.timestampLabel || formatTimestamp(safeStart),
        text: seg.text || sermon.notes || '',
      }
      candidate.semanticBonus = Math.max(candidate.semanticBonus, semanticRankBonus)
      candidate.lexicalScore += segLexical * 1.5
      candidate.totalScore = candidate.lexicalScore + candidate.semanticBonus
    }
  })

  const rankedPool = Array.from(candidateMap.values())
    .filter((c) => c.lexicalScore > 0 || (usedSemanticSearch && c.semanticBonus > 0))
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      return (b.sermon.datePreached || '').localeCompare(a.sermon.datePreached || '')
    })
    .slice(0, 12)

  // 7. Optional AI rerank & intent verification (never hallucinates IDs or prose)
  const rerankInputs: RerankCandidate[] = rankedPool.map((c) => ({
    sermonId: c.sermon._id,
    title: c.sermon.title,
    preacher: c.sermon.preacher,
    series: c.sermon.series,
    scriptureReference: c.sermon.scriptureReference,
    topics: c.sermon.topics,
    aiThemes: c.sermon.aiThemes,
    bestSegment: c.bestSegment,
  }))

  const aiResult = await rerankSermonCandidatesWithAi({
    query: trimmedQuery,
    candidates: rerankInputs,
    limit,
    preferred: config.providerPreference,
  })

  if (aiResult !== null) {
    incrementDailyUsageAsync(config, todayLagos)

    if (aiResult.intent === 'crisis') {
      const contact = await getEmergencyContact()
      return {
        kind: 'crisis',
        sermons: [],
        preachers: [],
        message:
          'You are deeply valued by God and by your ECCF family. Please do not walk through this alone — reach out right away to someone who can pray with and support you.',
        contact: {
          ...(contact.phone ? { phone: contact.phone } : {}),
          ...(contact.email ? { email: contact.email } : {}),
          emergencyNumber: '112',
        },
      }
    }

    if (aiResult.intent === 'off_topic') {
      const offTopicResponse: AiSearchFinderResponse = {
        kind: 'off_topic',
        cached: false,
        sermons: [],
        preachers,
        message:
          "I'm built to help you find ECCF messages for faith, life, and campus challenges. Try asking about a topic or spiritual question!",
        suggestions: pickRandomSuggestions(config.suggestions, 4),
      }
      setHotCachedFinder(queryHash, offTopicResponse)
      persistSanityCacheAsync(queryHash, offTopicResponse)
      return offTopicResponse
    }

    const formattedAiSermons: AiSearchSermonResult[] = []
    for (const pick of aiResult.picks) {
      const candidate = candidateMap.get(pick.sermonId)
      if (!candidate) continue
      formattedAiSermons.push(
        formatSermonResult(
          candidate.sermon,
          pick.startSeconds,
          candidate.bestSegment.text,
          config.excerptWords
        )
      )
    }

    const aiResponse: AiSearchFinderResponse =
      formattedAiSermons.length > 0
        ? {
            kind: 'results',
            cached: false,
            sermons: formattedAiSermons,
            preachers,
          }
        : {
            kind: 'empty',
            cached: false,
            sermons: [],
            preachers,
            message:
              'We could not find a strong match for that exact request yet. Try one of the suggested prompts or browse by topic.',
            suggestions: pickRandomSuggestions(config.suggestions, 4),
          }

    setHotCachedFinder(queryHash, aiResponse)
    persistSanityCacheAsync(queryHash, aiResponse)
    return aiResponse
  }

  // 8. Deterministic fallback when AI credentials are absent or timed out
  const lexicalMatches = rankedPool.filter((c) => c.lexicalScore > 0).slice(0, limit)
  const fallbackSermons = lexicalMatches.map((c) =>
    formatSermonResult(
      c.sermon,
      c.bestSegment.startSeconds,
      c.bestSegment.text,
      config.excerptWords
    )
  )

  const fallbackResponse: AiSearchFinderResponse =
    fallbackSermons.length > 0
      ? {
          kind: 'results',
          cached: false,
          sermons: fallbackSermons,
          preachers,
        }
      : {
          kind: 'empty',
          cached: false,
          sermons: [],
          preachers,
          message:
            'We could not find a direct match for that phrase. Try one of the suggested prompts or search by sermon title or speaker.',
          suggestions: pickRandomSuggestions(config.suggestions, 4),
        }

  setHotCachedFinder(queryHash, fallbackResponse)
  persistSanityCacheAsync(queryHash, fallbackResponse)
  return fallbackResponse
}
