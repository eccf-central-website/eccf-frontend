import type { AiProviderPreference, AiSearchConfig } from '@/types'

/**
 * Default starter prompts for ECCF Message AI Search.
 * Client-safe — contains no server secrets or `server-only` imports.
 */
export const DEFAULT_AI_SEARCH_SUGGESTIONS: string[] = [
  'My passion for God feels cold',
  'How do I overcome exam fear and academic pressure?',
  'How to overcome temptation as a student',
  "I need encouragement holding onto God's promises",
  'How can I grow a consistent prayer life?',
  "Understanding God's purpose for my career and academics",
  'Forgiving someone who hurt me',
  'How can I be filled with the Holy Spirit?',
  'Trusting God for healing and breakthrough',
  'Building godly friendships and relationships',
  'How to study the Bible effectively',
  'Overcoming anxiety and worry',
  'Standing for Christ on campus',
  'Dealing with setbacks and disappointment',
  "How to hear God's voice clearly",
  'Serving God faithfully with my gifts',
]

export const DEFAULT_AI_SEARCH_CONFIG: AiSearchConfig = {
  _id: 'aiSearchConfig',
  enabled: true,
  showFloatingButton: true,
  buttonLabel: 'AI Search',
  heading: "Looking for a word for what you're going through?",
  subtitle: "Describe it in your own words, and we'll suggest messages that speak to it.",
  placeholder: 'e.g. I need strength for exams and academic pressure',
  greeting:
    "Hi! Tell me what you're going through, or what kind of message you want to listen to, and I'll find messages from ECCF sermons that speak to it.",
  excerptWords: 20,
  maxSuggestions: 150,
  suggestions: [...DEFAULT_AI_SEARCH_SUGGESTIONS],
  dailyLimit: 3000,
  hourlySearchLimit: 20,
  hourlyChatLimit: 40,
  hiddenYears: [],
  providerPreference: 'auto',
  dailyUsageCount: 0,
  contentChangesSinceOldestCache: 0,
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const rounded = Math.round(value)
  if (rounded < min) return min
  if (rounded > max) return max
  return rounded
}

function pickNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function normalizeProviderPreference(value: unknown): AiProviderPreference {
  if (value === 'gemini' || value === 'openai' || value === 'auto') {
    return value
  }
  return DEFAULT_AI_SEARCH_CONFIG.providerPreference
}

function dedupeStrings(items: string[], maxCount: number): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
    if (result.length >= maxCount) break
  }
  return result
}

/**
 * Merge partial Sanity configuration with safe bounded defaults.
 */
export function mergeAiSearchConfig(raw?: Partial<AiSearchConfig> | null): AiSearchConfig {
  const maxSuggestions = clampInt(raw?.maxSuggestions, DEFAULT_AI_SEARCH_CONFIG.maxSuggestions, 1, 200)

  const cleanedSuggestions = Array.isArray(raw?.suggestions)
    ? dedupeStrings(raw.suggestions, maxSuggestions)
    : []

  const hiddenYears = Array.isArray(raw?.hiddenYears)
    ? Array.from(
        new Set(
          raw.hiddenYears
            .filter((year): year is number => typeof year === 'number' && Number.isInteger(year) && year >= 1900 && year <= 2100)
        )
      ).sort((a, b) => b - a)
    : [...DEFAULT_AI_SEARCH_CONFIG.hiddenYears]

  return {
    _id: typeof raw?._id === 'string' && raw._id.trim() ? raw._id.trim() : DEFAULT_AI_SEARCH_CONFIG._id,
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : DEFAULT_AI_SEARCH_CONFIG.enabled,
    showFloatingButton:
      typeof raw?.showFloatingButton === 'boolean'
        ? raw.showFloatingButton
        : DEFAULT_AI_SEARCH_CONFIG.showFloatingButton,
    buttonLabel: pickNonEmptyString(raw?.buttonLabel, DEFAULT_AI_SEARCH_CONFIG.buttonLabel),
    heading: pickNonEmptyString(raw?.heading, DEFAULT_AI_SEARCH_CONFIG.heading),
    subtitle: pickNonEmptyString(raw?.subtitle, DEFAULT_AI_SEARCH_CONFIG.subtitle),
    placeholder: pickNonEmptyString(raw?.placeholder, DEFAULT_AI_SEARCH_CONFIG.placeholder),
    greeting: pickNonEmptyString(raw?.greeting, DEFAULT_AI_SEARCH_CONFIG.greeting),
    excerptWords: clampInt(raw?.excerptWords, DEFAULT_AI_SEARCH_CONFIG.excerptWords, 0, 64),
    maxSuggestions,
    suggestions:
      cleanedSuggestions.length > 0
        ? cleanedSuggestions
        : DEFAULT_AI_SEARCH_SUGGESTIONS.slice(0, maxSuggestions),
    dailyLimit: clampInt(raw?.dailyLimit, DEFAULT_AI_SEARCH_CONFIG.dailyLimit, 0, 50000),
    hourlySearchLimit: clampInt(raw?.hourlySearchLimit, DEFAULT_AI_SEARCH_CONFIG.hourlySearchLimit, 1, 500),
    hourlyChatLimit: clampInt(raw?.hourlyChatLimit, DEFAULT_AI_SEARCH_CONFIG.hourlyChatLimit, 1, 500),
    hiddenYears,
    providerPreference: normalizeProviderPreference(raw?.providerPreference),
    dailyUsageDate:
      typeof raw?.dailyUsageDate === 'string' && raw.dailyUsageDate.trim()
        ? raw.dailyUsageDate.trim()
        : undefined,
    dailyUsageCount: clampInt(raw?.dailyUsageCount, 0, 0, 1_000_000),
    lastContentUpdatedAt:
      typeof raw?.lastContentUpdatedAt === 'string' && raw.lastContentUpdatedAt.trim()
        ? raw.lastContentUpdatedAt.trim()
        : undefined,
    contentChangesSinceOldestCache: clampInt(raw?.contentChangesSinceOldestCache, 0, 0, 1_000_000),
  }
}

function shuffleCopy<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

/**
 * Pick `count` random unique suggestions from `pool`, preferring entries not in `exclude`.
 */
export function pickRandomSuggestions(pool: string[], count: number, exclude?: string[]): string[] {
  const target = Math.max(0, Math.floor(count || 0))
  if (target === 0) return []

  const cleaned = dedupeStrings(pool, 200)
  const source = cleaned.length > 0 ? cleaned : DEFAULT_AI_SEARCH_SUGGESTIONS

  const excludeSet = new Set(
    (exclude || [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  )

  const fresh = source.filter((item) => !excludeSet.has(item.toLowerCase()))
  const shuffledFresh = shuffleCopy(fresh)

  if (shuffledFresh.length >= target) {
    return shuffledFresh.slice(0, target)
  }

  const remaining = source.filter((item) => excludeSet.has(item.toLowerCase()))
  return [...shuffledFresh, ...shuffleCopy(remaining)].slice(0, target)
}
