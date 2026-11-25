'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, Plus, Sparkles, X } from 'lucide-react'
import type { SermonVault } from '@/types'
import {
  createSermon,
  updateSermon,
  type SermonInput,
} from '@/app/actions/sermon-management-actions'
import { Button } from '@/components/dashboard/ui/button'
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
import { toast } from 'sonner'
import { lagosDate } from '@/lib/dashboard/dates'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'

interface SermonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sermon?: SermonVault | null
  onSuccess: (savedSermon: SermonVault) => void
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
  const [submitting, setSubmitting] = useState(false)

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

    const payload: SermonInput = {
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
    }

    setSubmitting(true)
    try {
      if (isEditing && sermon?._id) {
        const res = await updateSermon(sermon._id, payload)
        if (res.success) {
          toastSuccess('Sermon updated successfully.')
          if (res.warning) toast.info(res.warning)
          onSuccess({
            ...sermon,
            ...payload,
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
          onSuccess(res.sermon)
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
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
              ? 'Update sermon details, scripture text, and streaming links in Sanity.'
              : 'Add a new teaching to the ECCF Sermon Vault. All updates propagate to the public site.'}
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
              Topics / Tags{' '}
              <span className="text-[13px] font-normal text-muted-foreground">
                (Press Enter or comma to add)
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="sermon-topics"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={handleKeyDownTopic}
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
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="sermon-duration" className="text-sm font-semibold text-foreground">
              Duration{' '}
              <span className="text-[13px] font-normal text-muted-foreground">
                (e.g. 48:15)
              </span>
            </Label>
            <Input
              id="sermon-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45:30"
              disabled={submitting}
              className="bg-background"
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
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/episode/..."
                disabled={submitting}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sermon-youtube" className="text-sm font-semibold text-foreground">
                YouTube Video Watch URL
              </Label>
              <Input
                id="sermon-youtube"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={submitting}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Outline, key takeaways, and study notes..."
              rows={3}
              disabled={submitting}
              className="flex min-h-[88px] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="min-h-11 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
              className="min-h-11 w-full min-w-[130px] gap-2 sm:w-auto"
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
      </DialogContent>
    </Dialog>
  )
}
