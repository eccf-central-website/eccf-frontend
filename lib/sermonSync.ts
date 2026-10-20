import { revalidatePath } from 'next/cache'
import { sanityWriteClient } from '@/lib/sanity'

export const DEFAULT_SPOTIFY_RSS_URL = 'https://anchor.fm/s/f24b9b94/podcast/rss'
export const DEFAULT_YOUTUBE_RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCMaqmdr3Wrvx5rLWUlAsChw'

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
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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

    const rawTitle = titleMatch ? titleMatch[1].trim() : ''
    const title = decodeHtmlEntities(rawTitle)

    if (title) {
      items.push({
        type: 'podcast',
        title,
        link: linkMatch ? linkMatch[1].trim() : '',
        guid: guidMatch ? guidMatch[1].trim() : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
        author: authorMatch ? decodeHtmlEntities(authorMatch[1].trim()) : '',
        thumbnailUrl: imageMatch ? imageMatch[1].trim() : '',
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
 * Automatically searches YouTube for a sermon from ECCF to retrieve its video ID.
 * Bypasses cookie consent dialogues and extracts the videoId from public YouTube results.
 */
export async function searchYouTubeForSermon(title: string): Promise<string | null> {
  // First check curated reference catalogue
  const known = KNOWN_YOUTUBE_SERMONS.find((k) => titlesMatch(k.title, title))
  if (known) {
    return known.youtubeVideoId
  }

  try {
    const cleanTitle = title
      .replace(/['"“”‘’]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const query = `ESUI Christian Campus Fellowship ${cleanTitle}`
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: 'SOCS=CAESEwgDEgk2OTU3NTg3MDRaAmVuIAEaBgiA_LyaBg;',
      },
      cache: 'no-store',
    })

    if (!res.ok) return null
    const html = await res.text()
    const matches: string[] = []
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1])
    }
    return matches.length > 0 ? matches[0] : null
  } catch {
    return null
  }
}

interface SanitySermonDoc {
  _id: string
  title: string
  preacher?: string
  series?: string
  datePreached?: string
  spotifyUrl?: string
  spotifyEmbedId?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  youtubeMusicUrl?: string
  thumbnailUrl?: string
  isAutoSynced?: boolean
}

/**
 * Main Sermon Sync Engine.
 * Ingests Spotify for Podcasters & YouTube feeds, and guarantees that every sermon
 * receives its YouTube video ID and high-resolution thumbnail automatically.
 */
export async function runSermonSync() {
  const spotifyUrl = process.env.SPOTIFY_RSS_URL || DEFAULT_SPOTIFY_RSS_URL
  const youtubeUrl = process.env.YOUTUBE_RSS_URL || DEFAULT_YOUTUBE_RSS_URL

  const results = {
    spotify: { itemsFetched: 0, created: 0, updated: 0, skipped: 0 },
    youtube: { itemsFetched: 0, created: 0, updated: 0, skipped: 0 },
    resolvedFromYouTube: 0,
  }

  // Fetch all existing sermons from Sanity to allow fast in-memory normalized title matching
  const existingSermons: SanitySermonDoc[] = await sanityWriteClient.fetch(
    `*[_type == "sermonVault"]{
      _id,
      title,
      preacher,
      series,
      datePreached,
      spotifyUrl,
      spotifyEmbedId,
      youtubeUrl,
      youtubeVideoId,
      youtubeMusicUrl,
      thumbnailUrl,
      isAutoSynced
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
            const created = await sanityWriteClient.create({
              _type: 'sermonVault',
              title: item.title,
              preacher: item.author || 'ECCF Media',
              series: 'Sermon Series',
              topics: ['Faith', 'Sermon'],
              datePreached: item.pubDate
                ? new Date(item.pubDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              scriptureReference: 'Scripture Reference',
              youtubeUrl: ytUrl,
              youtubeVideoId: videoId,
              youtubeMusicUrl: ytMusicUrl,
              thumbnailUrl: ytThumb,
              isAutoSynced: true,
            })
            existingSermons.push(created as unknown as SanitySermonDoc)
            results.youtube.created++
          } else if (existing.isAutoSynced !== false) {
            await sanityWriteClient
              .patch(existing._id)
              .set({
                youtubeUrl: ytUrl,
                youtubeVideoId: videoId,
                youtubeMusicUrl: ytMusicUrl,
                thumbnailUrl: existing.thumbnailUrl || ytThumb,
              })
              .commit()
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
              const foundId = await searchYouTubeForSermon(item.title)
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
            const created = await sanityWriteClient.create({
              _type: 'sermonVault',
              title: item.title,
              preacher: item.author || 'ECCF Media',
              series: 'Sermon Series',
              topics: ['Faith', 'Sermon'],
              datePreached: item.pubDate
                ? new Date(item.pubDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              scriptureReference: 'Scripture Reference',
              spotifyUrl: item.link,
              spotifyEmbedId: spotifyEmbedId || undefined,
              youtubeUrl: ytUrl,
              youtubeVideoId: ytVideoId,
              youtubeMusicUrl: ytMusicUrl,
              thumbnailUrl: finalThumb,
              isAutoSynced: true,
            })
            existingSermons.push(created as unknown as SanitySermonDoc)
            results.spotify.created++
          } else if (existing.isAutoSynced !== false) {
            const patchObj: Record<string, unknown> = {
              spotifyUrl: item.link,
              ...(spotifyEmbedId ? { spotifyEmbedId } : {}),
            }

            if (ytVideoId && !existing.youtubeVideoId) {
              patchObj.youtubeVideoId = ytVideoId
              patchObj.youtubeUrl = ytUrl
              patchObj.youtubeMusicUrl = ytMusicUrl
            }

            if (!existing.thumbnailUrl && finalThumb) {
              patchObj.thumbnailUrl = finalThumb
            } else if (ytVideoId && existing.thumbnailUrl?.includes('cloudfront.net')) {
              // Upgrade Spotify low-res podcast image to official YouTube video thumbnail
              patchObj.thumbnailUrl = `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`
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
      const foundId = await searchYouTubeForSermon(s.title)
      if (foundId) {
        const ytThumb = `https://img.youtube.com/vi/${foundId}/hqdefault.jpg`
        await sanityWriteClient
          .patch(s._id)
          .set({
            youtubeVideoId: foundId,
            youtubeUrl: `https://www.youtube.com/watch?v=${foundId}`,
            youtubeMusicUrl: `https://music.youtube.com/watch?v=${foundId}`,
            thumbnailUrl: ytThumb,
          })
          .commit()
        results.resolvedFromYouTube++
      }
    }
  }

  // Revalidate public pages
  try {
    revalidatePath('/')
    revalidatePath('/sermons')
    revalidatePath('/dashboard')
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
