'use client'

import React, { useState, useMemo } from 'react'
import type { Announcement, ECCFSession } from '@/types'
import {
  deleteAnnouncement,
  togglePinAnnouncement,
} from '@/app/actions/announcement-actions'
import { portableTextToString } from '@/lib/portable-text-helpers'
import { broadcastAnnouncementManually } from '@/app/actions/announcement-broadcast-actions'
import AnnouncementModal from './AnnouncementModal'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Pin,
  Calendar,
  Clock,
  MapPin,
  Mail,
  CheckCircle2,
  Trash2,
  Edit,
  AlertCircle,
  Megaphone,
  Loader2,
  Send,
} from 'lucide-react'

interface AnnouncementsClientProps {
  initialAnnouncements: Announcement[]
  session: ECCFSession
}

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'PINNED'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'WEEKLY SERVICES': {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
  },
  'ACADEMIC & EXAMS': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-400',
  },
  'BIBLE STUDY': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
  },
  'EXCO UPDATES': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  GENERAL: {
    bg: 'bg-slate-50 dark:bg-slate-900/60',
    text: 'text-slate-700 dark:text-slate-400',
  },
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Date not specified'
  try {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2])
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export default function AnnouncementsClient({
  initialAnnouncements,
}: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  // Confirmation Dialogs State
  const [deletingItem, setDeletingItem] = useState<Announcement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [broadcastingItem, setBroadcastingItem] = useState<Announcement | null>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  const [pinningId, setPinningId] = useState<string | null>(null)

  // Filtered & Searched announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      // Status Filter
      if (statusFilter === 'PUBLISHED' && item.isPublished === false) return false
      if (statusFilter === 'DRAFT' && item.isPublished !== false) return false
      if (statusFilter === 'PINNED' && !item.isPinned) return false

      // Category Filter
      if (categoryFilter !== 'ALL') {
        const itemCat = (item.category || 'GENERAL').toUpperCase()
        if (itemCat !== categoryFilter) return false
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const titleMatch = (item.title || '').toLowerCase().includes(query)
        const locationMatch = (item.location || '').toLowerCase().includes(query)
        const bodyText = portableTextToString(item.content).toLowerCase()
        const contentMatch = bodyText.includes(query)
        return titleMatch || locationMatch || contentMatch
      }

      return true
    })
  }, [announcements, searchQuery, categoryFilter, statusFilter])

  // Count stats
  const stats = useMemo(() => {
    const total = announcements.length
    const published = announcements.filter((a) => a.isPublished !== false).length
    const drafts = announcements.filter((a) => a.isPublished === false).length
    const pinned = announcements.filter((a) => a.isPinned).length
    const broadcasted = announcements.filter((a) => a.sentToSubscribers).length
    return { total, published, drafts, pinned, broadcasted }
  }, [announcements])

  // Handle Save from Modal
  const handleSaveSuccess = (saved: Announcement) => {
    setAnnouncements((prev) => {
      const idx = prev.findIndex((a) => a._id === saved._id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = saved
        return updated
      }
      return [saved, ...prev]
    })
  }

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    setIsDeleting(true)

    try {
      const res = await deleteAnnouncement(deletingItem._id)
      if (res.ok) {
        toast.success(`"${deletingItem.title}" has been deleted.`)
        setAnnouncements((prev) => prev.filter((a) => a._id !== deletingItem._id))
        setDeletingItem(null)
      } else {
        toast.error(res.error || 'Failed to delete announcement.')
      }
    } catch {
      toast.error('An unexpected error occurred while deleting.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Pin Toggle
  const handleTogglePin = async (item: Announcement) => {
    const nextPin = !item.isPinned
    setPinningId(item._id)

    // Optimistic UI update
    setAnnouncements((prev) =>
      prev.map((a) => (a._id === item._id ? { ...a, isPinned: nextPin } : a))
    )

    try {
      const res = await togglePinAnnouncement(item._id, Boolean(item.isPinned))
      if (res.ok) {
        toast.success(nextPin ? 'Pinned notice to top!' : 'Notice unpinned.')
      } else {
        // Rollback
        setAnnouncements((prev) =>
          prev.map((a) => (a._id === item._id ? { ...a, isPinned: item.isPinned } : a))
        )
        toast.error(res.error || 'Failed to update pin state.')
      }
    } catch {
      // Rollback
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, isPinned: item.isPinned } : a))
      )
      toast.error('Could not toggle pin state.')
    } finally {
      setPinningId(null)
    }
  }

  // Handle Broadcast to Subscribers
  const handleBroadcastConfirm = async () => {
    if (!broadcastingItem) return
    setIsBroadcasting(true)

    try {
      const res = await broadcastAnnouncementManually(broadcastingItem._id)
      if (res.success) {
        toast.success(res.message || 'Announcement broadcast dispatched successfully!')
        // Update local status
        setAnnouncements((prev) =>
          prev.map((a) =>
            a._id === broadcastingItem._id
              ? { ...a, sentToSubscribers: true, sentAt: new Date().toISOString() }
              : a
          )
        )
        setBroadcastingItem(null)
      } else {
        toast.error(res.message || 'Failed to dispatch email broadcast.')
      }
    } catch {
      toast.error('An unexpected error occurred during manual broadcast.')
    } finally {
      setIsBroadcasting(false)
    }
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Top Controls: Stats Bar & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Metric Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card shadow-xs text-xs font-medium text-foreground">
            <Megaphone className="w-3.5 h-3.5 text-primary" />
            <span>Total:</span>
            <strong className="text-foreground">{stats.total}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live:</span>
            <strong>{stats.published}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Drafts:</span>
            <strong>{stats.drafts}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-xs font-medium text-indigo-700 dark:text-indigo-400">
            <Pin className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pinned:</span>
            <strong>{stats.pinned}</strong>
          </div>
        </div>

        {/* Create Button */}
        <Button
          onClick={() => {
            setEditingAnnouncement(null)
            setIsModalOpen(true)
          }}
          className="w-full sm:w-auto h-11 px-5 shadow-sm font-semibold tracking-wide flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Announcement</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements by title, content, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Categories</option>
            <option value="WEEKLY SERVICES">Weekly Services</option>
            <option value="ACADEMIC & EXAMS">Academic & Exams</option>
            <option value="BIBLE STUDY">Bible Study</option>
            <option value="EXCO UPDATES">Exco Updates</option>
            <option value="GENERAL">General Fellowship</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center bg-muted/60 p-1 rounded-md text-xs">
            {(['ALL', 'PUBLISHED', 'DRAFT', 'PINNED'] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1.5 rounded font-medium transition-colors ${
                  statusFilter === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'ALL'
                  ? 'All'
                  : tab === 'PUBLISHED'
                  ? 'Live'
                  : tab === 'DRAFT'
                  ? 'Draft'
                  : 'Pinned'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements List / Cards */}
      {filteredAnnouncements.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-card shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-foreground">
            No announcements found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No notices match your current filters. Try resetting your search or category filter.'
              : 'Create your first fellowship announcement to broadcast notices, vigil schedules, or academic updates.'}
          </p>
          {(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL') ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('ALL')
                setStatusFilter('ALL')
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setEditingAnnouncement(null)
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Announcement
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnnouncements.map((item) => {
            const cat = (item.category || 'GENERAL').toUpperCase()
            const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.GENERAL
            const isLive = item.isPublished !== false
            const isPinned = Boolean(item.isPinned)
            const isBroadcasted = Boolean(item.sentToSubscribers)
            const bodyPreview = portableTextToString(item.content)

            return (
              <div
                key={item._id}
                className={`flex flex-col justify-between rounded-2xl bg-card shadow-sm transition-all duration-200 hover:shadow-md ${
                  isPinned ? 'ring-2 ring-indigo-500/30' : ''
                }`}
              >
                {/* Card Header & Badges */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Category Tag */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${colors.bg} ${colors.text}`}
                    >
                      {item.category || 'GENERAL'}
                    </span>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5">
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
                          <Pin className="w-3 h-3 fill-indigo-500" />
                          Pinned
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          isLive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                        {isLive ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-lg font-bold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Event Details: Date, Time, Venue */}
                  <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
                    {item.eventDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                          {formatDate(item.eventDate)}
                        </span>
                      </div>
                    )}

                    {item.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{item.time}</span>
                      </div>
                    )}

                    {item.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Snippet */}
                  {bodyPreview && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                      {bodyPreview}
                    </p>
                  )}
                </div>

                {/* Card Footer: Broadcast Indicator & Actions */}
                <div className="p-4 sm:p-5 pt-0 space-y-3">
                  {/* Subscriber broadcast indicator */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    {isBroadcasted ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Broadcast sent</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Not broadcasted</span>
                      </div>
                    )}

                    {/* Quick Pin Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(item)}
                      disabled={pinningId === item._id}
                      title={isPinned ? 'Unpin from top' : 'Pin to top'}
                      className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                        isPinned
                          ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400'
                          : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {pinningId === item._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-indigo-600' : ''}`} />
                      )}
                    </button>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2">
                    {/* Broadcast Button */}
                    <Button
                      variant={isBroadcasted ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => setBroadcastingItem(item)}
                      disabled={!isLive}
                      title={
                        !isLive
                          ? 'Must publish notice first to broadcast'
                          : isBroadcasted
                          ? 'Re-broadcast to all subscribers'
                          : 'Send notice to subscribers via email'
                      }
                      className="flex-1 text-xs h-8 font-medium gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isBroadcasted ? 'Re-send' : 'Broadcast'}</span>
                    </Button>

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAnnouncement(item)
                        setIsModalOpen(true)
                      }}
                      className="text-xs h-8 px-2.5"
                    >
                      <Edit className="w-3.5 h-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingItem(item)}
                      className="text-xs h-8 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        announcement={editingAnnouncement}
        onSuccess={handleSaveSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deletingItem)} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Delete Announcement?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete &ldquo;{deletingItem?.title}&rdquo;?
              This will remove the announcement from the Exco Dashboard and the public fellowship website.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingItem(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Notice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Confirmation Dialog */}
      <Dialog
        open={Boolean(broadcastingItem)}
        onOpenChange={(open) => !open && setBroadcastingItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Mail className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Broadcast Notice to Subscribers?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will send an email bulletin with the event date, venue, and full body text of &ldquo;{broadcastingItem?.title}&rdquo; to all verified active fellowship subscribers.
            </DialogDescription>
          </DialogHeader>

          {broadcastingItem?.sentToSubscribers && (
            <div className="p-3 bg-amber-500/10 rounded-lg flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Notice: This announcement was already broadcasted earlier. Confirming will dispatch another email bulletin.
              </span>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setBroadcastingItem(null)}
              disabled={isBroadcasting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBroadcastConfirm}
              disabled={isBroadcasting}
              className="gap-2 font-medium"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Dispatch Email Broadcast
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
