'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  Eye,
  Plus,
  UserCheck,
  Users,
} from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import type { AttendanceWorker } from '@/lib/dashboard/attendance-worker'
import { formatCount, formatDate, formatPercent, toDateTimeAttr } from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { DataToolbar, type ActiveFilterChip } from '@/components/dashboard/ui/data-toolbar'
import { KpiStrip, type KpiStripItem } from '@/components/dashboard/ui/kpi-strip'
import { Label } from '@/components/dashboard/ui/label'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import EmptyState from '@/components/dashboard/states/EmptyState'

interface TeamMeetingAttendanceViewProps {
  session: ECCFSession
  rows: AttendanceRow[]
  availableWorkers: AttendanceWorker[]
  teamOptions: TeamUnitOption[]
  highlightedId?: string | null
  onRecordClick?: () => void
}

export default function TeamMeetingAttendanceView({
  session,
  rows,
  availableWorkers,
  teamOptions,
  highlightedId,
  onRecordClick,
}: TeamMeetingAttendanceViewProps) {
  const teamNames = useMemo(() => teamOptions.map((option) => option.name), [teamOptions])

  const effectiveTeamName = useMemo(() => {
    if (session.role === 'team_lead') {
      return session.leadingTeam || session.teams?.[0] || session.team
    }
    return session.team || 'All teams'
  }, [session])

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>(
    session.role === 'team_lead' ? effectiveTeamName : 'all'
  )
  const [historySearch, setHistorySearch] = useState('')
  const [activeRosterRecord, setActiveRosterRecord] = useState<AttendanceRow | null>(null)

  const teamRows = useMemo(() => {
    return rows.filter((r) => {
      if (r.serviceType !== 'Team Meeting') return false
      if (session.role === 'team_lead') {
        const leadTeam = (session.leadingTeam || session.team || '').toLowerCase()
        if (!leadTeam) return true
        const rowTeam = (r.teamName || '').toLowerCase()
        return rowTeam.includes(leadTeam) || leadTeam.includes(rowTeam)
      }
      if (selectedTeamFilter !== 'all') {
        const target = selectedTeamFilter.toLowerCase()
        const rowTeam = (r.teamName || '').toLowerCase()
        return rowTeam.includes(target) || target.includes(rowTeam)
      }
      return true
    })
  }, [rows, session, selectedTeamFilter])

  const filteredMeetingRows = useMemo(() => {
    const q = historySearch.trim().toLowerCase()
    if (!q) return teamRows
    return teamRows.filter(
      (r) =>
        (r.meetingTitle || '').toLowerCase().includes(q) ||
        (r.teamName || '').toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q) ||
        (r.loggedBy?.fullName || '').toLowerCase().includes(q) ||
        formatDate(r.date).toLowerCase().includes(q)
    )
  }, [teamRows, historySearch])

  const scopedWorkers = useMemo(() => {
    const activeTeam = (
      session.role === 'team_lead'
        ? effectiveTeamName
        : selectedTeamFilter !== 'all'
          ? selectedTeamFilter
          : ''
    ).toLowerCase()

    return availableWorkers.filter((w) => {
      if (!activeTeam || activeTeam === 'all') return true
      const workerTeams = (w.teams && w.teams.length > 0 ? w.teams : [w.team])
        .filter(Boolean)
        .map((t) => String(t).toLowerCase())
      return workerTeams.some((wt) => wt.includes(activeTeam) || activeTeam.includes(wt))
    })
  }, [availableWorkers, session.role, effectiveTeamName, selectedTeamFilter])

  const metrics = useMemo(() => {
    const totalMeetings = teamRows.length
    const totalWorkersPresent = teamRows.reduce(
      (sum, r) => sum + (r.attendeeCount || r.totalCount || 0),
      0
    )
    const avgAttendance = totalMeetings > 0 ? Math.round(totalWorkersPresent / totalMeetings) : 0
    const rosterSize = scopedWorkers.length
    const attendanceRate =
      rosterSize > 0 && avgAttendance > 0
        ? Math.min(100, Math.round((avgAttendance / rosterSize) * 100))
        : 0

    return {
      totalMeetings,
      avgAttendance,
      rosterSize,
      attendanceRate,
    }
  }, [teamRows, scopedWorkers])

  const kpiItems: KpiStripItem[] = useMemo(
    () => [
      {
        id: 'meetings-counted',
        label: 'Meetings counted',
        value: formatCount(metrics.totalMeetings),
        rawValue: metrics.totalMeetings,
        caption:
          metrics.avgAttendance > 0
            ? `Avg ${formatCount(metrics.avgAttendance)} present`
            : 'No meetings logged yet',
        icon: <CalendarCheck />,
        tone: 'primary',
      },
      {
        id: 'roster-size',
        label: 'Roster size',
        value: formatCount(metrics.rosterSize),
        rawValue: metrics.rosterSize,
        caption:
          session.role === 'admin' && selectedTeamFilter !== 'all'
            ? `${selectedTeamFilter} workers`
            : 'Active team workers',
        icon: <Users />,
        tone: 'neutral',
      },
      {
        id: 'attendance-rate',
        label: 'Attendance rate',
        value: formatPercent(metrics.attendanceRate, 0),
        rawValue: metrics.attendanceRate,
        caption: 'Average turnout',
        icon: <BarChart3 />,
        tone:
          metrics.attendanceRate >= 70
            ? 'success'
            : metrics.attendanceRate >= 40
              ? 'warning'
              : 'neutral',
      },
    ],
    [metrics, session.role, selectedTeamFilter]
  )

  const canFilterByTeam = session.role === 'admin'
  const hasActiveFilters =
    (canFilterByTeam && selectedTeamFilter !== 'all') || historySearch.trim().length > 0

  const resetFilters = () => {
    if (canFilterByTeam) setSelectedTeamFilter('all')
    setHistorySearch('')
  }

  const activeFilters: ActiveFilterChip[] = []
  if (canFilterByTeam && selectedTeamFilter !== 'all') {
    activeFilters.push({
      id: 'team',
      label: 'Team',
      value: selectedTeamFilter,
      onRemove: () => setSelectedTeamFilter('all'),
    })
  }
  if (historySearch.trim()) {
    activeFilters.push({
      id: 'search',
      label: 'Search',
      value: historySearch.trim(),
      onRemove: () => setHistorySearch(''),
    })
  }

  return (
    <div className="space-y-6">
      <KpiStrip ariaLabel="Team meeting attendance summary" items={kpiItems} />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-sans text-lg font-semibold tracking-tight text-foreground">
            {session.role === 'team_lead'
              ? `${effectiveTeamName} meeting history`
              : 'Team meeting history'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Recorded rehearsals, vigils, and unit meetings with worker attendance rosters.
          </p>
        </div>

        <DataToolbar
          searchValue={historySearch}
          onSearchChange={setHistorySearch}
          searchLabel="Search meeting attendance logs"
          searchPlaceholder="Search meeting topics, teams, or recorder…"
          filterSheetTitle="Filter team meetings"
          activeFilterCount={activeFilters.length}
          activeFilters={activeFilters}
          onResetFilters={resetFilters}
          filters={
            canFilterByTeam ? (
              <>
                <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                  <SelectTrigger aria-label="Filter by team" className="w-[220px] bg-card">
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {teamNames.map((teamName) => (
                      <SelectItem key={teamName} value={teamName}>
                        {teamName}
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
            ) : undefined
          }
          mobileFilters={
            canFilterByTeam ? (
              <div className="space-y-2">
                <Label htmlFor="mobile-team-filter" className="text-sm font-medium">
                  Team
                </Label>
                <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                  <SelectTrigger id="mobile-team-filter" aria-label="Filter by team">
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {teamNames.map((teamName) => (
                      <SelectItem key={teamName} value={teamName}>
                        {teamName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : undefined
          }
          meta={
            <span>
              Showing {formatCount(filteredMeetingRows.length)} of {formatCount(teamRows.length)}{' '}
              {teamRows.length === 1 ? 'meeting' : 'meetings'}
            </span>
          }
        />

        {filteredMeetingRows.length === 0 ? (
          <EmptyState
            variant={hasActiveFilters ? 'no-results' : 'nothing-yet'}
            headingLevel="h3"
            title={
              hasActiveFilters
                ? 'No meeting logs match your filters'
                : 'No team meetings recorded yet'
            }
            description={
              hasActiveFilters
                ? 'Try clearing the search query or selecting a different team.'
                : 'Record your first team rehearsal or unit meeting to start building roster history.'
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
              <Table aria-label="Team meeting attendance records">
                <TableCaption className="sr-only">
                  Team meeting attendance history
                </TableCaption>
                <TableHeader sticky>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className="w-[150px]">
                      Date
                    </TableHead>
                    <TableHead scope="col">Meeting topic</TableHead>
                    <TableHead scope="col">Team</TableHead>
                    <TableHead scope="col" className="text-right">
                      Present
                    </TableHead>
                    <TableHead scope="col">Recorded by</TableHead>
                    <TableHead scope="col" className="w-[120px] text-right">
                      Roster
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetingRows.map((row) => (
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
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground">
                            {row.meetingTitle || 'Standard team meeting'}
                          </p>
                          {row.notes && (
                            <p
                              className="line-clamp-1 text-[13px] text-muted-foreground"
                              title={row.notes}
                            >
                              {row.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge variant="neutral" dot>
                          {row.teamName || 'Team unit'}
                        </StatusBadge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-sans text-base font-semibold tabular-nums text-foreground">
                            <data value={row.totalCount}>{formatCount(row.totalCount)}</data>{' '}
                            present
                          </span>
                          {row.attendeeCount > 0 && (
                            <span className="text-[13px] text-muted-foreground tabular-nums">
                              {formatCount(row.attendeeCount)} registered
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-[13px] text-foreground">
                          <UserCheck
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span className="max-w-[140px] truncate">
                            {row.loggedBy?.fullName || 'Team Lead'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setActiveRosterRecord(row)}
                          aria-label={`View roster for ${
                            row.meetingTitle || 'team meeting'
                          } on ${formatDate(row.date)}`}
                          className="min-h-11 gap-1.5 px-3 text-sm text-primary hover:text-primary md:min-h-10"
                        >
                          <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>Roster</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {filteredMeetingRows.map((row) => (
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
                    <StatusBadge variant="neutral" dot className="shrink-0">
                      {row.teamName || 'Team unit'}
                    </StatusBadge>
                  </div>

                  <h3 className="line-clamp-2 font-sans text-base font-semibold text-foreground">
                    {row.meetingTitle || 'Standard team meeting'}
                  </h3>

                  {row.notes && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{row.notes}</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-sans text-base font-semibold tabular-nums text-foreground">
                        <data value={row.totalCount}>{formatCount(row.totalCount)}</data> present
                      </p>
                      {row.attendeeCount > 0 && (
                        <p className="text-[13px] text-muted-foreground tabular-nums">
                          {formatCount(row.attendeeCount)} registered
                        </p>
                      )}
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                      <UserCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate">{row.loggedBy?.fullName || 'Team Lead'}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveRosterRecord(row)}
                    aria-label={`View roster for ${
                      row.meetingTitle || 'team meeting'
                    } on ${formatDate(row.date)}`}
                    className="min-h-11 w-full gap-2 text-sm font-medium"
                  >
                    <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>View roster</span>
                  </Button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Meeting Roster Detail Sheet */}
      <RecordSheet
        open={Boolean(activeRosterRecord)}
        onOpenChange={(open) => {
          if (!open) setActiveRosterRecord(null)
        }}
        side="right"
        className="[&>button]:h-11 [&>button]:w-11"
        title="Meeting attendance roster"
        description={
          activeRosterRecord ? (
            <>
              <span>{activeRosterRecord.meetingTitle || 'Standard team meeting'} · </span>
              <time dateTime={toDateTimeAttr(activeRosterRecord.date)}>
                {formatDate(activeRosterRecord.date)}
              </time>
            </>
          ) : undefined
        }
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveRosterRecord(null)}
            className="min-h-11 w-full sm:w-auto"
          >
            Close
          </Button>
        }
      >
        {activeRosterRecord && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-card)] bg-surface-raised p-4">
              <div>
                <p className="text-[13px] text-muted-foreground">Team</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {activeRosterRecord.teamName || effectiveTeamName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-muted-foreground">Total present</p>
                <p className="mt-0.5 font-sans text-lg font-semibold tabular-nums text-foreground">
                  <data value={activeRosterRecord.totalCount}>
                    {formatCount(activeRosterRecord.totalCount)}
                  </data>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-sans text-sm font-semibold text-foreground">
                Registered workers (
                {formatCount(
                  activeRosterRecord.attendees?.length || activeRosterRecord.attendeeCount || 0
                )}
                )
              </h3>

              {activeRosterRecord.attendees && activeRosterRecord.attendees.length > 0 ? (
                <ul className="space-y-1.5">
                  {activeRosterRecord.attendees.map((worker, idx) => (
                    <li
                      key={worker._id || idx}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-surface-raised px-3.5 py-2.5 text-sm"
                    >
                      <span className="font-medium text-foreground">{worker.fullName}</span>
                      {worker.team && (
                        <StatusBadge variant="neutral" dot>
                          {worker.team}
                        </StatusBadge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-[var(--radius-control)] bg-surface-raised p-4 text-center text-sm text-muted-foreground">
                  {activeRosterRecord.totalCount > 0
                    ? `${formatCount(activeRosterRecord.totalCount)} attendees recorded for this meeting.`
                    : 'No worker entries recorded.'}
                </div>
              )}
            </div>

            {activeRosterRecord.notes && (
              <div className="space-y-1 rounded-[var(--radius-control)] bg-surface-raised p-3.5">
                <p className="text-[13px] font-medium text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground">{activeRosterRecord.notes}</p>
              </div>
            )}

            {activeRosterRecord.loggedBy?.fullName && (
              <p className="text-[13px] text-muted-foreground">
                Recorded by {activeRosterRecord.loggedBy.fullName}
              </p>
            )}
          </div>
        )}
      </RecordSheet>
    </div>
  )
}
