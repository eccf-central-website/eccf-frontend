'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  EyeOff,
  FileText,
  Globe,
  Layers,
  LayoutGrid,
  List,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import type {
  AiSearchCacheStats,
  AiSearchConfig,
  AiSearchSecretStatus,
  SermonTranscriptStatus,
  SermonVault,
} from '@/types'
import { deleteSermon } from '@/app/actions/sermon-management-actions'
import SyncSermonsButton from '@/components/dashboard/shell/SyncSermonsButton'
import { Button } from '@/components/dashboard/ui/button'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import { DataToolbar, type ActiveFilterChip } from '@/components/dashboard/ui/data-toolbar'
import { KpiStrip } from '@/components/dashboard/ui/kpi-strip'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import { SpotifyIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'
import { toast } from 'sonner'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatCount, formatDate, toDateTimeAttr } from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'
import SermonModal from './SermonModal'
import TranscriptsTab from './TranscriptsTab'
import AiSearchSettingsTab from './AiSearchSettingsTab'

interface SermonsClientProps {
  sermons: SermonVault[]
  aiConfig: AiSearchConfig
  secretStatus: AiSearchSecretStatus
  cacheStats: AiSearchCacheStats
  today?: string
}

type DeskTab = 'sermons' | 'transcripts' | 'ai-search'
type OriginFilter = 'all' | 'synced' | 'manual'

function isValidIso(dateStr?: string): dateStr is string {
  if (!dateStr) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return !Number.isNaN(new Date(dateStr).getTime())
}

function safeFormatDate(dateStr?: string): string {
  if (!isValidIso(dateStr)) return dateStr || 'Date unavailable'
  return formatDate(dateStr)
}

function renderTranscriptBadge(status?: SermonTranscriptStatus) {
  if (status === 'ready') {
    return <StatusBadge variant="success">Ready</StatusBadge>
  }
  if (status === 'unavailable') {
    return <StatusBadge variant="neutral">Unavailable</StatusBadge>
  }
  return <StatusBadge variant="warning">Waiting</StatusBadge>
}

export default function SermonsClient({
  sermons: initialSermons,
  aiConfig: initialAiConfig,
  secretStatus: initialSecretStatus,
  cacheStats: initialCacheStats,
  today,
}: SermonsClientProps) {
  const [activeTab, setActiveTab] = useState<DeskTab>('sermons')
  const [sermons, setSermons] = useState<SermonVault[]>(initialSermons)
  const [aiConfig, setAiConfig] = useState<AiSearchConfig>(initialAiConfig)
  const [secretStatus, setSecretStatus] = useState<AiSearchSecretStatus>(initialSecretStatus)
  const [cacheStats, setCacheStats] = useState<AiSearchCacheStats>(initialCacheStats)

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSermon, setEditingSermon] = useState<SermonVault | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [playingSermonId, setPlayingSermonId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioTitle = ''
  const audioPreacher = ''
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const eyebrowDate = today || formatDate(lagosDate())

  const allTopics = useMemo(() => {
    const set = new Set<string>()
    sermons.forEach((s) => {
      s.topics?.forEach((t) => {
        if (t.trim()) set.add(t.trim())
      })
    })
    return Array.from(set).sort()
  }, [sermons])

  const totalCount = sermons.length
  const autoSyncedCount = useMemo(
    () => sermons.filter((s) => s.isAutoSynced).length,
    [sermons]
  )
  const manualCount = totalCount - autoSyncedCount
  const uniquePreachers = useMemo(
    () => new Set(sermons.map((s) => s.preacher).filter(Boolean)).size,
    [sermons]
  )
  const readyTranscriptsCount = useMemo(
    () => sermons.filter((s) => s.transcriptStatus === 'ready').length,
    [sermons]
  )

  const filteredSermons = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sermons.filter((s) => {
      const titleMatch = (s.title || '').toLowerCase().includes(query)
      const preacherMatch = (s.preacher || '').toLowerCase().includes(query)
      const scriptureMatch = (s.scriptureReference || '').toLowerCase().includes(query)
      const seriesMatch = (s.series || '').toLowerCase().includes(query)
      const topicMatch = s.topics?.some((t) => t.toLowerCase().includes(query)) ?? false

      const matchesSearch =
        !query ||
        titleMatch ||
        preacherMatch ||
        scriptureMatch ||
        seriesMatch ||
        topicMatch
      const matchesTopic =
        topicFilter === 'all' || (s.topics && s.topics.includes(topicFilter))
      const matchesOrigin =
        originFilter === 'all' ||
        (originFilter === 'synced' && Boolean(s.isAutoSynced)) ||
        (originFilter === 'manual' && !s.isAutoSynced)

      return matchesSearch && matchesTopic && matchesOrigin
    })
  }, [sermons, search, topicFilter, originFilter])

  const hasActiveFilters = Boolean(
    search.trim() || topicFilter !== 'all' || originFilter !== 'all'
  )

  const handleResetFilters = () => {
    setSearch('')
    setTopicFilter('all')
    setOriginFilter('all')
  }

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const chips: ActiveFilterChip[] = []
    if (topicFilter !== 'all') {
      chips.push({
        id: 'topic',
        label: 'Topic',
        value: topicFilter,
        onRemove: () => setTopicFilter('all'),
      })
    }
    if (originFilter !== 'all') {
      chips.push({
        id: 'origin',
        label: 'Source',
        value: originFilter === 'synced' ? 'Auto-Synced (RSS)' : 'Curated (Manual)',
        onRemove: () => setOriginFilter('all'),
      })
    }
    return chips
  }, [topicFilter, originFilter])

  const handleToggleAudio = (sermon: SermonVault) => {
    if (playingSermonId === sermon._id) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play()
        } else {
          audioRef.current.pause()
          setPlayingSermonId(null)
        }
      }
      return
    }

    if (sermon.spotifyUrl) {
      window.open(sermon.spotifyUrl, '_blank', 'noopener,noreferrer')
    } else if (sermon.youtubeUrl) {
      window.open(sermon.youtubeUrl, '_blank', 'noopener,noreferrer')
    } else {
      toast.info('No platform URL available for this sermon.')
    }
  }

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPlayingSermonId(null)
    setAudioUrl(null)
  }

  const handleOpenCreate = () => {
    setEditingSermon(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (sermon: SermonVault) => {
    setEditingSermon(sermon)
    setModalOpen(true)
  }

  const handleModalSuccess = (savedSermon: SermonVault) => {
    setEditingSermon((prev) => (prev?._id === savedSermon._id ? savedSermon : prev))
    setSermons((prev) => {
      const idx = prev.findIndex((s) => s._id === savedSermon._id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = savedSermon
        return next
      }
      return [savedSermon, ...prev]
    })
    setCacheStats((prev) => ({
      ...prev,
      staleChangeCount: prev.totalEntries > 0 ? prev.staleChangeCount + 1 : prev.staleChangeCount,
    }))
  }

  const confirmDeleteSermon = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      const res = await deleteSermon(deletingId)
      if (res.success) {
        toastSuccess('Sermon successfully removed from vault.')
        if (res.warning) toast.info(res.warning)
        setSermons((prev) => prev.filter((s) => s._id !== deletingId))
        if (playingSermonId === deletingId) {
          handleStopAudio()
        }
        setDeletingId(null)
      } else {
        toastError(res.error || 'Failed to delete sermon.')
      }
    } catch {
      toastError('Unexpected error while deleting sermon.')
    } finally {
      setIsDeleting(false)
    }
  }

  const sermonToDelete = sermons.find((s) => s._id === deletingId)

  const renderCardGrid = (className?: string) => (
    <ul className={className ?? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'}>
      {filteredSermons.map((sermon) => {
        const isPlaying = playingSermonId === sermon._id
        const validDate = isValidIso(sermon.datePreached)
        const isLive = sermon.isPublished !== false

        return (
          <li key={sermon._id}>
            <article className="flex h-full flex-col justify-between gap-4 rounded-[var(--radius-card)] bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="space-y-3">
                {/* Top row: source + transcript + visibility + date */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sermon.isAutoSynced ? (
                      <StatusBadge
                        variant="success"
                        icon={<RefreshCw className="h-3.5 w-3.5" />}
                      >
                        Auto-Synced
                      </StatusBadge>
                    ) : (
                      <StatusBadge
                        variant="primary"
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                      >
                        Curated
                      </StatusBadge>
                    )}

                    {renderTranscriptBadge(sermon.transcriptStatus)}

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
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground tabular-nums">
                    <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {validDate ? (
                      <time dateTime={toDateTimeAttr(sermon.datePreached)}>
                        {formatDate(sermon.datePreached)}
                      </time>
                    ) : (
                      <span>{safeFormatDate(sermon.datePreached)}</span>
                    )}
                  </span>
                </div>

                {/* Title and Preacher (Work Sans, never Belleza on cards) */}
                <div>
                  <h2 className="line-clamp-2 font-sans text-base font-semibold leading-snug text-foreground">
                    {sermon.title}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {sermon.preacher}
                  </p>
                </div>

                {/* Scripture, Series & Duration */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center rounded-[var(--radius-control)] bg-surface-raised px-2.5 py-1 text-[13px] font-medium text-foreground">
                    {sermon.scriptureReference}
                  </span>
                  {sermon.series && (
                    <StatusBadge variant="neutral">{sermon.series}</StatusBadge>
                  )}
                  {sermon.duration && (
                    <span className="ml-auto inline-flex items-center gap-1 font-sans text-[13px] text-muted-foreground tabular-nums">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{sermon.duration}</span>
                    </span>
                  )}
                </div>

                {/* Topics chips */}
                {sermon.topics && sermon.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {sermon.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-[var(--radius-pill)] bg-primary/10 px-2.5 py-0.5 text-[13px] font-medium text-accent-foreground dark:text-primary"
                      >
                        #{t}
                      </span>
                    ))}
                    {sermon.topics.length > 3 && (
                      <span className="self-center text-[13px] text-muted-foreground">
                        +{formatCount(sermon.topics.length - 3)} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Audio Test & Actions */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant={isPlaying ? 'default' : 'outline'}
                    onClick={() => handleToggleAudio(sermon)}
                    className="min-h-11 gap-1.5 px-3.5 md:min-h-10"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
                        <span>Test Audio</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1">
                    {sermon.spotifyUrl && (
                      <a
                        href={sermon.spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Listen to ${sermon.title} on Spotify`}
                        title="Open Spotify"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-success/10 hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:w-10"
                      >
                        <SpotifyIcon className="h-4 w-4 shrink-0" />
                      </a>
                    )}
                    {sermon.youtubeUrl && (
                      <a
                        href={sermon.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Watch ${sermon.title} on YouTube`}
                        title="Open YouTube"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:w-10"
                      >
                        <YouTubeIcon className="h-4 w-4 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleOpenEdit(sermon)}
                    aria-label={`Edit ${sermon.title}`}
                    className="min-h-11 gap-1.5 px-3 text-muted-foreground hover:text-foreground md:min-h-10"
                  >
                    <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDeletingId(sermon._id)}
                    aria-label={`Delete ${sermon.title}`}
                    className="min-h-11 gap-1.5 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive md:min-h-10"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrowDate}
        title="Sermons"
        description="Publish recordings, index YouTube captions, and configure AI Message Search."
        secondaryActions={
          <SyncSermonsButton
            variant="button"
            className="min-h-11 px-4 md:min-h-10"
          />
        }
        primaryAction={
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="min-h-11 gap-2 px-4 md:min-h-10"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>New sermon</span>
          </Button>
        }
      />

      {/* Desk Sub-Navigation Tabs */}
      <nav aria-label="Sermon management sections" className="overflow-x-auto pb-1">
        <div
          role="tablist"
          aria-label="Sermon management sections"
          className="inline-flex min-w-full items-center gap-1 rounded-[var(--radius-panel)] bg-card p-1.5 shadow-sm sm:min-w-0"
        >
          <button
            type="button"
            role="tab"
            id="sermons-tab-btn"
            aria-selected={activeTab === 'sermons'}
            aria-controls="sermons-tab-panel"
            onClick={() => setActiveTab('sermons')}
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none md:min-h-10',
              activeTab === 'sermons'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
            )}
          >
            <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Sermons</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-xs tabular-nums">
              {formatCount(totalCount)}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="transcripts-tab-btn"
            aria-selected={activeTab === 'transcripts'}
            aria-controls="transcripts-tab-panel"
            onClick={() => setActiveTab('transcripts')}
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none md:min-h-10',
              activeTab === 'transcripts'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
            )}
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Transcripts</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-xs tabular-nums">
              {formatCount(readyTranscriptsCount)}/{formatCount(totalCount)}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="ai-search-tab-btn"
            aria-selected={activeTab === 'ai-search'}
            aria-controls="ai-search-tab-panel"
            onClick={() => setActiveTab('ai-search')}
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none md:min-h-10',
              activeTab === 'ai-search'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>AI Search</span>
            {cacheStats.staleChangeCount > 0 && (
              <span
                title="Saved search cache has pending sermon/transcript updates"
                className="inline-block h-2 w-2 rounded-full bg-warning"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </nav>

      {/* TAB 1: SERMONS CATALOG */}
      {activeTab === 'sermons' && (
        <div
          role="tabpanel"
          id="sermons-tab-panel"
          aria-labelledby="sermons-tab-btn"
          className="space-y-6"
        >
          {/* KPI Strip — Work Sans tabular-nums, semantic tokens */}
          <KpiStrip
            ariaLabel="Sermon vault summary"
            items={[
              {
                id: 'total-messages',
                label: 'Total messages',
                value: formatCount(totalCount),
                rawValue: totalCount,
                icon: <BookOpen className="h-4 w-4" />,
                tone: 'neutral',
                active: originFilter === 'all',
                onClick: () => setOriginFilter('all'),
              },
              {
                id: 'auto-synced',
                label: 'Auto-synced (RSS)',
                value: formatCount(autoSyncedCount),
                rawValue: autoSyncedCount,
                icon: <RefreshCw className="h-4 w-4" />,
                tone: 'success',
                active: originFilter === 'synced',
                onClick: () =>
                  setOriginFilter((prev) => (prev === 'synced' ? 'all' : 'synced')),
              },
              {
                id: 'manually-curated',
                label: 'Manually curated',
                value: formatCount(manualCount),
                rawValue: manualCount,
                icon: <Sparkles className="h-4 w-4" />,
                tone: 'primary',
                active: originFilter === 'manual',
                onClick: () =>
                  setOriginFilter((prev) => (prev === 'manual' ? 'all' : 'manual')),
              },
              {
                id: 'ministers',
                label: 'Ministers / speakers',
                value: formatCount(uniquePreachers),
                rawValue: uniquePreachers,
                icon: <Layers className="h-4 w-4" />,
                tone: 'neutral',
              },
            ]}
          />

          {/* Search, Topic/Origin Filters & View Mode Switch */}
          <DataToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchLabel="Search sermons"
            searchPlaceholder="Search by title, minister, scripture, series, or topic…"
            activeFilterCount={activeFilterChips.length}
            activeFilters={activeFilterChips}
            onResetFilters={handleResetFilters}
            filterSheetTitle="Filter sermons"
            filterSheetDescription="Narrow recordings by sermon topic or publishing source."
            meta={`${formatCount(filteredSermons.length)} ${filteredSermons.length === 1 ? 'sermon' : 'sermons'}`}
            filters={
              <div className="flex flex-wrap items-center gap-2">
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger
                    aria-label="Filter sermons by topic"
                    className="w-[175px] bg-card"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {allTopics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={originFilter}
                  onValueChange={(val) => setOriginFilter(val as OriginFilter)}
                >
                  <SelectTrigger
                    aria-label="Filter sermons by source"
                    className="w-[180px] bg-card"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="synced">Auto-Synced (RSS)</SelectItem>
                    <SelectItem value="manual">Curated (Manual)</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="mobile-sermon-topic"
                    className="block text-[13px] font-semibold text-foreground"
                  >
                    Topic
                  </label>
                  <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger
                      id="mobile-sermon-topic"
                      aria-label="Filter sermons by topic"
                      className="w-full bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {allTopics.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="mobile-sermon-origin"
                    className="block text-[13px] font-semibold text-foreground"
                  >
                    Source
                  </label>
                  <Select
                    value={originFilter}
                    onValueChange={(val) => setOriginFilter(val as OriginFilter)}
                  >
                    <SelectTrigger
                      id="mobile-sermon-origin"
                      aria-label="Filter sermons by source"
                      className="w-full bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="synced">Auto-Synced (RSS)</SelectItem>
                      <SelectItem value="manual">Curated (Manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            actions={
              <div
                role="group"
                aria-label="Display mode"
                className="hidden items-center gap-1 rounded-[var(--radius-control)] bg-surface-raised p-1 md:inline-flex"
              >
                <Button
                  type="button"
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('table')}
                  aria-pressed={viewMode === 'table'}
                  aria-label="Table view"
                  className="h-10 gap-1.5 px-3 text-[13px]"
                >
                  <List className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Table</span>
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('cards')}
                  aria-pressed={viewMode === 'cards'}
                  aria-label="Cards view"
                  className="h-10 gap-1.5 px-3 text-[13px]"
                >
                  <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Cards</span>
                </Button>
              </div>
            }
          />

          {/* Sermons Display */}
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
                <Radio className="h-6 w-6" />
              </div>
              <h2 className="font-sans text-lg font-semibold text-foreground [text-wrap:balance]">
                No sermons found
              </h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
                {hasActiveFilters
                  ? 'No teachings matched your active filters. Try clearing your search or filter selections.'
                  : 'The Sermon Vault currently contains no sermons. Use "New sermon" or "Sync Feeds" to populate.'}
              </p>
              {hasActiveFilters && (
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
          ) : viewMode === 'table' ? (
            <>
              {/* Desktop Table View (default on md+) */}
              <div className="hidden overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm md:block">
                <Table>
                  <caption className="sr-only">
                    Sermon vault recordings, scripture references, transcript indexing status, and
                    actions
                  </caption>
                  <TableHeader sticky>
                    <TableRow className="hover:bg-transparent">
                      <TableHead sticky scope="col" className="w-[155px]">
                        Status
                      </TableHead>
                      <TableHead sticky scope="col" className="min-w-[210px]">
                        Title &amp; Minister
                      </TableHead>
                      <TableHead sticky scope="col" className="min-w-[160px]">
                        Scripture / Series
                      </TableHead>
                      <TableHead sticky scope="col" className="w-[130px]">
                        Transcript
                      </TableHead>
                      <TableHead sticky scope="col" className="min-w-[135px]">
                        Date &amp; Length
                      </TableHead>
                      <TableHead sticky scope="col" className="w-[115px] text-center">
                        Audio Test
                      </TableHead>
                      <TableHead sticky scope="col" className="w-[100px] text-center">
                        Links
                      </TableHead>
                      <TableHead sticky scope="col" className="w-[100px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSermons.map((sermon) => {
                      const isPlaying = playingSermonId === sermon._id
                      const validDate = isValidIso(sermon.datePreached)
                      const isLive = sermon.isPublished !== false

                      return (
                        <TableRow
                          key={sermon._id}
                          className="transition-colors hover:bg-surface-raised/60"
                        >
                          {/* Source & Live Status */}
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              {sermon.isAutoSynced ? (
                                <StatusBadge
                                  variant="success"
                                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                                >
                                  RSS
                                </StatusBadge>
                              ) : (
                                <StatusBadge
                                  variant="primary"
                                  icon={<Sparkles className="h-3.5 w-3.5" />}
                                >
                                  Curated
                                </StatusBadge>
                              )}

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
                            </div>
                          </TableCell>

                          {/* Title & Minister */}
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="line-clamp-1 text-sm font-medium text-foreground">
                                {sermon.title}
                              </span>
                              <span className="text-[13px] text-muted-foreground">
                                {sermon.preacher}
                              </span>
                            </div>
                          </TableCell>

                          {/* Scripture & Series */}
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="w-fit rounded-[var(--radius-control)] bg-surface-raised px-2 py-0.5 text-[13px] font-medium text-foreground">
                                {sermon.scriptureReference}
                              </span>
                              {sermon.series && (
                                <span className="line-clamp-1 text-[13px] text-muted-foreground">
                                  Series: {sermon.series}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Transcript Status */}
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              {renderTranscriptBadge(sermon.transcriptStatus)}
                              {(sermon.transcriptWordCount ?? 0) > 0 && (
                                <span className="text-[12px] text-muted-foreground tabular-nums">
                                  {formatCount(sermon.transcriptWordCount ?? 0)} words
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Date & Duration */}
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-[13px] tabular-nums">
                              {validDate ? (
                                <time
                                  dateTime={toDateTimeAttr(sermon.datePreached)}
                                  className="text-foreground"
                                >
                                  {formatDate(sermon.datePreached)}
                                </time>
                              ) : (
                                <span className="text-muted-foreground">
                                  {safeFormatDate(sermon.datePreached)}
                                </span>
                              )}
                              {sermon.duration && (
                                <span className="font-sans text-[13px] text-muted-foreground tabular-nums">
                                  {sermon.duration}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Audio Test */}
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant={isPlaying ? 'default' : 'outline'}
                              onClick={() => handleToggleAudio(sermon)}
                              aria-label={
                                isPlaying
                                  ? `Pause audio test for ${sermon.title}`
                                  : `Test audio for ${sermon.title}`
                              }
                              title={
                                sermon.spotifyUrl || sermon.youtubeUrl
                                  ? 'Open platform link'
                                  : 'No stream available'
                              }
                              className="h-10 gap-1.5 px-3 text-[13px]"
                            >
                              {isPlaying ? (
                                <>
                                  <Pause
                                    className="h-3.5 w-3.5 shrink-0 fill-current"
                                    aria-hidden="true"
                                  />
                                  <span>Playing</span>
                                </>
                              ) : (
                                <>
                                  <Play
                                    className="h-3.5 w-3.5 shrink-0 fill-current"
                                    aria-hidden="true"
                                  />
                                  <span>Test</span>
                                </>
                              )}
                            </Button>
                          </TableCell>

                          {/* External Links */}
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center gap-1 text-muted-foreground">
                              {sermon.spotifyUrl && (
                                <a
                                  href={sermon.spotifyUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Listen to ${sermon.title} on Spotify`}
                                  title="Listen on Spotify"
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] transition-colors hover:bg-success/10 hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <SpotifyIcon className="h-4 w-4 shrink-0" />
                                </a>
                              )}
                              {sermon.youtubeUrl && (
                                <a
                                  href={sermon.youtubeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Watch ${sermon.title} on YouTube`}
                                  title="Watch on YouTube"
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <YouTubeIcon className="h-4 w-4 shrink-0" />
                                </a>
                              )}
                              {!sermon.spotifyUrl && !sermon.youtubeUrl && (
                                <span className="text-[13px] text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEdit(sermon)}
                                aria-label={`Edit ${sermon.title}`}
                                title="Edit sermon record"
                                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                              >
                                <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingId(sermon._id)}
                                aria-label={`Delete ${sermon.title}`}
                                title="Delete sermon"
                                className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Fallback (< md) */}
              {renderCardGrid('grid grid-cols-1 gap-4 md:hidden')}
            </>
          ) : (
            renderCardGrid()
          )}
        </div>
      )}

      {/* TAB 2: TRANSCRIPTS & AI THEMES */}
      {activeTab === 'transcripts' && (
        <div
          role="tabpanel"
          id="transcripts-tab-panel"
          aria-labelledby="transcripts-tab-btn"
        >
          <TranscriptsTab
            sermons={sermons}
            onSermonUpdated={handleModalSuccess}
            onEditSermon={handleOpenEdit}
          />
        </div>
      )}

      {/* TAB 3: AI SEARCH CONFIGURATION, KEY OVERRIDE & CACHE */}
      {activeTab === 'ai-search' && (
        <div
          role="tabpanel"
          id="ai-search-tab-panel"
          aria-labelledby="ai-search-tab-btn"
        >
          <AiSearchSettingsTab
            sermons={sermons}
            aiConfig={aiConfig}
            secretStatus={secretStatus}
            cacheStats={cacheStats}
            onConfigUpdated={setAiConfig}
            onSecretStatusUpdated={setSecretStatus}
            onCacheCleared={setCacheStats}
          />
        </div>
      )}

      {/* Floating Audio Stream Player Bar */}
      {audioUrl && (
        <div
          role="region"
          aria-label="Audio stream player"
          className="fixed bottom-4 left-4 right-4 z-50 rounded-[var(--radius-card)] border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200 sm:left-auto sm:right-6 sm:w-[460px]"
        >
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-primary">
                Audio Stream Test
              </span>
              <p className="truncate text-sm font-semibold text-foreground">{audioTitle}</p>
              <p className="truncate text-[13px] text-muted-foreground">{audioPreacher}</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleStopAudio}
              className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground md:h-10 md:w-10"
              aria-label="Close audio player"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="h-10 w-full accent-primary focus:outline-none"
            onEnded={() => setPlayingSermonId(null)}
          />
        </div>
      )}

      {/* Create / Edit Sermon Modal */}
      <SermonModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sermon={editingSermon}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
        tone="destructive"
        title={`Delete “${sermonToDelete?.title || 'this sermon'}”?`}
        description="This permanently removes the message and its indexed transcript segments from Sanity."
        effectSummary="This sermon will be unpublished from the public website, homepage, and AI Sermon Search."
        confirmLabel="Delete sermon"
        loading={isDeleting}
        loadingLabel="Deleting…"
        onConfirm={confirmDeleteSermon}
      />
    </div>
  )
}
