'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import {
  Check,
  Clock,
  Copy,
  Expand,
  HeartHandshake,
  Shield,
  Users,
} from 'lucide-react'
import type { PrayerRequest } from '@/types'
import { PrayingHands } from '@/components/dashboard/icons/PrayingHands'
import { Button } from '@/components/dashboard/ui/button'
import { DataToolbar, type ActiveFilterChip } from '@/components/dashboard/ui/data-toolbar'
import { KpiStrip } from '@/components/dashboard/ui/kpi-strip'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { lagosDate, lagosDaysAgo } from '@/lib/dashboard/dates'
import {
  formatCount,
  formatDate,
  formatRelativeDay,
  toDateTimeAttr,
} from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

type PrayerFilterTab = 'all' | 'this_week' | 'named' | 'anonymous'
type SortOrder = 'newest' | 'oldest'

interface PrayerRequestsFeedProps {
  requests: PrayerRequest[]
  todayIso?: string
}

const FILTER_OPTIONS: { value: PrayerFilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'this_week', label: 'This week' },
  { value: 'named', label: 'Named' },
  { value: 'anonymous', label: 'Anonymous' },
]

function isValidIso(dateStr: string | undefined): dateStr is string {
  if (!dateStr) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return !Number.isNaN(new Date(dateStr).getTime())
}

function toLagosCalendarDay(dateStr: string | undefined): string | null {
  if (!isValidIso(dateStr)) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return lagosDate(new Date(dateStr))
}

function isAnonymousRequest(item: PrayerRequest): boolean {
  return !item.name || item.name.trim().toLowerCase() === 'anonymous'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return (parts[0]?.[0] || 'P').toUpperCase()
}

export default function PrayerRequestsFeed({
  requests,
  todayIso,
}: PrayerRequestsFeedProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<PrayerFilterTab>('all')
  const [sortBy, setSortBy] = useState<SortOrder>('newest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null)

  const referenceNow = useMemo(() => {
    if (todayIso && /^\d{4}-\d{2}-\d{2}$/.test(todayIso)) {
      return new Date(`${todayIso}T12:00:00Z`)
    }
    return new Date()
  }, [todayIso])

  const weekStartDay = useMemo(() => lagosDaysAgo(6, referenceNow), [referenceNow])

  const metrics = useMemo(() => {
    let thisWeek = 0
    let anonymous = 0
    let named = 0

    for (const r of requests) {
      if (isAnonymousRequest(r)) anonymous++
      else named++

      const day = toLagosCalendarDay(r.dateSubmitted)
      if (day && day >= weekStartDay) thisWeek++
    }

    return {
      total: requests.length,
      thisWeek,
      anonymous,
      named,
    }
  }, [requests, weekStartDay])

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return requests
      .filter((r) => {
        const anon = isAnonymousRequest(r)

        if (activeTab === 'named' && anon) return false
        if (activeTab === 'anonymous' && !anon) return false
        if (activeTab === 'this_week') {
          const day = toLagosCalendarDay(r.dateSubmitted)
          if (!day || day < weekStartDay) return false
        }

        if (q) {
          const nameMatch = (r.name || 'Anonymous').toLowerCase().includes(q)
          const requestMatch = (r.request || '').toLowerCase().includes(q)
          if (!nameMatch && !requestMatch) return false
        }

        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateSubmitted).getTime() || 0
        const dateB = new Date(b.dateSubmitted).getTime() || 0
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [requests, activeTab, searchQuery, sortBy, weekStartDay])

  const visibleRequests = useMemo(
    () => filteredRequests.slice(0, visibleCount),
    [filteredRequests, visibleCount]
  )

  const remainingCount = Math.max(0, filteredRequests.length - visibleRequests.length)
  const hasActiveFilters = Boolean(searchQuery.trim() || activeTab !== 'all' || sortBy !== 'newest')

  const handleResetFilters = () => {
    setSearchQuery('')
    setActiveTab('all')
    setSortBy('newest')
    setVisibleCount(PAGE_SIZE)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setVisibleCount(PAGE_SIZE)
  }

  const handleTabChange = (tab: PrayerFilterTab) => {
    setActiveTab(tab)
    setVisibleCount(PAGE_SIZE)
  }

  const handleSortChange = (order: SortOrder) => {
    setSortBy(order)
    setVisibleCount(PAGE_SIZE)
  }

  const handleCopyRequest = async (item: PrayerRequest) => {
    const submitter = isAnonymousRequest(item) ? 'Anonymous' : item.name!.trim()
    const dateLabel = isValidIso(item.dateSubmitted)
      ? formatDate(item.dateSubmitted)
      : item.dateSubmitted
    const textToCopy = `[ECCF Prayer Request]\nFrom: ${submitter}\nDate: ${dateLabel}\n\n"${item.request}"`

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedId(item._id)
      toastSuccess('Prayer request copied to clipboard.')
      setTimeout(() => setCopiedId((prev) => (prev === item._id ? null : prev)), 2500)
    } catch {
      toastError('Failed to copy prayer request to clipboard.')
    }
  }

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const chips: ActiveFilterChip[] = []
    if (activeTab !== 'all') {
      const label = FILTER_OPTIONS.find((opt) => opt.value === activeTab)?.label ?? activeTab
      chips.push({
        id: 'segment',
        label: 'Filter',
        value: label,
        onRemove: () => handleTabChange('all'),
      })
    }
    if (sortBy !== 'newest') {
      chips.push({
        id: 'sort',
        label: 'Sort',
        value: 'Oldest first',
        onRemove: () => handleSortChange('newest'),
      })
    }
    return chips
  }, [activeTab, sortBy])

  const selectedIsAnon = selectedRequest ? isAnonymousRequest(selectedRequest) : false
  const selectedSubmitter = selectedRequest
    ? selectedIsAnon
      ? 'Anonymous Believer'
      : selectedRequest.name!.trim()
    : ''

  return (
    <div className="space-y-6">
      {/* Compact 2-signal KPI strip */}
      <KpiStrip
        ariaLabel="Prayer request summary"
        items={[
          {
            id: 'this-week',
            label: 'This week',
            value: formatCount(metrics.thisWeek),
            rawValue: metrics.thisWeek,
            caption: `${formatCount(metrics.total)} total submitted`,
            icon: <PrayingHands className="h-4 w-4" />,
            tone: 'primary',
          },
          {
            id: 'named-vs-anonymous',
            label: 'Named vs anonymous',
            value: `${formatCount(metrics.named)} / ${formatCount(metrics.anonymous)}`,
            rawValue: metrics.named,
            caption: `${formatCount(metrics.named)} named · ${formatCount(metrics.anonymous)} anonymous`,
            icon: <Users className="h-4 w-4" />,
            tone: 'neutral',
          },
        ]}
      />

      {/* Labeled search, segmented filter, sort select, mobile filter sheet & reset */}
      <DataToolbar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchLabel="Search prayer requests"
        searchPlaceholder="Search by submitter name or keyword…"
        activeFilterCount={activeFilterChips.length}
        activeFilters={activeFilterChips}
        onResetFilters={handleResetFilters}
        filterSheetTitle="Filter prayer requests"
        filterSheetDescription="Narrow the intercession feed or change how requests are ordered."
        meta={`${formatCount(filteredRequests.length)} ${filteredRequests.length === 1 ? 'request' : 'requests'}`}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter prayer requests by category"
              className="inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-surface-raised p-1"
            >
              {FILTER_OPTIONS.map((option) => {
                const active = activeTab === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleTabChange(option.value)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-[calc(var(--radius-control)-2px)] px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10',
                      active
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            <Select value={sortBy} onValueChange={(val) => handleSortChange(val as SortOrder)}>
              <SelectTrigger
                aria-label="Sort prayer requests"
                className="w-[155px] bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
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
                Show requests
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_OPTIONS.map((option) => {
                  const active = activeTab === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleTabChange(option.value)}
                      className={cn(
                        'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface-raised text-foreground hover:bg-muted'
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label
                htmlFor="mobile-prayer-sort"
                className="block text-[13px] font-semibold text-foreground"
              >
                Sort order
              </label>
              <Select value={sortBy} onValueChange={(val) => handleSortChange(val as SortOrder)}>
                <SelectTrigger
                  id="mobile-prayer-sort"
                  aria-label="Sort prayer requests"
                  className="w-full bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      {/* Requests Feed */}
      {filteredRequests.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center rounded-[var(--radius-card)] border-0 bg-card px-6 py-12 text-center shadow-sm"
        >
          <div
            aria-hidden="true"
            className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <HeartHandshake className="h-6 w-6" />
          </div>
          <h2 className="font-sans text-lg font-semibold text-foreground [text-wrap:balance]">
            No prayer requests found
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
            {searchQuery
              ? `No requests match "${searchQuery}". Try adjusting your keywords or clearing the filter.`
              : 'There are no prayer requests in this filtered view.'}
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="mt-5 min-h-11 px-5 md:min-h-10"
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <ul className="space-y-4">
            {visibleRequests.map((item) => {
              const anon = isAnonymousRequest(item)
              const submitter = anon ? 'Anonymous Believer' : item.name!.trim()
              const validDate = isValidIso(item.dateSubmitted)
              const formattedDate = validDate ? formatDate(item.dateSubmitted) : item.dateSubmitted
              const relativeDay = validDate ? formatRelativeDay(item.dateSubmitted, referenceNow) : ''
              const isCopied = copiedId === item._id

              return (
                <li key={item._id}>
                  <article className="rounded-[var(--radius-card)] border-0 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
                    <div className="space-y-4">
                      {/* Header: Submitter & timestamp */}
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          {anon ? (
                            <div
                              aria-hidden="true"
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-foreground dark:bg-gold/15 dark:text-gold"
                            >
                              <Shield className="h-4 w-4 shrink-0" />
                            </div>
                          ) : (
                            <div
                              aria-hidden="true"
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-accent-foreground dark:text-primary"
                            >
                              {getInitials(submitter)}
                            </div>
                          )}

                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="truncate text-base font-semibold text-foreground">
                              {submitter}
                            </span>
                            <StatusBadge variant={anon ? 'neutral' : 'primary'} dot>
                              {anon ? 'Anonymous' : 'Named'}
                            </StatusBadge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground tabular-nums">
                          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {validDate ? (
                            <time dateTime={toDateTimeAttr(item.dateSubmitted)}>
                              {formattedDate}
                              {relativeDay ? ` · ${relativeDay}` : ''}
                            </time>
                          ) : (
                            <span>{formattedDate}</span>
                          )}
                        </div>
                      </div>

                      {/* Prayer body — clean borderless tonal presentation */}
                      <p className="max-w-[75ch] whitespace-pre-wrap text-[15px] leading-[1.6] text-foreground [text-wrap:pretty] sm:text-base">
                        {item.request}
                      </p>

                      {/* Card Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                          <PrayingHands
                            size={16}
                            className="shrink-0 text-primary"
                          />
                          <span>Intercessory Prayer Network</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCopyRequest(item)}
                            aria-label={`Copy prayer request from ${submitter}`}
                            className={cn(
                              'min-h-11 gap-1.5 px-3.5 md:min-h-10',
                              isCopied &&
                                'border-success/30 bg-success/10 text-success hover:bg-success/15 hover:text-success'
                            )}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedRequest(item)}
                            aria-label={`Open full prayer request from ${submitter}`}
                            className="min-h-11 gap-1.5 px-3.5 md:min-h-10"
                          >
                            <Expand className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Open</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>

          {/* Pagination */}
          {remainingCount > 0 && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-[13px] text-muted-foreground tabular-nums">
                Showing {formatCount(visibleRequests.length)} of{' '}
                {formatCount(filteredRequests.length)} requests
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="min-h-11 px-6"
              >
                Load more ({formatCount(Math.min(PAGE_SIZE, remainingCount))} more)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Full-request Drawer */}
      <RecordSheet
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null)
        }}
        headerExtra={
          selectedRequest && (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={selectedIsAnon ? 'neutral' : 'primary'} dot>
                {selectedIsAnon ? 'Anonymous' : 'Named'}
              </StatusBadge>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <PrayingHands size={15} className="shrink-0 text-primary" />
                Intercessory Prayer Network
              </span>
            </div>
          )
        }
        title={selectedSubmitter || 'Prayer request'}
        description={
          selectedRequest && isValidIso(selectedRequest.dateSubmitted) ? (
            <time dateTime={toDateTimeAttr(selectedRequest.dateSubmitted)}>
              Submitted {formatDate(selectedRequest.dateSubmitted)} ·{' '}
              {formatRelativeDay(selectedRequest.dateSubmitted, referenceNow)}
            </time>
          ) : (
            selectedRequest?.dateSubmitted
          )
        }
        footer={
          selectedRequest && (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="min-h-11 sm:min-w-24"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => handleCopyRequest(selectedRequest)}
                className="min-h-11 gap-2"
              >
                {copiedId === selectedRequest._id ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Copy request</span>
                  </>
                )}
              </Button>
            </div>
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-card)] bg-surface-raised p-4 sm:p-5">
              <p className="whitespace-pre-wrap text-base leading-[1.65] text-foreground [text-wrap:pretty]">
                {selectedRequest.request}
              </p>
            </div>

            <div className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
              <PrayingHands size={16} className="mt-0.5 shrink-0 text-primary" />
              <p>
                {selectedIsAnon
                  ? 'Submitted anonymously through the Connect page. Please lift this request in intercession with the prayer team.'
                  : `Submitted by ${selectedSubmitter}. Coordinate pastoral follow-up discretely where needed.`}
              </p>
            </div>
          </div>
        )}
      </RecordSheet>
    </div>
  )
}
