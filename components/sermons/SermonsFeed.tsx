/**
 * SermonsFeed — Client Component
 *
 * Interactive AI Message Finder results + keyword/topic catalog filtering for ECCF Sermon Vault.
 * Filters out hidden years per AI Search config, supports exact-word fallback toggle,
 * and routes every sermon card to `/sermons/<slug>` (and timestamped `/sermons/<slug>?t=...`).
 */

'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Disc3,
  Filter,
  HeartHandshake,
  Loader2,
  Mail,
  Phone,
  Play,
  Radio,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'
import AiSearchInlineCard from '@/components/sermons/AiSearchInlineCard'
import {
  SermonPlayerItem as SermonItem,
  formatTimestamp,
  getSermonDetailPath,
  getSermonThumbnailUrl,
  getSpotifyEmbedUrl,
  getYoutubeVideoId,
  isOptimizableSermonImageUrl,
} from '@/lib/sermonUtils'
import { mergeAiSearchConfig } from '@/lib/sermon-ai/defaults'
import type { AiSearchConfig, AiSearchFinderResponse } from '@/types'

export type { SermonPlayerItem as SermonItem } from '@/lib/sermonUtils'

interface Props {
  sermons?: SermonItem[] | null
  aiConfig?: Partial<AiSearchConfig> | null
  initialSuggestions?: string[]
  initialQuery?: string
  initialAiMode?: boolean
  initialExactMode?: boolean
}

function getSermonYear(datePreached?: string): number | null {
  if (!datePreached) return null
  const match = datePreached.match(/^(\d{4})/)
  return match ? Number(match[1]) : null
}

function getAiBannerMessage(response: AiSearchFinderResponse): string {
  if (response.message) return response.message
  switch (response.kind) {
    case 'crisis':
      return "You don't have to carry this alone. Please reach out to someone who can support you today."
    case 'off_topic':
      return 'That looks outside what our sermon archive covers. Try searching a life situation, scripture topic, or spiritual question.'
    case 'disabled':
      return 'AI Message Finder is currently paused. You can search for exact words across the Sermon Vault below.'
    case 'rate_limited':
      return 'AI search limit reached for now. Try exact-word search below or check back shortly.'
    case 'empty':
    default:
      return 'No specific sermon segment matched that phrasing. Try searching exact words or browsing by topic below.'
  }
}

export default function SermonsFeed({
  sermons,
  aiConfig,
  initialSuggestions,
  initialQuery = '',
  initialAiMode = false,
  initialExactMode = false,
}: Props) {
  const config = useMemo(() => mergeAiSearchConfig(aiConfig), [aiConfig])
  const catalogSearchId = useId()
  const abortRef = useRef<AbortController | null>(null)

  const trimmedInitial = initialQuery.trim()
  const startInAiMode = Boolean(
    config.enabled && initialAiMode && !initialExactMode && trimmedInitial
  )

  const [searchQuery, setSearchQuery] = useState(
    !startInAiMode && trimmedInitial ? trimmedInitial : ''
  )
  const [selectedTopic, setSelectedTopic] = useState('All')

  const [aiMode, setAiMode] = useState(startInAiMode)
  const [aiQuery, setAiQuery] = useState(startInAiMode ? trimmedInitial : '')
  const [aiLoading, setAiLoading] = useState(startInAiMode)
  const [aiResponse, setAiResponse] = useState<AiSearchFinderResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Exclude sermons from hidden years configured in Sanity Dashboard
  const visibleSermons = useMemo(() => {
    const hiddenYears = new Set(config.hiddenYears || [])
    return (sermons || []).filter((sermon) => {
      if (hiddenYears.size === 0) return true
      const year = getSermonYear(sermon.datePreached)
      return year === null || !hiddenYears.has(year)
    })
  }, [sermons, config.hiddenYears])

  // Derive dynamic topic filters from visible sermons
  const dynamicTopics = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(visibleSermons.flatMap((s) => s.topics || []).filter(Boolean))
      ),
    ],
    [visibleSermons]
  )

  const syncUrl = useCallback((nextPath: string) => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', nextPath)
    }
  }, [])

  const executeAiSearch = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim()
    if (trimmed.length < 2) {
      setAiMode(true)
      setAiQuery(trimmed)
      setAiLoading(false)
      setAiResponse(null)
      setAiError('Please enter at least 2 characters to search.')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setAiMode(true)
    setAiQuery(trimmed)
    setAiLoading(true)
    setAiError(null)
    setAiResponse(null)

    try {
      const res = await fetch('/api/sermons/finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          mode: 'page',
          limit: 8,
        }),
        signal: controller.signal,
      })
      const raw = (await res.json().catch(() => null)) as
        | (AiSearchFinderResponse & { error?: string })
        | null
      if (controller.signal.aborted) return

      if (!res.ok || !raw || !('kind' in raw)) {
        const errMsg =
          (raw && typeof raw.error === 'string' && raw.error) ||
          'Could not process that search right now. You can search exact words below.'
        setAiError(errMsg)
        return
      }

      setAiResponse(raw)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setAiError(
        'Could not reach the AI Message Finder right now. You can search exact words below.'
      )
    } finally {
      if (!controller.signal.aborted) {
        setAiLoading(false)
      }
    }
  }, [])

  // Run initial AI search when page loads with ?ai=1&q=...
  useEffect(() => {
    if (startInAiMode && trimmedInitial) {
      void executeAiSearch(trimmedInitial)
    }
    return () => {
      abortRef.current?.abort()
    }
    // Only trigger on mount for initial server searchParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAiSearch = (nextQuery: string) => {
    const trimmed = nextQuery.trim()
    if (!trimmed) return
    syncUrl(`/sermons?ai=1&q=${encodeURIComponent(trimmed)}#results`)
    void executeAiSearch(trimmed)
    const resultsEl = document.getElementById('results')
    resultsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const switchToExactSearch = (exactTerm: string) => {
    abortRef.current?.abort()
    const trimmed = exactTerm.trim()
    setAiMode(false)
    setAiLoading(false)
    setAiResponse(null)
    setAiError(null)
    setSelectedTopic('All')
    setSearchQuery(trimmed)
    if (trimmed) {
      syncUrl(`/sermons?q=${encodeURIComponent(trimmed)}&exact=1#results`)
    } else {
      syncUrl('/sermons')
    }
  }

  const clearAiSearch = () => {
    abortRef.current?.abort()
    setAiMode(false)
    setAiQuery('')
    setAiLoading(false)
    setAiResponse(null)
    setAiError(null)
    setSearchQuery('')
    syncUrl('/sermons')
  }

  // Client-side keyword search across title, preacher, series, topics, and scriptureReference
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return visibleSermons.filter((sermon) => {
      const matchesSearch =
        !query ||
        (sermon.title || '').toLowerCase().includes(query) ||
        (sermon.preacher || '').toLowerCase().includes(query) ||
        (sermon.series || '').toLowerCase().includes(query) ||
        (sermon.scriptureReference || '').toLowerCase().includes(query) ||
        (sermon.topics || []).some((topic) => topic.toLowerCase().includes(query))

      const matchesTopic =
        selectedTopic === 'All' || (sermon.topics && sermon.topics.includes(selectedTopic))

      return matchesSearch && matchesTopic
    })
  }, [visibleSermons, searchQuery, selectedTopic])

  return (
    <>
      {/* Inline AI Message Finder Card */}
      {config.enabled !== false && (
        <AiSearchInlineCard
          aiConfig={config}
          initialSuggestions={initialSuggestions}
          initialQuery={aiMode ? aiQuery : ''}
          showSuggestions={true}
          onAiSearch={handleAiSearch}
          isLoading={aiLoading}
          headingAs="h2"
          className="mb-8 sm:mb-10"
        />
      )}

      {/* Results / Catalog Anchor */}
      <div id="results" className="scroll-mt-28">
        {/* AI Search Active Results View */}
        {aiMode && aiQuery && (
          <section aria-label="AI message search results" className="mb-12">
            {/* Loading State */}
            {aiLoading && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-[24px] bg-white border border-stone-200/90 p-8 sm:p-10 text-center shadow-sm"
              >
                <Loader2
                  className="h-8 w-8 mx-auto animate-spin text-[#0077cc]"
                  aria-hidden="true"
                />
                <p className="mt-3 font-serif text-xl text-slate-900">
                  Searching sermon moments for &ldquo;{aiQuery}&rdquo;...
                </p>
                <span className="mt-1 block text-xs text-slate-500">
                  Matching relevant teachings and exact starting timestamps
                </span>
              </div>
            )}

            {/* Error State */}
            {!aiLoading && aiError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 sm:p-8 space-y-4"
              >
                <p className="text-sm sm:text-base font-medium text-rose-950">{aiError}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => switchToExactSearch(aiQuery)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#0077cc] hover:bg-[#0065b0] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                  >
                    <span>Search for these exact words instead</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearAiSearch}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:bg-stone-100 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition-colors"
                  >
                    <span>Browse all sermons</span>
                  </button>
                </div>
              </div>
            )}

            {/* Crisis Banner */}
            {!aiLoading && aiResponse?.kind === 'crisis' && (
              <div
                role="region"
                aria-label="Care and emergency support"
                className="rounded-[24px] border border-amber-300 bg-amber-50 p-6 sm:p-8 text-slate-900 space-y-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <HeartHandshake
                    className="h-6 w-6 shrink-0 text-amber-700 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-2xl font-bold text-slate-950">
                      We care about you — support is available right now
                    </h3>
                    <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                      {getAiBannerMessage(aiResponse)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href={`tel:${aiResponse.contact?.emergencyNumber || '112'}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-amber-900 hover:bg-amber-950 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Emergency: {aiResponse.contact?.emergencyNumber || '112'}</span>
                  </a>

                  {aiResponse.contact?.phone && (
                    <a
                      href={`tel:${aiResponse.contact.phone}`}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-amber-400 bg-white hover:bg-amber-100 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 transition-colors"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                      <span>ECCF Care: {aiResponse.contact.phone}</span>
                    </a>
                  )}

                  {aiResponse.contact?.email && (
                    <a
                      href={`mailto:${aiResponse.contact.email}`}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-amber-400 bg-white hover:bg-amber-100 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 transition-colors"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                      <span>{aiResponse.contact.email}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={clearAiSearch}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:bg-stone-100 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition-colors"
                  >
                    <span>Browse all sermons</span>
                  </button>
                </div>
              </div>
            )}

            {/* Off-topic / Empty / Disabled / Rate-Limited Banner */}
            {!aiLoading &&
              aiResponse &&
              aiResponse.kind !== 'results' &&
              aiResponse.kind !== 'crisis' && (
                <div className="rounded-[24px] border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#0077cc]">
                        AI Message Finder
                      </span>
                      <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                        {getAiBannerMessage(aiResponse)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => switchToExactSearch(aiQuery)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#0077cc] hover:bg-[#0065b0] px-5 py-2 text-xs sm:text-sm font-bold text-white transition-colors"
                      >
                        <span>Search for these exact words instead</span>
                      </button>
                      <button
                        type="button"
                        onClick={clearAiSearch}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-stone-300 bg-[#fafaf9] hover:bg-stone-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-colors"
                      >
                        <span>Browse all</span>
                      </button>
                    </div>
                  </div>

                  {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 mr-1">
                        Try instead:
                      </span>
                      {aiResponse.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAiSearch(suggestion)}
                          className="min-h-[36px] rounded-full border border-stone-300 bg-[#fafaf9] hover:border-[#0077cc] hover:bg-sky-50 px-3.5 py-1.5 text-xs font-medium text-slate-800 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Matched Sermon Cards */}
            {!aiLoading && aiResponse?.kind === 'results' && (
              <div className="space-y-6">
                {/* Crisp AI Results Banner */}
                <div className="rounded-[24px] border border-sky-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0077cc]">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>AI Matched ({aiResponse.sermons.length})</span>
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        for &ldquo;{aiQuery}&rdquo;
                      </span>
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl text-slate-950 leading-snug pt-1">
                      Messages that may help, picked from what was preached.
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => switchToExactSearch(aiQuery)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-stone-300 bg-[#fafaf9] hover:border-[#0077cc] hover:bg-sky-50 px-4 py-2 text-xs font-bold text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                    >
                      <Search className="h-3.5 w-3.5 shrink-0 text-[#0077cc]" aria-hidden="true" />
                      <span>Search for these exact words instead</span>
                    </button>

                    <button
                      type="button"
                      onClick={clearAiSearch}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-100 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                    >
                      <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Show all sermons</span>
                    </button>
                  </div>
                </div>

                {/* AI Matched Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {aiResponse.sermons.map((sermon) => {
                    const momentLabel =
                      sermon.moment || formatTimestamp(sermon.startSeconds || 0)

                    return (
                      <article
                        key={sermon.id}
                        className="group flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-stone-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
                      >
                        <div>
                          <div className="relative h-48 sm:h-52 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                            {sermon.thumb ? (
                              <>
                                <Image
                                  src={sermon.thumb}
                                  alt={sermon.title}
                                  fill
                                  unoptimized={!isOptimizableSermonImageUrl(sermon.thumb)}
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-black/25 to-transparent pointer-events-none" />
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-slate-900" />
                            )}

                            {sermon.length && (
                              <div className="absolute top-3.5 right-3.5 z-10 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 flex items-center gap-1.5 shadow-sm">
                                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span>{sermon.length}</span>
                              </div>
                            )}

                            {sermon.series && (
                              <div className="absolute top-3.5 left-3.5 z-10 rounded-full bg-white/95 backdrop-blur-md text-[#0077cc] text-[11px] font-bold px-3.5 py-1 uppercase tracking-wider shadow-sm">
                                {sermon.series}
                              </div>
                            )}

                            <Link
                              href={sermon.url}
                              aria-label={`Play ${sermon.title} starting at ${momentLabel}`}
                              className="relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#0077cc] hover:bg-[#0065b0] text-white shadow-xl group-hover:scale-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                            >
                              <Play className="h-6 w-6 shrink-0 fill-white translate-x-0.5" aria-hidden="true" />
                            </Link>
                          </div>

                          <div className="p-6 sm:p-7">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2.5">
                              {sermon.datePreached && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[#0077cc]" aria-hidden="true" />
                                  <span>{sermon.datePreached}</span>
                                </span>
                              )}
                              {sermon.datePreached && sermon.scriptureReference && (
                                <span aria-hidden="true">&bull;</span>
                              )}
                              {sermon.scriptureReference && (
                                <span className="inline-flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                                  <span>{sermon.scriptureReference}</span>
                                </span>
                              )}
                            </div>

                            <Link
                              href={sermon.url}
                              className="block font-serif font-bold text-xl text-slate-950 group-hover:text-[#0077cc] transition-colors leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
                            >
                              {sermon.title}
                            </Link>

                            <span className="block text-sm font-semibold text-slate-600 mt-2">
                              {sermon.preacher}
                            </span>

                            {sermon.excerpt && (
                              <span className="mt-3 block rounded-xl bg-[#fafaf9] border border-stone-200/80 p-3 text-xs text-slate-600 leading-relaxed">
                                &ldquo;{sermon.excerpt}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="px-6 pb-6 pt-3 border-t border-slate-100">
                          <Link
                            href={sermon.url}
                            className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-full bg-[#0077cc] hover:bg-[#0065b0] px-4 py-2 text-xs font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] focus-visible:ring-offset-2"
                          >
                            <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
                            <span>
                              {momentLabel} &middot; Play from where this teaching starts
                            </span>
                          </Link>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Normal Catalog Toolbar & Grid (visible when AI mode is inactive) */}
        {!aiMode && (
          <>
            {/* Search & Topic Filters */}
            <div className="mb-10 sm:mb-14 flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-stone-200/80 p-5 sm:p-6 rounded-[24px] shadow-sm">
              <search aria-label="Filter sermon catalog" className="relative w-full md:w-96">
                <label htmlFor={catalogSearchId} className="sr-only">
                  Search by title, preacher, series, topic, or scripture
                </label>
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id={catalogSearchId}
                  type="search"
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, preacher, series, topic, or scripture..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="search"
                  className="w-full min-h-[48px] rounded-2xl border border-stone-200 bg-[#fafaf9] pl-12 pr-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] focus:outline-none transition-all"
                />
              </search>

              {dynamicTopics.length > 1 && (
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <Filter className="h-4 w-4 shrink-0 text-slate-400 mr-1 hidden sm:block" aria-hidden="true" />
                  {dynamicTopics.map((topic) => {
                    const isActive = selectedTopic === topic
                    return (
                      <button
                        key={topic}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setSelectedTopic(topic)}
                        className={`min-h-[40px] rounded-full px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] ${
                          isActive
                            ? 'bg-slate-950 text-white shadow-md'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                        }`}
                      >
                        {topic}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Switch to AI search helper when user searched by exact words */}
            {config.enabled !== false && searchQuery.trim().length > 2 && (
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-3.5 text-xs sm:text-sm text-slate-700">
                <span>
                  Showing exact keyword matches for{' '}
                  <strong className="text-slate-950">&ldquo;{searchQuery.trim()}&rdquo;</strong> ({filtered.length})
                </span>
                <button
                  type="button"
                  onClick={() => handleAiSearch(searchQuery.trim())}
                  className="inline-flex items-center gap-1.5 font-bold text-[#0077cc] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Try AI Message Finder instead</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Disc3 className="h-16 w-16 shrink-0 text-slate-300 animate-pulse" aria-hidden="true" />
                <p className="font-serif font-bold text-2xl text-slate-800 tracking-tight">
                  {searchQuery || selectedTopic !== 'All'
                    ? 'No sermons match your filter'
                    : 'No sermons published in the vault yet'}
                </p>
                <p className="text-base text-slate-600 max-w-md">
                  {searchQuery || selectedTopic !== 'All'
                    ? 'Try clearing your search query, choosing another topic, or asking the AI Message Finder above.'
                    : 'Recordings, podcasts, and video messages will appear here once published from Sanity Studio.'}
                </p>
                {(searchQuery || selectedTopic !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedTopic('All')
                      syncUrl('/sermons')
                    }}
                    className="mt-2 inline-flex min-h-[44px] items-center rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Sermon Cards Grid */}
            {filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filtered.map((sermon, idx) => {
                  const youtubeId = getYoutubeVideoId(sermon)
                  const thumbnailUrl = getSermonThumbnailUrl(sermon)
                  const spotifyEmbedUrl = getSpotifyEmbedUrl(sermon)
                  const hasPlayableMedia = Boolean(
                    youtubeId || spotifyEmbedUrl || sermon.youtubeUrl || sermon.spotifyUrl
                  )
                  const detailHref = getSermonDetailPath(sermon)

                  return (
                    <motion.div
                      key={sermon._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      className="group flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-stone-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
                    >
                      <div>
                        {/* Thumbnail / Media Header */}
                        <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                          {thumbnailUrl ? (
                            <>
                              <Image
                                src={thumbnailUrl}
                                alt={sermon.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-black/20 to-transparent pointer-events-none" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-slate-200/50" />
                          )}

                          {sermon.duration && (
                            <div className="absolute top-3.5 right-3.5 z-10 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 flex items-center gap-1.5 shadow-sm">
                              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span>{sermon.duration}</span>
                            </div>
                          )}

                          {sermon.series && (
                            <div className="absolute top-3.5 left-3.5 z-10 rounded-full bg-white/95 backdrop-blur-md text-[#0077cc] text-[11px] font-bold px-3.5 py-1 uppercase tracking-wider shadow-sm">
                              {sermon.series}
                            </div>
                          )}

                          {/* Play Button Trigger -> Internal Sermon Detail Player */}
                          {hasPlayableMedia ? (
                            <Link
                              href={detailHref}
                              aria-label={`Play ${sermon.title}`}
                              className={`relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-white shadow-xl group-hover:scale-110 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                youtubeId
                                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                                  : 'bg-[#0077cc] hover:bg-[#0065b0] shadow-sky-500/30'
                              }`}
                            >
                              <Play className="h-6 w-6 shrink-0 fill-white translate-x-0.5" aria-hidden="true" />
                            </Link>
                          ) : (
                            <Link
                              href={detailHref}
                              aria-label={`Open ${sermon.title}`}
                              className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#0077cc] shadow-sm"
                            >
                              <Radio className="h-5 w-5 shrink-0 text-[#0077cc]" aria-hidden="true" />
                            </Link>
                          )}
                        </div>

                        {/* Sermon Info */}
                        <div className="p-6 sm:p-7">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2.5">
                            {sermon.datePreached && (
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#0077cc]" aria-hidden="true" />
                                <span>{sermon.datePreached}</span>
                              </span>
                            )}
                            {sermon.datePreached && sermon.scriptureReference && (
                              <span aria-hidden="true">&bull;</span>
                            )}
                            {sermon.scriptureReference && (
                              <span className="inline-flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                                <span>{sermon.scriptureReference}</span>
                              </span>
                            )}
                          </div>

                          <Link
                            href={detailHref}
                            className="block font-serif font-bold text-xl text-slate-950 group-hover:text-[#0077cc] transition-colors leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
                          >
                            {sermon.title}
                          </Link>

                          <span className="block text-sm font-semibold text-slate-600 mt-2">
                            {sermon.preacher}
                          </span>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-slate-100">
                        <Link
                          href={detailHref}
                          className="inline-flex min-h-[36px] items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0077cc] hover:text-sky-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
                        >
                          <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
                          <span>{youtubeId ? 'Watch Video' : 'Listen Now'}</span>
                        </Link>

                        <div className="flex items-center gap-2">
                          {sermon.spotifyUrl && (
                            <a
                              href={sermon.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Listen on Spotify"
                              aria-label={`Listen to ${sermon.title} on Spotify (opens in a new tab)`}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-stone-200/60"
                            >
                              <SpotifyIcon className="h-4 w-4 shrink-0" />
                            </a>
                          )}

                          {sermon.youtubeMusicUrl && (
                            <a
                              href={sermon.youtubeMusicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Listen on YouTube Music"
                              aria-label={`Listen to ${sermon.title} on YouTube Music (opens in a new tab)`}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-stone-200/60"
                            >
                              <YouTubeMusicIcon className="h-4 w-4 shrink-0" />
                            </a>
                          )}

                          {sermon.youtubeUrl && (
                            <a
                              href={sermon.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Watch on YouTube"
                              aria-label={`Watch ${sermon.title} on YouTube (opens in a new tab)`}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-stone-200/60"
                            >
                              <YouTubeIcon className="h-4 w-4 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
