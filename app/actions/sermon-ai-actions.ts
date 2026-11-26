'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/dashboard/auth'
import { isMediaLeader, requirePermission } from '@/lib/dashboard/rbac'
import { encrypt } from '@/lib/encryption'
import { SERMON_BY_ID_QUERY } from '@/lib/queries'
import { sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'
import { DEFAULT_AI_SEARCH_CONFIG, mergeAiSearchConfig } from '@/lib/sermon-ai/defaults'
import { invalidatePublicAiConfigCache } from '@/lib/sermon-ai/finder'
import {
  extractSermonThemes,
  getAiSecretStatus,
  invalidateAiCredentialsCache,
} from '@/lib/sermon-ai/provider'
import { clearHotFinderCache } from '@/lib/sermon-ai/rate-limit'
import {
  fetchYoutubeCaptionsForVideo,
  parseCaptionTextToSegments,
  type ParsedTranscriptResult,
} from '@/lib/sermon-ai/vtt'
import {
  getYoutubeVideoId,
  parseDurationToSeconds,
  slugifySermonTitle,
} from '@/lib/sermonUtils'
import type {
  AiProviderPreference,
  AiSearchCacheStats,
  AiSearchConfig,
  AiSearchSecretStatus,
  SermonThemeWeight,
  SermonTranscriptSource,
  SermonTranscriptStatus,
  SermonVault,
} from '@/types'

const MAX_CAPTION_FILE_BYTES = 2 * 1024 * 1024 // 2 MB
const SANITY_TX_BATCH_SIZE = 50
const POLL_MAX_SERMONS = 10
const POLL_TIME_BUDGET_MS = 20_000

const ADMIN_AI_CONFIG_DOC_QUERY = `
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

function isMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.DASHBOARD_DATA_SOURCE === 'mock'
}

function canFallbackToMockInDev(): boolean {
  return process.env.NODE_ENV !== 'production' && !process.env.SANITY_WRITE_TOKEN
}

function getReadClient() {
  return sanityPrivateClient.config().token ? sanityPrivateClient : sanityWriteClient
}

function cleanDocumentId(id: string): string {
  return id.replace(/^drafts\./, '').trim()
}

function sanitizeSegmentIdPrefix(sermonId: string): string {
  return cleanDocumentId(sermonId).replace(/[^a-zA-Z0-9_-]/g, '_')
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

function revalidateSermonRoutes(slug?: string | null) {
  revalidatePath('/dashboard/sermons')
  revalidatePath('/sermons')
  revalidatePath('/')
  if (slug && slug.trim()) {
    revalidatePath(`/sermons/${slug.trim()}`)
  }
}

async function getConfiguredProviderPreference(): Promise<AiProviderPreference> {
  try {
    const row = await getReadClient().fetch<{ providerPreference?: string } | null>(
      ADMIN_AI_CONFIG_DOC_QUERY
    )
    if (
      row?.providerPreference === 'gemini' ||
      row?.providerPreference === 'openai' ||
      row?.providerPreference === 'auto'
    ) {
      return row.providerPreference
    }
  } catch {
    // Default to 'auto' when config cannot be read
  }
  return 'auto'
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
    console.warn('[sermon-ai-actions] Failed to bump aiSearchConfig content change counter:', err)
  } finally {
    invalidatePublicAiConfigCache()
  }
}

async function deleteSermonSegmentsForSermon(sermonId: string): Promise<number> {
  const cleanId = cleanDocumentId(sermonId)
  const segmentIds = await sanityWriteClient.fetch<string[]>(
    `*[_type == "sermonSegment" && (sermonId == $cleanId || sermonId == $rawId || sermon._ref == $cleanId || sermon._ref == $rawId)]._id`,
    { cleanId, rawId: sermonId }
  )

  if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
    return 0
  }

  for (let i = 0; i < segmentIds.length; i += SANITY_TX_BATCH_SIZE) {
    const batch = segmentIds.slice(i, i + SANITY_TX_BATCH_SIZE)
    const tx = sanityWriteClient.transaction()
    for (const segId of batch) {
      tx.delete(segId)
    }
    await tx.commit()
  }

  return segmentIds.length
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

function hasOnlyPlaceholderTopics(topics?: string[]): boolean {
  if (!Array.isArray(topics) || topics.length === 0) return true
  return topics.every((topic) => {
    const lower = topic.trim().toLowerCase()
    return lower === 'faith' || lower === 'sermon' || lower === ''
  })
}

async function replaceSermonSegmentsAndThemes(
  sermon: SermonVault,
  parsed: ParsedTranscriptResult,
  source: SermonTranscriptSource
): Promise<{
  aiThemes: SermonThemeWeight[]
  wordCount: number
  segmentCount: number
}> {
  const cleanId = cleanDocumentId(sermon._id)
  const isDraft = sermon._id.startsWith('drafts.')
  const idPrefix = sanitizeSegmentIdPrefix(sermon._id)
  const durationSeconds = sermon.durationSeconds ?? parseDurationToSeconds(sermon.duration)

  // 1. Remove any stale segments for this sermon before writing fresh segments
  await deleteSermonSegmentsForSermon(sermon._id)

  // 2. Write new sermonSegment documents in batched transactions
  for (let i = 0; i < parsed.chunks.length; i += SANITY_TX_BATCH_SIZE) {
    const batch = parsed.chunks.slice(i, i + SANITY_TX_BATCH_SIZE)
    const tx = sanityWriteClient.transaction()

    for (const chunk of batch) {
      const segDocId = `sermonSegment-${idPrefix}-${String(chunk.segmentIndex).padStart(4, '0')}`
      tx.createOrReplace({
        _id: segDocId,
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

  // 3. Extract AI-weighted themes (with deterministic fallback if no provider key is set)
  const preferred = await getConfiguredProviderPreference()
  const extracted = await extractSermonThemes(
    {
      title: sermon.title,
      preacher: sermon.preacher,
      notes: sermon.notes,
      transcriptExcerpt: parsed.fullTextPreview,
    },
    preferred
  )
  const aiThemes = buildSanityThemes(extracted.themes)

  // 4. Patch parent sermonVault document with transcript status, metrics, and themes
  const patchSet: Record<string, unknown> = {
    transcriptStatus: 'ready',
    transcriptSource: source,
    transcriptWordCount: parsed.wordCount,
    transcriptUpdatedAt: new Date().toISOString(),
    aiThemes,
  }

  if (
    extracted.topics &&
    extracted.topics.length > 0 &&
    hasOnlyPlaceholderTopics(sermon.topics)
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

  // 5. Bump cache staleness counter & revalidate public/dashboard routes
  await bumpAiSearchContentChanges()
  revalidateSermonRoutes(sermon.slug || slugifySermonTitle(sermon.title, cleanId))

  return {
    aiThemes,
    wordCount: parsed.wordCount,
    segmentCount: parsed.chunks.length,
  }
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

/**
 * Fetch and index YouTube captions for a specific sermon.
 */
export async function fetchYoutubeCaptionsForSermonAction(sermonId: string): Promise<{
  success: boolean
  transcriptStatus?: SermonTranscriptStatus
  transcriptSource?: SermonTranscriptSource
  transcriptWordCount?: number
  segmentCount?: number
  aiThemes?: SermonThemeWeight[]
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  const trimmedId = typeof sermonId === 'string' ? sermonId.trim() : ''
  if (!trimmedId) {
    return { success: false, error: 'Sermon ID is required.' }
  }

  if (isMockMode()) {
    const extracted = await extractSermonThemes({
      title: 'Mock ECCF Sermon',
      transcriptExcerpt: 'Trusting God in academic pursuit, prayer, and diligence on campus.',
    })
    const aiThemes = buildSanityThemes(extracted.themes)
    revalidateSermonRoutes()
    return {
      success: true,
      transcriptStatus: 'ready',
      transcriptSource: 'youtube_captions',
      transcriptWordCount: 3840,
      segmentCount: 12,
      aiThemes,
      warning: 'Dev mock mode: Simulated YouTube caption indexing locally.',
    }
  }

  try {
    const sermon = await getReadClient().fetch<SermonVault | null>(SERMON_BY_ID_QUERY, {
      id: trimmedId,
    })
    if (!sermon) {
      return { success: false, error: 'Sermon not found.' }
    }

    const videoId = getYoutubeVideoId(sermon)
    if (!videoId) {
      return {
        success: false,
        error: 'This sermon does not have a valid YouTube video URL or ID.',
      }
    }

    const captionResult = await fetchYoutubeCaptionsForVideo(videoId)
    if (!captionResult.ok) {
      try {
        await sanityWriteClient
          .patch(sermon._id)
          .set({ transcriptStatus: 'unavailable' })
          .commit()
        revalidateSermonRoutes(sermon.slug)
      } catch (patchErr) {
        console.warn('[fetchYoutubeCaptionsForSermonAction] Failed to mark unavailable:', patchErr)
      }

      return {
        success: false,
        transcriptStatus: 'unavailable',
        error: captionResult.reason || 'YouTube captions are not available for this video.',
      }
    }

    const persisted = await replaceSermonSegmentsAndThemes(
      sermon,
      captionResult.parsed,
      'youtube_captions'
    )

    return {
      success: true,
      transcriptStatus: 'ready',
      transcriptSource: 'youtube_captions',
      transcriptWordCount: persisted.wordCount,
      segmentCount: persisted.segmentCount,
      aiThemes: persisted.aiThemes,
    }
  } catch (err) {
    console.error('[fetchYoutubeCaptionsForSermonAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      return {
        success: true,
        transcriptStatus: 'ready',
        transcriptSource: 'youtube_captions',
        transcriptWordCount: 3600,
        segmentCount: 10,
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch YouTube captions.',
    }
  }
}

/**
 * Upload and parse a `.vtt` or `.srt` caption file (max 2 MB) for a sermon.
 */
export async function uploadSermonCaptionFileAction(formData: FormData): Promise<{
  success: boolean
  transcriptStatus?: SermonTranscriptStatus
  transcriptSource?: SermonTranscriptSource
  transcriptWordCount?: number
  segmentCount?: number
  aiThemes?: SermonThemeWeight[]
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (!formData || typeof formData.get !== 'function') {
    return { success: false, error: 'Invalid upload payload.' }
  }

  const rawSermonId = formData.get('sermonId')
  const sermonId = typeof rawSermonId === 'string' ? rawSermonId.trim() : ''
  if (!sermonId) {
    return { success: false, error: 'Sermon ID is required.' }
  }

  const fileEntry = formData.get('file')
  if (
    !fileEntry ||
    typeof fileEntry !== 'object' ||
    typeof (fileEntry as File).text !== 'function' ||
    typeof (fileEntry as File).name !== 'string' ||
    typeof (fileEntry as File).size !== 'number'
  ) {
    return { success: false, error: 'Please select a .vtt or .srt caption file to upload.' }
  }

  const file = fileEntry as File
  if (!/\.(vtt|srt)$/i.test(file.name.trim())) {
    return { success: false, error: 'Only .vtt or .srt caption files are supported.' }
  }

  if (file.size <= 0) {
    return { success: false, error: 'The uploaded caption file is empty.' }
  }

  if (file.size > MAX_CAPTION_FILE_BYTES) {
    return { success: false, error: 'Caption file must be 2 MB or smaller.' }
  }

  let rawText = ''
  try {
    rawText = await file.text()
  } catch {
    return { success: false, error: 'Could not read the uploaded caption file.' }
  }

  const parsed = parseCaptionTextToSegments(rawText)
  if (parsed.chunks.length === 0 || parsed.wordCount === 0) {
    return {
      success: false,
      error: 'No readable caption cues or transcript text found in this file.',
    }
  }

  if (isMockMode()) {
    const extracted = await extractSermonThemes({
      title: 'Uploaded Sermon Transcript',
      transcriptExcerpt: parsed.fullTextPreview,
    })
    const aiThemes = buildSanityThemes(extracted.themes)
    revalidateSermonRoutes()
    return {
      success: true,
      transcriptStatus: 'ready',
      transcriptSource: 'uploaded_vtt',
      transcriptWordCount: parsed.wordCount,
      segmentCount: parsed.chunks.length,
      aiThemes,
      warning: 'Dev mock mode: Parsed caption file locally.',
    }
  }

  try {
    const sermon = await getReadClient().fetch<SermonVault | null>(SERMON_BY_ID_QUERY, {
      id: sermonId,
    })
    if (!sermon) {
      return { success: false, error: 'Sermon not found.' }
    }

    const persisted = await replaceSermonSegmentsAndThemes(sermon, parsed, 'uploaded_vtt')

    return {
      success: true,
      transcriptStatus: 'ready',
      transcriptSource: 'uploaded_vtt',
      transcriptWordCount: persisted.wordCount,
      segmentCount: persisted.segmentCount,
      aiThemes: persisted.aiThemes,
    }
  } catch (err) {
    console.error('[uploadSermonCaptionFileAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      return {
        success: true,
        transcriptStatus: 'ready',
        transcriptSource: 'uploaded_vtt',
        transcriptWordCount: parsed.wordCount,
        segmentCount: parsed.chunks.length,
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to store uploaded captions.',
    }
  }
}

/**
 * Remove stored transcript segments and reset transcript/theme metadata for a sermon.
 */
export async function removeSermonTranscriptAction(sermonId: string): Promise<{
  success: boolean
  transcriptStatus?: SermonTranscriptStatus
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  const trimmedId = typeof sermonId === 'string' ? sermonId.trim() : ''
  if (!trimmedId) {
    return { success: false, error: 'Sermon ID is required.' }
  }

  if (isMockMode()) {
    revalidateSermonRoutes()
    return {
      success: true,
      transcriptStatus: 'waiting',
      warning: 'Dev mock mode: Transcript cleared locally.',
    }
  }

  try {
    const sermon = await getReadClient().fetch<{ _id: string; slug?: string } | null>(
      `*[_type == "sermonVault" && _id == $id][0]{ _id, "slug": slug.current }`,
      { id: trimmedId }
    )

    await deleteSermonSegmentsForSermon(trimmedId)

    await sanityWriteClient
      .patch(trimmedId)
      .set({
        transcriptStatus: 'waiting',
        transcriptWordCount: 0,
      })
      .unset(['transcriptSource', 'transcriptUpdatedAt', 'aiThemes'])
      .commit()

    await bumpAiSearchContentChanges()
    revalidateSermonRoutes(sermon?.slug)

    return {
      success: true,
      transcriptStatus: 'waiting',
    }
  } catch (err) {
    console.error('[removeSermonTranscriptAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      return {
        success: true,
        transcriptStatus: 'waiting',
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove sermon transcript.',
    }
  }
}

/**
 * Poll YouTube captions for up to 10 sermons that have a YouTube video ID and lack a ready transcript.
 */
export async function pollMissingCaptionsAction(): Promise<{
  success: boolean
  checked: number
  updated: number
  unavailable: number
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, checked: 0, updated: 0, unavailable: 0, error: auth.error }
  }

  if (isMockMode()) {
    return {
      success: true,
      checked: 0,
      updated: 0,
      unavailable: 0,
      warning: 'Dev mock mode: Caption polling skipped.',
    }
  }

  try {
    const candidates = await getReadClient().fetch<SermonVault[]>(
      `*[_type == "sermonVault" && defined(youtubeVideoId) && youtubeVideoId != "" && coalesce(transcriptStatus, "waiting") != "ready"] | order(datePreached desc)[0...${POLL_MAX_SERMONS}] {
        _id,
        _type,
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
        youtubeUrl,
        youtubeVideoId,
        notes,
        "transcriptStatus": coalesce(transcriptStatus, "waiting")
      }`
    )

    const sermons = Array.isArray(candidates) ? candidates : []
    let checked = 0
    let updated = 0
    let unavailable = 0
    const startedAt = Date.now()

    for (let i = 0; i < sermons.length; i += 3) {
      if (Date.now() - startedAt > POLL_TIME_BUDGET_MS) {
        break
      }

      const batch = sermons.slice(i, i + 3)
      await Promise.all(
        batch.map(async (sermon) => {
          const videoId = getYoutubeVideoId(sermon)
          if (!videoId) return

          checked += 1
          try {
            const captionResult = await fetchYoutubeCaptionsForVideo(videoId)
            if (captionResult.ok) {
              await replaceSermonSegmentsAndThemes(
                sermon,
                captionResult.parsed,
                'youtube_captions'
              )
              updated += 1
            } else {
              if (sermon.transcriptStatus !== 'unavailable') {
                await sanityWriteClient
                  .patch(sermon._id)
                  .set({ transcriptStatus: 'unavailable' })
                  .commit()
              }
              unavailable += 1
            }
          } catch (itemErr) {
            console.warn(
              `[pollMissingCaptionsAction] Failed polling sermon ${sermon._id}:`,
              itemErr
            )
            unavailable += 1
          }
        })
      )
    }

    if (updated > 0 || unavailable > 0) {
      revalidateSermonRoutes()
    }

    return {
      success: true,
      checked,
      updated,
      unavailable,
    }
  } catch (err) {
    console.error('[pollMissingCaptionsAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      return {
        success: true,
        checked: 0,
        updated: 0,
        unavailable: 0,
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      checked: 0,
      updated: 0,
      unavailable: 0,
      error: err instanceof Error ? err.message : 'Failed to poll missing captions.',
    }
  }
}

/**
 * Validate and persist the public-safe AI Search configuration singleton (`_id: 'aiSearchConfig'`).
 */
export async function updateAiSearchConfigAction(
  input: Partial<AiSearchConfig>
): Promise<{
  success: boolean
  aiConfig?: AiSearchConfig
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Configuration payload is required.' }
  }

  if (input.excerptWords !== undefined) {
    if (
      typeof input.excerptWords !== 'number' ||
      !Number.isFinite(input.excerptWords) ||
      input.excerptWords < 0 ||
      input.excerptWords > 64
    ) {
      return { success: false, error: 'Excerpt word count must be between 0 and 64.' }
    }
  }

  if (input.maxSuggestions !== undefined) {
    if (
      typeof input.maxSuggestions !== 'number' ||
      !Number.isFinite(input.maxSuggestions) ||
      input.maxSuggestions < 1 ||
      input.maxSuggestions > 200
    ) {
      return { success: false, error: 'Maximum suggestions must be between 1 and 200.' }
    }
  }

  if (input.dailyLimit !== undefined) {
    if (
      typeof input.dailyLimit !== 'number' ||
      !Number.isFinite(input.dailyLimit) ||
      input.dailyLimit < 0 ||
      input.dailyLimit > 50_000
    ) {
      return { success: false, error: 'Daily global AI search limit must be 0 or greater (max 50,000).' }
    }
  }

  if (input.hourlySearchLimit !== undefined) {
    if (
      typeof input.hourlySearchLimit !== 'number' ||
      !Number.isFinite(input.hourlySearchLimit) ||
      input.hourlySearchLimit < 1 ||
      input.hourlySearchLimit > 500
    ) {
      return { success: false, error: 'Hourly page search limit must be at least 1 (max 500).' }
    }
  }

  if (input.hourlyChatLimit !== undefined) {
    if (
      typeof input.hourlyChatLimit !== 'number' ||
      !Number.isFinite(input.hourlyChatLimit) ||
      input.hourlyChatLimit < 1 ||
      input.hourlyChatLimit > 500
    ) {
      return { success: false, error: 'Hourly modal search limit must be at least 1 (max 500).' }
    }
  }

  if (
    input.providerPreference !== undefined &&
    input.providerPreference !== 'auto' &&
    input.providerPreference !== 'gemini' &&
    input.providerPreference !== 'openai'
  ) {
    return { success: false, error: 'Invalid AI provider preference.' }
  }

  let existingRaw: Partial<AiSearchConfig> | null = null
  if (!isMockMode()) {
    try {
      existingRaw = await getReadClient().fetch<Partial<AiSearchConfig> | null>(
        ADMIN_AI_CONFIG_DOC_QUERY
      )
    } catch {
      existingRaw = null
    }
  }

  const base = mergeAiSearchConfig(existingRaw)
  const nextMaxSuggestions =
    input.maxSuggestions !== undefined ? Math.round(input.maxSuggestions) : base.maxSuggestions

  let cleanedSuggestions = base.suggestions
  if (input.suggestions !== undefined) {
    if (!Array.isArray(input.suggestions)) {
      return { success: false, error: 'Suggestions must be an array of prompts.' }
    }
    const seen = new Set<string>()
    const nextList: string[] = []
    for (const entry of input.suggestions) {
      if (typeof entry !== 'string') continue
      const trimmed = entry.trim()
      if (!trimmed) continue
      const key = trimmed.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      nextList.push(trimmed)
      if (nextList.length >= nextMaxSuggestions) break
    }
    cleanedSuggestions = nextList
  } else {
    cleanedSuggestions = base.suggestions.slice(0, nextMaxSuggestions)
  }

  const nextHiddenYears =
    input.hiddenYears !== undefined
      ? Array.from(
          new Set(
            (Array.isArray(input.hiddenYears) ? input.hiddenYears : []).filter(
              (yr): yr is number =>
                typeof yr === 'number' && Number.isInteger(yr) && yr >= 1900 && yr <= 2100
            )
          )
        ).sort((a, b) => b - a)
      : base.hiddenYears

  const nextConfig = mergeAiSearchConfig({
    ...base,
    ...input,
    _id: 'aiSearchConfig',
    maxSuggestions: nextMaxSuggestions,
    suggestions: cleanedSuggestions,
    hiddenYears: nextHiddenYears,
    dailyUsageDate: base.dailyUsageDate,
    dailyUsageCount: base.dailyUsageCount,
    lastContentUpdatedAt: base.lastContentUpdatedAt,
    contentChangesSinceOldestCache: base.contentChangesSinceOldestCache,
  })

  if (isMockMode()) {
    invalidatePublicAiConfigCache()
    revalidateSermonRoutes()
    return {
      success: true,
      aiConfig: nextConfig,
      warning: 'Dev mock mode: AI Search configuration validated locally.',
    }
  }

  try {
    const configDoc = {
      _id: 'aiSearchConfig',
      _type: 'aiSearchConfig',
      enabled: nextConfig.enabled,
      showFloatingButton: nextConfig.showFloatingButton,
      buttonLabel: nextConfig.buttonLabel,
      heading: nextConfig.heading,
      subtitle: nextConfig.subtitle,
      placeholder: nextConfig.placeholder,
      greeting: nextConfig.greeting,
      excerptWords: nextConfig.excerptWords,
      maxSuggestions: nextConfig.maxSuggestions,
      suggestions: nextConfig.suggestions,
      dailyLimit: nextConfig.dailyLimit,
      hourlySearchLimit: nextConfig.hourlySearchLimit,
      hourlyChatLimit: nextConfig.hourlyChatLimit,
      hiddenYears: nextConfig.hiddenYears,
      providerPreference: nextConfig.providerPreference,
      dailyUsageCount: nextConfig.dailyUsageCount ?? 0,
      contentChangesSinceOldestCache: nextConfig.contentChangesSinceOldestCache ?? 0,
      ...(nextConfig.dailyUsageDate ? { dailyUsageDate: nextConfig.dailyUsageDate } : {}),
      ...(nextConfig.lastContentUpdatedAt
        ? { lastContentUpdatedAt: nextConfig.lastContentUpdatedAt }
        : {}),
    }

    await sanityWriteClient.createOrReplace(configDoc)
    invalidatePublicAiConfigCache()
    revalidateSermonRoutes()

    return {
      success: true,
      aiConfig: nextConfig,
    }
  } catch (err) {
    console.error('[updateAiSearchConfigAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      return {
        success: true,
        aiConfig: nextConfig,
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save AI Search configuration.',
    }
  }
}

/**
 * Encrypt and store an optional AI provider API key override strictly inside
 * unpublished draft document `drafts.aiSearchSecret`. Plaintext keys are never
 * written unencrypted or returned to any client.
 */
export async function saveAiKeyOverrideAction({
  provider,
  apiKey,
}: {
  provider: 'gemini' | 'openai'
  apiKey: string
}): Promise<{
  success: boolean
  secretStatus?: AiSearchSecretStatus
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (provider !== 'gemini' && provider !== 'openai') {
    return { success: false, error: 'Provider must be either Gemini or OpenAI.' }
  }

  const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : ''
  if (trimmedKey.length < 16 || /\s/.test(trimmedKey)) {
    return {
      success: false,
      error: 'API key must be at least 16 characters with no spaces.',
    }
  }

  let encryptedApiKey = ''
  try {
    encryptedApiKey = encrypt(trimmedKey)
  } catch (encErr) {
    console.error('[saveAiKeyOverrideAction] Encryption failed:', encErr)
    return {
      success: false,
      error: 'Server encryption is not configured properly.',
    }
  }

  if (!encryptedApiKey) {
    return { success: false, error: 'Failed to encrypt API key.' }
  }

  const keyTail = trimmedKey.slice(-4)
  const updatedBy =
    auth.session?.name?.trim() ||
    auth.session?.email?.trim() ||
    auth.session?.id ||
    'Media Leader'
  const updatedAt = new Date().toISOString()

  if (isMockMode()) {
    const baseStatus = await getSafeSecretStatus('auto')
    const hasEnv = baseStatus.hasEnvGemini || baseStatus.hasEnvOpenAI
    return {
      success: true,
      secretStatus: {
        ...baseStatus,
        hasDashboardOverride: true,
        overrideProvider: provider,
        maskedOverrideTail: keyTail,
        overrideUpdatedAt: updatedAt,
        activeProvider: hasEnv ? baseStatus.activeProvider : provider,
        activeSource: hasEnv ? baseStatus.activeSource : 'dashboard_override',
      },
      warning: 'Dev mock mode: Encrypted API key override simulated locally.',
    }
  }

  try {
    await sanityWriteClient.createOrReplace({
      _id: 'drafts.aiSearchSecret',
      _type: 'aiSearchSecret',
      provider,
      encryptedApiKey,
      keyTail,
      updatedBy,
      updatedAt,
    })

    // Ensure no published copy of aiSearchSecret ever exists
    await sanityWriteClient.delete('aiSearchSecret').catch(() => {})

    invalidateAiCredentialsCache()
    const preferred = await getConfiguredProviderPreference()
    const secretStatus = await getSafeSecretStatus(preferred)
    revalidatePath('/dashboard/sermons')

    return {
      success: true,
      secretStatus,
    }
  } catch (err) {
    console.error('[saveAiKeyOverrideAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      const baseStatus = await getSafeSecretStatus('auto')
      return {
        success: true,
        secretStatus: {
          ...baseStatus,
          hasDashboardOverride: true,
          overrideProvider: provider,
          maskedOverrideTail: keyTail,
          overrideUpdatedAt: updatedAt,
        },
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save encrypted AI key override.',
    }
  }
}

/**
 * Remove any stored dashboard AI key override (`drafts.aiSearchSecret` and `aiSearchSecret`).
 */
export async function clearAiKeyOverrideAction(): Promise<{
  success: boolean
  secretStatus?: AiSearchSecretStatus
  error?: string
  warning?: string
}> {
  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  if (isMockMode()) {
    invalidateAiCredentialsCache()
    const secretStatus = await getSafeSecretStatus('auto')
    return {
      success: true,
      secretStatus: {
        ...secretStatus,
        hasDashboardOverride: false,
        overrideProvider: undefined,
        maskedOverrideTail: undefined,
        overrideUpdatedAt: undefined,
      },
      warning: 'Dev mock mode: AI key override cleared locally.',
    }
  }

  try {
    await sanityWriteClient
      .transaction()
      .delete('drafts.aiSearchSecret')
      .delete('aiSearchSecret')
      .commit()

    invalidateAiCredentialsCache()
    const preferred = await getConfiguredProviderPreference()
    const secretStatus = await getSafeSecretStatus(preferred)
    revalidatePath('/dashboard/sermons')

    return {
      success: true,
      secretStatus,
    }
  } catch (err) {
    console.error('[clearAiKeyOverrideAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      const secretStatus = await getSafeSecretStatus('auto')
      return {
        success: true,
        secretStatus,
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to clear AI key override.',
    }
  }
}

/**
 * Purge all persistent `aiSearchCache` documents in Sanity, clear the in-memory hot LRU cache,
 * and reset `contentChangesSinceOldestCache` to 0.
 */
export async function clearAiSearchCacheAction(): Promise<{
  success: boolean
  clearedCount: number
  cacheStats: AiSearchCacheStats
  error?: string
  warning?: string
}> {
  const emptyStats: AiSearchCacheStats = {
    totalEntries: 0,
    totalReuses: 0,
    staleChangeCount: 0,
  }

  const auth = await verifyMediaLeaderAuth()
  if (!auth.ok) {
    return {
      success: false,
      clearedCount: 0,
      cacheStats: emptyStats,
      error: auth.error,
    }
  }

  if (isMockMode()) {
    clearHotFinderCache()
    invalidatePublicAiConfigCache()
    revalidatePath('/dashboard/sermons')
    return {
      success: true,
      clearedCount: 0,
      cacheStats: emptyStats,
      warning: 'Dev mock mode: Hot AI Search cache cleared.',
    }
  }

  try {
    const cacheIds = await sanityWriteClient.fetch<string[]>(
      `*[_type == "aiSearchCache"]._id`
    )
    const ids = Array.isArray(cacheIds) ? cacheIds : []

    for (let i = 0; i < ids.length; i += SANITY_TX_BATCH_SIZE) {
      const batch = ids.slice(i, i + SANITY_TX_BATCH_SIZE)
      const tx = sanityWriteClient.transaction()
      for (const id of batch) {
        tx.delete(id)
      }
      await tx.commit()
    }

    const configId = await sanityWriteClient.fetch<string | null>(
      `coalesce(*[_type == "aiSearchConfig" && _id == "aiSearchConfig"][0]._id, *[_type == "aiSearchConfig"][0]._id)`
    )
    if (configId) {
      await sanityWriteClient
        .patch(configId)
        .set({ contentChangesSinceOldestCache: 0 })
        .commit()
    }

    clearHotFinderCache()
    invalidatePublicAiConfigCache()
    revalidatePath('/dashboard/sermons')

    return {
      success: true,
      clearedCount: ids.length,
      cacheStats: emptyStats,
    }
  } catch (err) {
    console.error('[clearAiSearchCacheAction] Failed:', err)
    if (canFallbackToMockInDev()) {
      clearHotFinderCache()
      return {
        success: true,
        clearedCount: 0,
        cacheStats: emptyStats,
        warning: 'Dev mock mode: SANITY_WRITE_TOKEN is not configured.',
      }
    }
    return {
      success: false,
      clearedCount: 0,
      cacheStats: emptyStats,
      error: err instanceof Error ? err.message : 'Failed to clear AI Search cache.',
    }
  }
}
