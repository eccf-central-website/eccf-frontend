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
  startSeconds?: number
): string {
  const segment = encodeURIComponent(sermon.slug || sermon._id)
  if (typeof startSeconds === 'number' && Number.isFinite(startSeconds) && startSeconds > 0) {
    return `/sermons/${segment}?t=${Math.floor(startSeconds)}`
  }
  return `/sermons/${segment}`
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
  startSeconds?: number
): string | null {
  const id = getYoutubeVideoId(sermon)
  if (!id) return null
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  })
  if (typeof startSeconds === 'number' && Number.isFinite(startSeconds) && startSeconds > 0) {
    params.set('start', String(Math.floor(startSeconds)))
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

export function getSpotifyEmbedUrl(
  sermon: { spotifyUrl?: string; spotifyEmbedId?: string } | null | undefined
): string | null {
  if (!sermon) return null
  if (sermon.spotifyEmbedId) {
    return `https://open.spotify.com/embed/episode/${sermon.spotifyEmbedId}`
  }
  if (!sermon.spotifyUrl) return null
  const epMatch = sermon.spotifyUrl.match(/episode\/([a-zA-Z0-9]+)/)
  if (epMatch) {
    return `https://open.spotify.com/embed/episode/${epMatch[1]}`
  }
  const showMatch = sermon.spotifyUrl.match(/show\/([a-zA-Z0-9]+)/)
  if (showMatch) {
    return `https://open.spotify.com/embed/show/${showMatch[1]}`
  }
  return null
}
