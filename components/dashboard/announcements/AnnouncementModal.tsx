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
import type { Announcement } from '@/types'
import {
  createAnnouncement,
  updateAnnouncement,
} from '@/app/actions/announcement-actions'
import { portableTextToString } from '@/lib/portable-text-helpers'
import { toast } from 'sonner'
import {
  Calendar,
  Clock,
  MapPin,
  Pin,
  Send,
  Loader2,
  FileText,
  Tag,
  Sparkles,
} from 'lucide-react'

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
  const [sendBroadcastOnPublish, setSendBroadcastOnPublish] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form on edit mode change
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || '')
      setCategory(announcement.category || 'WEEKLY SERVICES')
      setEventDate(announcement.eventDate || '')
      setPublishDate(announcement.publishDate || new Date().toISOString().split('T')[0])
      setTime(announcement.time || '08:00 AM')
      setLocation(announcement.location || 'NLT 5, Faculty of Law, ESUI')
      setContent(portableTextToString(announcement.content))
      setIsPinned(Boolean(announcement.isPinned))
      setIsPublished(announcement.isPublished !== false)
      setSendBroadcastOnPublish(Boolean(announcement.sendBroadcastOnPublish))
    } else {
      // Default new announcement values
      const today = new Date().toISOString().split('T')[0]
      setTitle('')
      setCategory('WEEKLY SERVICES')
      setEventDate(today)
      setPublishDate(today)
      setTime('08:00 AM')
      setLocation('NLT 5, Faculty of Law, ESUI')
      setContent('')
      setIsPinned(false)
      setIsPublished(true)
      setSendBroadcastOnPublish(false)
    }
  }, [announcement, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || title.trim().length < 3) {
      toast.error('Please enter a descriptive announcement title (at least 3 characters).')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && announcement?._id) {
        const res = await updateAnnouncement({
          _id: announcement._id,
          title: title.trim(),
          category,
          eventDate: eventDate || undefined,
          publishDate: publishDate || new Date().toISOString().split('T')[0],
          time: time.trim() || undefined,
          location: location.trim() || 'NLT 5, Faculty of Law, ESUI',
          content: content.trim(),
          isPinned,
          isPublished,
          sendBroadcastOnPublish,
        })

        if (!res.ok) {
          toast.error(res.error || 'Failed to update announcement.')
          return
        }

        toast.success('Announcement updated successfully!')
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
          sendBroadcastOnPublish,
        })
        onClose()
      } else {
        const res = await createAnnouncement({
          title: title.trim(),
          category,
          eventDate: eventDate || undefined,
          publishDate: publishDate || new Date().toISOString().split('T')[0],
          time: time.trim() || undefined,
          location: location.trim() || 'NLT 5, Faculty of Law, ESUI',
          content: content.trim(),
          isPinned,
          isPublished,
          sendBroadcastOnPublish,
        })

        if (!res.ok) {
          toast.error(res.error || 'Failed to create announcement.')
          return
        }

        toast.success(
          isPublished
            ? 'Announcement published successfully!'
            : 'Announcement saved as draft.'
        )
        onSuccess(res.data)
        onClose()
      }
    } catch (err: unknown) {
      console.error('Error saving announcement:', err)
      toast.error('An unexpected error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preset templates helper for fast CSGB workflow
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl p-0 gap-0 border-border bg-background shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <FileText className="w-4 h-4" />
            <span>{isEditing ? 'Edit Notice' : 'New Notice'}</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-serif font-bold text-foreground mt-1">
            {isEditing ? 'Edit Fellowship Announcement' : 'Create Sunday Announcement'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Configure announcement details, schedule date, event location, and broadcast preferences.
          </DialogDescription>
        </DialogHeader>

        {/* Quick template chips */}
        {!isEditing && (
          <div className="px-6 py-2.5 bg-muted/40 border-b flex items-center gap-2 overflow-x-auto text-xs">
            <span className="flex items-center gap-1 text-muted-foreground font-medium shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Templates:
            </span>
            <button
              type="button"
              onClick={() => applyTemplate('sunday')}
              className="px-2.5 py-1 rounded-full bg-background border hover:bg-accent hover:text-accent-foreground text-foreground transition-colors shrink-0"
            >
              Sunday Service
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('midweek')}
              className="px-2.5 py-1 rounded-full bg-background border hover:bg-accent hover:text-accent-foreground text-foreground transition-colors shrink-0"
            >
              Wednesday Study
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('vigil')}
              className="px-2.5 py-1 rounded-full bg-background border hover:bg-accent hover:text-accent-foreground text-foreground transition-colors shrink-0"
            >
              Night Vigil
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('exam')}
              className="px-2.5 py-1 rounded-full bg-background border hover:bg-accent hover:text-accent-foreground text-foreground transition-colors shrink-0"
            >
              Exams Clinic
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Headline / Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Announcement Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Sunday Worship Encounter & Praise Harvest"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium h-11"
              required
            />
          </div>

          {/* Category & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Category
              </Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              >
                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Time
              </Label>
              <Input
                id="time"
                placeholder="e.g. 08:00 AM or 04:50 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Event Date & Publish Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventDate" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Event / Service Date
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Displayed in the date badge of the announcement card.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publishDate" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Publish Date
              </Label>
              <Input
                id="publishDate"
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Date this bulletin is officially recorded for.
              </p>
            </div>
          </div>

          {/* Location / Venue */}
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Venue / Location
            </Label>
            <Input
              id="location"
              placeholder="e.g. NLT 5, Faculty of Law, ESUI"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Content / Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Announcement Body & Details
              </Label>
              <span className="text-xs text-muted-foreground">
                Supports multiple paragraphs and bullet points (- or *)
              </span>
            </div>
            <textarea
              id="content"
              rows={5}
              placeholder="Enter the full announcement notice body. For lists, start lines with - or *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 text-sm font-normal rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent leading-relaxed resize-y"
            />
          </div>

          {/* Toggles: Pin to Top & Publish Now */}
          <div className="rounded-xl border bg-card/60 p-4 space-y-3.5">
            {/* Pin to top */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isPinned ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                  <Pin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    Pin Notice to Top
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    Display at the very top of both Exco Dashboard and Public Announcements
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </label>

            <div className="border-t border-border/60" />

            {/* Publish Now */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isPublished ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    {isPublished ? 'Publish Now (Live)' : 'Save as Private Draft'}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {isPublished
                      ? 'Visible to public fellowship visitors at /announcements'
                      : 'Saved privately in dashboard — invisible to public until published'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </label>
          </div>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
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
