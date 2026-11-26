import { revalidatePath } from 'next/cache'
import { lagosDaysBetween } from '@/lib/dashboard/dates'
import { sanityWriteClient } from '@/lib/sanity'
import { DEFAULT_AI_SEARCH_CONFIG } from '@/lib/sermon-ai/defaults'
import { invalidatePublicAiConfigCache } from '@/lib/sermon-ai/finder'
import { extractSermonThemes } from '@/lib/sermon-ai/provider'
import { fetchYoutubeCaptionsForVideo } from '@/lib/sermon-ai/vtt'
import { parseDurationToSeconds, slugifySermonTitle } from '@/lib/sermonUtils'
import type { AiProviderPreference, SermonThemeWeight } from '@/types'

export const DEFAULT_SPOTIFY_RSS_URL = 'https://anchor.fm/s/f24b9b94/podcast/rss'
export const DEFAULT_YOUTUBE_RSS_URL = 'https://www.youtube.com/feeds/videos.xml?playlist_id=PLBI5gIAk9TVM'

const MAX_AUTO_CAPTIONS_PER_SYNC = 2
const AUTO_CAPTION_RECENT_DAYS = 10
const AUTO_CAPTION_TIMEOUT_MS = 10_000
const SANITY_TX_BATCH_SIZE = 50

// Curated reference catalogue of confirmed ECCF sermon videos for instant high-accuracy resolution
const KNOWN_YOUTUBE_SERMONS: Array<{ title: string; youtubeVideoId: string; preacher?: string; series?: string }> = [
  {
    title: 'MAPPING YOUR WAY TO THE TOP',
    youtubeVideoId: 'XLqzP1qhxK0',
    preacher: 'Dr. Kunle Ogunkolati',
    series: 'SAS 2025',
  },
  {
    title: 'FROM SETBACK TO COMEBACK',
    youtubeVideoId: 'SBA_LZJmsTc',
    preacher: 'Dr. Kunle Ogunkolati',
    series: 'SAS 2025',
  },
  {
    title: 'ACHIEVING EXCELLENCE WITH AVAILABLE RESOURCES',
    youtubeVideoId: 'JxXUGqDpVKI',
    preacher: 'Dr. Kunle Ogunkolati',
    series: 'SAS 2025',
  },
  {
    title: 'FAITH, FOCUS AND FRUITFULNESS',
    youtubeVideoId: 'uhyt6YMUUWg',
    preacher: 'Dr. Sola Akinyemi',
    series: 'SAS 2025',
  },
  {
    title: 'Repentance: The Invitation to Experience the Kingdom of Heaven 2',
    youtubeVideoId: 'RcpgPLRqZ2c',
    preacher: 'Pst. Samuel Adebayo-Adesina',
    series: 'Repentance',
  },
  {
    title: 'The Power of Tamed and Untamed Tongue',
    youtubeVideoId: 'YQo2JqvxCHk',
    preacher: 'Pst. Dr. Ayodeji Aduloju',
  },
  {
    title: 'Sacntified Emotions and Feelings by Dr. Ayo Aduloju',
    youtubeVideoId: 'M5domJOhhxk',
    preacher: 'Pst. Dr. Ayodeji Aduloju',
  },
  {
    title: "Christ's Warning against 'Gen-Z' deceptions by Dr. Ayo Aduloju",
    youtubeVideoId: 'HzR1wVaSZHI',
    preacher: 'Pst. Dr. Ayodeji Aduloju',
  },
  {
    title: 'Standing Against Compromise in Academic Pursuit by Dr. Anthony Ugbenyen',
    youtubeVideoId: 'uB-Ug4ekSis',
    preacher: 'Dr. Anthony Ugbenyen',
  },
  {
    title: 'Table Water Discussion on Academic Pressure',
    youtubeVideoId: 'fC9rjQYyJ3M',
    preacher: 'Pst. Dr. Ayodeji Aduloju',
  },
  {
    title: 'There is a lifting up by Prof. Andrew Ate',
    youtubeVideoId: 'f3TFnt9shhk',
    preacher: 'Prof. Andrew Ate',
  },
  {
    title: 'Question and Answer session (Continuation from Table Water Discussion on Academic Pressure)',
    youtubeVideoId: 'i-bAMeubcRE',
    preacher: 'Pst. Dr. Ayodeji Aduloju',
  },
]

export interface FeedItem {
  type: 'youtube' | 'podcast'
  title: string
  link: string
  guid: string
  pubDate: string
  author: string
  thumbnailUrl: string
  videoId?: string
  description?: string
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return ''
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    })
}

function cleanFeedDescription(raw?: string): string | undefined {
  if (!raw) return undefined
  const pass1 = decodeHtmlEntities(raw)
  const decoded = pass1.includes('&') ? decodeHtmlEntities(pass1) : pass1
  const stripped = decoded
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return undefined
  if (stripped.length <= 800) return stripped
  return `${stripped.slice(0, 797).trimEnd()}...`
}

export function normalizeTitle(t: string): string {
  if (!t) return ''
  return t
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/['"“”‘’]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function titlesMatch(t1: string, t2: string): boolean {
  const n1 = normalizeTitle(t1)
  const n2 = normalizeTitle(t2)
  if (!n1 || !n2) return false
  if (n1 === n2) return true
  if (n1.length > 8 && n2.length > 8) {
    if (n1.startsWith(n2) || n2.startsWith(n1)) return true
    if (n1.includes(n2) || n2.includes(n1)) return true
  }
  return false
}

export function parseFeedXml(xml: string): FeedItem[] {
  const items: FeedItem[] = []

  // Check for Atom entries (<entry>...</entry>) — used by YouTube
  const entryMatches = xml.match(/<entry[\s\S]*?<\/entry>/g)
  if (entryMatches && entryMatches.length > 0) {
    for (const match of entryMatches) {
      const titleMatch =
        match.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) ||
        match.match(/<media:title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/media:title>/i)
      const linkMatch = match.match(/<link[^>]*href=["'](.*?)["']/i)
      const videoIdMatch =
        match.match(/<yt:videoId>(.*?)<\/yt:videoId>/i) || match.match(/<id>yt:video:(.*?)<\/id>/i)
      const pubDateMatch =
        match.match(/<published>(.*?)<\/published>/i) || match.match(/<updated>(.*?)<\/updated>/i)
      const authorMatch = match.match(/<author>[\s\S]*?<name>(.*?)<\/name>/i)
      const thumbMatch = match.match(/<media:thumbnail[^>]*url=["'](.*?)["']/i)

      const videoId = videoIdMatch ? videoIdMatch[1].trim() : ''
      const link = linkMatch
        ? linkMatch[1].trim()
        : videoId
        ? `https://www.youtube.com/watch?v=${videoId}`
        : ''
      const rawTitle = titleMatch ? titleMatch[1].trim() : ''
      const title = decodeHtmlEntities(rawTitle)

      if (title) {
        items.push({
          type: 'youtube',
          title,
          link,
          guid: videoId,
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
          author: authorMatch ? decodeHtmlEntities(authorMatch[1].trim()) : '',
          thumbnailUrl: thumbMatch
            ? thumbMatch[1].trim()
            : videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : '',
          videoId,
        })
      }
    }
    return items
  }

  // Parse standard RSS items (<item>...</item>) — used by Spotify/Anchor
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/g) || []
  for (const match of itemMatches) {
    const titleMatch = match.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
    const linkMatch = match.match(/<link>(.*?)<\/link>/i)
    const guidMatch = match.match(/<guid.*?>(.*?)<\/guid>/i)
    const pubDateMatch = match.match(/<pubDate>(.*?)<\/pubDate>/i)
    const authorMatch = match.match(/<itunes:author>(.*?)<\/itunes:author>/i)
    const imageMatch = match.match(/<itunes:image[^>]*href=["'](.*?)["']/i)
    const itunesSummaryMatch = match.match(
      /<itunes:summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/itunes:summary>/i
    )
    const descriptionMatch = match.match(
      /<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i
    )

    const rawTitle = titleMatch ? titleMatch[1].trim() : ''
    const title = decodeHtmlEntities(rawTitle)
    const description =
      cleanFeedDescription(itunesSummaryMatch?.[1]) ||
      cleanFeedDescription(descriptionMatch?.[1])

    if (title) {
      items.push({
        type: 'podcast',
        title,
        link: linkMatch ? linkMatch[1].trim() : '',
        guid: guidMatch ? guidMatch[1].trim() : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
        author: authorMatch ? decodeHtmlEntities(authorMatch[1].trim()) : '',
        thumbnailUrl: imageMatch ? imageMatch[1].trim() : '',
        ...(description ? { description } : {}),
      })
    }
  }

  return items
}

export function extractSpotifyId(urlStr: string): string | null {
  if (!urlStr) return null
  const match = urlStr.match(/episodes?\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export function extractYoutubeId(urlStr: string): string | null {
  if (!urlStr) return null
  const match = urlStr.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

/**
 * Searches YouTube for a sermon using the YouTube Data API v3.
 * Falls back to the curated KNOWN_YOUTUBE_SERMONS list first (exact match only)
 * to avoid API calls for known sermons and prevent false-positive video matches.
 */
export async function searchYouTubeForSermon(
  title: string,
  preacher?: string
): Promise<string | null> {
  // First check curated reference catalogue (exact match only to prevent wrong videos)
  const known = KNOWN_YOUTUBE_SERMONS.find((k) => {
    if (normalizeTitle(k.title) !== normalizeTitle(title)) return false
    if (preacher && k.preacher) {
      return k.preacher.toLowerCase() === preacher.toLowerCase()
    }
    return true
  })
  if (known) {
    return known.youtubeVideoId
  }

  // Fall back to YouTube Data API v3
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const cleanTitle = title
      .replace(/['"“”‘’]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const query = `ESUI Christian Campus Fellowship ${cleanTitle}`

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '1',
      channelId: 'UCMaqmdr3Wrvx5rLWUlAsChw',
      key: apiKey,
    })

    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null

    const data = await res.json()
    const item = data?.items?.[0]
    const videoId = item?.id?.videoId
    if (!videoId) return null

    // Verify the returned video title actually matches our search to prevent wrong videos
    const returnedTitle = item?.snippet?.title
    if (returnedTitle && !titlesMatch(returnedTitle, title)) {
      return null
    }

    return videoId
  } catch {
    return null
  }
}

interface SanitySermonDoc {
  _id: string
  title: string
  slug?: string
  preacher?: string
  series?: string
  topics?: string[]
  datePreached?: string
  scriptureReference?: string
  duration?: string
  durationSeconds?: number
  isPublished?: boolean
  spotifyUrl?: string
  spotifyEmbedId?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  youtubeMusicUrl?: string
  thumbnailUrl?: string
  notes?: string
  isAutoSynced?: boolean
  transcriptStatus?: string
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

function isWithinRecentDays(datePreached?: string, maxDays = AUTO_CAPTION_RECENT_DAYS): boolean {
  if (!datePreached || !/^\d{4}-\d{2}-\d{2}$/.test(datePreached)) return false
  const days = lagosDaysBetween(datePreached)
  return Number.isFinite(days) && days >= -1 && days <= maxDays
}

function buildSanityThemes(themes: SermonThemeWeight[]): SermonThemeWeight[] {
  return themes.map((item, idx) => {
    const slugKey = item.theme
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 16)
    return {
      _key: `theme-${idx}-${slugKey || 'item'}`,
      theme: item.theme,
      weight: item.weight,
    }
  })
}

async function getConfiguredProviderPreference(): Promise<AiProviderPreference> {
  try {
    const pref = await sanityWriteClient.fetch<string | null>(
      `coalesce(*[_type == "aiSearchConfig" && _id == "aiSearchConfig"][0].providerPreference, *[_type == "aiSearchConfig"][0].providerPreference)`
    )
    if (pref === 'gemini' || pref === 'openai' || pref === 'auto') {
      return pref
    }
  } catch {
    // Fallback to auto
  }
  return 'auto'
}

async function enrichRecentSermonCaptions(
  sermon: SanitySermonDoc,
  preferred: AiProviderPreference
): Promise<'enriched' | 'unavailable'> {
  const videoId = sermon.youtubeVideoId || extractYoutubeId(sermon.youtubeUrl || '')
  if (!videoId) return 'unavailable'

  const captionRes = await fetchYoutubeCaptionsForVideo(videoId)
  if (!captionRes.ok) {
    if (sermon.transcriptStatus !== 'unavailable') {
      await sanityWriteClient
        .patch(sermon._id)
        .set({ transcriptStatus: 'unavailable' })
        .commit()
    }
    return 'unavailable'
  }

  const cleanId = sermon._id.replace(/^drafts\./, '').trim()
  const isDraft = sermon._id.startsWith('drafts.')
  const idPrefix = cleanId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const durationSeconds = sermon.durationSeconds ?? parseDurationToSeconds(sermon.duration)

  // Clear existing segments before writing updated ones
  const existingSegIds = await sanityWriteClient.fetch<string[]>(
    `*[_type == "sermonSegment" && (sermonId == $cleanId || sermonId == $rawId || sermon._ref == $cleanId || sermon._ref == $rawId)]._id`,
    { cleanId, rawId: sermon._id }
  )
  if (Array.isArray(existingSegIds) && existingSegIds.length > 0) {
    for (let i = 0; i < existingSegIds.length; i += SANITY_TX_BATCH_SIZE) {
      const batch = existingSegIds.slice(i, i + SANITY_TX_BATCH_SIZE)
      const tx = sanityWriteClient.transaction()
      for (const segId of batch) {
        tx.delete(segId)
      }
      await tx.commit()
    }
  }

  // Write segment documents in batches
  for (let i = 0; i < captionRes.parsed.chunks.length; i += SANITY_TX_BATCH_SIZE) {
    const batch = captionRes.parsed.chunks.slice(i, i + SANITY_TX_BATCH_SIZE)
    const tx = sanityWriteClient.transaction()
    for (const chunk of batch) {
      tx.createOrReplace({
        _id: `sermonSegment-${idPrefix}-${String(chunk.segmentIndex).padStart(4, '0')}`,
        _type: 'sermonSegment',
        sermon: {
          _type: 'reference',
          _ref: cleanId,
          ...(isDraft ? { _weak: true } : {}),
        },
        sermonId: cleanId,
        sermonTitle: sermon.title,
        ...(sermon.preacher ? { preacher: sermon.preacher } : {}),
        ...(sermon.series ? { series: sermon.series } : {}),
        ...(sermon.datePreached ? { datePreached: sermon.datePreached } : {}),
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        isPublished: sermon.isPublished !== false,
        segmentIndex: chunk.segmentIndex,
        startSeconds: chunk.startSeconds,
        endSeconds: chunk.endSeconds,
        timestampLabel: chunk.timestampLabel,
        text: chunk.text,
      })
    }
    await tx.commit()
  }

  const extracted = await extractSermonThemes(
    {
      title: sermon.title,
      preacher: sermon.preacher,
      notes: sermon.notes,
      transcriptExcerpt: captionRes.parsed.fullTextPreview,
    },
    preferred
  )
  const aiThemes = buildSanityThemes(extracted.themes)

  const patchSet: Record<string, unknown> = {
    transcriptStatus: 'ready',
    transcriptSource: 'youtube_captions',
    transcriptWordCount: captionRes.parsed.wordCount,
    transcriptUpdatedAt: new Date().toISOString(),
    aiThemes,
  }

  if (
    extracted.topics &&
    extracted.topics.length > 0 &&
    (!sermon.topics ||
      sermon.topics.length === 0 ||
      sermon.topics.every((t) => {
        const lower = t.trim().toLowerCase()
        return lower === 'faith' || lower === 'sermon' || lower === ''
      }))
  ) {
    patchSet.topics = extracted.topics
  }

  if (
    extracted.scriptureReference &&
    (!sermon.scriptureReference || sermon.scriptureReference.trim() === 'Scripture Reference')
  ) {
    patchSet.scriptureReference = extracted.scriptureReference
  }

  await sanityWriteClient.patch(sermon._id).set(patchSet).commit()
  sermon.transcriptStatus = 'ready'
  return 'enriched'
}

async function bumpAiSearchContentChanges() {
  try {
    const existingId = await sanityWriteClient.fetch<string | null>(
      `coalesce(*[_type == "aiSearchConfig" && _id == "aiSearchConfig"][0]._id, *[_type == "aiSearchConfig"][0]._id)`
    )
    const configId = existingId || 'aiSearchConfig'

    if (!existingId) {
      await sanityWriteClient.createIfNotExists({
        ...DEFAULT_AI_SEARCH_CONFIG,
        _id: configId,
        _type: 'aiSearchConfig',
        contentChangesSinceOldestCache: 0,
      })
    }

    await sanityWriteClient
      .patch(configId)
      .setIfMissing({ contentChangesSinceOldestCache: 0 })
      .inc({ contentChangesSinceOldestCache: 1 })
      .set({ lastContentUpdatedAt: new Date().toISOString() })
      .commit()
  } catch (err) {
    console.warn('[runSermonSync] Failed to bump aiSearchConfig change counter:', err)
  } finally {
    invalidatePublicAiConfigCache()
  }
}

/**
 * Main Sermon Sync Engine.
 * Ingests Spotify for Podcasters & YouTube feeds, guarantees that every sermon
 * receives its YouTube video ID and high-resolution thumbnail automatically,
 * and enriches up to 2 recent sermons with YouTube captions & AI themes.
 */
export async function runSermonSync() {
  const spotifyUrl = process.env.SPOTIFY_RSS_URL || DEFAULT_SPOTIFY_RSS_URL
  const youtubeUrl = process.env.YOUTUBE_RSS_URL || DEFAULT_YOUTUBE_RSS_URL

  const results = {
    spotify: { itemsFetched: 0, created: 0, updated: 0, skipped: 0 },
    youtube: { itemsFetched: 0, created: 0, updated: 0, skipped: 0 },
    resolvedFromYouTube: 0,
    captionsEnriched: 0,
  }

  // Fetch all existing sermons from Sanity to allow fast in-memory normalized title matching
  const existingSermons: SanitySermonDoc[] = await sanityWriteClient.fetch(
    `*[_type == "sermonVault"]{
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
      spotifyEmbedId,
      youtubeUrl,
      youtubeVideoId,
      youtubeMusicUrl,
      thumbnailUrl,
      notes,
      isAutoSynced,
      transcriptStatus
    }`
  )

  // -------------------------------------------------------------------------
  // 1. Process YouTube Feed
  // -------------------------------------------------------------------------
  const parsedYouTubeItems: FeedItem[] = []
  if (youtubeUrl) {
    try {
      const res = await fetch(youtubeUrl, { cache: 'no-store' })
      if (res.ok) {
        const xml = await res.text()
        const items = parseFeedXml(xml)
        results.youtube.itemsFetched = items.length
        parsedYouTubeItems.push(...items)

        for (const item of items) {
          const videoId = item.videoId || extractYoutubeId(item.link || item.guid)
          if (!videoId) continue

          const ytUrl = `https://www.youtube.com/watch?v=${videoId}`
          const ytMusicUrl = `https://music.youtube.com/watch?v=${videoId}`
          const ytThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

          // Match by video ID or fuzzy title
          const existing = existingSermons.find(
            (s) => s.youtubeVideoId === videoId || titlesMatch(s.title, item.title)
          )

          if (!existing) {
            const slugCurrent = slugifySermonTitle(item.title)
            const datePreached = item.pubDate
              ? new Date(item.pubDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
            const created = await sanityWriteClient.create({
              _type: 'sermonVault',
              title: item.title,
              slug: { _type: 'slug', current: slugCurrent },
              preacher: item.author || 'ECCF Media',
              series: 'Sermon Series',
              topics: ['Faith', 'Sermon'],
              datePreached,
              scriptureReference: 'Scripture Reference',
              isPublished: true,
              youtubeUrl: ytUrl,
              youtubeVideoId: videoId,
              youtubeMusicUrl: ytMusicUrl,
              thumbnailUrl: ytThumb,
              isAutoSynced: true,
              transcriptStatus: 'waiting',
              transcriptWordCount: 0,
              ...(item.description ? { notes: item.description } : {}),
            })
            existingSermons.push({
              ...(created as unknown as SanitySermonDoc),
              slug: slugCurrent,
              datePreached,
              isPublished: true,
              transcriptStatus: 'waiting',
            })
            results.youtube.created++
          } else if (existing.isAutoSynced !== false) {
            const patchObj: Record<string, unknown> = {
              youtubeUrl: ytUrl,
              youtubeVideoId: videoId,
              youtubeMusicUrl: ytMusicUrl,
              thumbnailUrl: existing.thumbnailUrl || ytThumb,
            }
            if (!existing.slug) {
              const slugCurrent = slugifySermonTitle(item.title, existing._id)
              patchObj.slug = { _type: 'slug', current: slugCurrent }
              existing.slug = slugCurrent
            }
            if (!existing.notes && item.description) {
              patchObj.notes = item.description
              existing.notes = item.description
            }

            await sanityWriteClient.patch(existing._id).set(patchObj).commit()
            existing.youtubeUrl = ytUrl
            existing.youtubeVideoId = videoId
            existing.youtubeMusicUrl = ytMusicUrl
            if (!existing.thumbnailUrl) existing.thumbnailUrl = ytThumb
            results.youtube.updated++
          } else {
            results.youtube.skipped++
          }
        }
      }
    } catch (err) {
      console.error('[runSermonSync] Failed to fetch or process YouTube feed:', err)
    }
  }

  // -------------------------------------------------------------------------
  // 2. Process Spotify Feed
  // -------------------------------------------------------------------------
  if (spotifyUrl) {
    try {
      const res = await fetch(spotifyUrl, { cache: 'no-store' })
      if (res.ok) {
        const xml = await res.text()
        const items = parseFeedXml(xml)
        results.spotify.itemsFetched = items.length

        for (const item of items) {
          const spotifyEmbedId = extractSpotifyId(item.link || item.guid)

          // Match by spotifyEmbedId or title
          const existing = existingSermons.find(
            (s) =>
              (spotifyEmbedId && s.spotifyEmbedId === spotifyEmbedId) ||
              titlesMatch(s.title, item.title)
          )

          // Automatic YouTube Video & Thumbnail Resolution
          let ytVideoId = existing?.youtubeVideoId
          if (!ytVideoId) {
            // First check if any already parsed YouTube item matches
            const matchingYt = parsedYouTubeItems.find((yt) => titlesMatch(yt.title, item.title))
            if (matchingYt?.videoId) {
              ytVideoId = matchingYt.videoId
            } else {
              // Otherwise dynamically search YouTube
              const foundId = await searchYouTubeForSermon(item.title, item.author)
              if (foundId) {
                ytVideoId = foundId
                results.resolvedFromYouTube++
              }
            }
          }

          const ytUrl = ytVideoId ? `https://www.youtube.com/watch?v=${ytVideoId}` : undefined
          const ytMusicUrl = ytVideoId ? `https://music.youtube.com/watch?v=${ytVideoId}` : undefined
          const finalThumb = ytVideoId
            ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`
            : item.thumbnailUrl || undefined

          if (!existing) {
            const slugCurrent = slugifySermonTitle(item.title)
            const datePreached = item.pubDate
              ? new Date(item.pubDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
            const created = await sanityWriteClient.create({
              _type: 'sermonVault',
              title: item.title,
              slug: { _type: 'slug', current: slugCurrent },
              preacher: item.author || 'ECCF Media',
              series: 'Sermon Series',
              topics: ['Faith', 'Sermon'],
              datePreached,
              scriptureReference: 'Scripture Reference',
              isPublished: true,
              spotifyUrl: item.link,
              spotifyEmbedId: spotifyEmbedId || undefined,
              youtubeUrl: ytUrl,
              youtubeVideoId: ytVideoId,
              youtubeMusicUrl: ytMusicUrl,
              thumbnailUrl: finalThumb,
              isAutoSynced: true,
              transcriptStatus: 'waiting',
              transcriptWordCount: 0,
              ...(item.description ? { notes: item.description } : {}),
            })
            existingSermons.push({
              ...(created as unknown as SanitySermonDoc),
              slug: slugCurrent,
              datePreached,
              isPublished: true,
              transcriptStatus: 'waiting',
            })
            results.spotify.created++
          } else if (existing.isAutoSynced !== false) {
            const patchObj: Record<string, unknown> = {
              spotifyUrl: item.link,
              ...(spotifyEmbedId ? { spotifyEmbedId } : {}),
            }

            if (!existing.slug) {
              const slugCurrent = slugifySermonTitle(item.title, existing._id)
              patchObj.slug = { _type: 'slug', current: slugCurrent }
              existing.slug = slugCurrent
            }

            if (!existing.notes && item.description) {
              patchObj.notes = item.description
              existing.notes = item.description
            }

            if (ytVideoId && !existing.youtubeVideoId) {
              patchObj.youtubeVideoId = ytVideoId
              patchObj.youtubeUrl = ytUrl
              patchObj.youtubeMusicUrl = ytMusicUrl
              existing.youtubeVideoId = ytVideoId
              existing.youtubeUrl = ytUrl
              existing.youtubeMusicUrl = ytMusicUrl
            }

            if (!existing.thumbnailUrl && finalThumb) {
              patchObj.thumbnailUrl = finalThumb
              existing.thumbnailUrl = finalThumb
            } else if (ytVideoId && existing.thumbnailUrl?.includes('cloudfront.net')) {
              // Upgrade Spotify low-res podcast image to official YouTube video thumbnail
              patchObj.thumbnailUrl = `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`
              existing.thumbnailUrl = patchObj.thumbnailUrl as string
            }

            await sanityWriteClient.patch(existing._id).set(patchObj).commit()
            results.spotify.updated++
          } else {
            results.spotify.skipped++
          }
        }
      }
    } catch (err) {
      console.error('[runSermonSync] Failed to fetch or process Spotify feed:', err)
    }
  }

  // -------------------------------------------------------------------------
  // 3. Final Sweep: Ensure any remaining sermon lacking a YouTube thumbnail is resolved
  // -------------------------------------------------------------------------
  for (const s of existingSermons) {
    if (!s.youtubeVideoId || !s.thumbnailUrl) {
      const foundId = await searchYouTubeForSermon(s.title, s.preacher)
      if (foundId) {
        const ytThumb = `https://img.youtube.com/vi/${foundId}/hqdefault.jpg`
        const ytWatch = `https://www.youtube.com/watch?v=${foundId}`
        const ytMusic = `https://music.youtube.com/watch?v=${foundId}`
        await sanityWriteClient
          .patch(s._id)
          .set({
            youtubeVideoId: foundId,
            youtubeUrl: ytWatch,
            youtubeMusicUrl: ytMusic,
            thumbnailUrl: ytThumb,
          })
          .commit()
        s.youtubeVideoId = foundId
        s.youtubeUrl = ytWatch
        s.youtubeMusicUrl = ytMusic
        s.thumbnailUrl = ytThumb
        results.resolvedFromYouTube++
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. Bounded Caption & AI Theme Enrichment (max 2 recent sermons <= 10 days old)
  // -------------------------------------------------------------------------
  const captionCandidates = existingSermons
    .filter(
      (s) =>
        Boolean(s.youtubeVideoId || extractYoutubeId(s.youtubeUrl || '')) &&
        s.transcriptStatus !== 'ready' &&
        isWithinRecentDays(s.datePreached, AUTO_CAPTION_RECENT_DAYS)
    )
    .sort((a, b) => (b.datePreached || '').localeCompare(a.datePreached || ''))
    .slice(0, MAX_AUTO_CAPTIONS_PER_SYNC)

  if (captionCandidates.length > 0) {
    const preferred = await getConfiguredProviderPreference()
    for (const candidate of captionCandidates) {
      try {
        const outcome = await withTimeout(
          enrichRecentSermonCaptions(candidate, preferred),
          AUTO_CAPTION_TIMEOUT_MS,
          `caption-enrich:${candidate._id}`
        )
        if (outcome === 'enriched') {
          results.captionsEnriched++
        }
      } catch (err) {
        console.warn(`[runSermonSync] Caption enrichment skipped/timed out for ${candidate._id}:`, err)
      }
    }
  }

  const hasContentMutation =
    results.youtube.created > 0 ||
    results.youtube.updated > 0 ||
    results.spotify.created > 0 ||
    results.spotify.updated > 0 ||
    results.resolvedFromYouTube > 0 ||
    results.captionsEnriched > 0

  if (hasContentMutation) {
    await bumpAiSearchContentChanges()
  }

  // Revalidate public pages
  try {
    revalidatePath('/')
    revalidatePath('/sermons')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/sermons')
  } catch {
    // Revalidation may fail if called outside request context; safe to ignore
  }

  return {
    status: 'success',
    syncedAt: new Date().toISOString(),
    results,
  }
}

// In-memory timestamp to throttle background auto-sync checks
let lastBackgroundSyncTime = 0

/**
 * Triggers a non-blocking background sync if more than 15 minutes have elapsed since the last check.
 * This guarantees that whenever visitors or admins access the site after a new sermon was uploaded
 * to Spotify, the new message is ingested and enriched with its YouTube thumbnail automatically.
 */
export function triggerBackgroundSyncIfNeeded() {
  const now = Date.now()
  if (now - lastBackgroundSyncTime < 15 * 60 * 1000) {
    return
  }
  lastBackgroundSyncTime = now
  // Run asynchronously without awaiting so the current request is not delayed
  runSermonSync().catch((err) => {
    console.error('[triggerBackgroundSyncIfNeeded] Error in background sermon sync:', err)
  })
}
