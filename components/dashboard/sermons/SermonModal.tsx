'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Download,
  EyeOff,
  FileText,
  Globe,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SermonTranscriptSource, SermonVault } from '@/types'
import {
  fetchYoutubeCaptionsForSermonAction,
  removeSermonTranscriptAction,
  uploadSermonCaptionFileAction,
} from '@/app/actions/sermon-ai-actions'
import {
  createSermon,
  updateSermon,
  type SermonInput,
} from '@/app/actions/sermon-management-actions'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatCount } from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { getYoutubeVideoId } from '@/lib/sermonUtils'
import { cn } from '@/lib/utils'

interface SermonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sermon?: SermonVault | null
  onSuccess: (savedSermon: SermonVault) => void
}

function formatTranscriptSourceLabel(source?: SermonTranscriptSource): string {
  switch (source) {
    case 'youtube_captions':
      return 'YouTube automatic captions'
    case 'uploaded_vtt':
      return 'Uploaded .vtt/.srt'
    case 'manual':
      return 'Notes / manual fallback'
    default:
      return ''
  }
}

export default function SermonModal({
  open,
  onOpenChange,
  sermon,
  onSuccess,
}: SermonModalProps) {
  const isEditing = Boolean(sermon?._id)

  const [title, setTitle] = useState('')
  const [preacher, setPreacher] = useState('')
  const [datePreached, setDatePreached] = useState('')
  const [scriptureReference, setScriptureReference] = useState('')
  const [series, setSeries] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [duration, setDuration] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Transcript management state (edit mode only)
  const [fetchingCaptions, setFetchingCaptions] = useState(false)
  const [uploadingCaptions, setUploadingCaptions] = useState(false)
  const [removingTranscript, setRemovingTranscript] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [selectedCaptionFile, setSelectedCaptionFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const transcriptBusy = fetchingCaptions || uploadingCaptions || removingTranscript

  useEffect(() => {
    if (sermon) {
      setTitle(sermon.title || '')
      setPreacher(sermon.preacher || '')
      setDatePreached(sermon.datePreached || '')
      setScriptureReference(sermon.scriptureReference || '')
      setSeries(sermon.series || '')
      setTopics(sermon.topics || [])
      setTopicInput('')
      setDuration(sermon.duration || '')
      setSpotifyUrl(sermon.spotifyUrl || '')
      setYoutubeUrl(sermon.youtubeUrl || '')
      setNotes(sermon.notes || '')
      setIsPublished(sermon.isPublished !== false)
    } else {
      setTitle('')
      setPreacher('')
      setDatePreached(lagosDate())
      setScriptureReference('')
      setSeries('')
      setTopics([])
      setTopicInput('')
      setDuration('')
      setSpotifyUrl('')
      setYoutubeUrl('')
      setNotes('')
      setIsPublished(true)
    }
    setSelectedCaptionFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [sermon, open])

  const handleAddTopic = () => {
    const trimmed = topicInput.trim()
    if (!trimmed) return
    const split = trimmed
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t && !topics.includes(t))
    if (split.length > 0) {
      setTopics((prev) => [...prev, ...split])
      setTopicInput('')
    }
  }

  const handleKeyDownTopic = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTopic()
    }
  }

  const handleRemoveTopic = (tToRemove: string) => {
    setTopics((prev) => prev.filter((t) => t !== tToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedPreacher = preacher.trim()
    const trimmedScripture = scriptureReference.trim()

    if (!trimmedTitle || trimmedTitle.length < 3) {
      toastError('Sermon title is required (at least 3 characters).')
      return
    }
    if (!trimmedPreacher) {
      toastError('Preacher name is required.')
      return
    }
    if (!datePreached) {
      toastError('Date preached is required.')
      return
    }
    if (!trimmedScripture) {
      toastError('Scripture reference is required (e.g. Romans 8:28).')
      return
    }

    let currentTopics = [...topics]
    if (topicInput.trim()) {
      const extra = topicInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t && !currentTopics.includes(t))
      currentTopics = [...currentTopics, ...extra]
    }

    const payload: SermonInput & { isPublished: boolean } = {
      title: trimmedTitle,
      preacher: trimmedPreacher,
      datePreached,
      scriptureReference: trimmedScripture,
      series: series.trim() || undefined,
      topics: currentTopics.length > 0 ? currentTopics : undefined,
      duration: duration.trim() || undefined,
      spotifyUrl: spotifyUrl.trim() || undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      isPublished,
    }

    setSubmitting(true)
    try {
      if (isEditing && sermon?._id) {
        const res = await updateSermon(sermon._id, payload)
        if (res.success) {
          toastSuccess('Sermon updated successfully.')
          if (res.warning) toast.info(res.warning)
          const resolvedYoutubeId = payload.youtubeUrl
            ? getYoutubeVideoId({ youtubeUrl: payload.youtubeUrl }) ?? undefined
            : undefined
          onSuccess({
            ...sermon,
            ...payload,
            youtubeVideoId: resolvedYoutubeId,
          })
          onOpenChange(false)
        } else {
          toastError(res.error || 'Failed to update sermon.')
        }
      } else {
        const res = await createSermon(payload)
        if (res.success && res.sermon) {
          toastSuccess('New sermon created in Sermon Vault.')
          if (res.warning) toast.info(res.warning)
          onSuccess({
            ...res.sermon,
            isPublished,
          })
          onOpenChange(false)
        } else {
          toastError(res.error || 'Failed to create sermon.')
        }
      }
    } catch {
      toastError('An unexpected error occurred while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFetchYoutubeCaptions = async () => {
    if (!sermon?._id || transcriptBusy) return
    setFetchingCaptions(true)
    try {
      const res = await fetchYoutubeCaptionsForSermonAction(sermon._id)
      if (res.success) {
        toastSuccess(
          `Transcript indexed (${formatCount(res.transcriptWordCount ?? 0)} words).`
        )
        if (res.warning) toast.info(res.warning)
        onSuccess({
          ...sermon,
          transcriptStatus: res.transcriptStatus ?? 'ready',
          transcriptSource: res.transcriptSource ?? 'youtube_captions',
          transcriptWordCount: res.transcriptWordCount ?? 0,
          transcriptUpdatedAt: new Date().toISOString(),
          aiThemes: res.aiThemes ?? sermon.aiThemes,
        })
      } else {
        if (res.transcriptStatus === 'unavailable') {
          onSuccess({
            ...sermon,
            transcriptStatus: 'unavailable',
          })
        }
        toastError(res.error || 'Could not fetch YouTube captions.')
      }
    } catch {
      toastError('Unexpected error while fetching YouTube captions.')
    } finally {
      setFetchingCaptions(false)
    }
  }

  const handleUploadCaptionFile = async () => {
    if (!sermon?._id || !selectedCaptionFile || transcriptBusy) return
    setUploadingCaptions(true)
    try {
      const formData = new FormData()
      formData.append('sermonId', sermon._id)
      formData.append('file', selectedCaptionFile)

      const res = await uploadSermonCaptionFileAction(formData)
      if (res.success) {
        toastSuccess(
          `Caption file uploaded (${formatCount(res.transcriptWordCount ?? 0)} words indexed).`
        )
        if (res.warning) toast.info(res.warning)
        onSuccess({
          ...sermon,
          transcriptStatus: res.transcriptStatus ?? 'ready',
          transcriptSource: res.transcriptSource ?? 'uploaded_vtt',
          transcriptWordCount: res.transcriptWordCount ?? 0,
          transcriptUpdatedAt: new Date().toISOString(),
          aiThemes: res.aiThemes ?? sermon.aiThemes,
        })
        setSelectedCaptionFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toastError(res.error || 'Failed to upload caption file.')
      }
    } catch {
      toastError('Unexpected error while uploading caption file.')
    } finally {
      setUploadingCaptions(false)
    }
  }

  const handleRemoveTranscript = async () => {
    if (!sermon?._id || transcriptBusy) return
    setRemovingTranscript(true)
    try {
      const res = await removeSermonTranscriptAction(sermon._id)
      if (res.success) {
        toastSuccess('Transcript segments and AI themes cleared.')
        if (res.warning) toast.info(res.warning)
        onSuccess({
          ...sermon,
          transcriptStatus: res.transcriptStatus ?? 'waiting',
          transcriptSource: undefined,
          transcriptWordCount: 0,
          transcriptUpdatedAt: undefined,
          aiThemes: [],
        })
        setConfirmRemoveOpen(false)
      } else {
        toastError(res.error || 'Failed to remove sermon transcript.')
      }
    } catch {
      toastError('Unexpected error while removing sermon transcript.')
    } finally {
      setRemovingTranscript(false)
    }
  }

  const youtubeVideoId = sermon
    ? getYoutubeVideoId({
        youtubeVideoId: sermon.youtubeVideoId,
        youtubeUrl: youtubeUrl || sermon.youtubeUrl,
      })
    : null
  const hasYoutube = Boolean(youtubeVideoId || (youtubeUrl || sermon?.youtubeUrl || '').trim())
  const transcriptStatus = sermon?.transcriptStatus ?? 'waiting'
  const transcriptWords = sermon?.transcriptWordCount ?? 0
  const hasTranscript = transcriptStatus === 'ready' || transcriptWords > 0
  const sourceLabel = formatTranscriptSourceLabel(sermon?.transcriptSource)

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!submitting && !transcriptBusy) onOpenChange(next)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-border/60 bg-card p-5 sm:max-w-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-sans text-xl font-semibold text-foreground">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>{isEditing ? 'Edit Sermon Record' : 'Add New Sermon to Vault'}</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditing
                ? 'Update sermon details, visibility, streaming links, and searchable transcripts.'
                : 'Add a new teaching to the ECCF Sermon Vault. Published sermons appear on the public site.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="sermon-title" className="text-sm font-semibold text-foreground">
                Sermon Title <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="sermon-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Walking in Supernatural Grace & Power"
                required
                disabled={submitting}
                className="bg-background"
              />
            </div>

            {/* Preacher & Date Preached */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sermon-preacher" className="text-sm font-semibold text-foreground">
                  Preacher <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="sermon-preacher"
                  name="preacher"
                  value={preacher}
                  onChange={(e) => setPreacher(e.target.value)}
                  placeholder="e.g. Pastor David Olatunji"
                  required
                  disabled={submitting}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sermon-date" className="text-sm font-semibold text-foreground">
                  Date Preached <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="sermon-date"
                  name="datePreached"
                  type="date"
                  value={datePreached}
                  onChange={(e) => setDatePreached(e.target.value)}
                  required
                  disabled={submitting}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Scripture Reference & Series */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sermon-scripture" className="text-sm font-semibold text-foreground">
                  Scripture Reference <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="sermon-scripture"
                  name="scriptureReference"
                  value={scriptureReference}
                  onChange={(e) => setScriptureReference(e.target.value)}
                  placeholder="e.g. Romans 8:28-39"
                  required
                  disabled={submitting}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sermon-series" className="text-sm font-semibold text-foreground">
                  Series Name{' '}
                  <span className="text-[13px] font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="sermon-series"
                  name="series"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="e.g. Kingdom Foundations"
                  disabled={submitting}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Topics / Tags */}
            <div className="space-y-1.5">
              <Label htmlFor="sermon-topics" className="text-sm font-semibold text-foreground">
                Topics / Tags
              </Label>
              <p id="sermon-topics-help" className="text-[13px] text-muted-foreground">
                Press Enter or comma to add topic tags for public filtering.
              </p>
              <div className="flex gap-2">
                <Input
                  id="sermon-topics"
                  name="topicInput"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleKeyDownTopic}
                  aria-describedby="sermon-topics-help"
                  placeholder="e.g. Faith, Grace, Holiness…"
                  disabled={submitting}
                  className="flex-1 bg-background"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTopic}
                  disabled={submitting || !topicInput.trim()}
                  className="min-h-11 shrink-0 gap-1.5 px-4 md:min-h-10"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Add</span>
                </Button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {topics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleRemoveTopic(t)}
                      aria-label={`Remove topic ${t}`}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary/10 px-3 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-primary"
                    >
                      <span>#{t}</span>
                      <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="sermon-duration" className="text-sm font-semibold text-foreground">
                Duration{' '}
                <span className="text-[13px] font-normal text-muted-foreground">
                  (e.g. 48:15)
                </span>
              </Label>
              <Input
                id="sermon-duration"
                name="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45:30"
                disabled={submitting}
                className="bg-background tabular-nums"
              />
            </div>

            {/* External Platform Links */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sermon-spotify" className="text-sm font-semibold text-foreground">
                  Spotify Episode Link
                </Label>
                <Input
                  id="sermon-spotify"
                  name="spotifyUrl"
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/episode/..."
                  disabled={submitting}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sermon-youtube" className="text-sm font-semibold text-foreground">
                  YouTube Video Watch URL
                </Label>
                <Input
                  id="sermon-youtube"
                  name="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={submitting}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Sermon Summary / Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="sermon-notes" className="text-sm font-semibold text-foreground">
                Sermon Summary / Message Notes
              </Label>
              <textarea
                id="sermon-notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Outline, key takeaways, and study notes..."
                rows={3}
                disabled={submitting}
                className="flex min-h-[88px] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Public Visibility Toggle */}
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border/70 bg-surface-raised p-3.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card">
              <label
                htmlFor="sermon-is-published"
                className="flex flex-1 cursor-pointer items-center gap-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors',
                    isPublished
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isPublished ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    Show on public website
                  </span>
                  <span
                    id="sermon-published-help"
                    className="block text-[13px] text-muted-foreground"
                  >
                    {isPublished
                      ? 'Live on /sermons, homepage highlights, and AI Sermon Search.'
                      : 'Hidden from visitors, public sermon pages, and AI search results.'}
                  </span>
                </span>
              </label>
              <Checkbox
                id="sermon-is-published"
                name="isPublished"
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(Boolean(checked))}
                aria-describedby="sermon-published-help"
                disabled={submitting}
                className="h-5 w-5"
              />
            </div>

            <DialogFooter className="gap-2 pt-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting || transcriptBusy}
                className="min-h-11 w-full sm:w-auto md:min-h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || transcriptBusy}
                aria-busy={submitting || undefined}
                className="min-h-11 w-full min-w-[130px] gap-2 sm:w-auto md:min-h-10"
              >
                {submitting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <span>Saving…</span>
                  </>
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Create Sermon'
                )}
              </Button>
            </DialogFooter>
          </form>

          {/* Dedicated Transcript Management Section (Edit Mode Only) */}
          {isEditing && sermon?._id && (
            <section
              id="transcript"
              aria-labelledby="sermon-transcript-heading"
              className="mt-2 space-y-4 border-t border-border pt-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <h2
                    id="sermon-transcript-heading"
                    className="font-sans text-base font-semibold text-foreground"
                  >
                    Transcript
                  </h2>
                </div>
                {transcriptStatus === 'ready' ? (
                  <StatusBadge variant="success">Ready</StatusBadge>
                ) : transcriptStatus === 'unavailable' ? (
                  <StatusBadge variant="neutral">Unavailable</StatusBadge>
                ) : (
                  <StatusBadge variant="warning">Waiting</StatusBadge>
                )}
              </div>

              {/* Status Summary Box */}
              <div className="space-y-2 rounded-[var(--radius-control)] bg-surface-raised p-4">
                <p className="font-sans text-sm font-medium text-foreground tabular-nums">
                  {transcriptStatus === 'ready'
                    ? `Ready · ${formatCount(transcriptWords)} words${sourceLabel ? ` · ${sourceLabel}` : ''}`
                    : transcriptStatus === 'unavailable'
                      ? 'Unavailable · YouTube captions were not found automatically'
                      : 'Waiting for captions'}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Timestamped transcript segments power AI Sermon Search moment matching.
                </p>

                {sermon.aiThemes && sermon.aiThemes.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[13px] font-medium text-muted-foreground">
                      Internal AI-weighted themes (hidden from visitors):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sermon.aiThemes.map((item, idx) => (
                        <span
                          key={item._key || `${item.theme}-${idx}`}
                          className="inline-flex items-center rounded-[var(--radius-pill)] border border-border/60 bg-card px-2.5 py-0.5 text-[13px] font-medium text-foreground tabular-nums"
                        >
                          {item.theme} {formatCount(item.weight)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* YouTube Fetch & Remove Actions */}
              {(hasYoutube || hasTranscript) && (
                <div className="flex flex-wrap items-center gap-2">
                  {hasYoutube && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFetchYoutubeCaptions}
                      disabled={transcriptBusy || submitting}
                      aria-busy={fetchingCaptions || undefined}
                      className="min-h-11 gap-2 md:min-h-10"
                    >
                      {fetchingCaptions ? (
                        <Loader2
                          className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                      ) : (
                        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {fetchingCaptions ? 'Fetching captions…' : 'Fetch from YouTube'}
                      </span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmRemoveOpen(true)}
                    disabled={!hasTranscript || transcriptBusy || submitting}
                    aria-busy={removingTranscript || undefined}
                    className="min-h-11 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive md:min-h-10"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Remove transcript</span>
                  </Button>
                </div>
              )}

              {/* .vtt / .srt Caption File Upload */}
              <div className="space-y-2 rounded-[var(--radius-control)] border border-border/70 bg-background/60 p-4">
                <Label
                  htmlFor="sermon-caption-file"
                  className="block text-sm font-semibold text-foreground"
                >
                  Caption file (.vtt or .srt)
                </Label>
                <p
                  id="sermon-caption-help"
                  className="text-[13px] leading-relaxed text-muted-foreground"
                >
                  If YouTube automatic captions are unavailable or disabled, download the{' '}
                  <span className="font-medium text-foreground">.vtt</span> or{' '}
                  <span className="font-medium text-foreground">.srt</span> subtitle track from
                  YouTube Studio (Subtitles → Download) and upload it here.
                </p>

                <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center">
                  <input
                    id="sermon-caption-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".vtt,.srt,text/vtt"
                    aria-describedby="sermon-caption-help"
                    disabled={transcriptBusy || submitting}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setSelectedCaptionFile(file)
                    }}
                    className="min-h-11 w-full flex-1 cursor-pointer rounded-[var(--radius-control)] border border-input bg-card px-3 py-2 text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-[var(--radius-control)] file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUploadCaptionFile}
                    disabled={!selectedCaptionFile || transcriptBusy || submitting}
                    aria-busy={uploadingCaptions || undefined}
                    className="min-h-11 shrink-0 gap-2 md:min-h-10"
                  >
                    {uploadingCaptions ? (
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {uploadingCaptions ? 'Uploading…' : 'Upload caption file'}
                    </span>
                  </Button>
                </div>
              </div>
            </section>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        tone="destructive"
        title={`Remove transcript for “${sermon?.title || 'this sermon'}”?`}
        description="This deletes all indexed transcript segments and resets the transcript status to Waiting."
        effectSummary="AI Sermon Search will no longer match timestamped spoken moments inside this sermon until captions are fetched or uploaded again."
        confirmLabel="Remove transcript"
        loading={removingTranscript}
        loadingLabel="Removing…"
        onConfirm={handleRemoveTranscript}
      />
    </>
  )
}
