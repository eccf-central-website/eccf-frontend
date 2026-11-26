import 'server-only'

import { ADMIN_SERMONS_QUERY } from '@/lib/queries'
import { sanityClient, sanityPrivateClient } from '@/lib/sanity'
import { DEFAULT_AI_SEARCH_CONFIG, mergeAiSearchConfig } from '@/lib/sermon-ai/defaults'
import { getAiSecretStatus } from '@/lib/sermon-ai/provider'
import type {
  AiProviderPreference,
  AiSearchCacheStats,
  AiSearchConfig,
  AiSearchSecretStatus,
  SermonVault,
} from '@/types'

export interface SermonDashboardData {
  sermons: SermonVault[]
  aiConfig: AiSearchConfig
  secretStatus: AiSearchSecretStatus
  cacheStats: AiSearchCacheStats
}

const ADMIN_AI_SEARCH_CONFIG_QUERY = `
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

const AI_SEARCH_CACHE_AGGREGATE_QUERY = `
  {
    "totalEntries": count(*[_type == "aiSearchCache"]),
    "totalReuses": coalesce(math::sum(*[_type == "aiSearchCache" && defined(hitCount)].hitCount), 0),
    "oldestSavedAt": *[_type == "aiSearchCache" && defined(createdAt)] | order(createdAt asc)[0].createdAt
  }
`

interface CacheAggregateRow {
  totalEntries?: number
  totalReuses?: number
  oldestSavedAt?: string | null
}

const MOCK_SERMONS: SermonVault[] = [
  {
    _id: 'mock-sermon-1',
    _type: 'sermonVault',
    title: 'MAPPING YOUR WAY TO THE TOP',
    slug: 'mapping-your-way-to-the-top',
    preacher: 'Dr. Kunle Ogunkolati',
    series: 'SAS 2025',
    topics: ['Excellence', 'Purpose', 'Wisdom'],
    datePreached: '2026-02-15',
    scriptureReference: 'Daniel 1:17',
    duration: '48 min',
    durationSeconds: 2880,
    isPublished: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=XLqzP1qhxK0',
    youtubeMusicUrl: 'https://music.youtube.com/watch?v=XLqzP1qhxK0',
    youtubeVideoId: 'XLqzP1qhxK0',
    thumbnailUrl: 'https://img.youtube.com/vi/XLqzP1qhxK0/hqdefault.jpg',
    isAutoSynced: true,
    notes: 'Practical biblical principles for academic excellence, planning ahead, and walking in divine wisdom on campus.',
    transcriptStatus: 'ready',
    transcriptSource: 'youtube_captions',
    transcriptWordCount: 5420,
    transcriptUpdatedAt: '2026-02-16T10:00:00.000Z',
    aiThemes: [
      { _key: 't-1', theme: 'Purpose & Academic Excellence', weight: 45 },
      { _key: 't-2', theme: 'Wisdom & Diligent Planning', weight: 35 },
      { _key: 't-3', theme: 'Faith & Spiritual Discipline', weight: 20 },
    ],
  },
  {
    _id: 'mock-sermon-2',
    _type: 'sermonVault',
    title: 'Table Water Discussion on Academic Pressure',
    slug: 'table-water-discussion-on-academic-pressure',
    preacher: 'Pst. Dr. Ayodeji Aduloju',
    series: 'Campus Life',
    topics: ['Academics', 'Peace', 'Anxiety'],
    datePreached: '2026-01-25',
    scriptureReference: 'Philippians 4:6-7',
    duration: '36 min',
    durationSeconds: 2160,
    isPublished: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=fC9rjQYyJ3M',
    youtubeMusicUrl: 'https://music.youtube.com/watch?v=fC9rjQYyJ3M',
    youtubeVideoId: 'fC9rjQYyJ3M',
    thumbnailUrl: 'https://img.youtube.com/vi/fC9rjQYyJ3M/hqdefault.jpg',
    isAutoSynced: false,
    notes: 'Interactive forum addressing exam anxiety, overwhelm, and trusting God in intense academic seasons.',
    transcriptStatus: 'ready',
    transcriptSource: 'uploaded_vtt',
    transcriptWordCount: 4180,
    transcriptUpdatedAt: '2026-01-26T14:30:00.000Z',
    aiThemes: [
      { _key: 't-1', theme: 'Overcoming Exam Anxiety & Fear', weight: 50 },
      { _key: 't-2', theme: 'Peace of God & Mental Rest', weight: 30 },
      { _key: 't-3', theme: 'Balanced Study & Devotion', weight: 20 },
    ],
  },
  {
    _id: 'mock-sermon-3',
    _type: 'sermonVault',
    title: 'FAITH, FOCUS AND FRUITFULNESS',
    slug: 'faith-focus-and-fruitfulness',
    preacher: 'Dr. Sola Akinyemi',
    series: 'SAS 2025',
    topics: ['Faith', 'Fruitfulness', 'Growth'],
    datePreached: '2025-11-16',
    scriptureReference: 'John 15:5',
    duration: '52 min',
    durationSeconds: 3120,
    isPublished: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=uhyt6YMUUWg',
    youtubeMusicUrl: 'https://music.youtube.com/watch?v=uhyt6YMUUWg',
    youtubeVideoId: 'uhyt6YMUUWg',
    thumbnailUrl: 'https://img.youtube.com/vi/uhyt6YMUUWg/hqdefault.jpg',
    isAutoSynced: true,
    notes: 'Abiding in Christ as the secret to lasting spiritual and academic fruitfulness.',
    transcriptStatus: 'waiting',
    transcriptWordCount: 0,
    aiThemes: [],
  },
  {
    _id: 'mock-sermon-4',
    _type: 'sermonVault',
    title: 'Standing Against Compromise in Academic Pursuit',
    slug: 'standing-against-compromise-in-academic-pursuit',
    preacher: 'Dr. Anthony Ugbenyen',
    series: 'Campus Witness',
    topics: ['Integrity', 'Holiness', 'Courage'],
    datePreached: '2025-10-12',
    scriptureReference: 'Daniel 1:8',
    duration: '41 min',
    durationSeconds: 2460,
    isPublished: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=uB-Ug4ekSis',
    youtubeMusicUrl: 'https://music.youtube.com/watch?v=uB-Ug4ekSis',
    youtubeVideoId: 'uB-Ug4ekSis',
    thumbnailUrl: 'https://img.youtube.com/vi/uB-Ug4ekSis/hqdefault.jpg',
    isAutoSynced: true,
    notes: 'Staying faithful to Christian convictions during exams, projects, and campus pressures.',
    transcriptStatus: 'unavailable',
    transcriptWordCount: 0,
    aiThemes: [
      { _key: 't-1', theme: 'Integrity & Moral Courage', weight: 60 },
      { _key: 't-2', theme: 'Resisting Peer & Academic Compromise', weight: 40 },
    ],
  },
]

function isMockDataSource(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.DASHBOARD_DATA_SOURCE === 'mock'
}

function buildFallbackSecretStatus(): AiSearchSecretStatus {
  const hasEnvGemini = Boolean(process.env.GEMINI_API_KEY?.trim())
  const hasEnvOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim())
  return {
    hasEnvGemini,
    hasEnvOpenAI,
    hasDashboardOverride: false,
    activeProvider: hasEnvGemini ? 'gemini' : hasEnvOpenAI ? 'openai' : 'none',
    activeSource: hasEnvGemini || hasEnvOpenAI ? 'env' : 'none',
  }
}

async function getSafeSecretStatus(preferred: AiProviderPreference): Promise<AiSearchSecretStatus> {
  try {
    return await getAiSecretStatus(preferred)
  } catch {
    return buildFallbackSecretStatus()
  }
}

async function buildMockDashboardData(skipRemoteSecretCheck = false): Promise<SermonDashboardData> {
  const aiConfig = mergeAiSearchConfig(DEFAULT_AI_SEARCH_CONFIG)
  const secretStatus = skipRemoteSecretCheck
    ? buildFallbackSecretStatus()
    : await getSafeSecretStatus(aiConfig.providerPreference)

  return {
    sermons: structuredClone(MOCK_SERMONS),
    aiConfig,
    secretStatus,
    cacheStats: {
      totalEntries: 0,
      totalReuses: 0,
      staleChangeCount: 0,
    },
  }
}

/**
 * Fetch sermons, AI Search configuration, masked provider secret status, and cache telemetry
 * for the Media Team `/dashboard/sermons` console.
 */
export async function getSermonDashboardData(): Promise<SermonDashboardData> {
  if (isMockDataSource()) {
    return buildMockDashboardData()
  }

  try {
    const client = sanityPrivateClient.config().token ? sanityPrivateClient : sanityClient

    const [rawSermons, rawConfig, cacheAgg] = await Promise.all([
      client.fetch<SermonVault[]>(ADMIN_SERMONS_QUERY),
      client.fetch<Partial<AiSearchConfig> | null>(ADMIN_AI_SEARCH_CONFIG_QUERY),
      client.fetch<CacheAggregateRow | null>(AI_SEARCH_CACHE_AGGREGATE_QUERY),
    ])

    const sermons = Array.isArray(rawSermons) ? rawSermons : []
    const aiConfig = mergeAiSearchConfig(rawConfig)
    const secretStatus = await getSafeSecretStatus(aiConfig.providerPreference)

    const totalEntries = Math.max(0, Number(cacheAgg?.totalEntries ?? 0))
    const totalReuses = Math.max(0, Number(cacheAgg?.totalReuses ?? 0))
    const oldestSavedAt =
      typeof cacheAgg?.oldestSavedAt === 'string' && cacheAgg.oldestSavedAt.trim()
        ? cacheAgg.oldestSavedAt.trim()
        : undefined
    const staleChangeCount =
      totalEntries > 0 ? Math.max(0, Number(aiConfig.contentChangesSinceOldestCache ?? 0)) : 0

    return {
      sermons,
      aiConfig,
      secretStatus,
      cacheStats: {
        totalEntries,
        totalReuses,
        oldestSavedAt,
        staleChangeCount,
      },
    }
  } catch (err) {
    console.error('[getSermonDashboardData] Failed to load Sanity sermon data:', err)
    if (process.env.NODE_ENV !== 'production') {
      return buildMockDashboardData(true)
    }
    throw err
  }
}
