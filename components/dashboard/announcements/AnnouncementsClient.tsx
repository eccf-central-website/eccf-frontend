'use client'

import React, { useMemo, useState } from 'react'
import {
  Calendar,
  Clock,
  Edit,
  Expand,
  Loader2,
  MapPin,
  Megaphone,
  Pin,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'
import type { Announcement, ECCFSession } from '@/types'
import {
  deleteAnnouncement,
  togglePinAnnouncement,
} from '@/app/actions/announcement-actions'
import { broadcastAnnouncementManually } from '@/app/actions/announcement-broadcast-actions'
import { portableTextToString } from '@/lib/portable-text-helpers'
import { Button } from '@/components/dashboard/ui/button'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import { DataToolbar, type ActiveFilterChip } from '@/components/dashboard/ui/data-toolbar'
import { KpiStrip } from '@/components/dashboard/ui/kpi-strip'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { StatusBadge, type StatusBadgeVariant } from '@/components/dashboard/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatCount, formatDate, formatShortDate, toDateTimeAttr } from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'
import AnnouncementModal, { ANNOUNCEMENT_CATEGORIES } from './AnnouncementModal'

interface AnnouncementsClientProps {
  initialAnnouncements: Announcement[]
  session: ECCFSession
  today?: string
  subscriberCount?: number | null
}

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'PINNED'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLISHED', label: 'Live' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PINNED', label: 'Pinned' },
]

const CATEGORY_VARIANT: Record<string, StatusBadgeVariant> = {
  'WEEKLY SERVICES': 'primary',
  'ACADEMIC & EXAMS': 'info',
  'BIBLE STUDY': 'gold',
  'EXCO UPDATES': 'success',
  GENERAL: 'neutral',
}

function getCategoryLabel(category?: string): string {
  const key = (category || 'GENERAL').toUpperCase()
  const match = ANNOUNCEMENT_CATEGORIES.find((c) => c.value === key)
  return match?.label ?? category ?? 'General'
}

function isValidIso(dateStr?: string): dateStr is string {
  if (!dateStr) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return !Number.isNaN(new Date(dateStr).getTime())
}

export default function AnnouncementsClient({
  initialAnnouncements,
  today,
  subscriberCount = null,
}: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [viewingItem, setViewingItem] = useState<Announcement | null>(null)

  const [deletingItem, setDeletingItem] = useState<Announcement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [broadcastingItem, setBroadcastingItem] = useState<Announcement | null>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  const [pinningId, setPinningId] = useState<string | null>(null)

  const eyebrowDate = today || formatDate(lagosDate())

  // Filter and sort pinned rows first
  const filteredAnnouncements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return announcements
      .filter((item) => {
        if (statusFilter === 'PUBLISHED' && item.isPublished === false) return false
        if (statusFilter === 'DRAFT' && item.isPublished !== false) return false
        if (statusFilter === 'PINNED' && !item.isPinned) return false

        if (categoryFilter !== 'ALL') {
          const itemCat = (item.category || 'GENERAL').toUpperCase()
          if (itemCat !== categoryFilter) return false
        }

        if (query) {
          const titleMatch = (item.title || '').toLowerCase().includes(query)
          const locationMatch = (item.location || '').toLowerCase().includes(query)
          const bodyText = portableTextToString(item.content).toLowerCase()
          if (!titleMatch && !locationMatch && !bodyText.includes(query)) return false
        }

        return true
      })
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)))
  }, [announcements, searchQuery, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    const total = announcements.length
    const published = announcements.filter((a) => a.isPublished !== false).length
    const drafts = announcements.filter((a) => a.isPublished === false).length
    const pinned = announcements.filter((a) => a.isPinned).length
    return { total, published, drafts, pinned }
  }, [announcements])

  const hasActiveFilters = Boolean(
    searchQuery.trim() || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
  )

  const handleResetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('ALL')
    setStatusFilter('ALL')
  }

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const chips: ActiveFilterChip[] = []
    if (statusFilter !== 'ALL') {
      const label = STATUS_TABS.find((t) => t.value === statusFilter)?.label ?? statusFilter
      chips.push({
        id: 'status',
        label: 'Status',
        value: label,
        onRemove: () => setStatusFilter('ALL'),
      })
    }
    if (categoryFilter !== 'ALL') {
      chips.push({
        id: 'category',
        label: 'Category',
        value: getCategoryLabel(categoryFilter),
        onRemove: () => setCategoryFilter('ALL'),
      })
    }
    return chips
  }, [statusFilter, categoryFilter])

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
    if (viewingItem?._id === saved._id) {
      setViewingItem(saved)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    setIsDeleting(true)

    try {
      const res = await deleteAnnouncement(deletingItem._id)
      if (res.ok) {
        toastSuccess(`"${deletingItem.title}" has been deleted.`)
        setAnnouncements((prev) => prev.filter((a) => a._id !== deletingItem._id))
        if (viewingItem?._id === deletingItem._id) {
          setViewingItem(null)
        }
        setDeletingItem(null)
      } else {
        toastError(res.error || 'Failed to delete announcement.')
      }
    } catch {
      toastError('An unexpected error occurred while deleting.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTogglePin = async (item: Announcement) => {
    const nextPin = !item.isPinned
    setPinningId(item._id)

    setAnnouncements((prev) =>
      prev.map((a) => (a._id === item._id ? { ...a, isPinned: nextPin } : a))
    )
    if (viewingItem?._id === item._id) {
      setViewingItem((prev) => (prev ? { ...prev, isPinned: nextPin } : prev))
    }

    try {
      const res = await togglePinAnnouncement(item._id, Boolean(item.isPinned))
      if (res.ok) {
        toastSuccess(nextPin ? 'Pinned notice to top.' : 'Notice unpinned.')
      } else {
        setAnnouncements((prev) =>
          prev.map((a) => (a._id === item._id ? { ...a, isPinned: item.isPinned } : a))
        )
        if (viewingItem?._id === item._id) {
          setViewingItem((prev) => (prev ? { ...prev, isPinned: item.isPinned } : prev))
        }
        toastError(res.error || 'Failed to update pin state.')
      }
    } catch {
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, isPinned: item.isPinned } : a))
      )
      if (viewingItem?._id === item._id) {
        setViewingItem((prev) => (prev ? { ...prev, isPinned: item.isPinned } : prev))
      }
      toastError('Could not toggle pin state.')
    } finally {
      setPinningId(null)
    }
  }

  const handleBroadcastConfirm = async () => {
    if (!broadcastingItem) return
    setIsBroadcasting(true)

    try {
      const res = await broadcastAnnouncementManually(broadcastingItem._id)
      if (res.success) {
        toastSuccess(res.message || 'Announcement broadcast dispatched successfully.')
        const sentAt = new Date().toISOString()
        setAnnouncements((prev) =>
          prev.map((a) =>
            a._id === broadcastingItem._id
              ? { ...a, sentToSubscribers: true, sentAt }
              : a
          )
        )
        if (viewingItem?._id === broadcastingItem._id) {
          setViewingItem((prev) =>
            prev ? { ...prev, sentToSubscribers: true, sentAt } : prev
          )
        }
        setBroadcastingItem(null)
      } else {
        toastError(res.message || 'Failed to dispatch email broadcast.')
      }
    } catch {
      toastError('An unexpected error occurred during manual broadcast.')
    } finally {
      setIsBroadcasting(false)
    }
  }

  const audienceLabel =
    subscriberCount !== null
      ? `${formatCount(subscriberCount)} active ${subscriberCount === 1 ? 'subscriber' : 'subscribers'}`
      : 'all verified active fellowship subscribers'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrowDate}
        title="Announcements"
        description="Plan, schedule, and broadcast notices."
        primaryAction={
          <Button
            type="button"
            onClick={() => {
              setEditingAnnouncement(null)
              setIsModalOpen(true)
            }}
            className="min-h-11 gap-2 px-5"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>New announcement</span>
          </Button>
        }
      />

      {/* Interactive status summary strip */}
      <KpiStrip
        ariaLabel="Announcement counts"
        items={[
          {
            id: 'all',
            label: 'Total notices',
            value: formatCount(stats.total),
            rawValue: stats.total,
            icon: <Megaphone className="h-4 w-4" />,
            tone: 'neutral',
            active: statusFilter === 'ALL',
            onClick: () => setStatusFilter('ALL'),
          },
          {
            id: 'live',
            label: 'Live',
            value: formatCount(stats.published),
            rawValue: stats.published,
            tone: 'success',
            active: statusFilter === 'PUBLISHED',
            onClick: () => setStatusFilter('PUBLISHED'),
          },
          {
            id: 'drafts',
            label: 'Drafts',
            value: formatCount(stats.drafts),
            rawValue: stats.drafts,
            tone: 'warning',
            active: statusFilter === 'DRAFT',
            onClick: () => setStatusFilter('DRAFT'),
          },
          {
            id: 'pinned',
            label: 'Pinned',
            value: formatCount(stats.pinned),
            rawValue: stats.pinned,
            icon: <Pin className="h-4 w-4" />,
            tone: 'gold',
            active: statusFilter === 'PINNED',
            onClick: () => setStatusFilter('PINNED'),
          },
        ]}
      />

      {/* Filter & Search Toolbar */}
      <DataToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchLabel="Search announcements"
        searchPlaceholder="Search by title, content, or venue…"
        activeFilterCount={activeFilterChips.length}
        activeFilters={activeFilterChips}
        onResetFilters={handleResetFilters}
        filterSheetTitle="Filter announcements"
        filterSheetDescription="Filter notices by status or fellowship category."
        meta={`${formatCount(filteredAnnouncements.length)} ${filteredAnnouncements.length === 1 ? 'notice' : 'notices'}`}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter announcements by status"
              className="inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-surface-raised p-1"
            >
              {STATUS_TABS.map((tab) => {
                const active = statusFilter === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(tab.value)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-[calc(var(--radius-control)-2px)] px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10',
                      active
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                aria-label="Filter by category"
                className="w-[185px] bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
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
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-[13px] font-semibold text-foreground">
                Status
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_TABS.map((tab) => {
                  const active = statusFilter === tab.value
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(tab.value)}
                      className={cn(
                        'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface-raised text-foreground hover:bg-muted'
                      )}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label
                htmlFor="mobile-announcement-category"
                className="block text-[13px] font-semibold text-foreground"
              >
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  id="mobile-announcement-category"
                  aria-label="Filter by category"
                  className="w-full bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All categories</SelectItem>
                  {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      {/* Empty State vs Table (md+) & Mobile Cards */}
      {filteredAnnouncements.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center rounded-[var(--radius-card)] bg-card px-6 py-12 text-center shadow-sm"
        >
          <div
            aria-hidden="true"
            className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Megaphone className="h-6 w-6" />
          </div>
          <h2 className="font-sans text-lg font-semibold text-foreground [text-wrap:balance]">
            No announcements found
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
            {hasActiveFilters
              ? 'No notices match your current filters. Try resetting your search or category filter.'
              : 'Create your first fellowship announcement to broadcast notices, vigil schedules, or academic updates.'}
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="mt-5 min-h-11 px-5 md:min-h-10"
            >
              Reset filters
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                setEditingAnnouncement(null)
                setIsModalOpen(true)
              }}
              className="mt-5 min-h-11 gap-2 px-5 md:min-h-10"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Create announcement</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm md:block">
            <Table>
              <caption className="sr-only">
                Fellowship announcements sorted with pinned notices first
              </caption>
              <TableHeader sticky>
                <TableRow className="hover:bg-transparent">
                  <TableHead sticky scope="col" className="w-[170px]">
                    Status
                  </TableHead>
                  <TableHead sticky scope="col" className="min-w-[240px]">
                    Title
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[165px]">
                    Category
                  </TableHead>
                  <TableHead sticky scope="col" className="min-w-[175px]">
                    Schedule
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[140px]">
                    Broadcast
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[270px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map((item) => {
                  const catKey = (item.category || 'GENERAL').toUpperCase()
                  const catVariant = CATEGORY_VARIANT[catKey] ?? 'neutral'
                  const isLive = item.isPublished !== false
                  const isPinned = Boolean(item.isPinned)
                  const isBroadcasted = Boolean(item.sentToSubscribers)
                  const scheduleDate = item.eventDate || item.publishDate
                  const validSchedule = isValidIso(scheduleDate)

                  return (
                    <TableRow
                      key={item._id}
                      className={cn(
                        'transition-colors hover:bg-surface-raised/60',
                        isPinned && 'bg-gold/5'
                      )}
                    >
                      {/* Status */}
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isPinned && (
                            <span className="inline-flex items-center gap-1">
                              <Pin
                                className="h-4 w-4 shrink-0 text-gold"
                                aria-hidden="true"
                              />
                              <StatusBadge
                                variant="gold"
                                icon={<Pin className="h-3.5 w-3.5" />}
                              >
                                Pinned
                              </StatusBadge>
                            </span>
                          )}
                          <StatusBadge variant={isLive ? 'success' : 'warning'}>
                            {isLive ? 'Live' : 'Draft'}
                          </StatusBadge>
                        </div>
                      </TableCell>

                      {/* Title */}
                      <TableCell>
                        <div className="min-w-0 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => setViewingItem(item)}
                            className="line-clamp-1 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
                          >
                            {item.title}
                          </button>
                          {item.location && (
                            <p className="flex items-center gap-1 truncate text-[13px] text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span className="truncate">{item.location}</span>
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <StatusBadge variant={catVariant} dot>
                          {getCategoryLabel(item.category)}
                        </StatusBadge>
                      </TableCell>

                      {/* Schedule */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-[13px]">
                          {validSchedule ? (
                            <time
                              dateTime={toDateTimeAttr(scheduleDate)}
                              className="font-medium text-foreground tabular-nums"
                            >
                              {formatDate(scheduleDate)}
                            </time>
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                          {item.time && (
                            <span className="text-muted-foreground tabular-nums">
                              {item.time}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Broadcast */}
                      <TableCell>
                        {isBroadcasted ? (
                          <div className="flex flex-col gap-0.5">
                            <StatusBadge variant="success">Sent</StatusBadge>
                            {isValidIso(item.sentAt) && (
                              <time
                                dateTime={toDateTimeAttr(item.sentAt)}
                                className="text-[13px] text-muted-foreground tabular-nums"
                              >
                                {formatShortDate(item.sentAt)}
                              </time>
                            )}
                          </div>
                        ) : (
                          <StatusBadge variant="neutral">Not sent</StatusBadge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setViewingItem(item)}
                            aria-label={`Open ${item.title}`}
                            className="h-10 gap-1.5 px-2.5 text-[13px]"
                          >
                            <Expand className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Open</span>
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleTogglePin(item)}
                            disabled={pinningId === item._id}
                            aria-label={
                              isPinned ? `Unpin ${item.title}` : `Pin ${item.title}`
                            }
                            aria-pressed={isPinned}
                            title={isPinned ? 'Unpin from top' : 'Pin to top'}
                            className={cn(
                              'h-10 w-10',
                              isPinned && 'bg-gold/15 text-gold-foreground dark:text-gold'
                            )}
                          >
                            {pinningId === item._id ? (
                              <Loader2
                                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                aria-hidden="true"
                              />
                            ) : (
                              <Pin className="h-4 w-4 shrink-0" aria-hidden="true" />
                            )}
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setBroadcastingItem(item)}
                            disabled={!isLive}
                            aria-label={
                              !isLive
                                ? `Publish ${item.title} before broadcasting`
                                : isBroadcasted
                                  ? `Re-broadcast ${item.title}`
                                  : `Broadcast ${item.title}`
                            }
                            title={
                              !isLive
                                ? 'Publish notice first to broadcast'
                                : isBroadcasted
                                  ? 'Re-broadcast to subscribers'
                                  : 'Send to subscribers'
                            }
                            className="h-10 w-10"
                          >
                            <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingAnnouncement(item)
                              setIsModalOpen(true)
                            }}
                            aria-label={`Edit ${item.title}`}
                            title="Edit announcement"
                            className="h-10 w-10"
                          >
                            <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingItem(item)}
                            aria-label={`Delete ${item.title}`}
                            title="Delete announcement"
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

          {/* Mobile Card List (< md) */}
          <ul className="space-y-3 md:hidden">
            {filteredAnnouncements.map((item) => {
              const catKey = (item.category || 'GENERAL').toUpperCase()
              const catVariant = CATEGORY_VARIANT[catKey] ?? 'neutral'
              const isLive = item.isPublished !== false
              const isPinned = Boolean(item.isPinned)
              const isBroadcasted = Boolean(item.sentToSubscribers)
              const scheduleDate = item.eventDate || item.publishDate
              const validSchedule = isValidIso(scheduleDate)
              const bodyPreview = portableTextToString(item.content)

              return (
                <li key={item._id}>
                  <article
                    className={cn(
                      'space-y-3.5 rounded-[var(--radius-card)] bg-card p-4 shadow-sm',
                      isPinned && 'ring-1 ring-inset ring-gold/40'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge variant={catVariant} dot>
                        {getCategoryLabel(item.category)}
                      </StatusBadge>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {isPinned && (
                          <span className="inline-flex items-center gap-1">
                            <Pin className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                            <StatusBadge
                              variant="gold"
                              icon={<Pin className="h-3.5 w-3.5" />}
                            >
                              Pinned
                            </StatusBadge>
                          </span>
                        )}
                        <StatusBadge variant={isLive ? 'success' : 'warning'}>
                          {isLive ? 'Live' : 'Draft'}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="font-sans text-base font-semibold leading-snug text-foreground">
                        {item.title}
                      </h2>
                      {bodyPreview && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {bodyPreview}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                      {validSchedule && (
                        <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <time dateTime={toDateTimeAttr(scheduleDate)}>
                            {formatDate(scheduleDate)}
                          </time>
                        </span>
                      )}
                      {item.time && (
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <span>{item.time}</span>
                        </span>
                      )}
                      {item.location && (
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <span className="truncate">{item.location}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <StatusBadge variant={isBroadcasted ? 'success' : 'neutral'}>
                        {isBroadcasted ? 'Broadcast sent' : 'Not broadcasted'}
                      </StatusBadge>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleTogglePin(item)}
                        disabled={pinningId === item._id}
                        aria-label={isPinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
                        aria-pressed={isPinned}
                        className={cn(
                          'h-11 w-11',
                          isPinned && 'bg-gold/15 text-gold-foreground dark:text-gold'
                        )}
                      >
                        {pinningId === item._id ? (
                          <Loader2
                            className="h-4 w-4 animate-spin motion-reduce:animate-none"
                            aria-hidden="true"
                          />
                        ) : (
                          <Pin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setViewingItem(item)}
                        className="col-span-2 min-h-11 gap-1.5"
                      >
                        <Expand className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Open</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingAnnouncement(item)
                          setIsModalOpen(true)
                        }}
                        aria-label={`Edit ${item.title}`}
                        className="min-h-11"
                      >
                        <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDeletingItem(item)}
                        aria-label={`Delete ${item.title}`}
                        className="min-h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant={isBroadcasted ? 'outline' : 'default'}
                      onClick={() => setBroadcastingItem(item)}
                      disabled={!isLive}
                      className="min-h-11 w-full gap-2"
                    >
                      <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        {isBroadcasted ? 'Re-send email broadcast' : 'Broadcast to subscribers'}
                      </span>
                    </Button>
                  </article>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* Preview RecordSheet */}
      <RecordSheet
        open={Boolean(viewingItem)}
        onOpenChange={(open) => {
          if (!open) setViewingItem(null)
        }}
        headerExtra={
          viewingItem && (
            <div className="flex flex-wrap items-center gap-2">
              {viewingItem.isPinned && (
                <StatusBadge variant="gold" icon={<Pin className="h-3.5 w-3.5" />}>
                  Pinned
                </StatusBadge>
              )}
              <StatusBadge variant={viewingItem.isPublished !== false ? 'success' : 'warning'}>
                {viewingItem.isPublished !== false ? 'Live' : 'Draft'}
              </StatusBadge>
              <StatusBadge
                variant={
                  CATEGORY_VARIANT[(viewingItem.category || 'GENERAL').toUpperCase()] ??
                  'neutral'
                }
                dot
              >
                {getCategoryLabel(viewingItem.category)}
              </StatusBadge>
            </div>
          )
        }
        title={viewingItem?.title ?? 'Announcement'}
        description={
          viewingItem && isValidIso(viewingItem.eventDate || viewingItem.publishDate) ? (
            <time dateTime={toDateTimeAttr((viewingItem.eventDate || viewingItem.publishDate)!)}>
              {formatDate((viewingItem.eventDate || viewingItem.publishDate)!)}
              {viewingItem.time ? ` · ${viewingItem.time}` : ''}
            </time>
          ) : (
            viewingItem?.time || 'Notice details'
          )
        }
        footer={
          viewingItem && (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingItem(viewingItem)}
                className="min-h-11 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Delete</span>
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingAnnouncement(viewingItem)
                    setIsModalOpen(true)
                  }}
                  className="min-h-11 gap-1.5"
                >
                  <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Edit</span>
                </Button>
                <Button
                  type="button"
                  disabled={viewingItem.isPublished === false}
                  onClick={() => setBroadcastingItem(viewingItem)}
                  className="min-h-11 gap-1.5"
                >
                  <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{viewingItem.sentToSubscribers ? 'Re-broadcast' : 'Broadcast'}</span>
                </Button>
              </div>
            </div>
          )
        }
      >
        {viewingItem && (
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-3 rounded-[var(--radius-card)] bg-surface-raised p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[13px] font-medium text-muted-foreground">Schedule</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {isValidIso(viewingItem.eventDate) ? (
                    <time dateTime={toDateTimeAttr(viewingItem.eventDate)}>
                      {formatDate(viewingItem.eventDate)}
                    </time>
                  ) : (
                    'Not specified'
                  )}
                  {viewingItem.time ? ` · ${viewingItem.time}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted-foreground">Publish date</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {isValidIso(viewingItem.publishDate) ? (
                    <time dateTime={toDateTimeAttr(viewingItem.publishDate)}>
                      {formatDate(viewingItem.publishDate)}
                    </time>
                  ) : (
                    'Not recorded'
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[13px] font-medium text-muted-foreground">Location</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {viewingItem.location || 'NLT 5, Faculty of Law, ESUI'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[13px] font-medium text-muted-foreground">
                  Email broadcast
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <StatusBadge variant={viewingItem.sentToSubscribers ? 'success' : 'neutral'}>
                    {viewingItem.sentToSubscribers ? 'Sent to subscribers' : 'Not broadcasted yet'}
                  </StatusBadge>
                  {isValidIso(viewingItem.sentAt) && (
                    <time
                      dateTime={toDateTimeAttr(viewingItem.sentAt)}
                      className="text-[13px] text-muted-foreground tabular-nums"
                    >
                      {formatDate(viewingItem.sentAt)}
                    </time>
                  )}
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notice content
              </h3>
              <p className="whitespace-pre-wrap text-[15px] leading-[1.6] text-foreground [text-wrap:pretty]">
                {portableTextToString(viewingItem.content) || 'No notice body provided.'}
              </p>
            </div>
          </div>
        )}
      </RecordSheet>

      {/* Create / Edit Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        announcement={editingAnnouncement}
        onSuccess={handleSaveSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null)
        }}
        tone="destructive"
        title={`Delete “${deletingItem?.title ?? 'announcement'}”?`}
        description="This permanently removes the announcement from the Exco Dashboard and the public fellowship website."
        effectSummary={`Deleting “${deletingItem?.title ?? 'this notice'}” cannot be undone.`}
        confirmLabel="Delete notice"
        loading={isDeleting}
        loadingLabel="Deleting…"
        onConfirm={handleDeleteConfirm}
      />

      {/* Broadcast Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(broadcastingItem)}
        onOpenChange={(open) => {
          if (!open) setBroadcastingItem(null)
        }}
        tone={broadcastingItem?.sentToSubscribers ? 'warning' : 'primary'}
        title={`Broadcast “${broadcastingItem?.title ?? 'announcement'}”?`}
        description={`This sends an email bulletin containing the schedule, venue, and full text of “${broadcastingItem?.title ?? 'this notice'}” to ${audienceLabel}.`}
        effectSummary={
          broadcastingItem?.sentToSubscribers
            ? `This notice was already broadcasted earlier. Confirming will send another email bulletin to ${audienceLabel}.`
            : `Email delivery starts immediately for ${audienceLabel}.`
        }
        confirmLabel="Send broadcast"
        loading={isBroadcasting}
        loadingLabel="Sending broadcast…"
        onConfirm={handleBroadcastConfirm}
      />
    </div>
  )
}
