/**
 * AiSearchInlineCard — Client Component
 *
 * High-contrast dark navy inline AI Message Finder card matching ECCF's palette.
 * Used both on the homepage (below Latest Inspired Messages) and at the top of /sermons.
 * Also exports `SermonShareActions` for lightweight Copy Link / WhatsApp sharing on /sermons/[slug].
 */

'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check,
  Copy,
  Loader2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { AiSearchConfig } from '@/types'
import { mergeAiSearchConfig, pickRandomSuggestions } from '@/lib/sermon-ai/defaults'

export interface AiSearchInlineCardProps {
  aiConfig?: Partial<AiSearchConfig> | null
  initialQuery?: string
  showSuggestions?: boolean
  /** When provided (e.g. on /sermons), handles search inline instead of navigating. */
  onAiSearch?: (query: string) => void
  isLoading?: boolean
  headingAs?: 'h2' | 'h3'
  className?: string
}

export default function AiSearchInlineCard({
  aiConfig,
  initialQuery = '',
  showSuggestions = false,
  onAiSearch,
  isLoading = false,
  headingAs = 'h2',
  className = '',
}: AiSearchInlineCardProps) {
  const config = mergeAiSearchConfig(aiConfig)
  const router = useRouter()

  const headingId = useId()
  const descId = useId()
  const inputId = useId()
  const errorId = useId()

  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(initialQuery)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Start deterministically from pool slice to avoid SSR/client hydration mismatch;
  // randomize on client mount via effect.
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    showSuggestions ? (config.suggestions || []).slice(0, 5) : []
  )

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (!showSuggestions) {
      setSuggestions([])
      return
    }
    setSuggestions(pickRandomSuggestions(config.suggestions || [], 5))
  }, [showSuggestions, config.suggestions])

  if (config.enabled === false) {
    return null
  }

  const HeadingTag = headingAs

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return
      }
      formRef.current?.requestSubmit()
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      e.preventDefault()
      setErrorMessage(
        trimmed.length === 0
          ? 'Describe what you are going through or searching for first.'
          : 'Please enter at least 2 characters to search.'
      )
      inputRef.current?.focus()
      return
    }
    setErrorMessage(null)

    if (onAiSearch) {
      e.preventDefault()
      onAiSearch(trimmed)
      return
    }

    e.preventDefault()
    router.push(`/sermons?ai=1&q=${encodeURIComponent(trimmed)}#results`)
  }

  const handleSuggestionClick = (prompt: string) => {
    setQuery(prompt)
    setErrorMessage(null)
    if (onAiSearch) {
      onAiSearch(prompt)
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      className={`relative overflow-hidden rounded-[28px] bg-[#090d16] text-white border border-slate-800/80 shadow-xl shadow-slate-950/15 p-6 sm:p-8 lg:p-10 ${className}`}
    >
      {/* Decorative atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#0095ff]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#0077cc]/15 blur-3xl"
      />

      <div className="relative z-10 max-w-4xl">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#38bdf8]">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>AI Message Finder</span>
        </span>

        <HeadingTag
          id={headingId}
          className="mt-3 font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-white leading-tight"
        >
          {config.heading}
        </HeadingTag>

        <p
          id={descId}
          className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl"
        >
          {config.subtitle}
        </p>

        <search aria-labelledby={headingId}>
          <form
            ref={formRef}
            method="GET"
            action="/sermons#results"
            data-ai-search-inline="true"
            onSubmit={handleSubmit}
            className="mt-6"
            noValidate
          >
            <input type="hidden" name="ai" value="1" />

            <label htmlFor={inputId} className="sr-only">
              Describe what you are going through or looking for
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  id={inputId}
                  type="search"
                  name="q"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={config.placeholder}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="search"
                  maxLength={300}
                  aria-describedby={errorMessage ? `${descId} ${errorId}` : descId}
                  aria-invalid={errorMessage ? 'true' : undefined}
                  className="w-full min-h-[52px] rounded-2xl border border-slate-700/90 bg-slate-900/90 pl-12 pr-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-[#38bdf8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0077cc] hover:bg-[#0065b0] active:bg-[#005596] disabled:opacity-60 disabled:cursor-not-allowed px-6 sm:px-7 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-[#0077cc]/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d16]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                    <span>Finding...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Find messages</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <p
                id={errorId}
                role="alert"
                aria-live="assertive"
                className="mt-2.5 text-xs font-medium text-amber-300"
              >
                {errorMessage}
              </p>
            )}

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#38bdf8]" aria-hidden="true" />
                <span>Searches are anonymous</span>
              </span>
              <span>Matched from ECCF sermon transcripts &amp; study notes</span>
            </div>
          </form>
        </search>

        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-800/90">
            <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-3">
              Try asking about
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((prompt) =>
                onAiSearch ? (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSuggestionClick(prompt)}
                    className="min-h-[38px] rounded-full border border-slate-700/80 bg-slate-900/80 hover:bg-[#0077cc]/25 hover:border-[#38bdf8]/60 px-4 py-1.5 text-left text-xs font-medium text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    {prompt}
                  </button>
                ) : (
                  <Link
                    key={prompt}
                    href={`/sermons?ai=1&q=${encodeURIComponent(prompt)}#results`}
                    className="inline-flex items-center min-h-[38px] rounded-full border border-slate-700/80 bg-slate-900/80 hover:bg-[#0077cc]/25 hover:border-[#38bdf8]/60 px-4 py-1.5 text-xs font-medium text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    {prompt}
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export interface SermonShareActionsProps {
  title: string
  shareUrl: string
  timestampLabel?: string | null
}

/**
 * Lightweight client share controls (Copy Link + WhatsApp) used on /sermons/[slug].
 */
export function SermonShareActions({
  title,
  shareUrl,
  timestampLabel,
}: SermonShareActionsProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const handleCopy = async () => {
    const resolvedUrl =
      shareUrl || (typeof window !== 'undefined' ? window.location.href : '')
    if (!resolvedUrl) return

    try {
      await navigator.clipboard.writeText(resolvedUrl)
      setCopyError(false)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopyError(true)
      window.setTimeout(() => setCopyError(false), 2400)
    }
  }

  const shareText = timestampLabel
    ? `Listen to "${title}" (starting at ${timestampLabel}) on ECCF Sermon Vault: ${shareUrl}`
    : `Listen to "${title}" on ECCF Sermon Vault: ${shareUrl}`

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-300 bg-white hover:bg-stone-100 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>Link copied</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 shrink-0 text-[#0077cc]" aria-hidden="true" />
            <span>Copy link</span>
          </>
        )}
      </button>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp (opens in a new tab)"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Share on WhatsApp</span>
      </a>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Sermon link copied to clipboard.' : copyError ? 'Unable to copy link automatically.' : ''}
      </span>
    </div>
  )
}
