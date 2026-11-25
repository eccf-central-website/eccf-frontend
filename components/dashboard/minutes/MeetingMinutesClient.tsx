'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  Calendar,
  CheckSquare,
  Edit,
  Expand,
  EyeOff,
  FolderOpen,
  Loader2,
  Lock,
  MapPin,
  NotebookPen,
  Pin,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'
import {
  deleteMeetingMinute,
  toggleMeetingMinuteActionItem,
  toggleMeetingMinuteArchive,
  toggleMeetingMinutePin,
  toggleMeetingMinuteVisibility,
} from '@/app/actions/meeting-minutes-actions'
import { Button } from '@/components/dashboard/ui/button'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import {
  DataToolbar,
  type ActiveFilterChip,
} from '@/components/dashboard/ui/data-toolbar'
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
import { lagosDate } from '@/lib/dashboard/dates'
import {
  formatCount,
  formatDate,
  formatRelativeDay,
  toDateTimeAttr,
} from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'
import type { MeetingMinute, MeetingMinuteActionItem } from '@/types'
import MeetingMinuteDetailSheet, {
  MEETING_TYPE_VARIANT,
} from './MeetingMinuteDetailSheet'
import MeetingMinuteEditorSheet, {
  MEETING_MINUTE_TYPES,
} from './MeetingMinuteEditorSheet'

interface MeetingMinutesClientProps {
  initialMinutes: MeetingMinute[]
  canManage: boolean
  recorderDefaultName?: string
  today?: string
}

type MinuteStatusFilter = 'ALL' | 'POSTED' | 'DRAFT' | 'ARCHIVED'

const STATUS_TABS: { value: MinuteStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'POSTED', label: 'Posted to EXCOs' },
  { value: 'DRAFT', label: 'CSGB Drafts' },
  { value: 'ARCHIVED', label: 'Archived' },
]

function isValidIso(dateStr?: string): dateStr is string {
  if (!dateStr) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return !Number.isNaN(new Date(dateStr).getTime())
}

function sortMinutes(rows: MeetingMinute[]): MeetingMinute[] {
  return [...rows].sort((a, b) => {
    const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned))
    if (pinDiff !== 0) return pinDiff
    const dateDiff = (b.meetingDate || '').localeCompare(a.meetingDate || '')
    if (dateDiff !== 0) return dateDiff
    return (b.createdAt || b._createdAt || '').localeCompare(
      a.createdAt || a._createdAt || ''
    )
  })
}

export default function MeetingMinutesClient({
  initialMinutes,
  canManage,
  recorderDefaultName = '',
  today,
}: MeetingMinutesClientProps) {
  const [minutes, setMinutes] = useState<MeetingMinute[]>(() =>
    sortMinutes(initialMinutes)
  )

  useEffect(() => {
    setMinutes(sortMinutes(initialMinutes))
  }, [initialMinutes])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<MinuteStatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [folderFilter, setFolderFilter] = useState<string>('ALL')

  const [viewingMinute, setViewingMinute] = useState<MeetingMinute | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null)

  const [deletingMinute, setDeletingMinute] = useState<MeetingMinute | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null)
  const [pinBusyId, setPinBusyId] = useState<string | null>(null)
  const [archiveBusyId, setArchiveBusyId] = useState<string | null>(null)
  const [actionItemBusyKey, setActionItemBusyKey] = useState<string | null>(null)

  const eyebrowDate = today || formatDate(lagosDate())

  // Distinct folders across visible records (respecting non-archived by default unless viewing archived)
  const folderOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of minutes) {
      if (!canManage && (item.archived || !item.isPostedToExcos)) continue
      if (canManage && statusFilter !== 'ARCHIVED' && item.archived) continue
      const folderName = item.folder?.trim() || 'Unfiled'
      counts.set(folderName, (counts.get(folderName) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.name.localeCompare(a.name))
  }, [minutes, canManage, statusFilter])

  const allKnownFolders = useMemo(() => {
    const set = new Set<string>()
    for (const item of minutes) {
      if (item.folder?.trim()) set.add(item.folder.trim())
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [minutes])

  const stats = useMemo(() => {
    const active = minutes.filter((m) => !m.archived)
    const posted = active.filter((m) => m.isPostedToExcos).length
    const drafts = active.filter((m) => !m.isPostedToExcos).length
    const archived = minutes.filter((m) => Boolean(m.archived)).length
    const pinned = active.filter((m) => Boolean(m.isPinned)).length
    const openActions = active.reduce(
      (total, m) =>
        total + (m.actionItems || []).filter((ai) => ai.status !== 'done').length,
      0
    )
    return {
      activeTotal: active.length,
      posted,
      drafts,
      archived,
      pinned,
      openActions,
      foldersCount: allKnownFolders.length,
    }
  }, [minutes, allKnownFolders])

  const filteredMinutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const filtered = minutes.filter((item) => {
      if (!canManage) {
        if (!item.isPostedToExcos || item.archived) return false
      } else {
        if (statusFilter === 'ALL' && item.archived) return false
        if (statusFilter === 'POSTED' && (!item.isPostedToExcos || item.archived))
          return false
        if (statusFilter === 'DRAFT' && (item.isPostedToExcos || item.archived))
          return false
        if (statusFilter === 'ARCHIVED' && !item.archived) return false
      }

      if (typeFilter !== 'ALL' && item.meetingType !== typeFilter) return false

      if (folderFilter !== 'ALL') {
        const itemFolder = item.folder?.trim() || 'Unfiled'
        if (itemFolder !== folderFilter) return false
      }

      if (query) {
        const haystack = [
          item.title,
          item.folder,
          item.meetingType,
          item.venue,
          item.chairperson,
          item.recorderName,
          item.summary,
          item.body,
          ...(item.attendees || []),
          ...(item.decisions || []),
          ...(item.tags || []),
          ...(item.actionItems || []).flatMap((ai) => [ai.task, ai.owner || '']),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(query)) return false
      }

      return true
    })

    return sortMinutes(filtered)
  }, [minutes, canManage, statusFilter, typeFilter, folderFilter, searchQuery])

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      (canManage && statusFilter !== 'ALL') ||
      typeFilter !== 'ALL' ||
      folderFilter !== 'ALL'
  )

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    setFolderFilter('ALL')
  }

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const chips: ActiveFilterChip[] = []
    if (canManage && statusFilter !== 'ALL') {
      const label =
        STATUS_TABS.find((t) => t.value === statusFilter)?.label ?? statusFilter
      chips.push({
        id: 'status',
        label: 'Status',
        value: label,
        onRemove: () => setStatusFilter('ALL'),
      })
    }
    if (typeFilter !== 'ALL') {
      chips.push({
        id: 'type',
        label: 'Type',
        value: typeFilter,
        onRemove: () => setTypeFilter('ALL'),
      })
    }
    if (folderFilter !== 'ALL') {
      chips.push({
        id: 'folder',
        label: 'Folder',
        value: folderFilter,
        onRemove: () => setFolderFilter('ALL'),
      })
    }
    return chips
  }, [canManage, statusFilter, typeFilter, folderFilter])

  const upsertMinuteInState = (updated: MeetingMinute) => {
    setMinutes((prev) => {
      const idx = prev.findIndex((m) => m._id === updated._id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = updated
        return sortMinutes(copy)
      }
      return sortMinutes([updated, ...prev])
    })
    setViewingMinute((prev) => (prev?._id === updated._id ? updated : prev))
  }

  const handleToggleVisibility = async (item: MeetingMinute) => {
    if (!canManage) return
    const nextPosted = !item.isPostedToExcos
    setVisibilityBusyId(item._id)

    try {
      const res = await toggleMeetingMinuteVisibility(item._id, nextPosted)
      if (!res.ok) {
        toastError(res.error)
        return
      }
      upsertMinuteInState(res.data)
      toastSuccess(
        nextPosted
          ? `"${item.title}" posted for EXCO view.`
          : `"${item.title}" moved to CSGB drafts.`
      )
    } catch {
      toastError('Could not update visibility status.')
    } finally {
      setVisibilityBusyId(null)
    }
  }

  const handleTogglePin = async (item: MeetingMinute) => {
    if (!canManage) return
    const nextPinned = !item.isPinned
    setPinBusyId(item._id)

    try {
      const res = await toggleMeetingMinutePin(item._id, nextPinned)
      if (!res.ok) {
        toastError(res.error)
        return
      }
      upsertMinuteInState(res.data)
      toastSuccess(nextPinned ? 'Minute pinned to top.' : 'Minute unpinned.')
    } catch {
      toastError('Could not update pin status.')
    } finally {
      setPinBusyId(null)
    }
  }

  const handleToggleArchive = async (item: MeetingMinute) => {
    if (!canManage) return
    const nextArchived = !item.archived
    setArchiveBusyId(item._id)

    try {
      const res = await toggleMeetingMinuteArchive(item._id, nextArchived)
      if (!res.ok) {
        toastError(res.error)
        return
      }
      upsertMinuteInState(res.data)
      toastSuccess(
        nextArchived ? 'Minute archived.' : 'Minute restored to active records.'
      )
    } catch {
      toastError('Could not update archive status.')
    } finally {
      setArchiveBusyId(null)
    }
  }

  const handleToggleActionItem = async (
    minute: MeetingMinute,
    item: MeetingMinuteActionItem,
    index: number
  ) => {
    if (!canManage) return
    const keyOrIdx = item._key || String(index)
    const nextStatus = item.status === 'done' ? 'open' : 'done'
    setActionItemBusyKey(keyOrIdx)

    try {
      const res = await toggleMeetingMinuteActionItem(
        minute._id,
        item._key || index,
        nextStatus
      )
      if (!res.ok) {
        toastError(res.error)
        return
      }
      upsertMinuteInState(res.data)
      toastSuccess(
        nextStatus === 'done'
          ? 'Action item marked complete.'
          : 'Action item reopened.'
      )
    } catch {
      toastError('Could not update action item.')
    } finally {
      setActionItemBusyKey(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingMinute || !canManage) return
    setIsDeleting(true)
    try {
      const res = await deleteMeetingMinute(deletingMinute._id)
      if (!res.ok) {
        toastError(res.error)
        return
      }
      setMinutes((prev) => prev.filter((m) => m._id !== deletingMinute._id))
      if (viewingMinute?._id === deletingMinute._id) {
        setViewingMinute(null)
      }
      toastSuccess(`"${deletingMinute.title}" has been deleted.`)
      setDeletingMinute(null)
    } catch {
      toastError('An unexpected error occurred while deleting the minute.')
    } finally {
      setIsDeleting(false)
    }
  }

  const kpiItems = canManage
    ? [
        {
          id: 'all',
          label: 'Active minutes',
          value: formatCount(stats.activeTotal),
          rawValue: stats.activeTotal,
          caption: `${formatCount(stats.pinned)} pinned`,
          icon: <NotebookPen className="h-4 w-4" />,
          tone: 'neutral' as const,
          active: statusFilter === 'ALL',
          onClick: () => setStatusFilter('ALL'),
        },
        {
          id: 'posted',
          label: 'Posted to EXCOs',
          value: formatCount(stats.posted),
          rawValue: stats.posted,
          caption: 'Visible read-only to EXCOs',
          icon: <Send className="h-4 w-4" />,
          tone: 'success' as const,
          active: statusFilter === 'POSTED',
          onClick: () => setStatusFilter('POSTED'),
        },
        {
          id: 'drafts',
          label: 'CSGB Drafts',
          value: formatCount(stats.drafts),
          rawValue: stats.drafts,
          caption: 'CSGB-only visibility',
          icon: <Lock className="h-4 w-4" />,
          tone: 'warning' as const,
          active: statusFilter === 'DRAFT',
          onClick: () => setStatusFilter('DRAFT'),
        },
        {
          id: 'archived',
          label: 'Archived',
          value: formatCount(stats.archived),
          rawValue: stats.archived,
          caption: `${formatCount(stats.foldersCount)} folders`,
          icon: <Archive className="h-4 w-4" />,
          tone: 'neutral' as const,
          active: statusFilter === 'ARCHIVED',
          onClick: () => setStatusFilter('ARCHIVED'),
        },
      ]
    : [
        {
          id: 'posted-exco',
          label: 'Posted minutes',
          value: formatCount(stats.posted),
          rawValue: stats.posted,
          caption: 'Published by CSGB Secretariat',
          icon: <NotebookPen className="h-4 w-4" />,
          tone: 'primary' as const,
        },
        {
          id: 'pinned-exco',
          label: 'Pinned',
          value: formatCount(stats.pinned),
          rawValue: stats.pinned,
          caption: 'Key references',
          icon: <Pin className="h-4 w-4" />,
          tone: 'gold' as const,
        },
        {
          id: 'actions-exco',
          label: 'Open actions',
          value: formatCount(stats.openActions),
          rawValue: stats.openActions,
          caption: 'Across posted minutes',
          icon: <CheckSquare className="h-4 w-4" />,
          tone: 'warning' as const,
        },
        {
          id: 'folders-exco',
          label: 'Folders',
          value: formatCount(folderOptions.length),
          rawValue: folderOptions.length,
          caption: 'Sessions & committees',
          icon: <FolderOpen className="h-4 w-4" />,
          tone: 'neutral' as const,
        },
      ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrowDate}
        title="Meeting Minutes"
        description={
          canManage
            ? 'Write, organize, and post official meeting minutes. CSGB drafts remain private until posted for EXCO view.'
            : 'Official fellowship meeting minutes posted by CSGB for read-only executive review.'
        }
        badge={
          canManage ? (
            <StatusBadge variant="primary">CSGB Read &amp; Write</StatusBadge>
          ) : (
            <StatusBadge variant="info" icon={<Lock className="h-3.5 w-3.5" />}>
              EXCO Read-Only
            </StatusBadge>
          )
        }
        primaryAction={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setEditingMinute(null)
                setEditorOpen(true)
              }}
              className="min-h-11 gap-2 px-5 md:min-h-10"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>New minute</span>
            </Button>
          ) : undefined
        }
      />

      <KpiStrip ariaLabel="Meeting minutes summary" items={kpiItems} />

      {/* Folder organization quick-filter rail */}
      {folderOptions.length > 0 && (
        <div
          role="group"
          aria-label="Organize by folder"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <FolderOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Folders:</span>
          </span>
          <button
            type="button"
            aria-pressed={folderFilter === 'ALL'}
            onClick={() => setFolderFilter('ALL')}
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10',
              folderFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <span>All folders</span>
          </button>
          {folderOptions.map((folderItem) => {
            const active = folderFilter === folderItem.name
            return (
              <button
                key={folderItem.name}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setFolderFilter(active ? 'ALL' : folderItem.name)
                }
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-pill)] px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span>{folderItem.name}</span>
                <span
                  className={cn(
                    'tabular-nums text-[13px]',
                    active ? 'text-primary-foreground/85' : 'text-muted-foreground'
                  )}
                >
                  {formatCount(folderItem.count)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Search & Filters */}
      <DataToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchLabel="Search meeting minutes"
        searchPlaceholder="Search title, folder, attendees, decisions, tags…"
        activeFilterCount={activeFilterChips.length}
        activeFilters={activeFilterChips}
        onResetFilters={handleResetFilters}
        filterSheetTitle="Filter meeting minutes"
        filterSheetDescription="Narrow minutes by visibility status, meeting type, or folder."
        meta={`${formatCount(filteredMinutes.length)} ${
          filteredMinutes.length === 1 ? 'minute' : 'minutes'
        }`}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <div
                role="group"
                aria-label="Filter minutes by visibility status"
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
            )}

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger
                aria-label="Filter by meeting type"
                className="w-[185px] bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All meeting types</SelectItem>
                {MEETING_MINUTE_TYPES.map((typeOption) => (
                  <SelectItem key={typeOption} value={typeOption}>
                    {typeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {folderOptions.length > 1 && (
              <Select value={folderFilter} onValueChange={setFolderFilter}>
                <SelectTrigger
                  aria-label="Filter by folder"
                  className="w-[190px] bg-card"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All folders</SelectItem>
                  {folderOptions.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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
            {canManage && (
              <fieldset className="space-y-2">
                <legend className="text-[13px] font-semibold text-foreground">
                  Visibility Status
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
            )}

            <div className="space-y-2">
              <label
                htmlFor="mobile-minutes-type"
                className="block text-[13px] font-semibold text-foreground"
              >
                Meeting Type
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  id="mobile-minutes-type"
                  aria-label="Filter by meeting type"
                  className="w-full bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All meeting types</SelectItem>
                  {MEETING_MINUTE_TYPES.map((typeOption) => (
                    <SelectItem key={typeOption} value={typeOption}>
                      {typeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {folderOptions.length > 0 && (
              <div className="space-y-2">
                <label
                  htmlFor="mobile-minutes-folder"
                  className="block text-[13px] font-semibold text-foreground"
                >
                  Folder / Session
                </label>
                <Select value={folderFilter} onValueChange={setFolderFilter}>
                  <SelectTrigger
                    id="mobile-minutes-folder"
                    aria-label="Filter by folder"
                    className="w-full bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All folders</SelectItem>
                    {folderOptions.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        }
      />

      {/* Empty State vs Table & Mobile Cards */}
      {filteredMinutes.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center rounded-[var(--radius-card)] bg-card px-6 py-12 text-center shadow-sm"
        >
          <div
            aria-hidden="true"
            className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <NotebookPen className="h-6 w-6" />
          </div>
          <h2 className="font-sans text-lg font-semibold text-foreground [text-wrap:balance]">
            {hasActiveFilters
              ? 'No matching meeting minutes'
              : canManage
                ? 'No meeting minutes recorded yet'
                : 'No meeting minutes posted yet'}
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
            {hasActiveFilters
              ? 'No minutes match your current search or filter settings. Clear filters to view available records.'
              : canManage
                ? 'Start recording CSGB or General EXCO minutes. Keep drafts private to CSGB or post them for all EXCOs to read.'
                : 'Minutes written by the CSGB Secretariat will appear here once posted for executive view.'}
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
            canManage && (
              <Button
                type="button"
                onClick={() => {
                  setEditingMinute(null)
                  setEditorOpen(true)
                }}
                className="mt-5 min-h-11 gap-2 px-5 md:min-h-10"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Write first minute</span>
              </Button>
            )
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm md:block">
            <Table>
              <caption className="sr-only">
                Fellowship meeting minutes sorted with pinned records first
              </caption>
              <TableHeader sticky>
                <TableRow className="hover:bg-transparent">
                  <TableHead sticky scope="col" className="min-w-[260px]">
                    Minute &amp; Folder
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[175px]">
                    Meeting Date
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[155px]">
                    Type
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[195px]">
                    Visibility
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[130px]">
                    Action Items
                  </TableHead>
                  <TableHead sticky scope="col" className="w-[260px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMinutes.map((item) => {
                  const isPinned = Boolean(item.isPinned)
                  const isPosted = Boolean(item.isPostedToExcos)
                  const isArchived = Boolean(item.archived)
                  const validDate = isValidIso(item.meetingDate)
                  const items = item.actionItems || []
                  const doneCount = items.filter((ai) => ai.status === 'done').length
                  const openCount = items.length - doneCount
                  const folderName = item.folder?.trim() || 'Unfiled'

                  return (
                    <TableRow
                      key={item._id}
                      className={cn(
                        'transition-colors hover:bg-surface-raised/60',
                        isPinned && 'bg-gold/5'
                      )}
                    >
                      {/* Minute & Folder */}
                      <TableCell>
                        <div className="min-w-0 space-y-1">
                          <button
                            type="button"
                            onClick={() => setViewingMinute(item)}
                            className="line-clamp-1 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
                          >
                            {item.title}
                          </button>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span>{folderName}</span>
                            </span>
                            {item.venue && (
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate max-w-[200px]">{item.venue}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Meeting Date */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-[13px]">
                          {validDate ? (
                            <>
                              <time
                                dateTime={toDateTimeAttr(item.meetingDate)}
                                className="font-medium text-foreground tabular-nums"
                              >
                                {formatDate(item.meetingDate)}
                              </time>
                              <span className="text-muted-foreground">
                                {formatRelativeDay(item.meetingDate)}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not recorded</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <StatusBadge
                          variant={MEETING_TYPE_VARIANT[item.meetingType] ?? 'neutral'}
                          dot
                        >
                          {item.meetingType}
                        </StatusBadge>
                      </TableCell>

                      {/* Visibility / Status */}
                      <TableCell>
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
                          {isArchived ? (
                            <StatusBadge variant="neutral">Archived</StatusBadge>
                          ) : isPosted ? (
                            <StatusBadge variant="success">Posted to EXCOs</StatusBadge>
                          ) : (
                            <StatusBadge variant="warning">CSGB Draft</StatusBadge>
                          )}
                        </div>
                      </TableCell>

                      {/* Action Items */}
                      <TableCell>
                        {items.length === 0 ? (
                          <span className="text-[13px] text-muted-foreground">None</span>
                        ) : (
                          <div className="flex flex-col gap-0.5 text-[13px] tabular-nums">
                            <span className="font-medium text-foreground">
                              {formatCount(doneCount)}/{formatCount(items.length)} done
                            </span>
                            {openCount > 0 && (
                              <span className="text-muted-foreground">
                                {formatCount(openCount)} open
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setViewingMinute(item)}
                            aria-label={`Open ${item.title}`}
                            className="h-10 gap-1.5 px-2.5 text-[13px]"
                          >
                            <Expand className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Open</span>
                          </Button>

                          {canManage && (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleToggleVisibility(item)}
                                disabled={visibilityBusyId === item._id || isArchived}
                                aria-label={
                                  isPosted
                                    ? `Move ${item.title} to CSGB draft`
                                    : `Post ${item.title} to EXCOs`
                                }
                                title={
                                  isPosted ? 'Move back to CSGB draft' : 'Post for EXCO view'
                                }
                                className={cn(
                                  'h-10 w-10',
                                  isPosted && 'text-success hover:bg-success/10 hover:text-success'
                                )}
                              >
                                {visibilityBusyId === item._id ? (
                                  <Loader2
                                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                    aria-hidden="true"
                                  />
                                ) : isPosted ? (
                                  <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                                ) : (
                                  <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                                )}
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleTogglePin(item)}
                                disabled={pinBusyId === item._id || isArchived}
                                aria-label={isPinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
                                aria-pressed={isPinned}
                                title={isPinned ? 'Unpin from top' : 'Pin to top'}
                                className={cn(
                                  'h-10 w-10',
                                  isPinned && 'bg-gold/15 text-gold-foreground dark:text-gold'
                                )}
                              >
                                {pinBusyId === item._id ? (
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
                                onClick={() => {
                                  setEditingMinute(item)
                                  setEditorOpen(true)
                                }}
                                aria-label={`Edit ${item.title}`}
                                title="Edit minute"
                                className="h-10 w-10"
                              >
                                <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleToggleArchive(item)}
                                disabled={archiveBusyId === item._id}
                                aria-label={
                                  isArchived ? `Restore ${item.title}` : `Archive ${item.title}`
                                }
                                title={isArchived ? 'Restore from archive' : 'Archive minute'}
                                className="h-10 w-10"
                              >
                                {archiveBusyId === item._id ? (
                                  <Loader2
                                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                    aria-hidden="true"
                                  />
                                ) : isArchived ? (
                                  <ArchiveRestore className="h-4 w-4 shrink-0" aria-hidden="true" />
                                ) : (
                                  <Archive className="h-4 w-4 shrink-0" aria-hidden="true" />
                                )}
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingMinute(item)}
                                aria-label={`Delete ${item.title}`}
                                title="Delete minute"
                                className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                              </Button>
                            </>
                          )}
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
            {filteredMinutes.map((item) => {
              const isPinned = Boolean(item.isPinned)
              const isPosted = Boolean(item.isPostedToExcos)
              const isArchived = Boolean(item.archived)
              const validDate = isValidIso(item.meetingDate)
              const items = item.actionItems || []
              const doneCount = items.filter((ai) => ai.status === 'done').length
              const folderName = item.folder?.trim() || 'Unfiled'

              return (
                <li key={item._id}>
                  <article
                    className={cn(
                      'space-y-3.5 rounded-[var(--radius-card)] bg-card p-4 shadow-sm',
                      isPinned && 'ring-1 ring-inset ring-gold/40'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge
                        variant={MEETING_TYPE_VARIANT[item.meetingType] ?? 'neutral'}
                        dot
                      >
                        {item.meetingType}
                      </StatusBadge>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {isPinned && (
                          <StatusBadge
                            variant="gold"
                            icon={<Pin className="h-3.5 w-3.5" />}
                          >
                            Pinned
                          </StatusBadge>
                        )}
                        {isArchived ? (
                          <StatusBadge variant="neutral">Archived</StatusBadge>
                        ) : isPosted ? (
                          <StatusBadge variant="success">Posted to EXCOs</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning">CSGB Draft</StatusBadge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="font-sans text-base font-semibold leading-snug text-foreground">
                        {item.title}
                      </h2>
                      {item.summary && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                      {validDate && (
                        <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <time dateTime={toDateTimeAttr(item.meetingDate)}>
                            {formatDate(item.meetingDate)}
                          </time>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span>{folderName}</span>
                      </span>
                      {items.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <CheckSquare className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <span>
                            {formatCount(doneCount)}/{formatCount(items.length)} actions
                          </span>
                        </span>
                      )}
                    </div>

                    {canManage ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-4 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setViewingMinute(item)}
                            className="col-span-2 min-h-11 gap-1.5"
                          >
                            <Expand className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Open</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingMinute(item)
                              setEditorOpen(true)
                            }}
                            aria-label={`Edit ${item.title}`}
                            className="min-h-11"
                          >
                            <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeletingMinute(item)}
                            aria-label={`Delete ${item.title}`}
                            className="min-h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                          </Button>
                        </div>

                        {!isArchived && (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={isPosted ? 'outline' : 'default'}
                              onClick={() => handleToggleVisibility(item)}
                              disabled={visibilityBusyId === item._id}
                              className="min-h-11 flex-1 gap-1.5"
                            >
                              {visibilityBusyId === item._id ? (
                                <Loader2
                                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                  aria-hidden="true"
                                />
                              ) : isPosted ? (
                                <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                              ) : (
                                <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                              )}
                              <span>
                                {isPosted ? 'Move to CSGB Draft' : 'Post to EXCOs'}
                              </span>
                            </Button>

                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleTogglePin(item)}
                              disabled={pinBusyId === item._id}
                              aria-label={isPinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
                              aria-pressed={isPinned}
                              className={cn(
                                'h-11 w-11 shrink-0',
                                isPinned && 'bg-gold/15 text-gold-foreground dark:text-gold'
                              )}
                            >
                              {pinBusyId === item._id ? (
                                <Loader2
                                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Pin className="h-4 w-4 shrink-0" aria-hidden="true" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setViewingMinute(item)}
                        className="min-h-11 w-full gap-1.5"
                      >
                        <Expand className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Read meeting minute</span>
                      </Button>
                    )}
                  </article>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* Detail / Reader Sheet */}
      <MeetingMinuteDetailSheet
        minute={viewingMinute}
        open={Boolean(viewingMinute)}
        onOpenChange={(open) => {
          if (!open) setViewingMinute(null)
        }}
        canManage={canManage}
        busyAction={{
          visibilityId: visibilityBusyId,
          pinId: pinBusyId,
          archiveId: archiveBusyId,
          actionItemKey: actionItemBusyKey,
        }}
        onEdit={(minute) => {
          setViewingMinute(null)
          setEditingMinute(minute)
          setEditorOpen(true)
        }}
        onToggleVisibility={handleToggleVisibility}
        onTogglePin={handleTogglePin}
        onToggleArchive={handleToggleArchive}
        onToggleActionItem={handleToggleActionItem}
        onRequestDelete={(minute) => setDeletingMinute(minute)}
      />

      {/* CSGB Create / Edit Sheet */}
      {canManage && (
        <MeetingMinuteEditorSheet
          open={editorOpen}
          onOpenChange={setEditorOpen}
          minute={editingMinute}
          existingFolders={allKnownFolders}
          recorderDefaultName={recorderDefaultName}
          onSaved={upsertMinuteInState}
        />
      )}

      {/* CSGB Delete Confirmation Dialog */}
      {canManage && (
        <ConfirmDialog
          open={Boolean(deletingMinute)}
          onOpenChange={(open) => {
            if (!open) setDeletingMinute(null)
          }}
          tone="destructive"
          title={`Delete “${deletingMinute?.title ?? 'meeting minute'}”?`}
          description="This permanently removes the meeting minute record, its action items, and all notes from the secretariat archive."
          effectSummary={`Deleting “${deletingMinute?.title ?? 'this record'}” cannot be undone.`}
          confirmLabel="Delete minute"
          loading={isDeleting}
          loadingLabel="Deleting…"
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
