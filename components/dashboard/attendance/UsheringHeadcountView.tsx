'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import {
  Calendar,
  CalendarDays,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import { GENERAL_SERVICE_TYPES } from '@/lib/dashboard/attendance-constants'
import { formatCount, formatDate, toDateTimeAttr } from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { DataToolbar, type ActiveFilterChip } from '@/components/dashboard/ui/data-toolbar'
import { KpiStrip, type KpiStripItem } from '@/components/dashboard/ui/kpi-strip'
import { Label } from '@/components/dashboard/ui/label'
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import EmptyState from '@/components/dashboard/states/EmptyState'

interface UsheringHeadcountViewProps {
  session?: ECCFSession
  rows: AttendanceRow[]
  highlightedId?: string | null
  onRecordClick?: () => void
}

function getServiceBadgeVariant(serviceType: AttendanceRow['serviceType']): StatusBadgeVariant {
  if (serviceType === 'Sunday Service') return 'primary'
  if (serviceType === 'Wednesday Bible Study') return 'info'
  return 'neutral'
}

function DemographicBreakdown({ row }: { row: AttendanceRow }) {
  const staffTotal =
    row.staffCount ??
    ((row.staffMenCount !== undefined || row.staffWomenCount !== undefined)
      ? (row.staffMenCount || 0) + (row.staffWomenCount || 0)
      : undefined)

  const hasBreakdown =
    row.menCount !== undefined ||
    row.womenCount !== undefined ||
    staffTotal !== undefined ||
    row.childrenCount !== undefined ||
    (row.firstTimersCount !== undefined && row.firstTimersCount !== null)

  if (!hasBreakdown) {
    return <span className="text-[13px] text-muted-foreground">Aggregate count</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[13px] tabular-nums">
      {(row.menCount !== undefined || row.womenCount !== undefined) && (
        <span className="rounded-[var(--radius-pill)] bg-surface-raised px-2 py-0.5 font-medium text-foreground">
          Students:{" "}
          {row.menCount !== undefined && row.womenCount !== undefined
            ? `${formatCount(row.menCount)}M / ${formatCount(row.womenCount ?? 0)}F`
            : row.menCount !== undefined
              ? `${formatCount(row.menCount)}M`
              : `${formatCount(row.womenCount ?? 0)}F`}
        </span>
      )}
      {staffTotal !== undefined && (
        <span className="rounded-[var(--radius-pill)] bg-surface-raised px-2 py-0.5 font-medium text-foreground">
          Staff: {formatCount(staffTotal)}
          {(row.staffMenCount !== undefined || row.staffWomenCount !== undefined) && (
            <span className="text-muted-foreground ml-1">
              ({row.staffMenCount ?? 0}M / {row.staffWomenCount ?? 0}F)
            </span>
          )}
        </span>
      )}
      {row.childrenCount !== undefined && (
        <span className="rounded-[var(--radius-pill)] bg-surface-raised px-2 py-0.5 font-medium text-foreground">
          Children {formatCount(row.childrenCount)}
        </span>
      )}
      {row.firstTimersCount !== undefined && row.firstTimersCount !== null && (
        <span className="rounded-[var(--radius-pill)] bg-success/10 px-2 py-0.5 font-medium text-success">
          First-timers {formatCount(row.firstTimersCount)}
        </span>
      )}
    </div>
  )
}

export default function UsheringHeadcountView({
  rows,
  highlightedId,
  onRecordClick,
}: UsheringHeadcountViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')

  const generalRows = useMemo(() => {
    return rows.filter(
      (r) => r.serviceType !== 'Team Meeting' && r.serviceType !== 'Exco Meeting'
    )
  }, [rows])

  const filteredRows = useMemo(() => {
    return generalRows.filter((row) => {
      if (serviceFilter !== 'all' && row.serviceType !== serviceFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = row.meetingTitle?.toLowerCase().includes(q)
        const matchService = row.serviceType.toLowerCase().includes(q)
        const matchNotes = row.notes?.toLowerCase().includes(q)
        const matchLoggedBy = (row.loggedBy?.fullName || '').toLowerCase().includes(q)
        const matchDate = formatDate(row.date).toLowerCase().includes(q)
        if (!matchTitle && !matchService && !matchNotes && !matchLoggedBy && !matchDate) {
          return false
        }
      }

      return true
    })
  }, [generalRows, serviceFilter, searchQuery])

  const metrics = useMemo(() => {
    const totalRecorded = generalRows.length
    const sundayServices = generalRows.filter((r) => r.serviceType === 'Sunday Service')
    const sundayAvg =
      sundayServices.length > 0
        ? Math.round(
            sundayServices.reduce((sum, r) => sum + (r.totalCount || 0), 0) /
              sundayServices.length
          )
        : 0
    const latestService = generalRows[0] ?? null

    return {
      totalRecorded,
      sundayCount: sundayServices.length,
      sundayAvg,
      latestService,
    }
  }, [generalRows])

  const kpiItems: KpiStripItem[] = useMemo(
    () => [
      {
        id: 'services-counted',
        label: 'Services counted',
        value: formatCount(metrics.totalRecorded),
        rawValue: metrics.totalRecorded,
        caption: metrics.totalRecorded === 1 ? '1 service logged' : 'Recorded services',
        icon: <CalendarDays />,
        tone: 'primary',
      },
      {
        id: 'sunday-average',
        label: 'Sunday average',
        value: metrics.sundayAvg > 0 ? formatCount(metrics.sundayAvg) : '—',
        rawValue: metrics.sundayAvg,
        caption:
          metrics.sundayCount > 0
            ? `Across ${formatCount(metrics.sundayCount)} Sunday ${
                metrics.sundayCount === 1 ? 'service' : 'services'
              }`
            : 'No Sunday logs yet',
        icon: <TrendingUp />,
        tone: 'success',
      },
      {
        id: 'last-service',
        label: 'Last service',
        value: metrics.latestService ? formatCount(metrics.latestService.totalCount) : '—',
        rawValue: metrics.latestService?.totalCount ?? 0,
        caption: metrics.latestService ? (
          <>
            <span>{metrics.latestService.serviceType} · </span>
            <time dateTime={toDateTimeAttr(metrics.latestService.date)}>
              {formatDate(metrics.latestService.date)}
            </time>
          </>
        ) : (
          'No logs yet'
        ),
        icon: <Users />,
        tone: 'neutral',
      },
    ],
    [metrics]
  )

  const hasActiveFilters = serviceFilter !== 'all' || searchQuery.trim().length > 0

  const resetFilters = () => {
    setServiceFilter('all')
    setSearchQuery('')
  }

  const activeFilters: ActiveFilterChip[] = []
  if (serviceFilter !== 'all') {
    activeFilters.push({
      id: 'service',
      label: 'Service',
      value: serviceFilter,
      onRemove: () => setServiceFilter('all'),
    })
  }
  if (searchQuery.trim()) {
    activeFilters.push({
      id: 'search',
      label: 'Search',
      value: searchQuery.trim(),
      onRemove: () => setSearchQuery(''),
    })
  }

  return (
    <div className="space-y-6">
      <KpiStrip ariaLabel="General service headcount summary" items={kpiItems} />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-sans text-lg font-semibold tracking-tight text-foreground">
            Service attendance history
          </h2>
          <p className="text-sm text-muted-foreground">
            Ushering headcounts recorded for Sunday, midweek, and special services.
          </p>
        </div>

        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchLabel="Search service attendance logs"
          searchPlaceholder="Search date, service, theme, or recorder…"
          filterSheetTitle="Filter service attendance"
          activeFilterCount={activeFilters.length}
          activeFilters={activeFilters}
          onResetFilters={resetFilters}
          filters={
            <>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger
                  aria-label="Filter by service type"
                  className="w-[195px] bg-card"
                >
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {GENERAL_SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  className="min-h-11 px-3 text-sm md:min-h-10"
                >
                  Reset
                </Button>
              )}
            </>
          }
          mobileFilters={
            <div className="space-y-2">
              <Label htmlFor="mobile-usher-service-filter" className="text-sm font-medium">
                Service type
              </Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger
                  id="mobile-usher-service-filter"
                  aria-label="Filter by service type"
                >
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {GENERAL_SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          meta={
            <span>
              Showing {formatCount(filteredRows.length)} of {formatCount(generalRows.length)}{' '}
              {generalRows.length === 1 ? 'record' : 'records'}
            </span>
          }
        />

        {filteredRows.length === 0 ? (
          <EmptyState
            variant={hasActiveFilters ? 'no-results' : 'nothing-yet'}
            headingLevel="h3"
            title={
              hasActiveFilters
                ? 'No service logs match your filters'
                : 'No service headcounts recorded yet'
            }
            description={
              hasActiveFilters
                ? 'Try clearing a filter or adjusting your search query.'
                : 'Record the first Sunday or midweek service count to start tracking attendance.'
            }
            action={
              hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : onRecordClick ? (
                <Button type="button" onClick={onRecordClick} className="gap-2">
                  <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Record attendance</span>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm md:block">
              <Table aria-label="General service headcount history">
                <TableCaption className="sr-only">
                  General church service headcount history
                </TableCaption>
                <TableHeader sticky>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className="w-[150px]">
                      Date
                    </TableHead>
                    <TableHead scope="col">Service / Programme</TableHead>
                    <TableHead scope="col" className="text-right">
                      Headcount
                    </TableHead>
                    <TableHead scope="col" className="hidden lg:table-cell">
                      Demographics
                    </TableHead>
                    <TableHead scope="col" className="hidden xl:table-cell">
                      Notes
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Recorded by
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow
                      key={row._id}
                      className={cn(
                        row._id === highlightedId && 'bg-primary/10 hover:bg-primary/15'
                      )}
                    >
                      <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <time dateTime={toDateTimeAttr(row.date)}>
                            {formatDate(row.date)}
                          </time>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge variant={getServiceBadgeVariant(row.serviceType)} dot>
                            {row.serviceType}
                          </StatusBadge>
                          <p className="line-clamp-1 text-sm text-foreground">
                            {row.meetingTitle ? (
                              <span className="font-medium">{row.meetingTitle}</span>
                            ) : (
                              <span className="text-[13px] text-muted-foreground">
                                Regular service
                              </span>
                            )}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-sans text-base font-semibold tabular-nums text-foreground">
                            <data value={row.totalCount}>{formatCount(row.totalCount)}</data>
                          </span>
                          <span className="text-[13px] text-muted-foreground">attendees</span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        <DemographicBreakdown row={row} />
                      </TableCell>

                      <TableCell className="hidden max-w-[220px] xl:table-cell">
                        {row.notes ? (
                          <p
                            className="truncate text-[13px] text-muted-foreground"
                            title={row.notes}
                          >
                            {row.notes}
                          </p>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 text-[13px] text-muted-foreground">
                          <UserCheck
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span className="max-w-[140px] truncate text-foreground">
                            {row.loggedBy?.fullName || 'Fellowship Admin'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {filteredRows.map((row) => (
                <article
                  key={row._id}
                  className={cn(
                    'space-y-3 rounded-[var(--radius-card)] bg-card p-4 shadow-sm',
                    row._id === highlightedId && 'ring-1 ring-inset ring-primary/40 bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <time dateTime={toDateTimeAttr(row.date)} className="text-foreground">
                        {formatDate(row.date)}
                      </time>
                    </div>
                    <StatusBadge variant={getServiceBadgeVariant(row.serviceType)} dot>
                      {row.serviceType}
                    </StatusBadge>
                  </div>

                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-sans text-base font-semibold text-foreground">
                        {row.meetingTitle || row.serviceType}
                      </h3>
                      {!row.meetingTitle && (
                        <p className="text-[13px] text-muted-foreground">Regular service</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-sans text-xl font-semibold leading-tight tabular-nums text-foreground">
                        <data value={row.totalCount}>{formatCount(row.totalCount)}</data>
                      </p>
                      <p className="text-[13px] text-muted-foreground">attendees</p>
                    </div>
                  </div>

                  {(row.menCount !== undefined ||
                    row.womenCount !== undefined ||
                    row.staffCount !== undefined ||
                    row.staffMenCount !== undefined ||
                    row.staffWomenCount !== undefined ||
                    row.childrenCount !== undefined ||
                    (row.firstTimersCount !== undefined && row.firstTimersCount !== null)) && (
                    <DemographicBreakdown row={row} />
                  )}

                  {row.notes && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{row.notes}</p>
                  )}

                  <div className="flex items-center gap-1.5 pt-1 text-[13px] text-muted-foreground">
                    <UserCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate">
                      Recorded by {row.loggedBy?.fullName || 'Fellowship Admin'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
