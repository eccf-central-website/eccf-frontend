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
