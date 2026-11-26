'use server'

import { revalidatePath } from 'next/cache'
import { sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { isMediaLeader, requirePermission } from '@/lib/dashboard/rbac'
import { DEFAULT_AI_SEARCH_CONFIG } from '@/lib/sermon-ai/defaults'
import { invalidatePublicAiConfigCache } from '@/lib/sermon-ai/finder'
import {
  getYoutubeVideoId,
  parseDurationToSeconds,
  slugifySermonTitle,
} from '@/lib/sermonUtils'
import type { SermonVault } from '@/types'

const SANITY_TX_BATCH_SIZE = 50

export interface SermonInput {
  title: string
  preacher: string
  datePreached: string
  scriptureReference: string
  series?: string
  topics?: string[]
  duration?: string
  isPublished?: boolean
  spotifyUrl?: string
  youtubeUrl?: string
  youtubeMusicUrl?: string
  thumbnailUrl?: string
  notes?: string
}

interface ExistingSermonMeta {
  _id: string
  title?: string
  slug?: string
  preacher?: string
  series?: string
  datePreached?: string
  duration?: string
  durationSeconds?: number
  isPublished?: boolean
}

function extractSpotifyEpisodeId(url?: string): string | undefined {
  if (!url) return undefined
  const match = url.match(/episode\/([a-zA-Z0-9]+)/)
  return match ? match[1] : undefined
}

function isMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.DASHBOARD_DATA_SOURCE === 'mock'
}

function getReadClient() {
  return sanityPrivateClient.config().token ? sanityPrivateClient : sanityWriteClient
}

function cleanDocumentId(id: string): string {
  return id.replace(/^drafts\./, '').trim()
}

function revalidateSermonRoutes(slug?: string | null, fallbackId?: string) {
  revalidatePath('/dashboard/sermons')
  revalidatePath('/sermons')
  revalidatePath('/')
  if (slug && slug.trim()) {
    revalidatePath(`/sermons/${slug.trim()}`)
  }
  if (fallbackId && fallbackId.trim() && fallbackId.trim() !== slug?.trim()) {
    revalidatePath(`/sermons/${cleanDocumentId(fallbackId)}`)
  }
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
    console.warn('[sermon-management-actions] Failed to bump aiSearchConfig content change counter:', err)
  } finally {
    invalidatePublicAiConfigCache()
  }
}

async function syncSegmentMetadataForSermon(
  sermonId: string,
  meta: {
    sermonTitle?: string
    preacher?: string
    series?: string
    datePreached?: string
    durationSeconds?: number
    unsetDurationSeconds?: boolean
    unsetSeries?: boolean
    isPublished?: boolean
  }
) {
  const cleanId = cleanDocumentId(sermonId)
  const segmentIds = await sanityWriteClient.fetch<string[]>(
    `*[_type == "sermonSegment" && (sermonId == $cleanId || sermonId == $rawId || sermon._ref == $cleanId || sermon._ref == $rawId)]._id`,
    { cleanId, rawId: sermonId }
  )

  if (!Array.isArray(segmentIds) || segmentIds.length === 0) return

  const setObj: Record<string, unknown> = {}
  const unsetArr: string[] = []

  if (meta.sermonTitle !== undefined) setObj.sermonTitle = meta.sermonTitle
  if (meta.preacher !== undefined) setObj.preacher = meta.preacher
  if (meta.unsetSeries) unsetArr.push('series')
  else if (meta.series !== undefined) setObj.series = meta.series
  if (meta.datePreached !== undefined) setObj.datePreached = meta.datePreached
  if (meta.unsetDurationSeconds) unsetArr.push('durationSeconds')
  else if (meta.durationSeconds !== undefined) setObj.durationSeconds = meta.durationSeconds
  if (meta.isPublished !== undefined) setObj.isPublished = meta.isPublished

  if (Object.keys(setObj).length === 0 && unsetArr.length === 0) return

  for (let i = 0; i < segmentIds.length; i += SANITY_TX_BATCH_SIZE) {
    const batch = segmentIds.slice(i, i + SANITY_TX_BATCH_SIZE)
    const tx = sanityWriteClient.transaction()
    for (const segId of batch) {
      tx.patch(segId, (p) => {
        let next = p
        if (Object.keys(setObj).length > 0) next = next.set(setObj)
        if (unsetArr.length > 0) next = next.unset(unsetArr)
        return next
      })
    }
    await tx.commit()
  }
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
    requirePermission(role, 'sermons:manage', session)
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

  // Extract platform IDs, slug, durationSeconds, and thumbnail
  const slugCurrent = slugifySermonTitle(title)
  const durationTrimmed = input.duration?.trim() || undefined
  const durationSeconds = parseDurationToSeconds(durationTrimmed)
  const isPublished = input.isPublished !== false
  const youtubeVideoId = input.youtubeUrl ? getYoutubeVideoId({ youtubeUrl: input.youtubeUrl }) : undefined
  const spotifyEmbedId = extractSpotifyEpisodeId(input.spotifyUrl)

  let thumbnailUrl = input.thumbnailUrl?.trim() || undefined
  if (!thumbnailUrl && youtubeVideoId) {
    thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
  }

  const baseFields = {
    _type: 'sermonVault' as const,
    title,
    preacher,
    datePreached,
    scriptureReference,
    series: input.series?.trim() || undefined,
    topics: input.topics?.map((t) => t.trim()).filter(Boolean) || [],
    duration: durationTrimmed,
    durationSeconds,
    isPublished,
    spotifyUrl: input.spotifyUrl?.trim() || undefined,
    youtubeUrl: input.youtubeUrl?.trim() || undefined,
    youtubeMusicUrl: input.youtubeMusicUrl?.trim() || undefined,
    spotifyEmbedId: spotifyEmbedId || undefined,
    youtubeVideoId: youtubeVideoId || undefined,
    thumbnailUrl,
    isAutoSynced: false,
    notes: input.notes?.trim() || undefined,
    transcriptStatus: 'waiting' as const,
    transcriptWordCount: 0,
  }

  const sanityDoc = {
    ...baseFields,
    slug: { _type: 'slug', current: slugCurrent },
  }

  const clientSermon = (id: string): SermonVault => ({
    _id: id,
    ...baseFields,
    slug: slugCurrent,
  })

  if (isMockMode()) {
    revalidateSermonRoutes(slugCurrent)
    return {
      success: true,
      sermon: clientSermon(`mock-created-${Date.now()}`),
      warning: 'Dev mock mode: Sermon recorded in local state (DASHBOARD_DATA_SOURCE=mock).',
    }
  }

  try {
    const created = await sanityWriteClient.create(sanityDoc)
    await bumpAiSearchContentChanges()
    revalidateSermonRoutes(slugCurrent, created._id)

    return {
      success: true,
      sermon: clientSermon(created._id),
    }
  } catch (err) {
    console.error('[createSermon] Sanity write failed:', err)

    if (process.env.NODE_ENV !== 'production' && !process.env.SANITY_WRITE_TOKEN) {
      return {
        success: true,
        sermon: clientSermon(`mock-created-${Date.now()}`),
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

  if (isMockMode()) {
    revalidateSermonRoutes(input.title ? slugifySermonTitle(input.title, id) : undefined, id)
    return {
      success: true,
      warning: 'Dev mock mode: Sermon updated locally (DASHBOARD_DATA_SOURCE=mock).',
    }
  }

  try {
    let existing: ExistingSermonMeta | null = null
    try {
      existing = await getReadClient().fetch<ExistingSermonMeta | null>(
        `*[_type == "sermonVault" && _id == $id][0]{
          _id,
          title,
          "slug": slug.current,
          preacher,
          series,
          datePreached,
          duration,
          durationSeconds,
          isPublished
        }`,
        { id }
      )
    } catch {
      existing = null
    }

    const patch = sanityWriteClient.patch(id)
    const setObj: Record<string, unknown> = {}
    const unsetArr: string[] = []

    if (input.title !== undefined) setObj.title = input.title.trim()
    if (input.preacher !== undefined) setObj.preacher = input.preacher.trim()
    if (input.datePreached !== undefined) setObj.datePreached = input.datePreached
    if (input.scriptureReference !== undefined) setObj.scriptureReference = input.scriptureReference.trim()
    if (input.isPublished !== undefined) setObj.isPublished = Boolean(input.isPublished)

    let effectiveSlug = existing?.slug?.trim() || undefined
    if (!effectiveSlug) {
      const slugTitle = input.title?.trim() || existing?.title?.trim()
      if (slugTitle) {
        effectiveSlug = slugifySermonTitle(slugTitle, id)
        setObj.slug = { _type: 'slug', current: effectiveSlug }
      }
    }

    if (input.series !== undefined) {
      if (input.series.trim()) setObj.series = input.series.trim()
      else unsetArr.push('series')
    }

    if (input.topics !== undefined) {
      setObj.topics = input.topics.map((t) => t.trim()).filter(Boolean)
    }

    let segmentDurationSeconds: number | undefined
    let unsetDurationSeconds = false
    if (input.duration !== undefined) {
      if (input.duration.trim()) {
        const trimmedDur = input.duration.trim()
        setObj.duration = trimmedDur
        const parsedSecs = parseDurationToSeconds(trimmedDur)
        if (parsedSecs !== undefined) {
          setObj.durationSeconds = parsedSecs
          segmentDurationSeconds = parsedSecs
        } else {
          unsetArr.push('durationSeconds')
          unsetDurationSeconds = true
        }
      } else {
        unsetArr.push('duration', 'durationSeconds')
        unsetDurationSeconds = true
      }
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

    const hasChanges = Object.keys(setObj).length > 0 || unsetArr.length > 0
    if (Object.keys(setObj).length > 0) patch.set(setObj)
    if (unsetArr.length > 0) patch.unset(unsetArr)

    await patch.commit()

    if (hasChanges) {
      await syncSegmentMetadataForSermon(id, {
        sermonTitle: input.title !== undefined ? input.title.trim() : undefined,
        preacher: input.preacher !== undefined ? input.preacher.trim() : undefined,
        series: input.series !== undefined && input.series.trim() ? input.series.trim() : undefined,
        unsetSeries: input.series !== undefined && !input.series.trim(),
        datePreached: input.datePreached !== undefined ? input.datePreached : undefined,
        durationSeconds: segmentDurationSeconds,
        unsetDurationSeconds,
        isPublished: input.isPublished !== undefined ? Boolean(input.isPublished) : undefined,
      }).catch((segErr) => {
        console.warn('[updateSermon] Failed to sync child segment metadata:', segErr)
      })

      await bumpAiSearchContentChanges()
    }

    revalidateSermonRoutes(effectiveSlug, id)

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
 * Delete a sermon vault record and any child `sermonSegment` documents.
 */
export async function deleteSermon(id: string): Promise<{ success: boolean; error?: string; warning?: string }> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (!id) {
    return { success: false, error: 'Sermon ID is required for deletion.' }
  }

  if (isMockMode()) {
    revalidateSermonRoutes(undefined, id)
    return {
      success: true,
      warning: 'Dev mock mode: Sermon deleted locally (DASHBOARD_DATA_SOURCE=mock).',
    }
  }

  try {
    const cleanId = cleanDocumentId(id)
    let sermonSlug: string | undefined

    try {
      const existing = await getReadClient().fetch<{ slug?: string } | null>(
        `*[_type == "sermonVault" && _id == $id][0]{ "slug": slug.current }`,
        { id }
      )
      sermonSlug = existing?.slug
    } catch {
      sermonSlug = undefined
    }

    const segmentIds = await sanityWriteClient.fetch<string[]>(
      `*[_type == "sermonSegment" && (sermonId == $cleanId || sermonId == $rawId || sermon._ref == $cleanId || sermon._ref == $rawId)]._id`,
      { cleanId, rawId: id }
    )

    if (Array.isArray(segmentIds) && segmentIds.length > 0) {
      for (let i = 0; i < segmentIds.length; i += SANITY_TX_BATCH_SIZE) {
        const batch = segmentIds.slice(i, i + SANITY_TX_BATCH_SIZE)
        const tx = sanityWriteClient.transaction()
        for (const segId of batch) {
          tx.delete(segId)
        }
        await tx.commit()
      }
    }

    await sanityWriteClient.delete(id)
    await bumpAiSearchContentChanges()
    revalidateSermonRoutes(sermonSlug, id)

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
