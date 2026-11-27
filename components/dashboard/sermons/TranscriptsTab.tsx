'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CaptionsOff,
  CheckCircle2,
  Clock,
  Download,
  EyeOff,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  SermonTranscriptSource,
  SermonTranscriptStatus,
  SermonVault,
} from '@/types'
import {
  fetchYoutubeCaptionsForSermonAction,
  pollMissingCaptionsAction,
} from '@/app/actions/sermon-ai-actions'
import { Button } from '@/components/dashboard/ui/button'
import { DataToolbar, type ActiveFilterChip } from '@/components/dashboard/ui/data-toolbar'
import { KpiStrip } from '@/components/dashboard/ui/kpi-strip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { formatCount, formatDate, toDateTimeAttr } from '@/lib/dashboard/format'
import { toastError, toastInfo, toastSuccess } from '@/lib/dashboard/toast'
import { getYoutubeVideoId } from '@/lib/sermonUtils'
import { TranscriptStatusBadge } from './TranscriptStatusBadge'

interface TranscriptsTabProps {
  sermons: SermonVault[]
  onSermonUpdated: (updated: SermonVault) => void
  onEditSermon: (sermon: SermonVault) => void
}

type StatusFilter = 'all' | SermonTranscriptStatus

function formatTranscriptSource(source?: SermonTranscriptSource): string {
  switch (source) {
    case 'youtube_captions':
      return 'YouTube automatic captions'
    case 'uploaded_vtt':
      return 'Uploaded .vtt/.srt'
    case 'manual':
      return 'Notes / manual fallback'
    default:
      return 'No transcript ingested yet'
  }
}

function isValidIso(dateStr?: string): dateStr is string {
  if (!dateStr) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return !Number.isNaN(new Date(dateStr).getTime())
}

export default function TranscriptsTab({
  sermons,
  onSermonUpdated,
  onEditSermon,
}: TranscriptsTabProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isPolling, setIsPolling] = useState(false)
  const [fetchingSermonId, setFetchingSermonId] = useState<string | null>(null)

  const counts = useMemo(() => {
    let ready = 0
    let waiting = 0
    let unavailable = 0
    for (const s of sermons) {
      const status = s.transcriptStatus ?? 'waiting'
      if (status === 'ready') ready += 1
      else if (status === 'unavailable') unavailable += 1
      else waiting += 1
    }
    return { ready, waiting, unavailable }
  }, [sermons])

  const filteredSermons = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sermons.filter((sermon) => {
      const status = sermon.transcriptStatus ?? 'waiting'
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false
      }
      if (!query) return true

      const titleMatch = (sermon.title || '').toLowerCase().includes(query)
      const preacherMatch = (sermon.preacher || '').toLowerCase().includes(query)
      const scriptureMatch = (sermon.scriptureReference || '').toLowerCase().includes(query)
      const themeMatch =
        sermon.aiThemes?.some((t) => t.theme.toLowerCase().includes(query)) ?? false

      return titleMatch || preacherMatch || scriptureMatch || themeMatch
    })
  }, [sermons, search, statusFilter])

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    if (statusFilter === 'all') return []
    const labelMap: Record<SermonTranscriptStatus, string> = {
      ready: 'Ready',
      waiting: 'Waiting',
      unavailable: 'Unavailable',
    }
    return [
      {
        id: 'transcript-status',
        label: 'Status',
        value: labelMap[statusFilter],
        onRemove: () => setStatusFilter('all'),
      },
    ]
  }, [statusFilter])

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const handlePollMissingCaptions = async () => {
    if (isPolling) return
    setIsPolling(true)
    try {
      const res = await pollMissingCaptionsAction()
      if (res.success) {
        if (res.warning) {
          toastInfo(res.warning)
        } else if (res.checked === 0) {
          toastInfo('All YouTube-linked sermons already have indexed transcripts.')
        } else {
          toastSuccess(
            `Checked ${formatCount(res.checked)} ${res.checked === 1 ? 'sermon' : 'sermons'} · ${formatCount(res.updated)} ready, ${formatCount(res.unavailable)} unavailable.`
          )
          if (res.unavailable > 0 && res.sampleReason) {
            toastInfo(res.sampleReason)
          }
        }
        router.refresh()
      } else {
        toastError(res.error || 'Failed to poll missing captions.')
      }
    } catch {
      toastError('Unexpected error while checking for YouTube captions.')
    } finally {
      setIsPolling(false)
    }
  }

  const handleFetchSingleSermon = async (sermon: SermonVault) => {
    if (fetchingSermonId) return
    setFetchingSermonId(sermon._id)
    try {
      const res = await fetchYoutubeCaptionsForSermonAction(sermon._id)
      if (res.success) {
        toastSuccess(
          `Indexed ${formatCount(res.transcriptWordCount ?? 0)} words for “${sermon.title}”.`
        )
        if (res.warning) toast.info(res.warning)
        onSermonUpdated({
          ...sermon,
          transcriptStatus: res.transcriptStatus ?? 'ready',
          transcriptSource: res.transcriptSource ?? 'youtube_captions',
          transcriptWordCount: res.transcriptWordCount ?? 0,
          transcriptUpdatedAt: new Date().toISOString(),
          aiThemes: res.aiThemes ?? sermon.aiThemes,
        })
      } else {
        if (res.transcriptStatus === 'unavailable') {
          onSermonUpdated({
            ...sermon,
            transcriptStatus: 'unavailable',
          })
        }
        toastError(res.error || 'Captions could not be fetched from YouTube.')
      }
    } catch {
      toastError('Unexpected error while fetching YouTube captions.')
    } finally {
      setFetchingSermonId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <section
        aria-labelledby="transcripts-overview-heading"
        className="rounded-[var(--radius-card)] bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <h2
                id="transcripts-overview-heading"
                className="font-sans text-lg font-semibold text-foreground"
              >
                Captions &amp; AI Theme Indexing
              </h2>
            </div>
            <p className="max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
              ECCF automatically checks YouTube for captions on new sermons and splits them into
              timestamped moments for AI Search. Each indexed sermon also gets internal
              percentage-weighted themes to improve search matching—visitors never see these
              internal weights.
            </p>
          </div>

          <Button
            type="button"
            onClick={handlePollMissingCaptions}
            disabled={isPolling}
            aria-busy={isPolling || undefined}
            className="min-h-11 shrink-0 gap-2 px-4 md:min-h-10"
          >
            {isPolling ? (
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{isPolling ? 'Checking YouTube…' : 'Check for captions now'}</span>
          </Button>
        </div>
      </section>

      {/* 3-card KPI Strip */}
      <KpiStrip
        ariaLabel="Transcript indexing status summary"
        items={[
          {
            id: 'transcripts-ready',
            label: 'Ready',
            value: formatCount(counts.ready),
            rawValue: counts.ready,
            caption: 'Indexed & searchable',
            icon: <CheckCircle2 className="h-4 w-4" />,
            tone: 'success',
            active: statusFilter === 'ready',
            onClick: () =>
              setStatusFilter((prev) => (prev === 'ready' ? 'all' : 'ready')),
          },
          {
            id: 'transcripts-waiting',
            label: 'Waiting',
            value: formatCount(counts.waiting),
            rawValue: counts.waiting,
            caption: 'Pending caption fetch',
            icon: <Clock className="h-4 w-4" />,
            tone: 'warning',
            active: statusFilter === 'waiting',
            onClick: () =>
              setStatusFilter((prev) => (prev === 'waiting' ? 'all' : 'waiting')),
          },
          {
            id: 'transcripts-unavailable',
            label: 'Unavailable',
            value: formatCount(counts.unavailable),
            rawValue: counts.unavailable,
            caption: 'Upload .vtt/.srt fallback',
            icon: <CaptionsOff className="h-4 w-4" />,
            tone: 'neutral',
            active: statusFilter === 'unavailable',
            onClick: () =>
              setStatusFilter((prev) =>
                prev === 'unavailable' ? 'all' : 'unavailable'
              ),
          },
        ]}
      />

      {/* Search & Status Toolbar */}
      <DataToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchLabel="Search sermon transcripts"
        searchPlaceholder="Search by title, preacher, scripture, or AI theme…"
        activeFilterCount={activeFilterChips.length}
        activeFilters={activeFilterChips}
        onResetFilters={handleResetFilters}
        filterSheetTitle="Filter transcripts"
        filterSheetDescription="Narrow sermons by transcript indexing status."
        meta={`${formatCount(filteredSermons.length)} ${filteredSermons.length === 1 ? 'sermon' : 'sermons'}`}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as StatusFilter)}
            >
              <SelectTrigger
                aria-label="Filter by transcript status"
                className="w-[180px] bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>

            {(search.trim() || statusFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetFilters}
                className="min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground md:min-h-10"
              >
                Reset
              </Button>
            )}
          </div>
        }
        mobileFilters={
          <div className="space-y-2">
            <label
              htmlFor="mobile-transcript-status"
              className="block text-[13px] font-semibold text-foreground"
            >
              Transcript status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as StatusFilter)}
            >
              <SelectTrigger
                id="mobile-transcript-status"
                aria-label="Filter by transcript status"
                className="w-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Sermon Transcripts List */}
      {filteredSermons.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center rounded-[var(--radius-card)] bg-card px-6 py-12 text-center shadow-sm"
        >
          <div
            aria-hidden="true"
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-foreground">
            No matching transcripts
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            No sermons match your current search or transcript status filter.
          </p>
          {(search.trim() || statusFilter !== 'all') && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="mt-5 min-h-11 px-5 md:min-h-10"
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredSermons.map((sermon) => {
            const status = sermon.transcriptStatus ?? 'waiting'
            const wordCount = sermon.transcriptWordCount ?? 0
            const hasYoutube = Boolean(
              getYoutubeVideoId({
                youtubeVideoId: sermon.youtubeVideoId,
                youtubeUrl: sermon.youtubeUrl,
              })
            )
            const isFetchingThis = fetchingSermonId === sermon._id
            const validDate = isValidIso(sermon.datePreached)
            const isLive = sermon.isPublished !== false

            return (
              <li key={sermon._id}>
                <article className="space-y-3.5 rounded-[var(--radius-card)] bg-card p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <TranscriptStatusBadge status={status} />

                        <StatusBadge
                          variant={isLive ? 'success' : 'neutral'}
                          icon={
                            isLive ? (
                              <Globe className="h-3.5 w-3.5" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )
                          }
                        >
                          {isLive ? 'Live' : 'Hidden'}
                        </StatusBadge>

                        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground tabular-nums">
                          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {validDate ? (
                            <time dateTime={toDateTimeAttr(sermon.datePreached)}>
                              {formatDate(sermon.datePreached)}
                            </time>
                          ) : (
                            <span>{sermon.datePreached || 'Date unavailable'}</span>
                          )}
                        </span>
                      </div>

                      <h3 className="font-sans text-base font-semibold leading-snug text-foreground">
                        {sermon.title}
                      </h3>
                      <p className="text-[13px] text-muted-foreground">
                        {sermon.preacher}
                        {sermon.scriptureReference
                          ? ` · ${sermon.scriptureReference}`
                          : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      {hasYoutube && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleFetchSingleSermon(sermon)}
                          disabled={Boolean(fetchingSermonId) || isPolling}
                          aria-busy={isFetchingThis || undefined}
                          aria-label={`Fetch YouTube captions for ${sermon.title}`}
                          className="min-h-11 gap-1.5 px-3.5 md:min-h-10"
                        >
                          {isFetchingThis ? (
                            <Loader2
                              className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                              aria-hidden="true"
                            />
                          ) : (
                            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          <span>{isFetchingThis ? 'Fetching…' : 'Fetch'}</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onEditSermon(sermon)}
                        aria-label={`Manage transcript and upload caption file for ${sermon.title}`}
                        className="min-h-11 gap-1.5 px-3.5 md:min-h-10"
                      >
                        <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Upload .vtt/.srt</span>
                      </Button>
                    </div>
                  </div>

                  {/* Word count & source */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-control)] bg-surface-raised px-3.5 py-2.5 text-[13px] text-muted-foreground tabular-nums">
                    <span>
                      <strong className="font-semibold text-foreground">
                        {formatCount(wordCount)}
                      </strong>{' '}
                      {wordCount === 1 ? 'word' : 'words'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Source: {formatTranscriptSource(sermon.transcriptSource)}</span>
                  </div>

                  {/* Internal AI-weighted theme chips */}
                  {sermon.aiThemes && sermon.aiThemes.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span>
                          Internal AI-weighted themes (visitors never see these weights)
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sermon.aiThemes.map((item, idx) => (
                          <span
                            key={item._key || `${item.theme}-${idx}`}
                            className="inline-flex items-center rounded-[var(--radius-pill)] bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-accent-foreground tabular-nums dark:text-primary"
                          >
                            {item.theme} {formatCount(item.weight)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
