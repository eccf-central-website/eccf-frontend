/**
 * Dedicated Sermon Detail & Timestamped Playback Page — /sermons/[slug]
 *
 * React Server Component — fetches single published sermon by slug or _id,
 * enforces hiddenYears visibility, sanitizes ?t=<seconds> timestamp,
 * and embeds privacy-enhanced YouTube player (youtube-nocookie.com) or Spotify fallback.
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { draftMode, headers } from 'next/headers'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Play,
  Radio,
  RotateCcw,
  User,
} from 'lucide-react'
import { getSanityClient } from '@/lib/sanity'
import {
  LATEST_SERMONS_QUERY,
  PUBLIC_AI_SEARCH_CONFIG_QUERY,
  SERMON_BY_SLUG_OR_ID_QUERY,
} from '@/lib/queries'
import {
  SermonPlayerItem,
  formatTimestamp,
  getSermonDetailPath,
  getSermonThumbnailUrl,
  getSpotifyEmbedUrl,
  getYoutubeEmbedUrl,
  getYoutubeVideoId,
  isOptimizableSermonImageUrl,
} from '@/lib/sermonUtils'
import { mergeAiSearchConfig } from '@/lib/sermon-ai/defaults'
import { SermonShareActions } from '@/components/sermons/AiSearchInlineCard'
import { SpotifyIcon, YouTubeIcon, YouTubeMusicIcon } from '@/components/ui/PlatformIcons'
import PreviewBanner from '@/components/common/PreviewBanner'
import type { AiSearchConfig } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { slug: string }
  searchParams?: {
    t?: string | string[]
    preview?: string
  }
}

function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function getSermonYear(datePreached?: string): number | null {
  if (!datePreached) return null
  const match = datePreached.match(/^(\d{4})/)
  return match ? Number(match[1]) : null
}

function parseStartSeconds(rawT?: string | string[]): number {
  const value = Array.isArray(rawT) ? rawT[0] : rawT
  if (!value) return 0
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.min(Math.floor(parsed), 86400)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = decodeSlug(params.slug)
  const client = getSanityClient(false)
  const sermon = await client
    .fetch<SermonPlayerItem | null>(SERMON_BY_SLUG_OR_ID_QUERY, { slug })
    .catch(() => null)

  if (!sermon) {
    return {
      title: 'Sermon Not Found | ECCF Family',
    }
  }

  return {
    title: `${sermon.title} | ECCF Sermons`,
    description: `${sermon.preacher}${sermon.scriptureReference ? ` — ${sermon.scriptureReference}` : ''}. Listen or watch on ECCF Sermon Vault.`,
  }
}

export default async function SermonDetailPage({ params, searchParams }: PageProps) {
  const isPreview = draftMode().isEnabled || searchParams?.preview === 'true'
  const slug = decodeSlug(params.slug)
  const client = getSanityClient(isPreview)

  const [sermon, latestSermons, rawAiConfig] = await Promise.all([
    client
      .fetch<SermonPlayerItem | null>(SERMON_BY_SLUG_OR_ID_QUERY, { slug })
      .catch((err) => {
        console.error('[SermonDetailPage] Failed to fetch sermon:', err)
        return null
      }),
    client
      .fetch<SermonPlayerItem[]>(LATEST_SERMONS_QUERY)
      .catch(() => [] as SermonPlayerItem[]),
    client
      .fetch<Partial<AiSearchConfig> | null>(PUBLIC_AI_SEARCH_CONFIG_QUERY)
      .catch(() => null),
  ])

  const aiConfig = mergeAiSearchConfig(rawAiConfig)
  const hiddenYears = new Set(aiConfig.hiddenYears || [])

  if (!sermon) {
    notFound()
  }

  const sermonYear = getSermonYear(sermon.datePreached)
  if (!isPreview && sermonYear !== null && hiddenYears.has(sermonYear)) {
    notFound()
  }

  const startSeconds = parseStartSeconds(searchParams?.t)
  const timestampLabel = startSeconds > 0 ? formatTimestamp(startSeconds) : null

  const youtubeEmbedUrl = getYoutubeEmbedUrl(sermon, startSeconds)
  const spotifyEmbedUrl = getSpotifyEmbedUrl(sermon)
  const thumbnailUrl = getSermonThumbnailUrl(sermon)

  const detailPath = getSermonDetailPath(sermon, startSeconds)
  const beginningPath = getSermonDetailPath(sermon)

  // Construct canonical share URL on server so Copy Link & WhatsApp stay hydration-safe
  const headerList = headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') || 'https'
  const origin =
    host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || ''
  const shareUrl = `${origin}${detailPath}`

  const moreMessages = (latestSermons || [])
    .filter((item) => {
      if (item._id === sermon._id) return false
      const itemYear = getSermonYear(item.datePreached)
      if (itemYear !== null && hiddenYears.has(itemYear)) return false
      return true
    })
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
            <li>
              <Link
                href="/"
                className="hover:text-[#0077cc] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </li>
            <li>
              <Link
                href="/sermons"
                className="hover:text-[#0077cc] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
              >
                Sermons
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </li>
            <li aria-current="page" className="text-slate-800 truncate max-w-[260px] sm:max-w-md">
              {sermon.title}
            </li>
          </ol>
        </nav>

        {/* Timestamp Indicator Banner when started via ?t=... */}
        {timestampLabel && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs sm:text-sm text-slate-900">
            <div className="inline-flex items-center gap-2 font-semibold">
              <Play className="h-4 w-4 shrink-0 text-[#0077cc] fill-current" aria-hidden="true" />
              <span>Plays from {timestampLabel}</span>
            </div>

            <Link
              href={beginningPath}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0077cc] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Play from beginning (0:00)</span>
            </Link>
          </div>
        )}

        {/* Primary Player Stage */}
        {youtubeEmbedUrl ? (
          <div className="overflow-hidden rounded-[28px] bg-[#090d16] shadow-2xl shadow-slate-950/15 border border-slate-800/80">
            <div className="aspect-video w-full">
              <iframe
                src={youtubeEmbedUrl}
                title={
                  timestampLabel
                    ? `${sermon.title} (starts at ${timestampLabel})`
                    : sermon.title
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        ) : spotifyEmbedUrl ? (
          <div className="overflow-hidden rounded-[28px] bg-[#090d16] p-4 sm:p-6 shadow-xl border border-slate-800/80">
            <iframe
              src={spotifyEmbedUrl}
              title={`Spotify podcast player for ${sermon.title}`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full h-[232px] sm:h-[352px] rounded-2xl border-0"
            />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[28px] bg-[#090d16] text-white p-8 sm:p-12 shadow-xl border border-slate-800/80 flex flex-col sm:flex-row items-center gap-6">
            {thumbnailUrl ? (
              <div className="relative h-36 w-56 shrink-0 overflow-hidden rounded-2xl border border-slate-700">
                <Image
                  src={thumbnailUrl}
                  alt={sermon.title}
                  fill
                  unoptimized={!isOptimizableSermonImageUrl(thumbnailUrl)}
                  sizes="224px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-[#38bdf8]">
                <Radio className="h-10 w-10" aria-hidden="true" />
              </div>
            )}
            <div className="space-y-3 text-center sm:text-left">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#38bdf8]">
                ECCF Sermon Vault
              </span>
              <p className="text-sm sm:text-base text-slate-300">
                Stream this teaching directly on the available platforms below.
              </p>
            </div>
          </div>
        )}

        {/* Sermon Metadata & Actions Card */}
        <section
          aria-labelledby="sermon-title"
          className="mt-8 rounded-[28px] bg-white border border-stone-200/90 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6"
        >
          <div className="space-y-3">
            {sermon.series && (
              <span className="inline-flex rounded-full bg-sky-50 border border-sky-200 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0077cc]">
                {sermon.series}
              </span>
            )}

            <h1
              id="sermon-title"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-950 tracking-tight leading-tight"
            >
              {sermon.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-1 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2 text-slate-900">
                <User className="h-4 w-4 shrink-0 text-[#0077cc]" aria-hidden="true" />
                <span>{sermon.preacher}</span>
              </span>

              {sermon.datePreached && (
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-[#0077cc]" aria-hidden="true" />
                  <span>{sermon.datePreached}</span>
                </span>
              )}

              {sermon.scriptureReference && (
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{sermon.scriptureReference}</span>
                </span>
              )}

              {sermon.duration && (
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <span>{sermon.duration}</span>
                </span>
              )}
            </div>
          </div>

          {/* Topics */}
          {sermon.topics && sermon.topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {sermon.topics.map((topic) => (
                <Link
                  key={topic}
                  href={`/sermons?q=${encodeURIComponent(topic)}&exact=1#results`}
                  className="rounded-full bg-[#fafaf9] border border-stone-200 hover:border-[#0077cc] hover:bg-sky-50 px-3.5 py-1 text-xs font-semibold text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                >
                  {topic}
                </Link>
              ))}
            </div>
          )}

          {/* Share & External Platform Links */}
          <div className="pt-5 border-t border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <SermonShareActions
              title={sermon.title}
              shareUrl={shareUrl}
              timestampLabel={timestampLabel}
            />

            <div className="flex flex-wrap items-center gap-2.5">
              {sermon.youtubeUrl && (
                <a
                  href={
                    startSeconds > 0
                      ? `${sermon.youtubeUrl}${sermon.youtubeUrl.includes('?') ? '&' : '?'}t=${startSeconds}s`
                      : sermon.youtubeUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Watch ${sermon.title} on YouTube (opens in a new tab)`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-300 bg-white hover:border-red-500 hover:bg-red-50 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 transition-colors"
                >
                  <YouTubeIcon className="h-4 w-4 shrink-0 text-red-600" />
                  <span>YouTube</span>
                </a>
              )}

              {sermon.spotifyUrl && (
                <a
                  href={sermon.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Listen to ${sermon.title} on Spotify (opens in a new tab)`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-300 bg-white hover:border-emerald-500 hover:bg-emerald-50 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 transition-colors"
                >
                  <SpotifyIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Spotify</span>
                </a>
              )}

              {sermon.youtubeMusicUrl && (
                <a
                  href={sermon.youtubeMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Listen to ${sermon.title} on YouTube Music (opens in a new tab)`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-300 bg-white hover:border-rose-500 hover:bg-rose-50 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 transition-colors"
                >
                  <YouTubeMusicIcon className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>YouTube Music</span>
                </a>
              )}
            </div>
          </div>

          {/* Companion Spotify Audio Player when YouTube video is primary */}
          {youtubeEmbedUrl && spotifyEmbedUrl && (
            <div className="pt-6 border-t border-stone-200/80 space-y-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                Audio Podcast Player
              </h2>
              <iframe
                src={spotifyEmbedUrl}
                title={`Spotify audio player for ${sermon.title}`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full h-[152px] rounded-2xl border-0"
              />
            </div>
          )}

          {/* Sermon Notes */}
          {sermon.notes && (
            <div className="pt-6 border-t border-stone-200/80 space-y-2.5">
              <h2 className="font-serif text-2xl text-slate-950">
                Message Outline &amp; Study Notes
              </h2>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {sermon.notes}
              </p>
            </div>
          )}
        </section>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/sermons"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-[#0077cc] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Back to all ECCF sermons</span>
          </Link>
        </div>

        {/* More Messages Grid */}
        {moreMessages.length > 0 && (
          <section aria-labelledby="more-messages-heading" className="mt-14 pt-12 border-t border-stone-200">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#0077cc] block mb-2">
                  Keep Listening
                </span>
                <h2
                  id="more-messages-heading"
                  className="font-serif text-2xl sm:text-3xl text-slate-950 tracking-tight"
                >
                  More Messages
                </h2>
              </div>

              <Link
                href="/sermons"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0077cc] hover:underline"
              >
                <span>Explore Full Vault</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {moreMessages.map((item) => {
                const itemThumb = getSermonThumbnailUrl(item)
                const itemHref = getSermonDetailPath(item)
                const itemHasYt = Boolean(getYoutubeVideoId(item))

                return (
                  <article
                    key={item._id}
                    className="group flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-stone-200/80 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div>
                      <Link
                        href={itemHref}
                        className="relative block h-44 w-full bg-slate-900 overflow-hidden"
                      >
                        {itemThumb ? (
                          <Image
                            src={itemThumb}
                            alt={item.title}
                            fill
                            unoptimized={!isOptimizableSermonImageUrl(itemThumb)}
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-sky-400">
                            <Radio className="h-8 w-8" aria-hidden="true" />
                          </div>
                        )}
                      </Link>

                      <div className="p-5">
                        <Link
                          href={itemHref}
                          className="block font-serif font-bold text-lg text-slate-950 group-hover:text-[#0077cc] transition-colors leading-snug"
                        >
                          {item.title}
                        </Link>
                        <span className="mt-1.5 block text-xs font-semibold text-slate-600">
                          {item.preacher}
                          {item.datePreached ? ` · ${item.datePreached}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-slate-100">
                      <Link
                        href={itemHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0077cc] hover:underline"
                      >
                        <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
                        <span>{itemHasYt ? 'Watch Video' : 'Listen Now'}</span>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {isPreview && <PreviewBanner exitUrl="/api/exit-preview?slug=/sermons" />}
    </div>
  )
}
