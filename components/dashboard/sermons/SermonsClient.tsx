'use client'

import React, { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Badge } from '@/components/dashboard/ui/badge'
import { Card, CardContent } from '@/components/dashboard/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import {
  Search,
  Plus,
  Play,
  Pause,
  Calendar,
  BookOpen,
  Clock,
  Edit,
  Trash2,
  Radio,
  RefreshCw,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  X,
} from 'lucide-react'
import { SpotifyIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'
import SyncSermonsButton from '@/components/dashboard/shell/SyncSermonsButton'
import SermonModal from './SermonModal'
import { deleteSermon } from '@/app/actions/sermon-management-actions'
import { toast } from 'sonner'
import type { SermonVault } from '@/types'

interface SermonsClientProps {
  initialSermons: SermonVault[]
}

export default function SermonsClient({ initialSermons }: SermonsClientProps) {
  const [sermons, setSermons] = useState<SermonVault[]>(initialSermons)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  const [originFilter, setOriginFilter] = useState<'all' | 'synced' | 'manual'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSermon, setEditingSermon] = useState<SermonVault | null>(null)

  // Delete confirmation dialog
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Audio preview player state
  const [playingSermonId, setPlayingSermonId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioTitle, setAudioTitle] = useState('')
  const [audioPreacher, setAudioPreacher] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Derive unique topics
  const allTopics = useMemo(() => {
    const set = new Set<string>()
    sermons.forEach((s) => {
      s.topics?.forEach((t) => {
        if (t.trim()) set.add(t.trim())
      })
    })
    return Array.from(set).sort()
  }, [sermons])

  // Stats
  const totalCount = sermons.length
  const autoSyncedCount = useMemo(() => sermons.filter((s) => s.isAutoSynced).length, [sermons])
  const manualCount = totalCount - autoSyncedCount
  const uniquePreachers = useMemo(() => new Set(sermons.map((s) => s.preacher).filter(Boolean)).size, [sermons])

  // Filtered sermons
  const filteredSermons = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sermons.filter((s) => {
      const titleMatch = (s.title || '').toLowerCase().includes(query)
      const preacherMatch = (s.preacher || '').toLowerCase().includes(query)
      const scriptureMatch = (s.scriptureReference || '').toLowerCase().includes(query)
      const seriesMatch = (s.series || '').toLowerCase().includes(query)
      const topicMatch = s.topics?.some((t) => t.toLowerCase().includes(query)) ?? false

      const matchesSearch = !query || titleMatch || preacherMatch || scriptureMatch || seriesMatch || topicMatch
      const matchesTopic = topicFilter === 'all' || (s.topics && s.topics.includes(topicFilter))
      const matchesOrigin =
        originFilter === 'all' ||
        (originFilter === 'synced' && s.isAutoSynced) ||
        (originFilter === 'manual' && !s.isAutoSynced)

      return matchesSearch && matchesTopic && matchesOrigin
    })
  }, [sermons, search, topicFilter, originFilter])

  // Audio player handler
  const handleToggleAudio = (sermon: SermonVault) => {
    if (playingSermonId === sermon._id) {
      // Toggle pause/play
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

    if (sermon.mediaUrl) {
      setAudioUrl(sermon.mediaUrl)
      setAudioTitle(sermon.title)
      setAudioPreacher(sermon.preacher)
      setPlayingSermonId(sermon._id)
      setTimeout(() => {
        audioRef.current?.play().catch((err) => {
          console.warn('[AudioPlayer] Autoplay prevented:', err)
          toast.info('Click play in audio player bar to begin listening.')
        })
      }, 50)
    } else if (sermon.spotifyUrl) {
      window.open(sermon.spotifyUrl, '_blank')
    } else if (sermon.youtubeUrl) {
      window.open(sermon.youtubeUrl, '_blank')
    } else {
      toast.info('No audio stream or platform URL available for this sermon.')
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

  // Create & Edit modal
  const handleOpenCreate = () => {
    setEditingSermon(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (sermon: SermonVault) => {
    setEditingSermon(sermon)
    setModalOpen(true)
  }

  const handleModalSuccess = (savedSermon: SermonVault) => {
    setSermons((prev) => {
      const idx = prev.findIndex((s) => s._id === savedSermon._id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = savedSermon
        return next
      }
      return [savedSermon, ...prev]
    })
  }

  // Delete action
  const confirmDeleteSermon = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      const res = await deleteSermon(deletingId)
      if (res.success) {
        toast.success('Sermon successfully removed from vault.')
        if (res.warning) toast.info(res.warning)
        setSermons((prev) => prev.filter((s) => s._id !== deletingId))
        if (playingSermonId === deletingId) {
          handleStopAudio()
        }
        setDeletingId(null)
      } else {
        toast.error(res.error || 'Failed to delete sermon.')
      }
    } catch {
      toast.error('Unexpected error while deleting sermon.')
    } finally {
      setIsDeleting(false)
    }
  }

  const sermonToDelete = sermons.find((s) => s._id === deletingId)

  return (
    <div className="space-y-6">
      {/* Media Management Desk Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Radio className="h-6 w-6" />
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sermon Vault &amp; Media Desk
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Curate fellowship messages, test audio streaming feeds, and monitor automated Spotify &amp; YouTube RSS ingestion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SyncSermonsButton variant="button" />
          <Button onClick={handleOpenCreate} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>New Sermon</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card/70 border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Messages
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                {totalCount}
              </span>
              <BookOpen className="h-4 w-4 text-muted-foreground/70" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Auto-Synced (RSS)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-serif">
                {autoSyncedCount}
              </span>
              <RefreshCw className="h-4 w-4 text-emerald-500/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Manually Curated
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-serif">
                {manualCount}
              </span>
              <Sparkles className="h-4 w-4 text-blue-500/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ministers / Speakers
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                {uniquePreachers}
              </span>
              <Layers className="h-4 w-4 text-muted-foreground/70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-lg border">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, minister, scripture, series, topic..."
              className="pl-9 h-9 bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Topic Filter */}
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 bg-background">
              <SelectValue placeholder="All Topics" />
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

          {/* Origin Filter */}
          <Select
            value={originFilter}
            onValueChange={(val) => setOriginFilter(val as 'all' | 'synced' | 'manual')}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-9 bg-background">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="synced">Auto-Synced (RSS)</SelectItem>
              <SelectItem value="manual">Curated (Manual)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle (Table vs Cards) */}
        <div className="flex items-center gap-1 self-end sm:self-auto border rounded-md p-0.5 bg-muted/40">
          <Button
            type="button"
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-2.5 text-xs gap-1"
            aria-label="Table view"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Table</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-2.5 text-xs gap-1"
            aria-label="Cards view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Cards</span>
          </Button>
        </div>
      </div>

      {/* Sermons Display */}
      {filteredSermons.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Radio className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No sermons found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {search || topicFilter !== 'all' || originFilter !== 'all'
              ? 'No teachings matched your active filters. Try clearing your search or filter selections.'
              : 'The Sermon Vault currently contains no sermons. Use "New Sermon" or "Sync Feeds" to populate.'}
          </p>
          {(search || topicFilter !== 'all' || originFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setTopicFilter('all')
                setOriginFilter('all')
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Desktop & Tablet Table View */
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[110px]">Source</TableHead>
                  <TableHead className="min-w-[220px]">Title &amp; Minister</TableHead>
                  <TableHead className="min-w-[150px]">Scripture / Series</TableHead>
                  <TableHead className="min-w-[120px]">Date &amp; Length</TableHead>
                  <TableHead className="w-[120px] text-center">Audio Test</TableHead>
                  <TableHead className="w-[90px] text-center">Links</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSermons.map((sermon) => {
                  const isPlaying = playingSermonId === sermon._id
                  return (
                    <TableRow key={sermon._id} className="hover:bg-muted/30 transition-colors">
                      {/* Source Badge */}
                      <TableCell>
                        {sermon.isAutoSynced ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 whitespace-nowrap"
                          >
                            <RefreshCw className="h-3 w-3" />
                            RSS
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 whitespace-nowrap"
                          >
                            <Sparkles className="h-3 w-3" />
                            Curated
                          </Badge>
                        )}
                      </TableCell>

                      {/* Title & Minister */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-sm line-clamp-1">
                            {sermon.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{sermon.preacher}</span>
                        </div>
                      </TableCell>

                      {/* Scripture & Series */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded w-fit">
                            {sermon.scriptureReference}
                          </span>
                          {sermon.series && (
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              Series: {sermon.series}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Date & Duration */}
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>{sermon.datePreached}</span>
                          {sermon.duration && (
                            <span className="text-[11px] font-mono text-foreground/80">
                              {sermon.duration}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Audio Test Button */}
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant={isPlaying ? 'default' : 'outline'}
                          onClick={() => handleToggleAudio(sermon)}
                          className="h-8 px-2.5 text-xs gap-1.5 font-medium"
                          title={
                            sermon.mediaUrl
                              ? 'Test live audio stream playback'
                              : sermon.spotifyUrl || sermon.youtubeUrl
                              ? 'Open platform link'
                              : 'No stream available'
                          }
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-3.5 w-3.5 fill-current" />
                              <span>Playing</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Test</span>
                            </>
                          )}
                        </Button>
                      </TableCell>

                      {/* External Platform Icons */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                          {sermon.spotifyUrl && (
                            <a
                              href={sermon.spotifyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              title="Listen on Spotify"
                            >
                              <SpotifyIcon className="h-4 w-4" />
                            </a>
                          )}
                          {sermon.youtubeUrl && (
                            <a
                              href={sermon.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Watch on YouTube"
                            >
                              <YouTubeIcon className="h-4 w-4" />
                            </a>
                          )}
                          {!sermon.spotifyUrl && !sermon.youtubeUrl && (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(sermon)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit sermon record"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingId(sermon._id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                            title="Delete sermon"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        /* Mobile-First Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSermons.map((sermon) => {
            const isPlaying = playingSermonId === sermon._id
            return (
              <Card key={sermon._id} className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 space-y-3">
                  {/* Top row: badge + date */}
                  <div className="flex items-center justify-between gap-2">
                    {sermon.isAutoSynced ? (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Auto-Synced (RSS)
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Curated
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {sermon.datePreached}
                    </span>
                  </div>

                  {/* Title and Preacher */}
                  <div>
                    <h4 className="font-serif font-bold text-base text-foreground leading-snug line-clamp-2">
                      {sermon.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{sermon.preacher}</p>
                  </div>

                  {/* Scripture and Series badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded">
                      {sermon.scriptureReference}
                    </span>
                    {sermon.series && (
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {sermon.series}
                      </Badge>
                    )}
                    {sermon.duration && (
                      <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" />
                        {sermon.duration}
                      </span>
                    )}
                  </div>

                  {/* Topics chips */}
                  {sermon.topics && sermon.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {sermon.topics.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded"
                        >
                          #{t}
                        </span>
                      ))}
                      {sermon.topics.length > 3 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{sermon.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Audio Test Bar & External Links */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button
                      size="sm"
                      variant={isPlaying ? 'default' : 'outline'}
                      onClick={() => handleToggleAudio(sermon)}
                      className="h-8 px-2.5 text-xs gap-1.5 font-medium"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Playing</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Test Audio</span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-1.5">
                      {sermon.spotifyUrl && (
                        <a
                          href={sermon.spotifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          title="Open Spotify"
                        >
                          <SpotifyIcon className="h-4 w-4" />
                        </a>
                      )}
                      {sermon.youtubeUrl && (
                        <a
                          href={sermon.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Open YouTube"
                        >
                          <YouTubeIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card actions: Edit / Delete */}
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(sermon)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingId(sermon._id)}
                      className="h-7 text-xs text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Floating Audio Stream Player Bar (active when test audio is playing) */}
      {audioUrl && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[460px] z-50 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-primary font-mono block">
                Audio Stream Test
              </span>
              <p className="text-xs font-semibold text-foreground truncate">{audioTitle}</p>
              <p className="text-[11px] text-muted-foreground truncate">{audioPreacher}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStopAudio}
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close audio player"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full h-8 accent-primary focus:outline-none"
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
      <Dialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Sermon Record
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                &ldquo;{sermonToDelete?.title || 'this sermon'}&rdquo;
              </span>
              ?
              <br />
              <br />
              This will permanently remove the message from the Sermon Vault in Sanity and unpublish it from the public website and homepage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSermon}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Sermon'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
