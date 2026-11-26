import 'server-only'

import { z } from 'zod'
import { sanityPrivateClient } from '@/lib/sanity'
import { decrypt } from '@/lib/encryption'
import type {
  AiProviderPreference,
  AiSearchSecretStatus,
  SermonThemeWeight,
} from '@/types'

export interface ResolvedAiCredentials {
  provider: 'gemini' | 'openai'
  apiKey: string
  source: 'env' | 'dashboard_override'
}

export interface RerankCandidate {
  sermonId: string
  title: string
  preacher?: string
  series?: string
  scriptureReference?: string
  topics?: string[]
  aiThemes?: SermonThemeWeight[]
  bestSegment: {
    startSeconds: number
    timestampLabel: string
    text: string
  }
}

interface StoredOverrideRecord {
  provider: 'gemini' | 'openai'
  apiKey: string
  keyTail: string
  updatedAt?: string
}

interface SecretCacheEntry {
  expiresAt: number
  override: StoredOverrideRecord | null
}

const SECRET_CACHE_TTL_MS = 60_000
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

let cachedOverride: SecretCacheEntry | null = null

export function invalidateAiCredentialsCache(): void {
  cachedOverride = null
}

function getEnvKeys(preferred?: AiProviderPreference): { geminiKey: string; openaiKey: string } {
  let geminiKey = process.env.GEMINI_API_KEY?.trim() || ''
  let openaiKey = process.env.OPENAI_API_KEY?.trim() || ''
  const genericKey = process.env.AI_API_KEY?.trim() || ''

  if (genericKey) {
    if (genericKey.startsWith('sk-') && !openaiKey) {
      openaiKey = genericKey
    } else if (genericKey.startsWith('AIza') && !geminiKey) {
      geminiKey = genericKey
    } else if (preferred === 'openai' && !openaiKey) {
      openaiKey = genericKey
    } else if (!geminiKey) {
      geminiKey = genericKey
    } else if (!openaiKey) {
      openaiKey = genericKey
    }
  }

  return { geminiKey, openaiKey }
}

async function loadDecryptedOverride(): Promise<StoredOverrideRecord | null> {
  const now = Date.now()
  if (cachedOverride && now < cachedOverride.expiresAt) {
    return cachedOverride.override
  }

  try {
    const doc = await sanityPrivateClient.fetch<{
      _id?: string
      provider?: string
      encryptedApiKey?: string
      keyTail?: string
      updatedAt?: string
    } | null>(
      `coalesce(
        *[_type == "aiSearchSecret" && _id == "drafts.aiSearchSecret"][0],
        *[_type == "aiSearchSecret" && _id == "aiSearchSecret"][0]
      ){
        _id,
        provider,
        encryptedApiKey,
        keyTail,
        updatedAt
      }`
    )

    if (!doc || (doc.provider !== 'gemini' && doc.provider !== 'openai') || !doc.encryptedApiKey) {
      cachedOverride = { expiresAt: now + SECRET_CACHE_TTL_MS, override: null }
      return null
    }

    const decrypted = decrypt(doc.encryptedApiKey).trim()
    if (!decrypted) {
      cachedOverride = { expiresAt: now + SECRET_CACHE_TTL_MS, override: null }
      return null
    }

    const safeTail =
      typeof doc.keyTail === 'string' && doc.keyTail.trim()
        ? doc.keyTail.trim().slice(-4)
        : decrypted.slice(-4)

    const record: StoredOverrideRecord = {
      provider: doc.provider,
      apiKey: decrypted,
      keyTail: safeTail,
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined,
    }

    cachedOverride = { expiresAt: now + SECRET_CACHE_TTL_MS, override: record }
    return record
  } catch {
    cachedOverride = { expiresAt: now + 10_000, override: null }
    return null
  }
}

function selectCredentials(
  envKeys: { geminiKey: string; openaiKey: string },
  override: StoredOverrideRecord | null,
  preferred: AiProviderPreference = 'auto'
): ResolvedAiCredentials | null {
  const { geminiKey, openaiKey } = envKeys

  if (preferred === 'gemini') {
    if (geminiKey) return { provider: 'gemini', apiKey: geminiKey, source: 'env' }
    if (override?.provider === 'gemini') {
      return { provider: 'gemini', apiKey: override.apiKey, source: 'dashboard_override' }
    }
    if (openaiKey) return { provider: 'openai', apiKey: openaiKey, source: 'env' }
    if (override) return { provider: override.provider, apiKey: override.apiKey, source: 'dashboard_override' }
    return null
  }

  if (preferred === 'openai') {
    if (openaiKey) return { provider: 'openai', apiKey: openaiKey, source: 'env' }
    if (override?.provider === 'openai') {
      return { provider: 'openai', apiKey: override.apiKey, source: 'dashboard_override' }
    }
    if (geminiKey) return { provider: 'gemini', apiKey: geminiKey, source: 'env' }
    if (override) return { provider: override.provider, apiKey: override.apiKey, source: 'dashboard_override' }
    return null
  }

  // 'auto': prefer env keys first (Gemini -> OpenAI), then active dashboard override
  if (geminiKey) return { provider: 'gemini', apiKey: geminiKey, source: 'env' }
  if (openaiKey) return { provider: 'openai', apiKey: openaiKey, source: 'env' }
  if (override) {
    return { provider: override.provider, apiKey: override.apiKey, source: 'dashboard_override' }
  }
  return null
}

/**
 * Resolve active AI provider credentials using env priority and encrypted Sanity override fallback.
 */
export async function resolveAiCredentials(
  preferred: AiProviderPreference = 'auto'
): Promise<ResolvedAiCredentials | null> {
  const envKeys = getEnvKeys(preferred)
  const override = await loadDecryptedOverride()
  return selectCredentials(envKeys, override, preferred)
}

/**
 * Return dashboard-safe secret status without ever exposing plaintext API keys.
 */
export async function getAiSecretStatus(
  preferred: AiProviderPreference = 'auto'
): Promise<AiSearchSecretStatus> {
  const envKeys = getEnvKeys(preferred)
  const override = await loadDecryptedOverride()
  const resolved = selectCredentials(envKeys, override, preferred)

  return {
    hasEnvGemini: Boolean(envKeys.geminiKey),
    hasEnvOpenAI: Boolean(envKeys.openaiKey),
    hasDashboardOverride: Boolean(override),
    overrideProvider: override?.provider,
    maskedOverrideTail: override?.keyTail,
    overrideUpdatedAt: override?.updatedAt,
    activeProvider: resolved?.provider ?? 'none',
    activeSource: resolved?.source ?? 'none',
  }
}

// ---------------------------------------------------------------------------
// Structured LLM Helpers
// ---------------------------------------------------------------------------

async function callStructuredJson(
  creds: ResolvedAiCredentials,
  systemInstruction: string,
  userPrompt: string,
  timeoutMs: number
): Promise<unknown | null> {
  if (creds.provider === 'gemini') {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': creds.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText || typeof rawText !== 'string') return null
    return JSON.parse(rawText)
  }

  const res = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creds.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  })

  if (!res.ok) return null
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const rawText = data?.choices?.[0]?.message?.content
  if (!rawText || typeof rawText !== 'string') return null
  return JSON.parse(rawText)
}

// ---------------------------------------------------------------------------
// Theme Normalization & Deterministic Fallback
// ---------------------------------------------------------------------------

interface ThemeLexiconEntry {
  theme: string
  topic: string
  keywords: string[]
}

const THEME_LEXICON: ThemeLexiconEntry[] = [
  {
    theme: 'Faith & Trust in God',
    topic: 'Faith',
    keywords: ['faith', 'trust', 'believe', 'promise', 'promises', 'miracle', 'confidence', 'assurance', 'doubt'],
  },
  {
    theme: 'Prayer & Intimacy with God',
    topic: 'Prayer',
    keywords: ['prayer', 'pray', 'intercession', 'communion', 'devotion', 'altar', 'passion', 'hunger', 'fire', 'worship', 'fasting'],
  },
  {
    theme: 'Academic Excellence & Wisdom',
    topic: 'Academics',
    keywords: ['academic', 'academics', 'exam', 'exams', 'excellence', 'study', 'studying', 'school', 'campus', 'wisdom', 'cgpa', 'pressure', 'student'],
  },
  {
    theme: 'Holiness & Victory Over Temptation',
    topic: 'Holiness',
    keywords: ['holiness', 'holy', 'purity', 'pure', 'temptation', 'sin', 'compromise', 'repentance', 'righteousness', 'sanctified', 'flesh', 'deception'],
  },
  {
    theme: 'Purpose, Calling & Leadership',
    topic: 'Purpose',
    keywords: ['purpose', 'calling', 'destiny', 'career', 'vision', 'gift', 'gifts', 'leadership', 'servant', 'serve', 'assignment', 'will of god'],
  },
  {
    theme: 'Holy Spirit & Spiritual Power',
    topic: 'Holy Spirit',
    keywords: ['holy spirit', 'spirit', 'anointing', 'power', 'tongues', 'guidance', 'voice of god', 'revival', 'filled'],
  },
  {
    theme: 'Grace, Mercy & Forgiveness',
    topic: 'Grace',
    keywords: ['grace', 'mercy', 'forgive', 'forgiveness', 'pardon', 'compassion', 'reconciliation', 'hurt', 'bitterness'],
  },
  {
    theme: 'Peace Over Anxiety & Fear',
    topic: 'Peace',
    keywords: ['peace', 'anxiety', 'worry', 'fear', 'afraid', 'calm', 'rest', 'stress', 'emotions', 'feelings', 'depression'],
  },
  {
    theme: 'Perseverance Through Setbacks',
    topic: 'Perseverance',
    keywords: ['setback', 'comeback', 'trial', 'trials', 'endure', 'perseverance', 'disappointment', 'lifting', 'resilience', 'overcome'],
  },
  {
    theme: 'Healing & Divine Breakthrough',
    topic: 'Breakthrough',
    keywords: ['healing', 'heal', 'breakthrough', 'deliverance', 'favour', 'favor', 'blessing', 'restoration', 'victory'],
  },
  {
    theme: 'Godly Relationships & Character',
    topic: 'Relationships',
    keywords: ['relationship', 'relationships', 'friendship', 'friends', 'marriage', 'love', 'character', 'tongue', 'speech', 'integrity', 'fellowship'],
  },
  {
    theme: 'Word of God & Discipleship',
    topic: 'Bible Study',
    keywords: ['bible', 'scripture', 'word of god', 'truth', 'doctrine', 'disciple', 'discipleship', 'growth', 'maturity'],
  },
  {
    theme: 'Evangelism & Campus Witness',
    topic: 'Evangelism',
    keywords: ['evangelism', 'gospel', 'witness', 'soul', 'souls', 'kingdom', 'mission', 'christ', 'stand'],
  },
]

const SCRIPTURE_REGEX =
  /\b(?:[1-3]\s*)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\s+of\s+Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d{1,3}(?::\d{1,3}(?:\s*[-–]\s*\d{1,3})?)?\b/i

function normalizeThemeWeights(rawThemes: Array<{ theme: string; weight: number }>): SermonThemeWeight[] {
  const deduped = new Map<string, { theme: string; score: number }>()
  for (const item of rawThemes) {
    const label = (item.theme || '').trim().slice(0, 110)
    const numeric = Number(item.weight)
    if (!label || !Number.isFinite(numeric) || numeric <= 0) continue
    const key = label.toLowerCase()
    const existing = deduped.get(key)
    if (existing) {
      existing.score += numeric
    } else {
      deduped.set(key, { theme: label, score: numeric })
    }
  }

  const sorted = Array.from(deduped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  if (sorted.length === 0) {
    return [
      { theme: 'Faith & Christian Living', weight: 60 },
      { theme: 'Word of God & Spiritual Growth', weight: 40 },
    ]
  }

  const totalScore = sorted.reduce((sum, item) => sum + item.score, 0) || 1
  const provisional = sorted.map((item) => {
    const exact = (item.score / totalScore) * 100
    const floored = Math.max(1, Math.floor(exact))
    return {
      theme: item.theme,
      weight: floored,
      remainder: exact - floored,
    }
  })

  let sum = provisional.reduce((acc, item) => acc + item.weight, 0)

  // Distribute or trim remainder so total is strictly 100 and every weight >= 1
  if (sum < 100) {
    const byRemainder = [...provisional].sort((a, b) => b.remainder - a.remainder)
    let idx = 0
    while (sum < 100) {
      byRemainder[idx % byRemainder.length].weight += 1
      sum += 1
      idx += 1
    }
  } else if (sum > 100) {
    const byWeightDesc = [...provisional].sort((a, b) => b.weight - a.weight)
    let guard = 0
    while (sum > 100 && guard < 500) {
      const candidate = byWeightDesc.find((item) => item.weight > 1)
      if (!candidate) break
      candidate.weight -= 1
      sum -= 1
      guard += 1
    }
  }

  return provisional
    .sort((a, b) => b.weight - a.weight)
    .map((item, idx) => ({
      _key: `theme-${idx}`,
      theme: item.theme,
      weight: item.weight,
    }))
}

function extractThemesFallback(input: {
  title: string
  preacher?: string
  notes?: string
  transcriptExcerpt?: string
}): { themes: SermonThemeWeight[]; topics?: string[]; scriptureReference?: string } {
  const titleLower = (input.title || '').toLowerCase()
  const notesLower = (input.notes || '').toLowerCase()
  const excerptLower = (input.transcriptExcerpt || '').toLowerCase()

  const scored: Array<{ theme: string; topic: string; weight: number }> = []

  for (const entry of THEME_LEXICON) {
    let score = 0
    for (const kw of entry.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'g')
      const titleHits = (titleLower.match(regex) || []).length
      const notesHits = (notesLower.match(regex) || []).length
      const excerptHits = (excerptLower.match(regex) || []).length
      score += titleHits * 6 + notesHits * 3 + Math.min(excerptHits, 8)
    }
    if (score > 0) {
      scored.push({ theme: entry.theme, topic: entry.topic, weight: score })
    }
  }

  scored.sort((a, b) => b.weight - a.weight)

  const themes =
    scored.length > 0
      ? normalizeThemeWeights(scored.slice(0, 5).map((s) => ({ theme: s.theme, weight: s.weight })))
      : normalizeThemeWeights([
          { theme: 'Faith & Christian Living', weight: 55 },
          { theme: 'Word of God & Discipleship', weight: 45 },
        ])

  const topics =
    scored.length > 0
      ? Array.from(new Set(scored.slice(0, 4).map((s) => s.topic)))
      : ['Faith', 'Discipleship']

  const combinedText = `${input.title || ''} ${input.notes || ''} ${input.transcriptExcerpt || ''}`
  const scriptureMatch = combinedText.match(SCRIPTURE_REGEX)
  const scriptureReference = scriptureMatch ? scriptureMatch[0].replace(/\s+/g, ' ').trim() : undefined

  return {
    themes,
    topics,
    ...(scriptureReference ? { scriptureReference } : {}),
  }
}

const ExtractThemesResponseSchema = z.object({
  themes: z
    .array(
      z.object({
        theme: z.string().trim().min(2).max(120),
        weight: z.number().finite().positive().max(100),
      })
    )
    .min(1)
    .max(8),
  topics: z.array(z.string().trim().min(2).max(40)).max(6).optional(),
  scriptureReference: z.string().trim().max(120).optional().nullable(),
})

/**
 * Extract normalized sermon themes (summing to 100%), concise topics, and primary scripture reference.
 * Falls back cleanly to deterministic keyword extraction if AI is unavailable or fails.
 */
export async function extractSermonThemes(
  input: {
    title: string
    preacher?: string
    notes?: string
    transcriptExcerpt?: string
  },
  preferred: AiProviderPreference = 'auto'
): Promise<{ themes: SermonThemeWeight[]; topics?: string[]; scriptureReference?: string }> {
  const fallback = extractThemesFallback(input)
  const creds = await resolveAiCredentials(preferred)
  if (!creds) {
    return fallback
  }

  const systemInstruction = [
    'You analyze Christian campus fellowship sermons to extract structured metadata.',
    'Return valid JSON matching: {"themes":[{"theme":"...","weight":40}],"topics":["Faith","Prayer"],"scriptureReference":"..."}',
    'Rules:',
    '- Provide 2 to 5 concise, practical themes whose weights are positive integers summing to 100.',
    '- Provide 2 to 5 short 1-2 word topic tags suitable for sermon vault filtering.',
    '- Provide scriptureReference only if clearly referenced in title, notes, or excerpt; otherwise omit or null.',
  ].join('\n')

  const userPrompt = JSON.stringify({
    title: input.title.slice(0, 200),
    preacher: input.preacher?.slice(0, 120) || undefined,
    notes: input.notes?.slice(0, 1500) || undefined,
    transcriptExcerpt: input.transcriptExcerpt?.slice(0, 3500) || undefined,
  })

  try {
    const rawJson = await callStructuredJson(creds, systemInstruction, userPrompt, 8000)
    const parsed = ExtractThemesResponseSchema.safeParse(rawJson)
    if (!parsed.success) {
      return fallback
    }

    const themes = normalizeThemeWeights(parsed.data.themes)
    const topics = parsed.data.topics
      ? Array.from(new Set(parsed.data.topics.map((t) => t.trim()).filter(Boolean))).slice(0, 5)
      : fallback.topics
    const scriptureReference =
      parsed.data.scriptureReference && parsed.data.scriptureReference.trim()
        ? parsed.data.scriptureReference.trim()
        : fallback.scriptureReference

    return {
      themes,
      topics: topics && topics.length > 0 ? topics : fallback.topics,
      ...(scriptureReference ? { scriptureReference } : {}),
    }
  } catch {
    return fallback
  }
}

const RerankResponseSchema = z.object({
  intent: z.enum(['results', 'off_topic', 'crisis']),
  picks: z
    .array(
      z.object({
        sermonId: z.string().trim().min(1),
        startSeconds: z.number().finite().min(0).optional(),
      })
    )
    .max(12)
    .default([]),
})

/**
 * Rerank candidate sermon moments with structured AI output.
 * Strictly validates that all picks belong to the provided candidate list.
 */
export async function rerankSermonCandidatesWithAi({
  query,
  candidates,
  limit,
  preferred = 'auto',
}: {
  query: string
  candidates: RerankCandidate[]
  limit: number
  preferred?: AiProviderPreference
}): Promise<{
  intent: 'results' | 'off_topic' | 'crisis'
  picks: Array<{ sermonId: string; startSeconds: number }>
} | null> {
  if (!query.trim() || candidates.length === 0) return null

  const creds = await resolveAiCredentials(preferred)
  if (!creds) return null

  const candidateMap = new Map<string, RerankCandidate>()
  for (const candidate of candidates) {
    candidateMap.set(candidate.sermonId, candidate)
  }

  const compactCandidates = candidates.slice(0, 12).map((c) => ({
    sermonId: c.sermonId,
    title: c.title,
    preacher: c.preacher,
    series: c.series,
    scriptureReference: c.scriptureReference,
    topics: c.topics?.slice(0, 6),
    aiThemes: c.aiThemes?.slice(0, 5).map((t) => ({ theme: t.theme, weight: t.weight })),
    bestSegment: {
      startSeconds: Math.max(0, Math.floor(c.bestSegment.startSeconds)),
      timestampLabel: c.bestSegment.timestampLabel,
      text: c.bestSegment.text.slice(0, 320),
    },
  }))

  const systemInstruction = [
    'You are an AI sermon finder for Edo State University Christian Campus Fellowship (ECCF).',
    'Classify the user query intent and rank ONLY the provided sermon candidates.',
    'Return strict JSON only: {"intent":"results"|"off_topic"|"crisis","picks":[{"sermonId":"...","startSeconds":0}]}',
    'Classification rules:',
    '- "crisis": user expresses suicidal thoughts, self-harm, wanting to die, or immediate physical danger.',
    '- "off_topic": completely non-spiritual/non-life queries like programming code, weather, sports scores, math homework calculations, cooking recipes, or stock prices.',
    '- "results": spiritual questions, Christian growth, campus life, academic pressure, emotions, relationships, purpose, or finding relevant teachings.',
    'Selection rules:',
    `- Return at most ${Math.max(1, Math.min(limit, 12))} picks when intent is "results", ordered from best match to weakest match.`,
    '- ONLY include sermonIds that genuinely address the query; omit irrelevant sermons.',
    '- Every sermonId and startSeconds MUST come verbatim from the provided candidates.',
    '- Return empty picks [] when intent is "off_topic" or "crisis". Never write prose.',
  ].join('\n')

  const userPrompt = JSON.stringify({
    query: query.slice(0, 300),
    limit: Math.max(1, Math.min(limit, 12)),
    candidates: compactCandidates,
  })

  try {
    const rawJson = await callStructuredJson(creds, systemInstruction, userPrompt, 4500)
    const parsed = RerankResponseSchema.safeParse(rawJson)
    if (!parsed.success) return null

    if (parsed.data.intent !== 'results') {
      return { intent: parsed.data.intent, picks: [] }
    }

    const seen = new Set<string>()
    const verifiedPicks: Array<{ sermonId: string; startSeconds: number }> = []

    for (const pick of parsed.data.picks) {
      const candidate = candidateMap.get(pick.sermonId)
      if (!candidate || seen.has(pick.sermonId)) continue
      seen.add(pick.sermonId)
      verifiedPicks.push({
        sermonId: candidate.sermonId,
        // Snap strictly to the verified segment offset from our Sanity candidate
        startSeconds: Math.max(0, Math.floor(candidate.bestSegment.startSeconds)),
      })
      if (verifiedPicks.length >= limit) break
    }

    return {
      intent: 'results',
      picks: verifiedPicks,
    }
  } catch {
    return null
  }
}
