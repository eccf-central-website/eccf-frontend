export interface SermonPlayerItem {
  _id: string
  title: string
  preacher: string
  series?: string
  topics?: string[]
  datePreached?: string
  scriptureReference?: string
  duration?: string
  spotifyUrl?: string
  youtubeUrl?: string
  youtubeMusicUrl?: string
  spotifyEmbedId?: string
  youtubeVideoId?: string
  mediaUrl?: string
}

export function getYoutubeVideoId(sermon: { youtubeVideoId?: string; youtubeUrl?: string } | null | undefined): string | null {
  if (!sermon) return null
  if (sermon.youtubeVideoId) return sermon.youtubeVideoId
  if (!sermon.youtubeUrl) return null
  const match = sermon.youtubeUrl.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export function getSpotifyEmbedUrl(sermon: { spotifyUrl?: string; spotifyEmbedId?: string } | null | undefined): string | null {
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

