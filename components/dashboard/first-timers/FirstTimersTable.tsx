'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, useId } from 'react'
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DoorClosed,
  Eye,
  GraduationCap,
  Loader2,
  MessageCircle,
  Phone,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import type { ECCFSession, FirstTimerRow } from '@/types'
import { isHallScoped, isOutreachLeader } from '@/lib/dashboard/rbac'
import { lagosDate, lagosMonthStart } from '@/lib/dashboard/dates'
import {
  formatCount,
  formatDate,
  formatRelativeDay,
  toDateTimeAttr,
} from '@/lib/dashboard/format'
import { Button } from '@/components/dashboard/ui/button'
import { KpiStrip, type KpiStripItem } from '@/components/dashboard/ui/kpi-strip'
import {
  DataToolbar,
  type ActiveFilterChip,
} from '@/components/dashboard/ui/data-toolbar'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import {
  Table,
  TableBody,
  TableCaption,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/dashboard/ui/tooltip'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { toast } from 'sonner'
import { toggleFirstTimerFollowUpAction } from '@/app/actions/first-timer-actions'
import { cn } from '@/lib/utils'

interface FirstTimersTableProps {
  rows: FirstTimerRow[]
  session: ECCFSession
}

type StatusFilter = 'all' | 'pending' | 'followed_up'

function cleanNigerianPhone(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length >= 13) return digits
  if (digits.startsWith('0') && digits.length >= 11) return `234${digits.slice(1)}`
  return digits
}

function isValidIso(iso?: string | null): iso is string {
  if (!iso) return false
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso)
  return !Number.isNaN(parsed.getTime())
}

function safeFormatDate(iso?: string | null): string {
  if (!isValidIso(iso)) return iso || '—'
  return formatDate(iso)
}

function safeFormatRelativeDay(iso?: string | null): string {
  if (!isValidIso(iso)) return iso || '—'
  return formatRelativeDay(iso)
}

function isInCurrentLagosMonth(iso: string | undefined, monthStart: string): boolean {
  if (!isValidIso(iso)) return false
  const day = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : lagosDate(new Date(iso))
  return day >= monthStart
}

export default function FirstTimersTable({ rows, session }: FirstTimersTableProps) {
  const [localRows, setLocalRows] = useState<FirstTimerRow[]>(rows)
  const [searchQuery, setSearchQuery] = useState('')
  const [hallFilter, setHallFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    rows.some((r) => !r.followedUp) ? 'pending' : 'all'
  )
  const [selectedVisitor, setSelectedVisitor] = useState<FirstTimerRow | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [notesInput, setNotesInput] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const mobileHallId = useId()
  const mobileLevelId = useId()
  const notesFieldId = useId()

  const isHallRep = isHallScoped(session.role)
  const isOutreach = isOutreachLeader(session)

  useEffect(() => {
    setLocalRows(rows)
  }, [rows])

  useEffect(() => {
    setNotesInput(selectedVisitor?.followUpNotes || '')
  }, [selectedVisitor?._id, selectedVisitor?.followUpNotes])

  const availableHalls = useMemo(() => {
    const halls = new Set<string>()
    localRows.forEach((r) => {
      if (r.hall && r.hall.trim()) halls.add(r.hall.trim())
    })
    return Array.from(halls).sort()
  }, [localRows])

  const availableLevels = useMemo(() => {
    const levels = new Set<string>()
    localRows.forEach((r) => {
      if (r.level && r.level.trim()) levels.add(r.level.trim())
    })
    return Array.from(levels).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [localRows])

  const monthStart = useMemo(() => lagosMonthStart(), [])

  const totalCount = localRows.length
  const thisMonthCount = useMemo(
    () => localRows.filter((r) => isInCurrentLagosMonth(r.dateVisited, monthStart)).length,
    [localRows, monthStart]
  )
  const pendingCount = useMemo(
    () => localRows.filter((r) => !r.followedUp).length,
    [localRows]
  )
  const followedUpCount = useMemo(
    () => localRows.filter((r) => Boolean(r.followedUp)).length,
    [localRows]
  )

  const filteredRows = useMemo(() => {
    return localRows.filter((row) => {
      if (statusFilter === 'pending' && row.followedUp) return false
      if (statusFilter === 'followed_up' && !row.followedUp) return false

      if (!isHallRep && hallFilter !== 'all') {
        if (!row.hall || row.hall.toLowerCase() !== hallFilter.toLowerCase()) return false
      }

      if (levelFilter !== 'all') {
        if (!row.level || row.level.toLowerCase() !== levelFilter.toLowerCase()) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = row.fullName.toLowerCase().includes(q)
        const matchHall = (row.hall || '').toLowerCase().includes(q)
        const matchRoom = (row.roomNumber || '').toLowerCase().includes(q)
        const matchDept = (row.department || '').toLowerCase().includes(q)
        const matchLevel = (row.level || '').toLowerCase().includes(q)
        const matchPhone = (row.phoneNumber || '').toLowerCase().includes(q)
        const matchNotes = (row.followUpNotes || '').toLowerCase().includes(q)
        const matchFollowedBy = (row.followedUpBy || '').toLowerCase().includes(q)
        if (
          !matchName &&
          !matchHall &&
          !matchRoom &&
          !matchDept &&
          !matchLevel &&
          !matchPhone &&
          !matchNotes &&
          !matchFollowedBy
        ) {
          return false
        }
      }

      return true
    })
  }, [localRows, isHallRep, hallFilter, levelFilter, statusFilter, searchQuery])

  const copyPhoneNumber = async (phone: string, id: string) => {
    if (!phone) return
    try {
      await navigator.clipboard.writeText(phone)
      setCopiedId(id)
      toast.success(`Copied ${phone} to clipboard`)
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current))
      }, 2000)
    } catch {
      toast.error('Unable to copy phone number.')
    }
  }

  const buildWhatsAppLink = (visitor: FirstTimerRow) => {
    const phone = cleanNigerianPhone(visitor.phoneNumber)
    if (!phone) return '#'
    const firstName =
      visitor.firstName?.trim() || visitor.fullName.split(' ')[0] || visitor.fullName
    const senderIdentity = isHallRep
      ? `your ${session.hall || 'hall'} representative`
      : 'the Outreach & Follow-up Team'

    const greeting = `Hello ${firstName}, greetings in Christ! This is ${senderIdentity} from Evangelical Christian Campus Fellowship (ECCF). We were truly delighted to connect with you during fellowship! We're checking in to see how you are settling into ${visitor.hall ? visitor.hall : 'campus'} and how your studies are going. Please let us know if there is anything you need or if you have any prayer points. God bless you richly!`

    return `https://wa.me/${phone}?text=${encodeURIComponent(greeting)}`
  }

  const handleToggleFollowUp = async (
    visitor: FirstTimerRow,
    nextStatus: boolean,
    customNotes?: string
  ) => {
    setIsUpdatingId(visitor._id)
    const prevRows = localRows
    const prevSelected = selectedVisitor
    const nowIso = new Date().toISOString()
    const leaderIdentifier = session.name
      ? `${session.name} (${session.excoPosition || session.role})`
      : session.excoPosition || session.role

    setLocalRows((prev) =>
      prev.map((r) =>
        r._id === visitor._id
          ? {
              ...r,
              followedUp: nextStatus,
              followedUpAt: nextStatus ? nowIso : undefined,
              followedUpBy: nextStatus ? leaderIdentifier : undefined,
              followUpNotes: customNotes !== undefined ? customNotes.trim() || undefined : r.followUpNotes,
            }
          : r
      )
    )

    if (selectedVisitor?._id === visitor._id) {
      setSelectedVisitor((prev) =>
        prev
          ? {
              ...prev,
              followedUp: nextStatus,
              followedUpAt: nextStatus ? nowIso : undefined,
              followedUpBy: nextStatus ? leaderIdentifier : undefined,
              followUpNotes:
                customNotes !== undefined ? customNotes.trim() || undefined : prev.followUpNotes,
            }
          : null
      )
    }

    try {
      const res = await toggleFirstTimerFollowUpAction({
        firstTimerId: visitor._id,
        followedUp: nextStatus,
        notes: customNotes,
      })

      if (res.ok) {
        toast.success(
          nextStatus
            ? `Marked ${visitor.fullName} as contacted.`
            : `Reopened follow-up for ${visitor.fullName}.`
        )
      } else {
        setLocalRows(prevRows)
        setSelectedVisitor(prevSelected)
        toast.error(res.error || 'Failed to update follow-up status.')
      }
    } catch {
      setLocalRows(prevRows)
      setSelectedVisitor(prevSelected)
      toast.error('An unexpected error occurred while updating status.')
    } finally {
      setIsUpdatingId(null)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedVisitor) return
    setIsSavingNotes(true)

    try {
      const res = await toggleFirstTimerFollowUpAction({
        firstTimerId: selectedVisitor._id,
        followedUp: Boolean(selectedVisitor.followedUp),
        notes: notesInput,
      })

      if (res.ok) {
        const trimmed = notesInput.trim() || undefined
        setLocalRows((prev) =>
          prev.map((r) =>
            r._id === selectedVisitor._id ? { ...r, followUpNotes: trimmed } : r
          )
        )
        setSelectedVisitor((prev) =>
          prev ? { ...prev, followUpNotes: trimmed } : null
        )
        toast.success('Follow-up notes saved.')
      } else {
        toast.error(res.error || 'Failed to save notes.')
      }
    } catch {
      toast.error('Failed to save notes.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setHallFilter('all')
    setLevelFilter('all')
    setStatusFilter('all')
  }

  const kpiItems: KpiStripItem[] = [
    {
      id: 'total',
      label: isHallRep ? 'Total in hall' : 'Total first-timers',
      value: formatCount(totalCount),
      rawValue: totalCount,
      caption: `${formatCount(thisMonthCount)} this month`,
      icon: <UserPlus />,
      tone: 'primary',
      onClick: () => setStatusFilter('all'),
      active: statusFilter === 'all',
      ariaLabel: `Show all ${totalCount} first-timers (${thisMonthCount} this month)`,
    },
    {
      id: 'pending',
      label: 'Needs follow-up',
      value: formatCount(pendingCount),
      rawValue: pendingCount,
      caption: pendingCount > 0 ? 'Reach out within 48 hours' : 'All visitors contacted',
      icon: <Clock />,
      tone: pendingCount > 0 ? 'warning' : 'neutral',
      onClick: () => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'),
      active: statusFilter === 'pending',
      ariaLabel: `Filter to ${pendingCount} visitors needing follow-up`,
    },
    {
      id: 'contacted',
      label: 'Contacted',
      value: formatCount(followedUpCount),
      rawValue: followedUpCount,
      caption:
        totalCount > 0
          ? `${Math.round((followedUpCount / totalCount) * 100)}% reached`
          : 'No visits recorded',
      icon: <CheckCircle2 />,
      tone: 'success',
      onClick: () =>
        setStatusFilter(statusFilter === 'followed_up' ? 'all' : 'followed_up'),
      active: statusFilter === 'followed_up',
      ariaLabel: `Filter to ${followedUpCount} contacted visitors`,
    },
    {
      id: 'halls',
      label: isHallRep ? 'Assigned hall' : 'Halls reached',
      value: isHallRep ? session.hall || 'Hall' : formatCount(availableHalls.length),
      rawValue: isHallRep ? session.hall || 'Hall' : availableHalls.length,
      caption: isHallRep ? 'Hall-scoped roster' : 'Campus halls represented',
      icon: <Building2 />,
      tone: 'neutral',
    },
  ]

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'pending', label: 'Needs follow-up', count: pendingCount },
    { key: 'followed_up', label: 'Contacted', count: followedUpCount },
  ]

  const activeFilters: ActiveFilterChip[] = []
  if (statusFilter !== 'all') {
    activeFilters.push({
      id: 'status',
      label: 'Status',
      value: statusFilter === 'pending' ? 'Needs follow-up' : 'Contacted',
      onRemove: () => setStatusFilter('all'),
    })
  }
  if (!isHallRep && hallFilter !== 'all') {
    activeFilters.push({
      id: 'hall',
      label: 'Hall',
      value: hallFilter,
      onRemove: () => setHallFilter('all'),
    })
  }
  if (levelFilter !== 'all') {
    activeFilters.push({
      id: 'level',
      label: 'Level',
      value: `${levelFilter} Level`,
      onRemove: () => setLevelFilter('all'),
    })
  }

  const desktopFilters =
    !isHallRep || availableLevels.length > 0 ? (
      <>
        {!isHallRep && (
          <Select value={hallFilter} onValueChange={setHallFilter}>
            <SelectTrigger
              aria-label="Filter by hall"
              className="w-[170px] bg-card"
            >
              <SelectValue placeholder="All halls" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All halls</SelectItem>
              {availableHalls.map((hall) => (
                <SelectItem key={hall} value={hall}>
                  {hall}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {availableLevels.length > 0 && (
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger
              aria-label="Filter by level"
              className="w-[150px] bg-card"
            >
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {availableLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level} Level
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </>
    ) : undefined

  const mobileFilters =
    !isHallRep || availableLevels.length > 0 ? (
      <div className="space-y-4">
        {!isHallRep && (
          <div className="space-y-1.5">
            <label
              htmlFor={mobileHallId}
              className="block text-[13px] font-medium text-foreground"
            >
              Campus hall
            </label>
            <Select value={hallFilter} onValueChange={setHallFilter}>
              <SelectTrigger
                id={mobileHallId}
                aria-label="Filter by hall"
                className="w-full"
              >
                <SelectValue placeholder="All halls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All halls</SelectItem>
                {availableHalls.map((hall) => (
                  <SelectItem key={hall} value={hall}>
                    {hall}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {availableLevels.length > 0 && (
          <div className="space-y-1.5">
            <label
              htmlFor={mobileLevelId}
              className="block text-[13px] font-medium text-foreground"
            >
              Academic level
            </label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger
                id={mobileLevelId}
                aria-label="Filter by level"
                className="w-full"
              >
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {availableLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level} Level
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    ) : undefined

  const hasSheetFilters = Boolean(mobileFilters)
  const modalActiveFilterCount =
    (!isHallRep && hallFilter !== 'all' ? 1 : 0) + (levelFilter !== 'all' ? 1 : 0)

  const renderEmptyState = () => {
    if (localRows.length === 0) {
      return (
        <EmptyState
          variant="nothing-yet"
          title="No first-timers recorded yet"
          description={
            isHallRep
              ? `Visitor records for ${session.hall || 'your hall'} will appear here once submitted.`
              : 'Submissions from the Connect page will appear here for follow-up.'
          }
          icon={<Users />}
        />
      )
    }

    if (statusFilter === 'pending' && !searchQuery && hallFilter === 'all' && levelFilter === 'all') {
      return (
        <EmptyState
          variant="nothing-yet"
          title="Every visitor has been contacted"
          description="No first-timers are currently waiting for follow-up."
          icon={<CheckCircle2 />}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusFilter('all')}
              className="min-h-11 md:min-h-10"
            >
              View all visitors ({formatCount(totalCount)})
            </Button>
          }
        />
      )
    }

    return (
      <EmptyState
        variant="no-results"
        title="No matching first-timers"
        description="Try clearing your search query or adjusting the hall, level, or status filters."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="min-h-11 md:min-h-10"
          >
            Clear filters
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <KpiStrip items={kpiItems} ariaLabel="First-timers summary" />

      {/* Segmented Status Tabs + Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter by follow-up status"
            className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-[var(--radius-control)] bg-card p-1 shadow-sm"
          >
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-3.5 py-2 text-sm font-medium transition-colors [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:min-h-10',
                    active
                      ? 'bg-surface-raised text-foreground ring-1 ring-inset ring-primary/35'
                      : 'text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'inline-flex min-w-6 items-center justify-center rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[13px] font-medium leading-none tabular-nums',
                      active
                        ? 'bg-primary/15 text-accent-foreground dark:text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {formatCount(tab.count)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isHallRep && (
              <StatusBadge variant="primary" icon={<Building2 />}>
                Scoped to {session.hall || 'your hall'}
              </StatusBadge>
            )}
            {isOutreach && (
              <StatusBadge variant="neutral" icon={<UserCheck />}>
                Outreach coordinator
              </StatusBadge>
            )}
          </div>
        </div>

        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchLabel="Search first-timers"
          searchPlaceholder="Search name, hall, room, department, or phone…"
          filters={desktopFilters}
          mobileFilters={hasSheetFilters ? mobileFilters : undefined}
          activeFilterCount={modalActiveFilterCount}
          activeFilters={activeFilters}
          onResetFilters={handleResetFilters}
          filterSheetTitle="Filter first-timers"
          filterSheetDescription="Narrow the follow-up queue by hall or academic level."
          meta={`${formatCount(filteredRows.length)} of ${formatCount(totalCount)} visitors`}
        />
      </div>

      <h2 className="sr-only">First-timers roster</h2>

      {filteredRows.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm md:block">
            <Table>
              <TableCaption className="sr-only">
                First-timers follow-up queue with contact options and follow-up status
              </TableCaption>
              <TableHeader sticky>
                <TableRow className="hover:bg-transparent">
                  <TableHead sticky scope="col">
                    Visitor
                  </TableHead>
                  <TableHead sticky scope="col">
                    Hall &amp; level
                  </TableHead>
                  <TableHead sticky scope="col">
                    Phone
                  </TableHead>
                  <TableHead sticky scope="col">
                    First visit
                  </TableHead>
                  <TableHead sticky scope="col" className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const isBusy = isUpdatingId === row._id
                  const isCopied = copiedId === row._id
                  const cleanTel = row.phoneNumber?.replace(/[^\d+]/g, '') || ''

                  return (
                    <TableRow
                      key={row._id}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      {/* Visitor & Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedVisitor(row)}
                              className="text-left font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                            >
                              {row.fullName}
                            </button>
                            <StatusBadge variant={row.followedUp ? 'success' : 'warning'}>
                              {row.followedUp ? 'Contacted' : 'Needs follow-up'}
                            </StatusBadge>
                          </div>
                          {row.followedUp && row.followedUpBy && (
                            <p className="text-[13px] text-muted-foreground">
                              By {row.followedUpBy}
                              {row.followedUpAt ? ` · ${safeFormatDate(row.followedUpAt)}` : ''}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Hall & Level */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {row.hall || 'Off-campus / unassigned'}
                            {row.roomNumber ? ` · ${row.roomNumber}` : ''}
                          </span>
                          <span className="text-[13px] text-muted-foreground">
                            {row.department || 'Department not specified'}
                            {row.level ? ` · ${row.level}L` : ''}
                          </span>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        {row.phoneNumber ? (
                          <div className="inline-flex items-center gap-1">
                            <span className="select-all text-sm font-medium tabular-nums text-foreground">
                              {row.phoneNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyPhoneNumber(row.phoneNumber!, row._id)}
                              aria-label={`Copy phone number for ${row.fullName}`}
                              title="Copy phone number"
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:min-h-10 md:min-w-10"
                            >
                              {isCopied ? (
                                <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                              ) : (
                                <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">
                            No phone number
                          </span>
                        )}
                      </TableCell>

                      {/* First Visit */}
                      <TableCell className="whitespace-nowrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex flex-col">
                              <time
                                dateTime={
                                  isValidIso(row.dateVisited)
                                    ? toDateTimeAttr(row.dateVisited)
                                    : undefined
                                }
                                title={safeFormatDate(row.dateVisited)}
                                className="text-sm font-medium text-foreground"
                              >
                                {safeFormatRelativeDay(row.dateVisited)}
                              </time>
                              <span className="text-[13px] text-muted-foreground">
                                {safeFormatDate(row.dateVisited)}
                              </span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{safeFormatDate(row.dateVisited)}</TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant={row.followedUp ? 'ghost' : 'outline'}
                            disabled={isBusy}
                            onClick={() => handleToggleFollowUp(row, !row.followedUp)}
                            aria-label={
                              row.followedUp
                                ? `Reopen follow-up for ${row.fullName}`
                                : `Mark ${row.fullName} as contacted`
                            }
                            className={cn(
                              'min-h-11 px-3 text-sm md:min-h-10',
                              row.followedUp && 'text-success hover:bg-success/10 hover:text-success'
                            )}
                          >
                            {isBusy ? (
                              <Loader2
                                className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                                aria-hidden="true"
                              />
                            ) : row.followedUp ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>Contacted</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>Mark contacted</span>
                              </>
                            )}
                          </Button>

                          {row.phoneNumber && (
                            <>
                              <a
                                href={buildWhatsAppLink(row)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Message ${row.fullName} on WhatsApp`}
                                title="Open WhatsApp chat with pastoral greeting"
                                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors [touch-action:manipulation] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:min-h-10"
                              >
                                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>WhatsApp</span>
                              </a>

                              <a
                                href={`tel:${cleanTel}`}
                                aria-label={`Call ${row.fullName}`}
                                title={`Call ${row.fullName}`}
                                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-raised text-foreground transition-colors [touch-action:manipulation] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:min-h-10 md:min-w-10"
                              >
                                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                              </a>
                            </>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedVisitor(row)}
                            aria-label={`View details for ${row.fullName}`}
                            title="View visitor details and notes"
                            className="min-h-11 min-w-11 shrink-0 md:min-h-10 md:min-w-10"
                          >
                            <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {filteredRows.map((row) => {
              const isBusy = isUpdatingId === row._id
              const isCopied = copiedId === row._id
              const cleanTel = row.phoneNumber?.replace(/[^\d+]/g, '') || ''

              return (
                <article
                  key={row._id}
                  className="space-y-3 rounded-[var(--radius-card)] bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-sans text-base font-semibold leading-snug text-foreground">
                        {row.fullName}
                      </h3>
                      <p className="text-[13px] text-muted-foreground">
                        Visited{' '}
                        <time
                          dateTime={
                            isValidIso(row.dateVisited)
                              ? toDateTimeAttr(row.dateVisited)
                              : undefined
                          }
                        >
                          {safeFormatDate(row.dateVisited)} ({safeFormatRelativeDay(row.dateVisited)})
                        </time>
                      </p>
                    </div>
                    <StatusBadge variant={row.followedUp ? 'success' : 'warning'}>
                      {row.followedUp ? 'Contacted' : 'Needs follow-up'}
                    </StatusBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] bg-surface-raised p-3 text-[13px]">
                    <div className="min-w-0">
                      <span className="block text-[13px] text-muted-foreground">
                        Hall &amp; room
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <DoorClosed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">
                          {row.hall || 'Off-campus'}
                          {row.roomNumber ? ` · ${row.roomNumber}` : ''}
                        </span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[13px] text-muted-foreground">
                        Department
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">
                          {row.department || '—'}
                          {row.level ? ` (${row.level}L)` : ''}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className={row.phoneNumber ? 'select-all font-medium tabular-nums text-foreground' : 'text-[13px]'}>
                        {row.phoneNumber || 'No phone number'}
                      </span>
                    </span>
                    {row.phoneNumber && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => copyPhoneNumber(row.phoneNumber!, row._id)}
                        aria-label={`Copy phone number for ${row.fullName}`}
                        className="min-h-11 min-w-11 shrink-0"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-success" aria-hidden="true" />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    )}
                  </div>

                  {row.followedUp && row.followedUpBy && (
                    <p className="text-[13px] text-muted-foreground">
                      Followed up by{' '}
                      <span className="font-medium text-foreground">{row.followedUpBy}</span>
                    </p>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    {row.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <a
                          href={buildWhatsAppLink(row)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Message ${row.fullName} on WhatsApp`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors [touch-action:manipulation] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                        >
                          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${cleanTel}`}
                          aria-label={`Call ${row.fullName}`}
                          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-raised text-foreground transition-colors [touch-action:manipulation] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                        >
                          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={row.followedUp ? 'secondary' : 'outline'}
                        disabled={isBusy}
                        onClick={() => handleToggleFollowUp(row, !row.followedUp)}
                        className={cn(
                          'min-h-11 flex-1 text-sm',
                          row.followedUp && 'bg-success/10 text-success hover:bg-success/15'
                        )}
                      >
                        {isBusy ? (
                          <Loader2
                            className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                            aria-hidden="true"
                          />
                        ) : row.followedUp ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Contacted</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Mark contacted</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedVisitor(row)}
                        className="min-h-11 px-4 text-sm"
                      >
                        <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Details</span>
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {/* Visitor Detail RecordSheet */}
      <RecordSheet
        open={Boolean(selectedVisitor)}
        onOpenChange={(open) => {
          if (!open) setSelectedVisitor(null)
        }}
        title={selectedVisitor?.fullName ?? 'First-timer profile'}
        description={
          selectedVisitor
            ? `Visited ${safeFormatDate(selectedVisitor.dateVisited)} (${safeFormatRelativeDay(selectedVisitor.dateVisited)})`
            : undefined
        }
        headerExtra={
          selectedVisitor ? (
            <StatusBadge variant={selectedVisitor.followedUp ? 'success' : 'warning'}>
              {selectedVisitor.followedUp ? 'Contacted' : 'Needs follow-up'}
            </StatusBadge>
          ) : undefined
        }
        footer={
          selectedVisitor ? (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={
                  isSavingNotes ||
                  notesInput === (selectedVisitor.followUpNotes || '')
                }
                onClick={handleSaveNotes}
                className="min-h-11 w-full sm:w-auto md:min-h-10"
              >
                {isSavingNotes ? (
                  <>
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <span>Saving notes…</span>
                  </>
                ) : (
                  <span>Save notes</span>
                )}
              </Button>
              <Button
                type="button"
                variant={selectedVisitor.followedUp ? 'outline' : 'default'}
                disabled={isUpdatingId === selectedVisitor._id}
                onClick={() =>
                  handleToggleFollowUp(
                    selectedVisitor,
                    !selectedVisitor.followedUp,
                    notesInput !== (selectedVisitor.followUpNotes || '')
                      ? notesInput
                      : undefined
                  )
                }
                className="min-h-11 w-full sm:w-auto md:min-h-10"
              >
                {isUpdatingId === selectedVisitor._id ? (
                  <>
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <span>Updating…</span>
                  </>
                ) : selectedVisitor.followedUp ? (
                  <span>Reopen follow-up</span>
                ) : (
                  <>
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Mark contacted</span>
                  </>
                )}
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedVisitor && (
          <div className="space-y-5">
            {/* Follow-up Status Summary */}
            <div className="rounded-[var(--radius-card)] bg-surface-raised p-4">
              <div className="flex items-start gap-3">
                {selectedVisitor.followedUp ? (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock
                    className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground dark:text-warning"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedVisitor.followedUp
                      ? 'Follow-up completed'
                      : 'Needs follow-up within 48 hours'}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {selectedVisitor.followedUp
                      ? `Handled by ${selectedVisitor.followedUpBy || 'Leader'}${
                          selectedVisitor.followedUpAt
                            ? ` on ${safeFormatDate(selectedVisitor.followedUpAt)}`
                            : ''
                        }`
                      : 'Reach out via WhatsApp or a brief call and log pastoral notes below.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            {selectedVisitor.phoneNumber ? (
              <div className="space-y-2">
                <a
                  href={buildWhatsAppLink(selectedVisitor)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors [touch-action:manipulation] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:min-h-10"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Open WhatsApp pastoral greeting</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedVisitor.phoneNumber.replace(/[^\d+]/g, '')}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors [touch-action:manipulation] hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:min-h-10"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Call</span>
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      copyPhoneNumber(selectedVisitor.phoneNumber!, selectedVisitor._id)
                    }
                    className="min-h-11 gap-2 md:min-h-10"
                  >
                    {copiedId === selectedVisitor._id ? (
                      <>
                        <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Copy phone</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="rounded-[var(--radius-control)] bg-surface-raised px-4 py-3 text-sm text-muted-foreground">
                No phone number recorded for this visitor.
              </p>
            )}

            {/* Visitor Profile Details */}
            <dl className="divide-y divide-border/40 rounded-[var(--radius-card)] bg-surface-raised px-4 py-1 text-sm">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Date visited</dt>
                <dd className="font-medium text-foreground">
                  <time
                    dateTime={
                      isValidIso(selectedVisitor.dateVisited)
                        ? toDateTimeAttr(selectedVisitor.dateVisited)
                        : undefined
                    }
                  >
                    {safeFormatDate(selectedVisitor.dateVisited)}
                  </time>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Hostel / hall</dt>
                <dd className="font-medium text-foreground">
                  {selectedVisitor.hall || 'Not specified'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Room</dt>
                <dd className="font-medium text-foreground">
                  {selectedVisitor.roomNumber || 'Not specified'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Department</dt>
                <dd className="font-medium text-foreground">
                  {selectedVisitor.department || 'Not specified'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Level</dt>
                <dd className="font-medium text-foreground">
                  {selectedVisitor.level ? `${selectedVisitor.level} Level` : 'Not specified'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Phone number</dt>
                <dd className="select-all font-medium tabular-nums text-foreground">
                  {selectedVisitor.phoneNumber || 'No phone number'}
                </dd>
              </div>
            </dl>

            {/* Pastoral Follow-Up Notes */}
            <div className="space-y-2">
              <label
                htmlFor={notesFieldId}
                className="block text-sm font-medium text-foreground"
              >
                Pastoral follow-up notes
              </label>
              <textarea
                id={notesFieldId}
                rows={4}
                placeholder="e.g. Called and prayed together; invited to Wednesday Bible study; connected with Hall Rep."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2.5 text-base leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
              <p className="text-[13px] text-muted-foreground">
                Save notes anytime, or mark contacted directly to store both together.
              </p>
            </div>
          </div>
        )}
      </RecordSheet>
    </div>
  )
}
