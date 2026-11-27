import { formatTimestamp } from '@/lib/sermonUtils'

export interface ParsedTranscriptChunk {
  segmentIndex: number
  startSeconds: number
  endSeconds: number
  timestampLabel: string
  text: string
  wordCount: number
}

export interface ParsedTranscriptResult {
  wordCount: number
  chunks: ParsedTranscriptChunk[]
  fullTextPreview: string
}

interface RawCue {
  startSeconds: number
  endSeconds: number
  lines: string[]
}

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/
const CUE_TIMESTAMP_REGEX =
  /^(?:(\d{1,3}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?\s*-->\s*(?:(\d{1,3}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?(?:\s+.*)?$/

const TARGET_WORDS_PER_SEGMENT = 300
const HARD_MAX_WORDS_PER_SEGMENT = 340
const MIN_WORDS_FOR_TIME_SPLIT = 80
const FULL_TEXT_PREVIEW_MAX_CHARS = 3500

function decodeHtmlEntitiesOnce(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    })
}

function decodeHtmlEntities(input: string): string {
  if (!input) return ''
  // Decode up to 2 passes to handle double-encoded YouTube timedtext entities (e.g. &amp;#39;)
  const pass1 = decodeHtmlEntitiesOnce(input)
  return pass1.includes('&') ? decodeHtmlEntitiesOnce(pass1) : pass1
}

function cleanCueLine(line: string): string {
  const withoutTags = line
    // Remove WebVTT inline timestamps like <00:01:23.450>
    .replace(/<\d{1,3}:\d{2}(?::\d{2})?[.,]\d{1,3}>/g, ' ')
    // Remove HTML/VTT/XML formatting tags (<c>, <i>, <v Speaker>, <font ...>, etc.)
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
    // Remove ASS/SSA style overrides like {\an8}
    .replace(/\{\\[^}]*\}/g, ' ')
  return decodeHtmlEntities(withoutTags)
    // Strip YouTube automatic speaker-turn markers (e.g. ">> He made...")
    .replace(/(?:^|\s)>>+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTimestampParts(
  hours: string | undefined,
  minutes: string,
  seconds: string,
  millis: string | undefined
): number {
  const h = hours ? Number(hours) : 0
  const m = Number(minutes)
  const s = Number(seconds)
  const ms = millis ? Number(millis.padEnd(3, '0')) / 1000 : 0
  return Math.max(0, h * 3600 + m * 60 + s + ms)
}

function normalizeWordForCompare(word: string): string {
  return word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

function extractXmlCues(normalized: string): RawCue[] {
  const cues: RawCue[] = []

  // Standard YouTube timedtext: <text start="1.23" dur="4.56">...</text>
  const textTagRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi
  let match: RegExpExecArray | null
  while ((match = textTagRegex.exec(normalized)) !== null) {
    const attrs = match[1] || ''
    const startMatch = attrs.match(/\bstart=["']([\d.]+)["']/i)
    if (!startMatch) continue
    const startSeconds = Number(startMatch[1])
    if (!Number.isFinite(startSeconds)) continue
    const durMatch = attrs.match(/\bdur=["']([\d.]+)["']/i)
    const durSeconds = durMatch ? Number(durMatch[1]) : 0
    const endSeconds =
      Number.isFinite(durSeconds) && durSeconds > 0 ? startSeconds + durSeconds : startSeconds + 2

    const lines = match[2]
      .split(/\n+/)
      .map(cleanCueLine)
      .filter(Boolean)
    if (lines.length > 0) {
      cues.push({ startSeconds: Math.max(0, startSeconds), endSeconds, lines })
    }
  }

  if (cues.length > 0) return cues

  // Newer YouTube srv3 XML: <p t="1230" d="4560">...</p> (milliseconds)
  const pTagRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi
  while ((match = pTagRegex.exec(normalized)) !== null) {
    const attrs = match[1] || ''
    const tMatch = attrs.match(/\bt=["'](\d+)["']/i)
    if (!tMatch) continue
    const startSeconds = Number(tMatch[1]) / 1000
    if (!Number.isFinite(startSeconds)) continue
    const dMatch = attrs.match(/\bd=["'](\d+)["']/i)
    const durSeconds = dMatch ? Number(dMatch[1]) / 1000 : 0
    const endSeconds =
      Number.isFinite(durSeconds) && durSeconds > 0 ? startSeconds + durSeconds : startSeconds + 2

    const lines = match[2]
      .split(/\n+/)
      .map(cleanCueLine)
      .filter(Boolean)
    if (lines.length > 0) {
      cues.push({ startSeconds: Math.max(0, startSeconds), endSeconds, lines })
    }
  }

  return cues
}

function extractVttOrSrtCues(normalized: string): RawCue[] {
  const lines = normalized.split('\n')
  const cues: RawCue[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Skip WEBVTT header and NOTE/STYLE/REGION blocks
    if (
      line.startsWith('WEBVTT') ||
      line === 'NOTE' ||
      line.startsWith('NOTE ') ||
      line === 'STYLE' ||
      line.startsWith('STYLE ') ||
      line === 'REGION' ||
      line.startsWith('REGION ')
    ) {
      i += 1
      while (i < lines.length && lines[i].trim() !== '') {
        i += 1
      }
      i += 1
      continue
    }

    const tsMatch = line.match(CUE_TIMESTAMP_REGEX)
    if (!tsMatch) {
      i += 1
      continue
    }

    const startSeconds = parseTimestampParts(tsMatch[1], tsMatch[2], tsMatch[3], tsMatch[4])
    const endSeconds = Math.max(
      startSeconds,
      parseTimestampParts(tsMatch[5], tsMatch[6], tsMatch[7], tsMatch[8])
    )

    i += 1
    const cueLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '') {
      // Stop cleanly if malformed file omits blank line before next timestamp
      if (CUE_TIMESTAMP_REGEX.test(lines[i].trim())) break
      const cleaned = cleanCueLine(lines[i])
      if (cleaned) {
        cueLines.push(cleaned)
      }
      i += 1
    }

    if (cueLines.length > 0) {
      cues.push({ startSeconds, endSeconds, lines: cueLines })
    }
  }

  return cues
}

/**
 * Remove rolling YouTube ASR caption overlaps between consecutive cues and
 * return only the newly spoken words.
 */
function deduplicateCueWords(
  cue: RawCue,
  recentWords: string[],
  lastAppendedLineLower: string
): { newWords: string[]; nextLastLineLower: string } {
  const filteredLines: string[] = []
  let prevLine = lastAppendedLineLower

  for (const line of cue.lines) {
    const normalizedLine = line.toLowerCase()
    if (!normalizedLine) continue
    if (normalizedLine === prevLine) continue
    filteredLines.push(line)
    prevLine = normalizedLine
  }

  if (filteredLines.length === 0) {
    return { newWords: [], nextLastLineLower: prevLine }
  }

  const cueWords = splitWords(filteredLines.join(' '))
  if (cueWords.length === 0) {
    return { newWords: [], nextLastLineLower: prevLine }
  }

  const cueDuration = cue.endSeconds - cue.startSeconds
  const tail = recentWords.slice(-24)
  const maxCheck = Math.min(tail.length, cueWords.length)
  let overlap = 0

  for (let k = maxCheck; k >= 1; k -= 1) {
    let allMatch = true
    for (let idx = 0; idx < k; idx += 1) {
      const a = normalizeWordForCompare(tail[tail.length - k + idx])
      const b = normalizeWordForCompare(cueWords[idx])
      if (!a || a !== b) {
        allMatch = false
        break
      }
    }
    if (allMatch) {
      const allowSingleWordOverlap =
        k >= 2 || cueWords.length === 1 || (cueDuration >= 0 && cueDuration <= 0.15)
      if (allowSingleWordOverlap) {
        overlap = k
        break
      }
    }
  }

  return {
    newWords: cueWords.slice(overlap),
    nextLastLineLower: prevLine,
  }
}

function buildPlainTextFallbackChunks(normalized: string): ParsedTranscriptChunk[] {
  const cleanedText = decodeHtmlEntities(
    normalized
      .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
      .replace(/\r/g, '')
  ).trim()

  if (!cleanedText) return []

  const paragraphs = cleanedText
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const units = paragraphs.length > 0 ? paragraphs : [cleanedText.replace(/\s+/g, ' ').trim()]
  const chunks: ParsedTranscriptChunk[] = []
  let bufferWords: string[] = []

  const flush = () => {
    if (bufferWords.length === 0) return
    const text = bufferWords.join(' ').trim()
    const wordCount = bufferWords.length
    chunks.push({
      segmentIndex: chunks.length,
      startSeconds: 0,
      endSeconds: 0,
      timestampLabel: formatTimestamp(0),
      text,
      wordCount,
    })
    bufferWords = []
  }

  for (const unit of units) {
    const words = splitWords(unit)
    if (words.length === 0) continue

    if (bufferWords.length > 0 && bufferWords.length + words.length > TARGET_WORDS_PER_SEGMENT) {
      flush()
    }

    if (words.length > HARD_MAX_WORDS_PER_SEGMENT) {
      for (let i = 0; i < words.length; i += TARGET_WORDS_PER_SEGMENT) {
        bufferWords.push(...words.slice(i, i + TARGET_WORDS_PER_SEGMENT))
        if (bufferWords.length >= TARGET_WORDS_PER_SEGMENT) {
          flush()
        }
      }
    } else {
      bufferWords.push(...words)
      if (bufferWords.length >= TARGET_WORDS_PER_SEGMENT) {
        flush()
      }
    }
  }

  flush()
  return chunks
}

function buildPreview(chunks: ParsedTranscriptChunk[]): string {
  if (chunks.length === 0) return ''
  const joined = chunks.map((chunk) => chunk.text).join(' ').replace(/\s+/g, ' ').trim()
  if (joined.length <= FULL_TEXT_PREVIEW_MAX_CHARS) return joined
  const clipped = joined.slice(0, FULL_TEXT_PREVIEW_MAX_CHARS)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 200 ? clipped.slice(0, lastSpace) : clipped).trim()}…`
}

/**
 * Parse WebVTT, SubRip (.srt), YouTube timedtext XML, or plain text into
 * timestamped transcript segments (~150s / ~300 words each).
 */
export function parseCaptionTextToSegments(
  raw: string,
  windowSeconds = 150
): ParsedTranscriptResult {
  if (!raw || typeof raw !== 'string') {
    return { wordCount: 0, chunks: [], fullTextPreview: '' }
  }

  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
  if (!normalized) {
    return { wordCount: 0, chunks: [], fullTextPreview: '' }
  }

  const safeWindowSeconds =
    Number.isFinite(windowSeconds) && windowSeconds > 10 ? windowSeconds : 150

  let cues: RawCue[] = []
  if (/<(transcript|timedtext|text|p)\b/i.test(normalized)) {
    cues = extractXmlCues(normalized)
  }
  if (cues.length === 0) {
    cues = extractVttOrSrtCues(normalized)
  }

  let chunks: ParsedTranscriptChunk[]

  if (cues.length === 0) {
    chunks = buildPlainTextFallbackChunks(normalized)
  } else {
    cues.sort((a, b) => a.startSeconds - b.startSeconds)
    chunks = []
    let recentWords: string[] = []
    let lastAppendedLineLower = ''

    let currentWords: string[] = []
    let segmentStart = 0
    let segmentEnd = 0

    const flushSegment = () => {
      if (currentWords.length === 0) return
      const startSeconds = Math.max(0, Math.floor(segmentStart))
      const endSeconds = Math.max(startSeconds, Math.ceil(segmentEnd))
      const text = currentWords.join(' ').trim()
      chunks.push({
        segmentIndex: chunks.length,
        startSeconds,
        endSeconds,
        timestampLabel: formatTimestamp(startSeconds),
        text,
        wordCount: currentWords.length,
      })
      currentWords = []
    }

    for (const cue of cues) {
      const { newWords, nextLastLineLower } = deduplicateCueWords(
        cue,
        recentWords,
        lastAppendedLineLower
      )
      lastAppendedLineLower = nextLastLineLower
      if (newWords.length === 0) {
        if (currentWords.length > 0) {
          segmentEnd = Math.max(segmentEnd, cue.endSeconds)
        }
        continue
      }

      recentWords = recentWords.concat(newWords).slice(-32)

      const shouldSplitBeforeAppend =
        currentWords.length > 0 &&
        (currentWords.length >= TARGET_WORDS_PER_SEGMENT ||
          currentWords.length + newWords.length > HARD_MAX_WORDS_PER_SEGMENT ||
          (cue.startSeconds - segmentStart >= safeWindowSeconds &&
            currentWords.length >= MIN_WORDS_FOR_TIME_SPLIT))

      if (shouldSplitBeforeAppend) {
        flushSegment()
      }

      if (currentWords.length === 0) {
        segmentStart = cue.startSeconds
        segmentEnd = cue.endSeconds
      } else {
        segmentEnd = Math.max(segmentEnd, cue.endSeconds)
      }

      currentWords.push(...newWords)
    }

    flushSegment()
  }

  const wordCount = chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0)
  return {
    wordCount,
    chunks,
    fullTextPreview: buildPreview(chunks),
  }
}

interface YoutubeCaptionTrack {
  baseUrl?: string
  languageCode?: string
  kind?: string
}

function extractCaptionTracksJson(html: string): YoutubeCaptionTrack[] {
  const marker = '"captionTracks":'
  const markerIdx = html.indexOf(marker)
  if (markerIdx === -1) return []

  const arrayStart = html.indexOf('[', markerIdx + marker.length)
  if (arrayStart === -1) return []

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = arrayStart; i < html.length; i += 1) {
    const ch = html[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
    } else if (ch === '[') {
      depth += 1
    } else if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        const jsonSlice = html.slice(arrayStart, i + 1)
        try {
          const parsed = JSON.parse(jsonSlice)
          return Array.isArray(parsed) ? (parsed as YoutubeCaptionTrack[]) : []
        } catch {
          return []
        }
      }
    }
  }

  return []
}

function isAllowedYoutubeCaptionUrl(rawUrl: unknown): URL | null {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null
  try {
    const parsed = new URL(rawUrl.trim())
    if (parsed.protocol !== 'https:') return null
    const host = parsed.hostname.toLowerCase()
    if (
      host !== 'youtube.com' &&
      !host.endsWith('.youtube.com') &&
      host !== 'timedtext.googleapis.com'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function selectPreferredCaptionTrack(
  tracks: YoutubeCaptionTrack[]
): { track: YoutubeCaptionTrack; url: URL } | null {
  const valid = tracks
    .map((track) => ({ track, url: isAllowedYoutubeCaptionUrl(track?.baseUrl) }))
    .filter((entry): entry is { track: YoutubeCaptionTrack; url: URL } => entry.url !== null)

  if (valid.length === 0) return null

  const isEnglish = (lang?: string) => typeof lang === 'string' && lang.toLowerCase().startsWith('en')

  return (
    valid.find((entry) => isEnglish(entry.track.languageCode) && entry.track.kind !== 'asr') ||
    valid.find((entry) => isEnglish(entry.track.languageCode)) ||
    valid.find((entry) => entry.track.kind !== 'asr') ||
    valid[0]
  )
}

interface InnertubePlayerResponse {
  playabilityStatus?: {
    status?: string
    reason?: string
  }
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: YoutubeCaptionTrack[]
    }
  }
}

const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const INNERTUBE_CLIENTS: Array<{
  name: string
  userAgent: string
  clientContext: Record<string, unknown>
}> = [
  {
    name: 'ANDROID',
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
    clientContext: {
      clientName: 'ANDROID',
      clientVersion: '20.10.38',
      androidSdkVersion: 34,
      hl: 'en',
      gl: 'US',
    },
  },
  {
    name: 'IOS',
    userAgent:
      'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)',
    clientContext: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceModel: 'iPhone16,2',
      hl: 'en',
      gl: 'US',
    },
  },
]

async function tryDownloadAndParseTracks(
  tracks: YoutubeCaptionTrack[],
  userAgent: string
): Promise<{ ok: true; raw: string; parsed: ParsedTranscriptResult } | { ok: false; hadTracks: boolean; reason?: string }> {
  const selected = selectPreferredCaptionTrack(tracks)
  if (!selected) {
    return { ok: false, hadTracks: false }
  }

  // Prefer srv1 (<text start dur>, ~3x smaller & cleaner than srv3), then WebVTT, then raw baseUrl.
  const srv1Url = new URL(selected.url.toString())
  srv1Url.searchParams.set('fmt', 'srv1')

  const vttUrl = new URL(selected.url.toString())
  vttUrl.searchParams.set('fmt', 'vtt')

  const candidates = [srv1Url, vttUrl, selected.url]
  let sawEmptyOrRestrictedBody = false

  for (const targetUrl of candidates) {
    try {
      const capRes = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': userAgent,
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      })
      if (!capRes.ok) {
        if (capRes.status === 403 || capRes.status === 429) {
          sawEmptyOrRestrictedBody = true
        }
        continue
      }
      const body = await capRes.text()
      if (!body.trim()) {
        sawEmptyOrRestrictedBody = true
        continue
      }
      const parsed = parseCaptionTextToSegments(body)
      if (parsed.chunks.length > 0 && parsed.wordCount > 0) {
        return { ok: true, raw: body, parsed }
      }
    } catch {
      // Try next format/client cleanly
    }
  }

  return {
    ok: false,
    hadTracks: true,
    reason: sawEmptyOrRestrictedBody
      ? 'YouTube returned an empty or restricted caption response for this track.'
      : 'Captions track could not be parsed.',
  }
}

/**
 * Fetch and parse YouTube captions for a strict 11-character YouTube video ID.
 * Uses YouTube Innertube Android/iOS player APIs first (avoiding web PO-token empty
 * responses on timedtext URLs), with desktop `/watch` HTML fallback.
 */
export async function fetchYoutubeCaptionsForVideo(
  videoId: string
): Promise<
  | { ok: true; source: 'youtube_captions'; raw: string; parsed: ParsedTranscriptResult }
  | { ok: false; reason: string }
> {
  if (!videoId || !YOUTUBE_ID_REGEX.test(videoId)) {
    return { ok: false, reason: 'Invalid YouTube video ID.' }
  }

  let botOrAuthReason: string | null = null
  let hadPublicTracks = false
  let restrictedTrackReason: string | null = null

  // 1. Primary path: YouTube Innertube player clients (Android / iOS)
  for (const clientCfg of INNERTUBE_CLIENTS) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': clientCfg.userAgent,
        },
        body: JSON.stringify({
          context: { client: clientCfg.clientContext },
          videoId,
        }),
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      })

      if (!res.ok) continue

      const payload = (await res.json().catch(() => null)) as InnertubePlayerResponse | null
      if (!payload) continue

      const status = payload.playabilityStatus?.status
      if (status === 'LOGIN_REQUIRED' || status === 'ERROR') {
        const reason = payload.playabilityStatus?.reason?.trim()
        if (reason) botOrAuthReason = reason
      }

      const tracks = payload.captions?.playerCaptionsTracklistRenderer?.captionTracks
      if (Array.isArray(tracks) && tracks.length > 0) {
        const result = await tryDownloadAndParseTracks(tracks, clientCfg.userAgent)
        if (result.ok) {
          return {
            ok: true,
            source: 'youtube_captions',
            raw: result.raw,
            parsed: result.parsed,
          }
        }
        if (result.hadTracks) {
          hadPublicTracks = true
          if (result.reason) restrictedTrackReason = result.reason
        }
      }
    } catch {
      // Continue cleanly to next client/fallback
    }
  }

  // 2. Fallback: desktop watch HTML with consent bypass cookie + Chrome User-Agent
  try {
    const watchRes = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999&has_verified=1`,
      {
        method: 'GET',
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': DESKTOP_CHROME_UA,
          Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+999',
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      }
    )

    if (!watchRes.ok) {
      return { ok: false, reason: `YouTube watch page returned HTTP ${watchRes.status}.` }
    }

    const html = await watchRes.text()
    const tracks = extractCaptionTracksJson(html)
    const result = await tryDownloadAndParseTracks(tracks, DESKTOP_CHROME_UA)
    if (result.ok) {
      return {
        ok: true,
        source: 'youtube_captions',
        raw: result.raw,
        parsed: result.parsed,
      }
    }
    if (result.hadTracks) {
      hadPublicTracks = true
      if (result.reason) restrictedTrackReason = result.reason
    }
  } catch (err) {
    if (!hadPublicTracks && !botOrAuthReason) {
      const message = err instanceof Error ? err.message : 'Caption fetch failed.'
      return { ok: false, reason: message }
    }
  }

  if (hadPublicTracks) {
    return {
      ok: false,
      reason:
        restrictedTrackReason ||
        'YouTube found captions but returned empty/restricted caption data from this server. Try uploading the .vtt/.srt file directly.',
    }
  }

  if (botOrAuthReason) {
    return {
      ok: false,
      reason: `YouTube blocked automated caption access (${botOrAuthReason}). Upload a .vtt/.srt caption file directly instead.`,
    }
  }

  return { ok: false, reason: 'No public YouTube captions available for this video.' }
}
