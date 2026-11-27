'use client'

import React, { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Pin,
  Send,
  Sparkles,
  Tag,
} from 'lucide-react'
import type { Announcement } from '@/types'
import {
  createAnnouncement,
  updateAnnouncement,
} from '@/app/actions/announcement-actions'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
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
import { lagosDate } from '@/lib/dashboard/dates'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { portableTextToString } from '@/lib/portable-text-helpers'
import { cn } from '@/lib/utils'

export const ANNOUNCEMENT_CATEGORIES = [
  { value: 'WEEKLY SERVICES', label: 'Weekly Services' },
  { value: 'ACADEMIC & EXAMS', label: 'Academic & Exams' },
  { value: 'BIBLE STUDY', label: 'Bible Study' },
  { value: 'EXCO UPDATES', label: 'Exco Updates' },
  { value: 'GENERAL', label: 'General Fellowship' },
] as const

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  announcement?: Announcement | null
  onSuccess: (saved: Announcement) => void
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  announcement,
  onSuccess,
}: AnnouncementModalProps) {
  const isEditing = Boolean(announcement && announcement._id)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('WEEKLY SERVICES')
  const [eventDate, setEventDate] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [time, setTime] = useState('08:00 AM')
  const [location, setLocation] = useState('NLT 5, Faculty of Law, ESUI')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [isPublished, setIsPublished] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const today = lagosDate()
    if (announcement) {
      setTitle(announcement.title || '')
      setCategory(announcement.category || 'WEEKLY SERVICES')
      setEventDate(announcement.eventDate || '')
      setPublishDate(announcement.publishDate || today)
      setTime(announcement.time || '08:00 AM')
      setLocation(announcement.location || 'NLT 5, Faculty of Law, ESUI')
      setContent(portableTextToString(announcement.content))
      setIsPinned(Boolean(announcement.isPinned))
      setIsPublished(announcement.isPublished !== false)
    } else {
      setTitle('')
      setCategory('WEEKLY SERVICES')
      setEventDate(today)
      setPublishDate(today)
      setTime('08:00 AM')
      setLocation('NLT 5, Faculty of Law, ESUI')
      setContent('')
      setIsPinned(false)
      setIsPublished(true)
    }
  }, [announcement, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || title.trim().length < 3) {
      toastError('Please enter a descriptive announcement title (at least 3 characters).')
      return
    }

    setIsSubmitting(true)

    try {
      const today = lagosDate()
      if (isEditing && announcement?._id) {
        const res = await updateAnnouncement({
          _id: announcement._id,
          title: title.trim(),
          category,
          eventDate: eventDate || undefined,
          publishDate: publishDate || today,
          time: time.trim() || undefined,
          location: location.trim() || 'NLT 5, Faculty of Law, ESUI',
          content: content.trim(),
          isPinned,
          isPublished,
        })

        if (!res.ok) {
          toastError(res.error || 'Failed to update announcement.')
          return
        }

        toastSuccess('Announcement updated successfully.')
        onSuccess({
          ...announcement,
          title: title.trim(),
          category,
          eventDate,
          publishDate,
          time,
          location,
          content,
          isPinned,
          isPublished,
        })
        onClose()
      } else {
        const res = await createAnnouncement({
          title: title.trim(),
          category,
          eventDate: eventDate || undefined,
          publishDate: publishDate || today,
          time: time.trim() || undefined,
          location: location.trim() || 'NLT 5, Faculty of Law, ESUI',
          content: content.trim(),
          isPinned,
          isPublished,
        })

        if (!res.ok) {
          toastError(res.error || 'Failed to create announcement.')
          return
        }

        toastSuccess(
          isPublished
            ? 'Announcement published successfully.'
            : 'Announcement saved as draft.'
        )
        onSuccess(res.data)
        onClose()
      }
    } catch (err: unknown) {
      console.error('Error saving announcement:', err)
      toastError('An unexpected error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const applyTemplate = (type: 'sunday' | 'vigil' | 'midweek' | 'exam') => {
    if (type === 'sunday') {
      setTitle('Sunday Worship Encounter: Divine Elevation')
      setCategory('WEEKLY SERVICES')
      setTime('08:00 AM')
      setLocation('NLT 5, Faculty of Law, ESUI')
      setContent(
        'Theme: Walking in Supernatural Wisdom.\n\nJoin us this Sunday as we worship the Lord and feed upon His word with power. Invite friends and roommates!'
      )
    } else if (type === 'vigil') {
      setTitle('Monthly Fellowship Night Vigil of Impartation')
      setCategory('WEEKLY SERVICES')
      setTime('10:00 PM')
      setLocation('NLT 5, Faculty of Law, ESUI')
      setContent(
        'An all-night atmosphere of intensive prayer, prophetic declarations, and worship encounter. Come with a heart prepared to tarry in prayer.'
      )
    } else if (type === 'midweek') {
      setTitle('Wednesday Bible Study & Expository Teaching')
      setCategory('BIBLE STUDY')
      setTime('04:50 PM')
      setLocation('NLT 5, Faculty of Law, ESUI')
      setContent(
        'Series: Fundamentals of the Faith.\n\nDeep interactive study into the Word of God. Do not miss this session!'
      )
    } else if (type === 'exam') {
      setTitle('First Semester Examination Prayer Clinic & Tutorials')
      setCategory('ACADEMIC & EXAMS')
      setTime('04:50 PM')
      setLocation('NLT 5, Faculty of Law, ESUI')
      setContent(
        'Academic revision classes across major faculties followed by focused prayer for retentive memory and peace in examination halls.'
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto border-border/60 bg-card p-0 shadow-2xl sm:max-w-2xl">
        <DialogHeader className="bg-surface-raised p-6 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isEditing ? 'Edit notice' : 'New notice'}</span>
          </div>
          <DialogTitle className="mt-1 font-sans text-xl font-semibold text-foreground sm:text-2xl">
            {isEditing ? 'Edit Fellowship Announcement' : 'Create Sunday Announcement'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Configure announcement details, schedule date, and event location.
          </DialogDescription>
        </DialogHeader>

        {/* Quick template chips (44px / 40px targets) */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-2 bg-surface-raised/60 px-6 py-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
              <Sparkles
                className="h-4 w-4 shrink-0 text-gold"
                aria-hidden="true"
              />
              <span>Templates:</span>
            </span>
            <button
              type="button"
              onClick={() => applyTemplate('sunday')}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-card px-3.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
            >
              Sunday Service
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('midweek')}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-card px-3.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
            >
              Wednesday Study
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('vigil')}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-card px-3.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
            >
              Night Vigil
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('exam')}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-card px-3.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
            >
              Exams Clinic
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="announcement-title" className="text-sm font-semibold text-foreground">
              Announcement Title <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="announcement-title"
              placeholder="e.g. Sunday Worship Encounter & Praise Harvest"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 bg-background text-base font-medium md:h-10"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="announcement-category"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Tag className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Category</span>
              </Label>
              <select
                id="announcement-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="flex h-11 w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm"
              >
                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="announcement-time"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Time</span>
              </Label>
              <Input
                id="announcement-time"
                placeholder="e.g. 08:00 AM or 04:50 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isSubmitting}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="announcement-eventDate"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Event / Service Date</span>
              </Label>
              <Input
                id="announcement-eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                aria-describedby="announcement-eventDate-hint"
                disabled={isSubmitting}
                className="bg-background"
              />
              <p id="announcement-eventDate-hint" className="text-[13px] text-muted-foreground">
                Displayed in the schedule summary of the notice.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="announcement-publishDate"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Publish Date</span>
              </Label>
              <Input
                id="announcement-publishDate"
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                aria-describedby="announcement-publishDate-hint"
                disabled={isSubmitting}
                className="bg-background"
              />
              <p id="announcement-publishDate-hint" className="text-[13px] text-muted-foreground">
                Date this bulletin is officially recorded for.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="announcement-location"
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>Venue / Location</span>
            </Label>
            <Input
              id="announcement-location"
              placeholder="e.g. NLT 5, Faculty of Law, ESUI"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
              className="bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="announcement-content" className="text-sm font-semibold text-foreground">
                Announcement Body &amp; Details
              </Label>
              <span className="text-[13px] text-muted-foreground">
                Supports paragraphs and bullet points (- or *)
              </span>
            </div>
            <textarea
              id="announcement-content"
              rows={5}
              placeholder="Enter the full announcement notice body. For lists, start lines with - or *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="w-full resize-y rounded-[var(--radius-control)] border border-input bg-background p-3 text-base font-normal leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* Toggles: Pin to Top & Publish Now */}
          <div className="space-y-3 rounded-[var(--radius-card)] bg-surface-raised p-4">
            <div className="flex min-h-11 items-center justify-between gap-4">
              <label
                htmlFor="announcement-pin"
                className="flex flex-1 cursor-pointer items-center gap-3"
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors',
                    isPinned
                      ? 'bg-gold/20 text-gold-foreground dark:bg-gold/15 dark:text-gold'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Pin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    Pin Notice to Top
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    Display first in both Exco Dashboard and Public Announcements
                  </span>
                </div>
              </label>
              <Checkbox
                id="announcement-pin"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(Boolean(checked))}
                disabled={isSubmitting}
                className="h-5 w-5"
              />
            </div>

            <div className="flex min-h-11 items-center justify-between gap-4">
              <label
                htmlFor="announcement-publish"
                className="flex flex-1 cursor-pointer items-center gap-3"
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors',
                    isPublished
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Send className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {isPublished ? 'Publish Now (Live)' : 'Save as Private Draft'}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {isPublished
                      ? 'Visible to public fellowship visitors at /updates'
                      : 'Saved privately in dashboard — invisible to public until published'}
                  </span>
                </div>
              </label>
              <Checkbox
                id="announcement-publish"
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(Boolean(checked))}
                disabled={isSubmitting}
                className="h-5 w-5"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
              className="min-h-11 w-full gap-2 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span>Saving…</span>
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : isPublished ? (
                'Publish Announcement'
              ) : (
                'Save Draft'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
