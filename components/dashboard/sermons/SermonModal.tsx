'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { createSermon, updateSermon, type SermonInput } from '@/app/actions/sermon-management-actions'
import { toast } from 'sonner'
import { Loader2, Plus, Sparkles, X } from 'lucide-react'
import type { SermonVault } from '@/types'

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
  const [mediaUrl, setMediaUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Populate fields when editing or reset when creating
  useEffect(() => {
    if (sermon) {
      setTitle(sermon.title || '')
      setPreacher(sermon.preacher || '')
      setDatePreached(sermon.datePreached || '')
      setScriptureReference(sermon.scriptureReference || '')
      setSeries(sermon.series || '')
      setTopics(sermon.topics || [])
      setTopicInput('')
      setMediaUrl(sermon.mediaUrl || '')
      setDuration(sermon.duration || '')
      setSpotifyUrl(sermon.spotifyUrl || '')
      setYoutubeUrl(sermon.youtubeUrl || '')
      setNotes(sermon.notes || '')
    } else {
      setTitle('')
      setPreacher('')
      setDatePreached(new Date().toISOString().split('T')[0])
      setScriptureReference('')
      setSeries('')
      setTopics([])
      setTopicInput('')
      setMediaUrl('')
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
      toast.error('Sermon title is required (at least 3 characters).')
      return
    }
    if (!trimmedPreacher) {
      toast.error('Preacher name is required.')
      return
    }
    if (!datePreached) {
      toast.error('Date preached is required.')
      return
    }
    if (!trimmedScripture) {
      toast.error('Scripture reference is required (e.g. Romans 8:28).')
      return
    }

    // Flush any pending text in topicInput
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
      mediaUrl: mediaUrl.trim() || undefined,
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
          toast.success('Sermon updated successfully.')
          if (res.warning) toast.info(res.warning)
          onSuccess({
            ...sermon,
            ...payload,
          })
          onOpenChange(false)
        } else {
          toast.error(res.error || 'Failed to update sermon.')
        }
      } else {
        const res = await createSermon(payload)
        if (res.success && res.sermon) {
          toast.success('New sermon created in Sermon Vault.')
          if (res.warning) toast.info(res.warning)
          onSuccess(res.sermon)
          onOpenChange(false)
        } else {
          toast.error(res.error || 'Failed to create sermon.')
        }
      }
    } catch {
      toast.error('An unexpected error occurred while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-serif">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            {isEditing ? 'Edit Sermon Record' : 'Add New Sermon to Vault'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {isEditing
              ? 'Update sermon details, scripture text, and streaming links in Sanity.'
              : 'Add a new teaching to the ECCF Sermon Vault. All updates propagate to the public site.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="sermon-title" className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Sermon Title <span className="text-red-500">*</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sermon-preacher" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Preacher <span className="text-red-500">*</span>
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
              <Label htmlFor="sermon-date" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Date Preached <span className="text-red-500">*</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sermon-scripture" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Scripture Reference <span className="text-red-500">*</span>
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
              <Label htmlFor="sermon-series" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Series Name <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Topics / Tags <span className="text-xs text-muted-foreground font-normal">(Press Enter or Comma to add)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={handleKeyDownTopic}
                placeholder="e.g. Faith, Grace, Holiness..."
                disabled={submitting}
                className="bg-background flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddTopic}
                disabled={submitting || !topicInput.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 shrink-0 mr-1" />
                Add
              </Button>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(t)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                      aria-label={`Remove topic ${t}`}
                    >
                      <X className="h-3 w-3 shrink-0" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media Audio Stream Link & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="sermon-mediaUrl" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Audio Stream Link <span className="text-xs text-muted-foreground font-normal">(Direct MP3 / CDN URL)</span>
              </Label>
              <Input
                id="sermon-mediaUrl"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://.../sermon.mp3"
                disabled={submitting}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sermon-duration" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Duration <span className="text-xs text-muted-foreground font-normal">(e.g. 48:15)</span>
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
          </div>

          {/* External Platform Links (Spotify & YouTube) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sermon-spotify" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Spotify Episode Link
              </Label>
              <Input
                id="sermon-spotify"
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/episode/..."
                disabled={submitting}
                className="bg-background text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sermon-youtube" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                YouTube Video Watch URL
              </Label>
              <Input
                id="sermon-youtube"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={submitting}
                className="bg-background text-xs"
              />
            </div>
          </div>

          {/* Sermon Summary / Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="sermon-notes" className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Sermon Summary / Message Notes
            </Label>
            <textarea
              id="sermon-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Outline, key takeaways, and study notes..."
              rows={3}
              disabled={submitting}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[120px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  Saving...
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
