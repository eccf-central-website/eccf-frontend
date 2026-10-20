'use server'

import { revalidatePath } from 'next/cache'
import { sanityWriteClient } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { isMediaLeader, requirePermission } from '@/lib/dashboard/rbac'
import { getYoutubeVideoId } from '@/lib/sermonUtils'
import type { SermonVault } from '@/types'

export interface SermonInput {
  title: string
  preacher: string
  datePreached: string
  scriptureReference: string
  series?: string
  topics?: string[]
  mediaUrl?: string
  duration?: string
  spotifyUrl?: string
  youtubeUrl?: string
  youtubeMusicUrl?: string
  thumbnailUrl?: string
  notes?: string
}

function extractSpotifyEpisodeId(url?: string): string | undefined {
  if (!url) return undefined
  const match = url.match(/episode\/([a-zA-Z0-9]+)/)
  return match ? match[1] : undefined
}

async function verifyMediaLeaderAuth() {
  const session = await getSession()
  if (!session && process.env.NODE_ENV === 'production') {
    return { ok: false, error: 'Unauthorized: Authentication required.' } as const
  }

  const role = session?.role ?? 'admin'

  if (session && !isMediaLeader(session) && process.env.NODE_ENV === 'production') {
    return { ok: false, error: 'Permission denied: Media Team leaders only.' } as const
  }

  try {
    requirePermission(role, 'sermons:manage')
  } catch (e) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: (e as Error).message } as const
    }
  }

  return { ok: true, session } as const
}

/**
 * Create a new sermon vault record.
 */
export async function createSermon(input: SermonInput): Promise<{
  success: boolean
  sermon?: SermonVault
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  // Validation
  const title = input.title?.trim()
  const preacher = input.preacher?.trim()
  const datePreached = input.datePreached?.trim()
  const scriptureReference = input.scriptureReference?.trim()

  if (!title || title.length < 3) {
    return { success: false, error: 'Sermon title is required (at least 3 characters).' }
  }
  if (!preacher) {
    return { success: false, error: 'Preacher name is required.' }
  }
  if (!datePreached) {
    return { success: false, error: 'Date preached is required.' }
  }
  if (!scriptureReference) {
    return { success: false, error: 'Scripture reference is required (e.g. Romans 8:28).' }
  }

  // Extract platform IDs and thumbnail
  const youtubeVideoId = input.youtubeUrl ? getYoutubeVideoId({ youtubeUrl: input.youtubeUrl }) : undefined
  const spotifyEmbedId = extractSpotifyEpisodeId(input.spotifyUrl)

  let thumbnailUrl = input.thumbnailUrl?.trim() || undefined
  if (!thumbnailUrl && youtubeVideoId) {
    thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
  }

  const doc = {
    _type: 'sermonVault',
    title,
    preacher,
    datePreached,
    scriptureReference,
    series: input.series?.trim() || undefined,
    topics: input.topics?.map((t) => t.trim()).filter(Boolean) || [],
    mediaUrl: input.mediaUrl?.trim() || undefined,
    duration: input.duration?.trim() || undefined,
    spotifyUrl: input.spotifyUrl?.trim() || undefined,
    youtubeUrl: input.youtubeUrl?.trim() || undefined,
    youtubeMusicUrl: input.youtubeMusicUrl?.trim() || undefined,
    spotifyEmbedId: spotifyEmbedId || undefined,
    youtubeVideoId: youtubeVideoId || undefined,
    thumbnailUrl,
    isAutoSynced: false,
    notes: input.notes?.trim() || undefined,
  }

  try {
    const created = await sanityWriteClient.create(doc)
    revalidatePath('/dashboard/sermons')
    revalidatePath('/sermons')
    revalidatePath('/')

    return {
      success: true,
      sermon: {
        _id: created._id,
        ...doc,
      } as SermonVault,
    }
  } catch (err) {
    console.error('[createSermon] Sanity write failed:', err)

    if (process.env.NODE_ENV !== 'production' && !process.env.SANITY_WRITE_TOKEN) {
      return {
        success: true,
        sermon: {
          _id: `mock-created-${Date.now()}`,
          ...doc,
        } as SermonVault,
        warning: 'Dev mock mode: Sermon recorded in local state (SANITY_WRITE_TOKEN not set).',
      }
    }

    return {
      success: false,
      error: (err as Error).message || 'Failed to save sermon in database.',
    }
  }
}

/**
 * Update an existing sermon vault record.
 */
export async function updateSermon(
  id: string,
  input: Partial<SermonInput>
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (!id) {
    return { success: false, error: 'Sermon ID is required for update.' }
  }

  if (input.title !== undefined && input.title.trim().length < 3) {
    return { success: false, error: 'Sermon title must be at least 3 characters.' }
  }

  try {
    const patch = sanityWriteClient.patch(id)
    const setObj: Record<string, unknown> = {}
    const unsetArr: string[] = []

    if (input.title !== undefined) setObj.title = input.title.trim()
    if (input.preacher !== undefined) setObj.preacher = input.preacher.trim()
    if (input.datePreached !== undefined) setObj.datePreached = input.datePreached
    if (input.scriptureReference !== undefined) setObj.scriptureReference = input.scriptureReference.trim()

    if (input.series !== undefined) {
      if (input.series.trim()) setObj.series = input.series.trim()
      else unsetArr.push('series')
    }

    if (input.topics !== undefined) {
      setObj.topics = input.topics.map((t) => t.trim()).filter(Boolean)
    }

    if (input.mediaUrl !== undefined) {
      if (input.mediaUrl.trim()) setObj.mediaUrl = input.mediaUrl.trim()
      else unsetArr.push('mediaUrl')
    }

    if (input.duration !== undefined) {
      if (input.duration.trim()) setObj.duration = input.duration.trim()
      else unsetArr.push('duration')
    }

    if (input.spotifyUrl !== undefined) {
      if (input.spotifyUrl.trim()) {
        setObj.spotifyUrl = input.spotifyUrl.trim()
        const epId = extractSpotifyEpisodeId(input.spotifyUrl.trim())
        if (epId) setObj.spotifyEmbedId = epId
      } else {
        unsetArr.push('spotifyUrl', 'spotifyEmbedId')
      }
    }

    if (input.youtubeUrl !== undefined) {
      if (input.youtubeUrl.trim()) {
        setObj.youtubeUrl = input.youtubeUrl.trim()
        const ytid = getYoutubeVideoId({ youtubeUrl: input.youtubeUrl.trim() })
        if (ytid) {
          setObj.youtubeVideoId = ytid
          if (!input.thumbnailUrl) {
            setObj.thumbnailUrl = `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`
          }
        }
      } else {
        unsetArr.push('youtubeUrl', 'youtubeVideoId')
      }
    }

    if (input.youtubeMusicUrl !== undefined) {
      if (input.youtubeMusicUrl.trim()) setObj.youtubeMusicUrl = input.youtubeMusicUrl.trim()
      else unsetArr.push('youtubeMusicUrl')
    }

    if (input.thumbnailUrl !== undefined) {
      if (input.thumbnailUrl.trim()) setObj.thumbnailUrl = input.thumbnailUrl.trim()
      else unsetArr.push('thumbnailUrl')
    }

    if (input.notes !== undefined) {
      if (input.notes.trim()) setObj.notes = input.notes.trim()
      else unsetArr.push('notes')
    }

    if (Object.keys(setObj).length > 0) patch.set(setObj)
    if (unsetArr.length > 0) patch.unset(unsetArr)

    await patch.commit()
    revalidatePath('/dashboard/sermons')
    revalidatePath('/sermons')
    revalidatePath('/')

    return { success: true }
  } catch (err) {
    console.error('[updateSermon] Sanity patch failed:', err)

    if (process.env.NODE_ENV !== 'production' && !process.env.SANITY_WRITE_TOKEN) {
      return {
        success: true,
        warning: 'Dev mock mode: Sermon updated locally (SANITY_WRITE_TOKEN not set).',
      }
    }

    return {
      success: false,
      error: (err as Error).message || 'Failed to update sermon in database.',
    }
  }
}

/**
 * Delete a sermon vault record.
 */
export async function deleteSermon(id: string): Promise<{ success: boolean; error?: string; warning?: string }> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (!id) {
    return { success: false, error: 'Sermon ID is required for deletion.' }
  }

  try {
    await sanityWriteClient.delete(id)
    revalidatePath('/dashboard/sermons')
    revalidatePath('/sermons')
    revalidatePath('/')

    return { success: true }
  } catch (err) {
    console.error('[deleteSermon] Sanity delete failed:', err)

    if (process.env.NODE_ENV !== 'production' && !process.env.SANITY_WRITE_TOKEN) {
      return {
        success: true,
        warning: 'Dev mock mode: Sermon deleted locally (SANITY_WRITE_TOKEN not set).',
      }
    }

    return {
      success: false,
      error: (err as Error).message || 'Failed to delete sermon from database.',
    }
  }
}
