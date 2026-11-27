/**
 * AiSearchFloatingModal — Client Component
 *
 * Floating bottom-left AI Message Finder trigger + native <dialog> modal.
 * - Automatically hides trigger via IntersectionObserver whenever any
 *   [data-ai-search-inline="true"] card is visible in the viewport.
 * - Uses native <dialog> via showModal() with closedby="any" + pointerdown/pointerup
 *   outside-bounding-rect fallback for Safari.
 * - Supports conversational follow-up chips (More like these, Something shorter,
 *   Only <Preacher>, Start over) and crisis/off-topic/rate-limit guidance.
 */

'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowRight,
  Clock,
  HeartHandshake,
  Loader2,
  Mail,
  Phone,
  Play,
  Radio,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import type {
  AiSearchConfig,
  AiSearchFinderRequest,
  AiSearchFinderResponse,
} from '@/types'
import { mergeAiSearchConfig, pickRandomSuggestions } from '@/lib/sermon-ai/defaults'
import { formatTimestamp, isOptimizableSermonImageUrl } from '@/lib/sermonUtils'

interface ChatTurn {
  id: string
  userLabel: string
  query: string
  response?: AiSearchFinderResponse
  error?: string
  preacherFilter?: string
  maxDurationSeconds?: number
}

export interface AiSearchFloatingModalProps {
  aiConfig?: Partial<AiSearchConfig> | null
}

function getFallbackStatusMessage(response: AiSearchFinderResponse): string {
  if (response.message) return response.message
  switch (response.kind) {
    case 'crisis':
      return "You don't have to walk through this alone. Please reach out to someone who can care for you right now."
    case 'off_topic':
      return 'That looks outside what our sermon library covers. Try describing a life season, faith question, or scripture topic.'
    case 'disabled':
      return 'AI Message Finder is currently turned off. You can still browse or keyword-search every message in the Sermon Vault.'
    case 'rate_limited':
      return 'Too many AI searches right now. Please try again shortly or browse the Sermon Vault directly.'
    case 'empty':
    default:
      return 'No specific sermon segment matched that phrasing yet. Try a different topic or browse the Sermon Vault.'
  }
}

export default function AiSearchFloatingModal({ aiConfig }: AiSearchFloatingModalProps) {
  const config = useMemo(() => mergeAiSearchConfig(aiConfig), [aiConfig])
  const pathname = usePathname()

  const titleId = useId()
  const inputId = useId()

  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [inlineVisible, setInlineVisible] = useState(false)
  const [queryInput, setQueryInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [starterSuggestions, setStarterSuggestions] = useState<string[]>(() =>
    (config.suggestions || []).slice(0, 4)
  )

  // Observe any inline AI search card across route transitions and dynamic renders
  useEffect(() => {
    if (typeof window === 'undefined') return

    const visibleElements = new Set<Element>()
    let currentTargets: Element[] = []
    let intersectionObserver: IntersectionObserver | null = null

    const bindTargets = () => {
      const nextTargets = Array.from(
        document.querySelectorAll('[data-ai-search-inline="true"]')
      )
      currentTargets = nextTargets
      visibleElements.clear()

      if (intersectionObserver) {
        intersectionObserver.disconnect()
        intersectionObserver = null
      }

      if (nextTargets.length === 0) {
        setInlineVisible(false)
        return
      }

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              visibleElements.add(entry.target)
            } else {
              visibleElements.delete(entry.target)
            }
          }
          setInlineVisible(visibleElements.size > 0)
        },
        { threshold: 0.05 }
      )

      for (const el of nextTargets) {
        intersectionObserver.observe(el)
      }
    }

    bindTargets()

    const mutationObserver = new MutationObserver(() => {
      const nextTargets = Array.from(
        document.querySelectorAll('[data-ai-search-inline="true"]')
      )
      const changed =
        nextTargets.length !== currentTargets.length ||
        nextTargets.some((el, index) => el !== currentTargets[index])
      if (changed) {
        bindTargets()
      }
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      intersectionObserver?.disconnect()
    }
  }, [pathname])

  // Safari fallback for <dialog closedby="any"> light-dismiss
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if ('closedBy' in HTMLDialogElement.prototype) return

    const isOutside = (e: PointerEvent) => {
      const rect = dialog.getBoundingClientRect()
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
    }

    let pressedOutside = false
    const handlePointerDown = (e: PointerEvent) => {
      if (!dialog.open) return
      pressedOutside = isOutside(e)
    }
    const handlePointerUp = (e: PointerEvent) => {
      if (!dialog.open) return
      if (pressedOutside && isOutside(e)) {
        dialog.close()
      }
      pressedOutside = false
    }

    dialog.addEventListener('pointerdown', handlePointerDown)
    dialog.addEventListener('pointerup', handlePointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown)
      dialog.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  // Close modal automatically on route change (defensive fallback)
  useEffect(() => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [pathname])

  // Scroll chat body to newest turn/response
  useEffect(() => {
    if (isOpen && (turns.length > 0 || isLoading)) {
      bodyEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [isOpen, turns, isLoading])

  if (!config.enabled || !config.showFloatingButton) {
    return null
  }

  const openModal = () => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (turns.length === 0) {
      setStarterSuggestions(
        pickRandomSuggestions(config.suggestions || [], 4)
      )
    }

    if (!dialog.open) {
      dialog.showModal()
      setIsOpen(true)
      window.requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }

  const closeModal = () => {
    const dialog = dialogRef.current
    if (dialog?.open) {
      dialog.close()
    }
  }

  const handleDialogClose = () => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = ''
    }
    setIsOpen(false)
  }

  const handleStartOver = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
    setTurns([])
    setQueryInput('')
    setLiveAnnouncement('Conversation cleared.')
    setStarterSuggestions((prev) =>
      pickRandomSuggestions(config.suggestions || [], 4, prev)
    )
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const runFinder = async (opts: {
    query: string
    userLabel: string
    preacher?: string
    maxDurationSeconds?: number
    excludeIds?: string[]
  }) => {
    const trimmed = opts.query.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const pendingTurn: ChatTurn = {
      id: turnId,
      userLabel: opts.userLabel,
      query: trimmed,
      preacherFilter: opts.preacher,
      maxDurationSeconds: opts.maxDurationSeconds,
    }

    setTurns((prev) => [...prev, pendingTurn])
    setIsLoading(true)
    setLiveAnnouncement('Searching ECCF sermons...')

    const payload: AiSearchFinderRequest = {
      query: trimmed,
      mode: 'modal',
      limit: 5,
      ...(opts.preacher ? { preacher: opts.preacher } : {}),
      ...(typeof opts.maxDurationSeconds === 'number'
        ? { maxDurationSeconds: Math.min(86400, Math.max(60, Math.round(opts.maxDurationSeconds))) }
        : {}),
      ...(opts.excludeIds && opts.excludeIds.length > 0
        ? { excludeIds: opts.excludeIds }
        : {}),
    }

    try {
      const res = await fetch('/api/sermons/finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const raw = (await res.json().catch(() => null)) as
        | (AiSearchFinderResponse & { error?: string })
        | null
      if (controller.signal.aborted) return

      if (!res.ok || !raw || !('kind' in raw)) {
        const errMsg =
          (raw && typeof raw.error === 'string' && raw.error) ||
          'Could not process that search right now. Please try rephrasing or browse the Sermon Vault.'
        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, error: errMsg } : t))
        )
        setLiveAnnouncement(errMsg)
        return
      }

      const data: AiSearchFinderResponse = raw
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, response: data } : t))
      )

      if (data.kind === 'results') {
        setLiveAnnouncement(
          `Found ${data.sermons.length} ${data.sermons.length === 1 ? 'message' : 'messages'}.`
        )
      } else {
        setLiveAnnouncement(getFallbackStatusMessage(data))
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? {
                ...t,
                error:
                  'Could not reach the message finder right now. Please try again or browse the Sermon Vault.',
              }
            : t
        )
      )
      setLiveAnnouncement('Could not reach the message finder right now.')
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading) return
    const trimmed = queryInput.trim()
    if (trimmed.length < 2) {
      inputRef.current?.focus()
      if (trimmed.length === 1) {
        setLiveAnnouncement('Please enter at least 2 characters to search.')
      }
      return
    }
    setQueryInput('')
    void runFinder({ query: trimmed, userLabel: trimmed })
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return
      }
      formRef.current?.requestSubmit()
    }
  }

  // Collect all sermon IDs already shown in this modal session so "More like these" advances cleanly
  const shownSermonIds = Array.from(
    new Set(turns.flatMap((t) => t.response?.sermons?.map((s) => s.id) || []))
  )

  return (
    <>
      {/* Floating Bottom-Left Trigger Pill (hidden when inline AI search card is visible) */}
      <button
        type="button"
        onClick={openModal}
        aria-haspopup="dialog"
        className={`fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 min-h-[48px] items-center gap-2 rounded-full bg-[#090d16] hover:bg-slate-900 text-white border border-[#38bdf8]/40 shadow-xl shadow-slate-950/35 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] ${
          inlineVisible && !isOpen ? 'hidden' : 'inline-flex'
        }`}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-[#38bdf8]" aria-hidden="true" />
        <span>{config.buttonLabel}</span>
      </button>

      {/* Native <dialog> Top-Layer Modal */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={handleDialogClose}
        {...({ closedby: 'any' } as Record<string, string>)}
        className="m-auto w-[calc(100vw-1.5rem)] max-w-2xl max-h-[calc(100dvh-2rem)] rounded-[28px] bg-white p-0 text-slate-900 shadow-2xl border border-stone-200/80 overflow-hidden"
      >
        <div className="flex flex-col max-h-[calc(100dvh-2rem)] w-full overflow-hidden">
          {/* Dark #090d16 Header */}
          <header className="flex items-center justify-between gap-3 bg-[#090d16] px-5 py-4 text-white shrink-0 border-b border-slate-800">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#38bdf8]">
                <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>ECCF Sermon Vault</span>
              </span>
              <h1
                id={titleId}
                className="font-serif text-xl sm:text-2xl font-normal text-white leading-tight truncate"
              >
                {config.buttonLabel}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Start over</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
              >
                <X className="h-5 w-5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Scrollable Chat Body */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#fafaf9] px-4 sm:px-6 py-5 space-y-5">
            {/* Initial Assistant Greeting + Starter Suggestions */}
            <div className="space-y-3">
              <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white border border-stone-200/90 p-4 shadow-sm">
                <p className="text-sm text-slate-800 leading-relaxed">
                  {config.greeting}
                </p>
              </div>

              {turns.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {starterSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void runFinder({ query: prompt, userLabel: prompt })}
                      className="min-h-[38px] rounded-full border border-stone-300 bg-white hover:border-[#0077cc] hover:bg-sky-50 px-3.5 py-1.5 text-left text-xs font-medium text-slate-800 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                    >
                      {prompt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="min-h-[38px] rounded-full border border-dashed border-stone-400 bg-stone-100/80 hover:bg-stone-200/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                  >
                    Other (type below)
                  </button>
                </div>
              )}
            </div>

            {/* Conversation Turns */}
            {turns.map((turn, turnIndex) => {
              const isLatestTurn = turnIndex === turns.length - 1
              const response = turn.response

              // Compute shorter threshold for "Something shorter" chip
              const resultDurations = (response?.sermons || [])
                .map((s) => s.durationSeconds)
                .filter((d): d is number => typeof d === 'number' && d > 0)
              const shorterLimit =
                resultDurations.length > 0
                  ? Math.max(900, Math.min(...resultDurations) > 1800 ? Math.min(...resultDurations) - 60 : 1800)
                  : 2400

              return (
                <div key={turn.id} className="space-y-4">
                  {/* User Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#090d16] px-4 py-2.5 text-sm font-medium text-white shadow-sm">
                      {turn.userLabel}
                    </div>
                  </div>

                  {/* Loading Spinner on pending turn */}
                  {!response && !turn.error && (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-stone-200 px-4 py-3 text-xs font-medium text-slate-600 shadow-sm">
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#0077cc]" aria-hidden="true" />
                      <span>Searching sermons and timestamps...</span>
                    </div>
                  )}

                  {/* Error Fallback */}
                  {turn.error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-2.5">
                      <p className="font-medium">{turn.error}</p>
                      <Link
                        href={`/sermons?q=${encodeURIComponent(turn.query)}&exact=1#results`}
                        onClick={closeModal}
                        className="inline-flex items-center gap-1.5 font-bold text-[#0077cc] hover:underline"
                      >
                        <span>Search Sermon Vault instead</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  )}

                  {/* Results Response */}
                  {response?.kind === 'results' && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Here are some messages that may help:
                      </p>

                      <div className="space-y-2.5">
                        {response.sermons.slice(0, 5).map((sermon) => {
                          const momentLabel =
                            sermon.moment || formatTimestamp(sermon.startSeconds || 0)

                          return (
                            <article
                              key={`${turn.id}-${sermon.id}`}
                              className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm hover:border-[#0077cc]/40 transition-colors"
                            >
                              <div className="flex gap-3">
                                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                                  {sermon.thumb ? (
                                    <Image
                                      src={sermon.thumb}
                                      alt=""
                                      fill
                                      unoptimized={!isOptimizableSermonImageUrl(sermon.thumb)}
                                      sizes="96px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Radio
                                      className="h-5 w-5 text-sky-400"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <Link
                                    href={sermon.url}
                                    onClick={closeModal}
                                    className="block font-serif text-base font-bold text-slate-950 hover:text-[#0077cc] transition-colors leading-snug line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] rounded-sm"
                                  >
                                    {sermon.title}
                                  </Link>

                                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
                                    <span className="font-semibold">{sermon.preacher}</span>
                                    {sermon.length && (
                                      <>
                                        <span aria-hidden="true">&bull;</span>
                                        <span className="inline-flex items-center gap-1">
                                          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                                          <span>{sermon.length}</span>
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {sermon.excerpt && (
                                    <span className="mt-1.5 block text-xs text-slate-600 leading-relaxed line-clamp-2">
                                      &ldquo;{sermon.excerpt}&rdquo;
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                                <Link
                                  href={sermon.url}
                                  onClick={closeModal}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#0077cc] hover:bg-[#0065b0] px-3.5 py-1.5 text-xs font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] focus-visible:ring-offset-1"
                                >
                                  <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
                                  <span>From {momentLabel}</span>
                                </Link>

                                {sermon.series && (
                                  <span className="text-[11px] font-semibold text-slate-500 truncate">
                                    {sermon.series}
                                  </span>
                                )}
                              </div>
                            </article>
                          )
                        })}
                      </div>

                      {/* Follow-up Chips under the latest results turn */}
                      {isLatestTurn && !isLoading && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              void runFinder({
                                query: turn.query,
                                userLabel: 'More like these',
                                preacher: turn.preacherFilter,
                                maxDurationSeconds: turn.maxDurationSeconds,
                                excludeIds: shownSermonIds,
                              })
                            }
                            className="min-h-[36px] rounded-full border border-stone-300 bg-white hover:border-[#0077cc] hover:bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                          >
                            More like these
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void runFinder({
                                query: turn.query,
                                userLabel: 'Something shorter',
                                preacher: turn.preacherFilter,
                                maxDurationSeconds: shorterLimit,
                              })
                            }
                            className="min-h-[36px] rounded-full border border-stone-300 bg-white hover:border-[#0077cc] hover:bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                          >
                            Something shorter
                          </button>

                          {response.preachers
                            .filter((p) => p && p !== turn.preacherFilter)
                            .slice(0, 3)
                            .map((preacher) => (
                              <button
                                key={preacher}
                                type="button"
                                onClick={() =>
                                  void runFinder({
                                    query: turn.query,
                                    userLabel: `Only ${preacher}`,
                                    preacher,
                                    maxDurationSeconds: turn.maxDurationSeconds,
                                  })
                                }
                                className="min-h-[36px] rounded-full border border-stone-300 bg-white hover:border-[#0077cc] hover:bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                              >
                                Only {preacher}
                              </button>
                            ))}

                          <button
                            type="button"
                            onClick={handleStartOver}
                            className="min-h-[36px] rounded-full border border-stone-300 bg-stone-100 hover:bg-stone-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                          >
                            Start over
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compassionate Crisis Support Card */}
                  {response?.kind === 'crisis' && (
                    <div
                      role="region"
                      aria-label="Immediate care and support contacts"
                      className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 text-slate-900 space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <HeartHandshake
                          className="h-5 w-5 shrink-0 text-amber-700 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="space-y-1.5">
                          <h2 className="font-serif text-lg font-bold text-slate-950">
                            You are not alone — support is available
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                            {getFallbackStatusMessage(response)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={`tel:${response.contact?.emergencyNumber || '112'}`}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-amber-900 hover:bg-amber-950 px-4 py-2 text-xs font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>Emergency: {response.contact?.emergencyNumber || '112'}</span>
                        </a>

                        {response.contact?.phone && (
                          <a
                            href={`tel:${response.contact.phone}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-amber-400 bg-white hover:bg-amber-100 px-4 py-2 text-xs font-bold text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
                            <span>ECCF Care: {response.contact.phone}</span>
                          </a>
                        )}

                        {response.contact?.email && (
                          <a
                            href={`mailto:${response.contact.email}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-amber-400 bg-white hover:bg-amber-100 px-4 py-2 text-xs font-bold text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
                            <span>{response.contact.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Off-topic / Empty / Disabled / Rate-Limited States */}
                  {response &&
                    response.kind !== 'results' &&
                    response.kind !== 'crisis' && (
                      <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3 shadow-sm">
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {getFallbackStatusMessage(response)}
                        </p>

                        {(response.suggestions?.length || starterSuggestions.length > 0) && (
                          <div className="flex flex-wrap gap-2">
                            {(response.suggestions && response.suggestions.length > 0
                              ? response.suggestions
                              : starterSuggestions
                            ).map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() =>
                                  void runFinder({ query: prompt, userLabel: prompt })
                                }
                                className="min-h-[36px] rounded-full border border-stone-300 bg-[#fafaf9] hover:border-[#0077cc] hover:bg-sky-50 px-3.5 py-1.5 text-left text-xs font-medium text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <Link
                            href="/sermons"
                            onClick={closeModal}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0077cc] hover:underline"
                          >
                            <span>Browse all sermons</span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>

                          {response.fallbackToKeyword && (
                            <Link
                              href={`/sermons?q=${encodeURIComponent(turn.query)}&exact=1#results`}
                              onClick={closeModal}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:underline"
                            >
                              <span>Search exact words instead</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )
            })}

            <div ref={bodyEndRef} />
          </div>

          {/* Screen-reader announcement for async search results */}
          <div className="sr-only" aria-live="polite" role="status">
            {liveAnnouncement}
          </div>

          {/* Footer Search Form */}
          <search
            aria-label="Ask AI Message Finder"
            className="border-t border-stone-200 bg-white p-3.5 sm:p-4 shrink-0"
          >
            <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2.5">
              <label htmlFor={inputId} className="sr-only">
                Describe what you are going through or want to hear
              </label>
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                name="q"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={config.placeholder}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
                maxLength={300}
                className="flex-1 min-w-0 min-h-[48px] rounded-2xl border border-stone-300 bg-[#fafaf9] px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-500 focus:border-[#0077cc] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
              />
              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0077cc] hover:bg-[#0065b0] disabled:opacity-50 disabled:cursor-not-allowed px-4 sm:px-5 text-sm font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] focus-visible:ring-offset-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span className="sr-only sm:not-sr-only">Find</span>
              </button>
            </form>
          </search>
        </div>
      </dialog>
    </>
  )
}
