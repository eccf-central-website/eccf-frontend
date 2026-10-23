'use client'

import * as React from 'react'
import { useState, useTransition, useMemo } from 'react'
import {
  Calendar,
  Users,
  CheckCircle2,
  Plus,
  Search,
  UserCheck,
  Eye,
  X,
  Loader2,
  BarChart3,
  CalendarCheck,
} from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { Badge } from '@/components/dashboard/ui/badge'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import {
  Table,
  TableBody,
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
import { FELLOWSHIP_TEAMS } from '@/lib/dashboard/attendance-constants'
import { recordTeamAttendanceAction } from '@/app/actions/attendance-actions'
import { toastFromResult } from '@/lib/dashboard/toast'

interface TeamMeetingAttendanceViewProps {
  session: ECCFSession
  rows: AttendanceRow[]
  availableWorkers: Array<{
    _id: string
    fullName: string
    team: string
    teams?: string[]
    hall: string
  }>
  onSuccess?: () => void
}

export default function TeamMeetingAttendanceView({
  session,
  rows,
  availableWorkers,
  onSuccess,
}: TeamMeetingAttendanceViewProps) {
  const [isPending, startTransition] = useTransition()
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Scope: effective team name
  const effectiveTeamName = useMemo(() => {
    if (session.role === 'team_lead') {
      return session.leadingTeam || session.teams?.[0] || session.team
    }
    return session.team || 'All Teams'
  }, [session])

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>(
    session.role === 'team_lead' ? effectiveTeamName : 'all'
  )

  // Meeting Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [date, setDate] = useState(todayStr)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [targetTeam, setTargetTeam] = useState<string>(effectiveTeamName)
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set())
  const [extraCount, setExtraCount] = useState<number>(0)
  const [workerSearch, setWorkerSearch] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  // Detail Modal for past meeting roster
  const [activeRosterRecord, setActiveRosterRecord] = useState<AttendanceRow | null>(null)

  // History Filter
  const [historySearch, setHistorySearch] = useState('')

  // Filter team meeting rows
  const teamRows = useMemo(() => {
    return rows.filter((r) => {
      if (r.serviceType !== 'Team Meeting') return false
      if (session.role === 'team_lead') {
        const leadTeam = (session.leadingTeam || session.team).toLowerCase()
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

  // Workers belonging to the current target team
  const filteredTeamWorkers = useMemo(() => {
    return availableWorkers.filter((w) => {
      const currentTeam = (session.role === 'team_lead' ? effectiveTeamName : targetTeam).toLowerCase()
      if (!currentTeam || currentTeam === 'all') return true
      const workerTeams = (w.teams && w.teams.length > 0 ? w.teams : [w.team]).map((t) => t.toLowerCase())
      return workerTeams.some((wt) => wt.includes(currentTeam) || currentTeam.includes(wt))
    })
  }, [availableWorkers, session, effectiveTeamName, targetTeam])

  // Visible workers in the checklist during search
  const visibleWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase()
    if (!q) return filteredTeamWorkers
    return filteredTeamWorkers.filter(
      (w) => w.fullName.toLowerCase().includes(q) || w.hall.toLowerCase().includes(q)
    )
  }, [filteredTeamWorkers, workerSearch])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalMeetings = teamRows.length
    const totalWorkersPresent = teamRows.reduce((sum, r) => sum + (r.attendeeCount || r.totalCount || 0), 0)
    const avgAttendance = totalMeetings > 0 ? Math.round(totalWorkersPresent / totalMeetings) : 0
    const rosterSize = filteredTeamWorkers.length
    const attendanceRate = rosterSize > 0 && avgAttendance > 0 ? Math.min(100, Math.round((avgAttendance / rosterSize) * 100)) : 0

    return {
      totalMeetings,
      avgAttendance,
      rosterSize,
      attendanceRate,
    }
  }, [teamRows, filteredTeamWorkers])

  // Checkbox helpers
  const toggleWorker = (id: string) => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev)
      visibleWorkers.forEach((w) => next.add(w._id))
      return next
    })
  }

  const deselectAllVisible = () => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev)
      visibleWorkers.forEach((w) => next.delete(w._id))
      return next
    })
  }

  const totalPresentCount = selectedWorkerIds.size + Math.max(0, extraCount || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (totalPresentCount === 0) return

    startTransition(async () => {
      const result = await recordTeamAttendanceAction({
        date,
        meetingTitle: meetingTitle.trim() || undefined,
        teamName: session.role === 'team_lead' ? effectiveTeamName : targetTeam,
        attendeeIds: Array.from(selectedWorkerIds),
        extraCount: Math.max(0, extraCount || 0),
        notes: meetingNotes.trim() || undefined,
      })

      if (
        toastFromResult(result, {
          success: `Meeting attendance for ${selectedWorkerIds.size} workers recorded successfully!`,
        })
      ) {
        setIsFormOpen(false)
        setSelectedWorkerIds(new Set())
        setMeetingTitle('')
        setExtraCount(0)
        setWorkerSearch('')
        setMeetingNotes('')
        onSuccess?.()
      }
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Team Meetings</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarCheck className="h-4 w-4 shrink-0" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.totalMeetings}
              </span>
              <span className="text-xs text-muted-foreground">held</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Avg Present</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="h-4 w-4 shrink-0" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {metrics.avgAttendance}
              </span>
              <span className="text-xs text-muted-foreground">workers</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Registered Crew</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <UserCheck className="h-4 w-4 shrink-0" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
                {metrics.rosterSize}
              </span>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Attendance Rate</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BarChart3 className="h-4 w-4 shrink-0" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.attendanceRate}%
              </span>
              <span className="text-xs text-muted-foreground">average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            {session.role === 'team_lead'
              ? `${effectiveTeamName} Worker Attendance`
              : 'Team Meetings & Unit Rosters'}
          </h3>
          <p className="text-xs text-muted-foreground">
            Take attendance for rehearsals, departmental vigils, and unit committee meetings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session.role === 'admin' && (
            <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
              <SelectTrigger className="w-[160px] text-xs h-9">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {FELLOWSHIP_TEAMS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="gap-2 h-9 text-xs sm:text-sm font-semibold"
          >
            {isFormOpen ? <X className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
            <span>{isFormOpen ? 'Close Roster Form' : 'Take Meeting Attendance'}</span>
          </Button>
        </div>
      </div>

      {/* Interactive Worker Checklist Form (Collapsible / Expandable) */}
      {isFormOpen && (
        <Card className="border-primary/30 shadow-md bg-gradient-to-b from-card to-card/95 transition-all">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-lg font-bold">
                  Mark Present Workers — {session.role === 'team_lead' ? effectiveTeamName : targetTeam}
                </CardTitle>
                <CardDescription className="text-xs">
                  Tap or click each worker present. Tick-offs are logged against their worker profiles.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedWorkerIds.size} of {filteredTeamWorkers.length} Selected
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Meeting Details Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tm-date" className="text-xs font-medium">
                    Meeting Date
                  </Label>
                  <Input
                    id="tm-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="tm-title" className="text-xs font-medium">
                    Meeting Title / Topic
                  </Label>
                  <Input
                    id="tm-title"
                    placeholder="e.g. Sunday Morning Pre-Service Rehearsal, Weekly Prayer Vigil"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {session.role === 'admin' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Team Selection</Label>
                  <Select
                    value={targetTeam}
                    onValueChange={(t) => {
                      setTargetTeam(t)
                      setSelectedWorkerIds(new Set())
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      {FELLOWSHIP_TEAMS.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs sm:text-sm">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Worker Checklist Box */}
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                      <Users className="h-4 w-4 shrink-0 text-primary" />
                      <span>Team Member Roster</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Tap any card to toggle attendance state.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium"
                      onClick={selectAllVisible}
                      disabled={visibleWorkers.length === 0}
                    >
                      Select All ({visibleWorkers.length})
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-medium"
                      onClick={deselectAllVisible}
                      disabled={selectedWorkerIds.size === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Worker Search */}
                <div className="relative mt-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Filter workers by name or residence hall..."
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>

                {/* Checklist Grid */}
                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                  {visibleWorkers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No active workers registered under this team unit.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {visibleWorkers.map((worker) => {
                        const isChecked = selectedWorkerIds.has(worker._id)
                        return (
                          <div
                            key={worker._id}
                            onClick={() => toggleWorker(worker._id)}
                            className={`flex cursor-pointer items-center justify-between rounded-lg p-2.5 transition-all select-none border ${
                              isChecked
                                ? 'bg-primary/10 border-primary/40 shadow-xs'
                                : 'hover:bg-muted/50 border-border/60 bg-card'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleWorker(worker._id)}
                                className="h-4 w-4 shrink-0"
                              />
                              <div className="truncate">
                                <p className="truncate text-xs sm:text-sm font-semibold text-foreground">
                                  {worker.fullName}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {worker.hall || 'Campus'}
                                </p>
                              </div>
                            </div>

                            {isChecked ? (
                              <Badge className="text-[10px] h-5 px-1.5 bg-primary font-medium shrink-0">
                                Present
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 mr-1 shrink-0">
                                Absent
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Extra Guests / Probationary Attendees */}
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 rounded-lg border bg-muted/20 p-3">
                <div>
                  <Label htmlFor="tm-extra" className="text-xs font-semibold text-foreground">
                    Guest / Visiting Attendees
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Visitors, observing freshers, or unassigned workers.
                  </p>
                </div>
                <div>
                  <Input
                    id="tm-extra"
                    type="number"
                    min="0"
                    value={extraCount}
                    onChange={(e) => setExtraCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-right font-medium text-sm h-9"
                  />
                </div>
              </div>

              {/* Meeting Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="tm-notes" className="text-xs font-medium">
                  Meeting Notes / Agenda Summary{' '}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="tm-notes"
                  placeholder="Key decisions, rehearsal songs practiced, prayer focus..."
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              {/* Live Headcount Summary Badge */}
              <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-2.5 text-xs sm:text-sm">
                <span className="font-medium text-muted-foreground">Calculated Attendance:</span>
                <span className="font-bold text-primary">
                  {selectedWorkerIds.size} workers + {extraCount} guests = {totalPresentCount} Total Present
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isPending}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || totalPresentCount === 0}
                  className="gap-2 text-xs font-semibold h-9"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      <span>Saving Roster...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Save Attendance ({totalPresentCount})</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History of Team Meetings */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div>
            <h3 className="font-serif text-base font-bold text-foreground">
              Past Meeting Attendance Logs
            </h3>
            <p className="text-xs text-muted-foreground">
              Recorded sessions with worker attendee rosters.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search meeting topics..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
        </div>

        {/* Meeting Logs Table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Meeting Topic</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Present Count</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="w-[90px] text-right">Roster</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                    No team meeting attendance records found yet. Click &quot;Take Meeting Attendance&quot; above to log your first meeting.
                  </TableCell>
                </TableRow>
              ) : (
                teamRows
                  .filter((r) => {
                    if (!historySearch.trim()) return true
                    const q = historySearch.toLowerCase()
                    return (
                      r.meetingTitle?.toLowerCase().includes(q) ||
                      r.teamName?.toLowerCase().includes(q) ||
                      r.loggedBy?.fullName?.toLowerCase().includes(q)
                    )
                  })
                  .map((row) => (
                    <TableRow key={row._id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{formatDate(row.date)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">
                            {row.meetingTitle || 'Standard Team Meeting'}
                          </p>
                          {row.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                              {row.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {row.teamName || 'Team Unit'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-bold text-sm text-foreground">
                            {row.totalCount} present
                          </span>
                          {row.attendeeCount > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {row.attendeeCount} registered
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {row.loggedBy?.fullName || 'Team Lead'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs text-primary hover:text-primary"
                          onClick={() => setActiveRosterRecord(row)}
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden sm:inline">Roster</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Ticked Worker Roster Detail Dialog */}
      <Dialog
        open={Boolean(activeRosterRecord)}
        onOpenChange={(open) => !open && setActiveRosterRecord(null)}
      >
        <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5 shrink-0" />
              <DialogTitle className="font-serif text-lg">
                Meeting Attendance Roster
              </DialogTitle>
            </div>
            <DialogDescription>
              {activeRosterRecord?.meetingTitle || 'Team Meeting'}
              {' · '}
              {activeRosterRecord?.date && formatDate(activeRosterRecord.date)}
            </DialogDescription>
          </DialogHeader>

          {activeRosterRecord && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Team Unit: </span>
                  <span className="font-semibold text-foreground">
                    {activeRosterRecord.teamName || effectiveTeamName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Present: </span>
                  <span className="font-bold text-primary">
                    {activeRosterRecord.totalCount} Attendees
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Ticked Registered Workers ({activeRosterRecord.attendees?.length || activeRosterRecord.attendeeCount || 0})
                </h4>

                {activeRosterRecord.attendees && activeRosterRecord.attendees.length > 0 ? (
                  <div className="divide-y rounded-md border bg-card max-h-60 overflow-y-auto">
                    {activeRosterRecord.attendees.map((worker, i) => (
                      <div key={worker._id || i} className="flex items-center justify-between p-2.5 text-xs">
                        <span className="font-medium text-foreground">{worker.fullName}</span>
                        {worker.team && (
                          <Badge variant="secondary" className="text-[10px]">
                            {worker.team}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    {activeRosterRecord.totalCount > 0
                      ? `${activeRosterRecord.totalCount} attendees logged on this meeting entry.`
                      : 'No worker attendee entries.'}
                  </div>
                )}
              </div>

              {activeRosterRecord.notes && (
                <div className="rounded-md bg-muted/30 p-2.5 text-xs">
                  <span className="font-semibold text-muted-foreground">Notes: </span>
                  <span className="text-foreground">{activeRosterRecord.notes}</span>
                </div>
              )}

              {activeRosterRecord.loggedBy?.fullName && (
                <div className="text-[11px] text-muted-foreground text-right italic">
                  Recorded by {activeRosterRecord.loggedBy.fullName}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
