export interface SermonPlayerItem {
  _id: string
  title: string
  slug?: string
  preacher: string
  series?: string
  topics?: string[]
  datePreached?: string
  scriptureReference?: string
  duration?: string
  durationSeconds?: number
  isPublished?: boolean
  spotifyUrl?: string
  youtubeUrl?: string
  youtubeMusicUrl?: string
  spotifyEmbedId?: string
  youtubeVideoId?: string
  thumbnailUrl?: string
  notes?: string
  isAutoSynced?: boolean
}

export function slugifySermonTitle(title: string, fallbackId?: string): string {
  const base = (title || '')
    .toLowerCase()
    .replace(/['’"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 88)
  if (base.length >= 3) return base
  return fallbackId || 'sermon'
}

export function getSermonDetailPath(
  sermon: { _id: string; slug?: string | null },
  startSeconds?: number,
  autoplay?: boolean
): string {
  const segment = encodeURIComponent(sermon.slug || sermon._id)
  const params = new URLSearchParams()
  if (typeof startSeconds === 'number' && Number.isFinite(startSeconds) && startSeconds > 0) {
    params.set('t', String(Math.floor(startSeconds)))
  }
  if (autoplay) {
    params.set('autoplay', '1')
  }
  const qs = params.toString()
  return qs ? `/sermons/${segment}?${qs}` : `/sermons/${segment}`
}

export function withSermonAutoplay(url: string): string {
  if (!url) return url
  if (/[?&]autoplay=/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}autoplay=1`
}

export function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

export function parseDurationToSeconds(duration?: string | null): number | undefined {
  if (!duration || typeof duration !== 'string') return undefined
  const trimmed = duration.trim().toLowerCase()
  if (!trimmed) return undefined

  // Support MM:SS or HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const parts = trimmed.split(':').map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  let total = 0
  const hrMatch = trimmed.match(/(\d+)\s*(?:hr|hrs|hour|hours|h)\b/)
  const minMatch = trimmed.match(/(\d+)\s*(?:min|mins|minute|minutes|m)\b/)
  const secMatch = trimmed.match(/(\d+)\s*(?:sec|secs|second|seconds|s)\b/)
  if (hrMatch) total += Number(hrMatch[1]) * 3600
  if (minMatch) total += Number(minMatch[1]) * 60
  if (secMatch) total += Number(secMatch[1])
  if (total > 0) return total

  const bareMin = trimmed.match(/^(\d+)$/)
  if (bareMin) return Number(bareMin[1]) * 60
  return undefined
}

export function getYoutubeVideoId(
  sermon: { youtubeVideoId?: string; youtubeUrl?: string } | null | undefined
): string | null {
  if (!sermon) return null
  if (sermon.youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(sermon.youtubeVideoId)) {
    return sermon.youtubeVideoId
  }
  if (!sermon.youtubeUrl) return null
  const match = sermon.youtubeUrl.match(
    /(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

export function getYoutubeEmbedUrl(
  sermon: { youtubeVideoId?: string; youtubeUrl?: string } | null | undefined,
  startSeconds?: number,
  autoplay?: boolean
): string | null {
  const id = getYoutubeVideoId(sermon)
  if (!id) return null
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  })
  const hasStart =
    typeof startSeconds === 'number' && Number.isFinite(startSeconds) && startSeconds > 0
  if (hasStart) {
    params.set('start', String(Math.floor(startSeconds)))
  }
  if (autoplay || hasStart) {
    params.set('autoplay', '1')
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}

export function getSermonThumbnailUrl(
  sermon:
    | {
        thumbnailUrl?: string
        youtubeVideoId?: string
        youtubeUrl?: string
      }
    | null
    | undefined
): string | null {
  if (!sermon) return null
  const ytid = getYoutubeVideoId(sermon)
  if (ytid) {
    return `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`
  }
  if (sermon.thumbnailUrl) {
    return sermon.thumbnailUrl
  }
  return null
}

/**
 * Matches domains configured in `next.config.mjs` `images.remotePatterns` so
 * `<Image>` can safely fall back to `unoptimized` for custom external URLs.
 */
export function isOptimizableSermonImageUrl(src?: string | null): boolean {
  if (!src) return false
  if (src.startsWith('/')) return true
  try {
    const parsed = new URL(src)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return (
      host === 'cdn.sanity.io' ||
      host === 'img.youtube.com' ||
      host === 'i.ytimg.com' ||
      host.endsWith('.ytimg.com') ||
      host === 'd3t3ozftmdmh3i.cloudfront.net'
    )
  } catch {
    return false
  }
}

const OPEN_SPOTIFY_ID_REGEX = /^[a-zA-Z0-9]{22}$/

/**
 * Extracts a strict 22-character Base62 Spotify episode ID from open.spotify.com URLs.
 * Ignores Anchor / Spotify for Creators slugged episode URLs, which cannot be embedded on open.spotify.com.
 */
export function extractSpotifyEpisodeId(urlStr?: string | null): string | undefined {
  if (!urlStr || typeof urlStr !== 'string') return undefined
  const trimmed = urlStr.trim()
  if (OPEN_SPOTIFY_ID_REGEX.test(trimmed)) return trimmed
  const match = trimmed.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?episode\/([a-zA-Z0-9]{22})/i)
  return match ? match[1] : undefined
}

export function getSpotifyEmbedUrl(
  sermon: { spotifyUrl?: string; spotifyEmbedId?: string } | null | undefined
): string | null {
  if (!sermon) return null

  const rawUrl = sermon.spotifyUrl?.trim()
  if (rawUrl) {
    // Anchor / Podcasters / Creators for Spotify episode URLs use creators.spotify.com embeds
    const creatorsMatch = rawUrl.match(
      /^https?:\/\/(?:podcasters\.spotify\.com|creators\.spotify\.com|anchor\.fm)\/pod\/(?:show|profile)\/([a-zA-Z0-9_-]+)\/(?:embed\/)?episodes\/([a-zA-Z0-9_-]+)/i
    )
    if (creatorsMatch) {
      return `https://creators.spotify.com/pod/profile/${creatorsMatch[1]}/embed/episodes/${creatorsMatch[2]}`
    }

    const openEpisodeId = extractSpotifyEpisodeId(rawUrl)
    if (openEpisodeId) {
      return `https://open.spotify.com/embed/episode/${openEpisodeId}`
    }

    const openShowMatch = rawUrl.match(
      /open\.spotify\.com\/(?:intl-[a-z-]+\/)?show\/([a-zA-Z0-9]{22})/i
    )
    if (openShowMatch) {
      return `https://open.spotify.com/embed/show/${openShowMatch[1]}`
    }
  }

  const embedId = sermon.spotifyEmbedId?.trim()
  if (embedId && OPEN_SPOTIFY_ID_REGEX.test(embedId)) {
    return `https://open.spotify.com/embed/episode/${embedId}`
  }

  return null
}

export interface TopicFilterOption {
  key: string
  label: string
  count: number
}

/**
 * Deduplicates sermon topic tags case-insensitively and sorts by sermon frequency
 * so duplicate casings (e.g. "Academics" / "academics") collapse to one clean pill.
 */
export function buildTopicFilterOptions(
  sermons: Array<{ topics?: string[] | null }>
): TopicFilterOption[] {
  const byKey = new Map<string, TopicFilterOption>()
  for (const sermon of sermons) {
    const seenInSermon = new Set<string>()
    for (const raw of sermon.topics || []) {
      const trimmed = typeof raw === 'string' ? raw.trim() : ''
      if (!trimmed) continue
      const key = trimmed.toLowerCase()
      if (seenInSermon.has(key)) continue
      seenInSermon.add(key)

      const existing = byKey.get(key)
      if (existing) {
        existing.count += 1
        if (!/[A-Z]/.test(existing.label) && /[A-Z]/.test(trimmed)) {
          existing.label = trimmed
        }
      } else {
        byKey.set(key, { key, label: trimmed, count: 1 })
      }
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  )
}
