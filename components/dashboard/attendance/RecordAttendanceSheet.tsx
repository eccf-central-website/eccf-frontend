'use client'

import * as React from 'react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import {
  GENERAL_SERVICE_TYPES,
  type GeneralServiceType,
  type TeamUnitOption,
} from '@/lib/dashboard/attendance-constants'
import { workerLeaderLabel, type AttendanceWorker } from '@/lib/dashboard/attendance-worker'
import { recordGeneralHeadcountAction, recordTeamAttendanceAction } from '@/app/actions/attendance-actions'
import { formatCount } from '@/lib/dashboard/format'
import { toastFromResult } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
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

export type AttendanceRecordMode = 'general' | 'team'

export interface RecordAttendanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ECCFSession
  initialMode: AttendanceRecordMode
  canUsher: boolean
  canTeamRoster: boolean
  availableWorkers: AttendanceWorker[]
  teamOptions: TeamUnitOption[]
  todayIso: string
  onRecorded?: (entry: AttendanceRow) => void
}

function getLagosWeekday(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

function subtractDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10)
}

function getLastWeekdayIso(todayIso: string, targetDay: number): string {
  const currentDay = getLagosWeekday(todayIso)
  const diff = (currentDay - targetDay + 7) % 7
  return subtractDaysIso(todayIso, diff === 0 ? 7 : diff)
}

export default function RecordAttendanceSheet({
  open,
  onOpenChange,
  session,
  initialMode,
  canUsher,
  canTeamRoster,
  availableWorkers,
  teamOptions,
  todayIso,
  onRecorded,
}: RecordAttendanceSheetProps) {
  const [isPending, startTransition] = useTransition()
  const hasDualAccess = canUsher && canTeamRoster

  const resolveAllowedMode = (preferred: AttendanceRecordMode): AttendanceRecordMode => {
    if (preferred === 'general' && canUsher) return 'general'
    if (preferred === 'team' && canTeamRoster) return 'team'
    return canUsher ? 'general' : 'team'
  }

  const [mode, setMode] = useState<AttendanceRecordMode>(() => resolveAllowedMode(initialMode))
  const [formError, setFormError] = useState<string | null>(null)

  // Shared date state
  const [date, setDate] = useState(todayIso)

  // General headcount state
  const [serviceType, setServiceType] = useState<GeneralServiceType>('Sunday Service')
  const [serviceTitle, setServiceTitle] = useState('')
  const [totalCount, setTotalCount] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [menCount, setMenCount] = useState('')
  const [womenCount, setWomenCount] = useState('')
  const [staffMenCount, setStaffMenCount] = useState('')
  const [staffWomenCount, setStaffWomenCount] = useState('')
  const [childrenCount, setChildrenCount] = useState('')
  const [firstTimersCount, setFirstTimersCount] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')

  // Team roster state
  const teamNames = useMemo(() => teamOptions.map((option) => option.name), [teamOptions])
  const effectiveTeamName = useMemo(() => {
    if (session.role === 'team_lead') {
      return session.leadingTeam || session.teams?.[0] || session.team
    }
    return session.team && session.team !== 'Exco' ? session.team : teamNames[0] || 'Choir Team'
  }, [session, teamNames])

  const [targetTeam, setTargetTeam] = useState(effectiveTeamName)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set())
  const [extraCount, setExtraCount] = useState(0)
  const [workerSearch, setWorkerSearch] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  const totalInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setMode(resolveAllowedMode(initialMode))
      setFormError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode, canUsher, canTeamRoster])

  const lastSundayIso = useMemo(() => getLastWeekdayIso(todayIso, 0), [todayIso])
  const lastWednesdayIso = useMemo(() => getLastWeekdayIso(todayIso, 3), [todayIso])

  const datePresets = useMemo(
    () => [
      { id: 'today', label: 'Today', value: todayIso },
      { id: 'last-sun', label: 'Last Sunday', value: lastSundayIso },
      { id: 'last-wed', label: 'Last Wednesday', value: lastWednesdayIso },
    ],
    [todayIso, lastSundayIso, lastWednesdayIso]
  )

  const studentSum = (parseInt(menCount, 10) || 0) + (parseInt(womenCount, 10) || 0)
  const staffSum = (parseInt(staffMenCount, 10) || 0) + (parseInt(staffWomenCount, 10) || 0)
  const childrenSum = parseInt(childrenCount, 10) || 0

  // Total headcount sum: Students + Staff + Children
  // NOTE: First-timers are visitors already counted among the students/staff above, so they are not double-counted into total headcount.
  const breakdownSum = studentSum + staffSum + childrenSum

  const applyBreakdownSum = () => {
    if (breakdownSum > 0) {
      setTotalCount(String(breakdownSum))
      setFormError(null)
    }
  }

  const adjustTotal = (delta: number) => {
    const current = parseInt(totalCount, 10) || 0
    const nextVal = Math.max(0, current + delta)
    setTotalCount(String(nextVal))
    setFormError(null)
  }

  // Workers belonging to the target team
  const filteredTeamWorkers = useMemo(() => {
    const activeTeam = (session.role === 'team_lead' ? effectiveTeamName : targetTeam || '').toLowerCase()
    return availableWorkers.filter((w) => {
      if (!activeTeam || activeTeam === 'all') return true
      const workerTeams = (w.teams && w.teams.length > 0 ? w.teams : [w.team])
        .filter(Boolean)
        .map((t) => String(t).toLowerCase())
      return workerTeams.some((wt) => wt.includes(activeTeam) || activeTeam.includes(wt))
    })
  }, [availableWorkers, session.role, effectiveTeamName, targetTeam])

  const visibleWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase()
    const filtered = filteredTeamWorkers.filter(
      (w) =>
        (w.fullName || '').toLowerCase().includes(q) ||
        (w.hall || '').toLowerCase().includes(q)
    )
    return filtered.sort((a, b) => {
      const aLeader = Boolean(workerLeaderLabel(a))
      const bLeader = Boolean(workerLeaderLabel(b))
      if (aLeader && !bLeader) return -1
      if (!aLeader && bLeader) return 1
      return (a.fullName || '').localeCompare(b.fullName || '')
    })
  }, [filteredTeamWorkers, workerSearch])

  const toggleWorker = (id: string) => {
    setFormError(null)
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setFormError(null)
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

  const resetGeneralForm = () => {
    setTotalCount('')
    setServiceTitle('')
    setMenCount('')
    setWomenCount('')
    setStaffMenCount('')
    setStaffWomenCount('')
    setChildrenCount('')
    setFirstTimersCount('')
    setGeneralNotes('')
    setShowBreakdown(false)
  }

  const resetTeamForm = () => {
    setSelectedWorkerIds(new Set())
    setMeetingTitle('')
    setExtraCount(0)
    setWorkerSearch('')
    setMeetingNotes('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError('Please choose a valid date.')
      dateInputRef.current?.focus()
      return
    }

    if (mode === 'general') {
      const countNum = parseInt(totalCount, 10)
      if (!countNum || isNaN(countNum) || countNum <= 0) {
        setFormError('Enter a total headcount greater than zero.')
        totalInputRef.current?.focus()
        return
      }

      const parsedMen = menCount.trim() !== '' ? parseInt(menCount, 10) : undefined
      const parsedWomen = womenCount.trim() !== '' ? parseInt(womenCount, 10) : undefined
      const parsedStaffMen = staffMenCount.trim() !== '' ? parseInt(staffMenCount, 10) : undefined
      const parsedStaffWomen = staffWomenCount.trim() !== '' ? parseInt(staffWomenCount, 10) : undefined
      const parsedStaffCount =
        parsedStaffMen !== undefined || parsedStaffWomen !== undefined
          ? (parsedStaffMen || 0) + (parsedStaffWomen || 0)
          : undefined
      const parsedChildren = childrenCount.trim() !== '' ? parseInt(childrenCount, 10) : undefined
      // First-timers is optional: if omitted/blank, do NOT set 0; pass undefined
      const parsedFirstTimers = firstTimersCount.trim() !== '' ? parseInt(firstTimersCount, 10) : undefined

      startTransition(async () => {
        const result = await recordGeneralHeadcountAction({
          date,
          serviceType,
          meetingTitle: serviceTitle.trim() || undefined,
          totalCount: countNum,
          menCount: parsedMen,
          womenCount: parsedWomen,
          staffCount: parsedStaffCount,
          staffMenCount: parsedStaffMen,
          staffWomenCount: parsedStaffWomen,
          childrenCount: parsedChildren,
          firstTimersCount: parsedFirstTimers,
          notes: generalNotes.trim() || undefined,
        })

        if (
          toastFromResult(result, {
            success: `${serviceType} headcount (${formatCount(countNum)}) recorded.`,
          })
        ) {
          onRecorded?.({
            _id: result.data.id,
            date,
            serviceType,
            meetingTitle: serviceTitle.trim() || undefined,
            totalCount: countNum,
            attendeeCount: 0,
            menCount: parsedMen,
            womenCount: parsedWomen,
            staffCount: parsedStaffCount,
            staffMenCount: parsedStaffMen,
            staffWomenCount: parsedStaffWomen,
            childrenCount: parsedChildren,
            firstTimersCount: parsedFirstTimers,
            notes: generalNotes.trim() || undefined,
            loggedBy: {
              _id: session.id,
              fullName: session.name || 'Fellowship Leader',
            },
          })
          resetGeneralForm()
          onOpenChange(false)
        }
      })
      return
    }

    // Team mode
    if (totalPresentCount <= 0) {
      setFormError('Select at least one worker or enter visiting attendees.')
      extraInputRef.current?.focus()
      return
    }

    const teamToLog = session.role === 'team_lead' ? effectiveTeamName : targetTeam
    const attendeeIds = Array.from(selectedWorkerIds)
    const attendeeObjects = availableWorkers
      .filter((w) => selectedWorkerIds.has(w._id))
      .map((w) => ({
        _id: w._id,
        fullName: w.fullName,
        team: w.team,
        teams: w.teams,
      }))

    startTransition(async () => {
      const result = await recordTeamAttendanceAction({
        date,
        meetingTitle: meetingTitle.trim() || undefined,
        teamName: teamToLog,
        attendeeIds,
        extraCount: Math.max(0, extraCount || 0),
        notes: meetingNotes.trim() || undefined,
      })

      if (
        toastFromResult(result, {
          success: `Recorded ${formatCount(totalPresentCount)} attendees for ${teamToLog}.`,
        })
      ) {
        onRecorded?.({
          _id: result.data.id,
          date,
          serviceType: 'Team Meeting',
          meetingTitle: meetingTitle.trim() || undefined,
          teamName: teamToLog,
          totalCount: totalPresentCount,
          attendeeCount: attendeeIds.length,
          attendees: attendeeObjects,
          notes: meetingNotes.trim() || undefined,
          loggedBy: {
            _id: session.id,
            fullName: session.name || 'Team Lead',
          },
        })
        resetTeamForm()
        onOpenChange(false)
      }
    })
  }

  return (
    <RecordSheet
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next)
      }}
      side="right"
      className="[&>button]:h-11 [&>button]:w-11"
      title={mode === 'general' ? 'Record service headcount' : 'Record team meeting attendance'}
      description={
        mode === 'general'
          ? 'Log total attendance for a church service with optional demographic counts.'
          : 'Mark present workers on the team roster and include any visiting attendees.'
      }
      footer={
        <div className="flex w-full items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="min-h-11 flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-attendance-form"
            disabled={isPending}
            aria-busy={isPending || undefined}
            className="min-h-11 flex-1 gap-2 font-semibold sm:flex-none"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Save attendance</span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="record-attendance-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {hasDualAccess && (
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted-foreground">
              Attendance type
            </span>
            <div className="grid grid-cols-2 gap-1.5 rounded-[var(--radius-control)] bg-surface-raised p-1">
              <button
                type="button"
                aria-pressed={mode === 'general'}
                onClick={() => {
                  setMode('general')
                  setFormError(null)
                }}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === 'general'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>General headcount</span>
              </button>
              <button
                type="button"
                aria-pressed={mode === 'team'}
                onClick={() => {
                  setMode('team')
                  setFormError(null)
                }}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === 'team'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Team meeting</span>
              </button>
            </div>
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[var(--radius-control)] bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {/* Date & 44px Quick-Pick Chips */}
        <div className="space-y-2.5">
          <Label htmlFor="att-record-date" className="text-sm font-medium text-foreground">
            {mode === 'general' ? 'Service date' : 'Meeting date'}
          </Label>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick date selections">
            {datePresets.map((preset) => {
              const isSelected = date === preset.value
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setDate(preset.value)
                    setFormError(null)
                  }}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-[var(--radius-pill)] px-3 text-sm font-medium transition-colors [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-surface-raised text-foreground hover:bg-muted'
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <Input
            ref={dateInputRef}
            id="att-record-date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setFormError(null)
            }}
            required
          />
        </div>

        {mode === 'general' ? (
          <>
            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="att-service-type" className="text-sm font-medium text-foreground">
                Service type
              </Label>
              <Select
                value={serviceType}
                onValueChange={(val) => setServiceType(val as GeneralServiceType)}
              >
                <SelectTrigger id="att-service-type" aria-label="Service type">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {GENERAL_SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional Theme / Title */}
            <div className="space-y-2">
              <Label htmlFor="att-service-title" className="text-sm font-medium text-foreground">
                Programme or theme{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="att-service-title"
                name="meetingTitle"
                type="text"
                placeholder="e.g. Communion Service, Freshers Welcome"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
              />
            </div>

            {/* Total Headcount */}
            <div className="space-y-3 rounded-[var(--radius-card)] bg-surface-raised p-4">
              <div className="space-y-1">
                <Label htmlFor="att-total-count" className="text-sm font-semibold text-foreground">
                  Total headcount
                </Label>
                <p className="text-[13px] text-muted-foreground">
                  Combined usher tally across auditorium and overflow sections.
                </p>
              </div>

              <div className="relative">
                <Input
                  ref={totalInputRef}
                  id="att-total-count"
                  name="totalCount"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="0"
                  value={totalCount}
                  onChange={(e) => {
                    setTotalCount(e.target.value)
                    setFormError(null)
                  }}
                  className="min-h-14 bg-card pr-24 font-sans text-2xl font-semibold tracking-tight tabular-nums md:h-14 md:text-2xl"
                  required
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-muted-foreground"
                >
                  attendees
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Add to headcount">
                {[10, 50, 100].map((delta) => (
                  <Button
                    key={delta}
                    type="button"
                    variant="outline"
                    onClick={() => adjustTotal(delta)}
                    className="min-h-11 bg-card px-3 text-sm font-medium tabular-nums md:min-h-10"
                  >
                    +{delta}
                  </Button>
                ))}
              </div>
            </div>

            {/* Optional Demographic Breakdown */}
            <div className="rounded-[var(--radius-card)] bg-surface-raised p-4 space-y-4">
              <button
                type="button"
                aria-expanded={showBreakdown}
                aria-controls="att-breakdown-panel"
                onClick={() => setShowBreakdown((prev) => !prev)}
                className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius-control)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>Demographic breakdown</span>
                </span>
                <span className="text-[13px] font-medium text-muted-foreground">
                  {showBreakdown ? 'Hide' : 'Optional (Students & Staff)'}
                </span>
              </button>

              {showBreakdown && (
                <div id="att-breakdown-panel" className="space-y-4 pt-1">
                  {/* Sub-section 1: University Students */}
                  <div className="rounded-[calc(var(--radius-card)-2px)] border border-border/60 bg-card/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          University Students
                        </span>
                      </div>
                      {studentSum > 0 && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          Subtotal: <strong className="text-foreground">{formatCount(studentSum)}</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="bc-men" className="text-[13px] text-muted-foreground">
                          Male students (Brothers)
                        </Label>
                        <Input
                          id="bc-men"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          value={menCount}
                          onChange={(e) => setMenCount(e.target.value)}
                          className="bg-card font-sans tabular-nums"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bc-women" className="text-[13px] text-muted-foreground">
                          Female students (Sisters)
                        </Label>
                        <Input
                          id="bc-women"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          value={womenCount}
                          onChange={(e) => setWomenCount(e.target.value)}
                          className="bg-card font-sans tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sub-section 2: University Staff & Faculty */}
                  <div className="rounded-[calc(var(--radius-card)-2px)] border border-border/60 bg-card/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          University Staff & Faculty
                        </span>
                      </div>
                      {staffSum > 0 && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          Subtotal: <strong className="text-foreground">{formatCount(staffSum)}</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="bc-staff-men" className="text-[13px] text-muted-foreground">
                          Male staff / lecturers
                        </Label>
                        <Input
                          id="bc-staff-men"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          value={staffMenCount}
                          onChange={(e) => setStaffMenCount(e.target.value)}
                          className="bg-card font-sans tabular-nums"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bc-staff-women" className="text-[13px] text-muted-foreground">
                          Female staff / lecturers
                        </Label>
                        <Input
                          id="bc-staff-women"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          value={staffWomenCount}
                          onChange={(e) => setStaffWomenCount(e.target.value)}
                          className="bg-card font-sans tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sub-section 3: Children & Teens */}
                  <div className="rounded-[calc(var(--radius-card)-2px)] border border-border/60 bg-card/60 p-3.5 space-y-2">
                    <Label htmlFor="bc-children" className="text-[13px] font-medium text-foreground">
                      Children & Teens <span className="font-normal text-muted-foreground">(dependents / visitors)</span>
                    </Label>
                    <Input
                      id="bc-children"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="0"
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(e.target.value)}
                      className="bg-card font-sans tabular-nums"
                    />
                  </div>

                  {/* Sub-section 4: First-Timers (Optional) */}
                  <div className="rounded-[calc(var(--radius-card)-2px)] border border-dashed border-border/80 bg-surface-raised/50 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-success" aria-hidden="true" />
                        <Label htmlFor="bc-firsttimers" className="text-[13px] font-semibold text-foreground">
                          First-Time Visitors
                        </Label>
                      </div>
                      <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Optional
                      </span>
                    </div>
                    <Input
                      id="bc-firsttimers"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="Leave blank if not counted"
                      value={firstTimersCount}
                      onChange={(e) => setFirstTimersCount(e.target.value)}
                      className="bg-card font-sans tabular-nums"
                    />
                    <p className="text-[12px] text-muted-foreground leading-normal">
                      Leave blank if skipped (blank is unrecorded, not zero). First-timers are visitors already counted within the students or staff totals above.
                    </p>
                  </div>

                  {/* Breakdown Sum / Apply Action */}
                  {breakdownSum > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                        <span className="text-muted-foreground tabular-nums">
                          Breakdown sum:{' '}
                          <strong className="font-semibold text-foreground">
                            {formatCount(breakdownSum)}
                          </strong>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatCount(studentSum)} students + {formatCount(staffSum)} staff{childrenSum > 0 ? ` + ${formatCount(childrenSum)} children` : ''})
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={applyBreakdownSum}
                          className="min-h-11 gap-1.5 bg-card px-3 text-sm md:min-h-10"
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <span>Use sum ({formatCount(breakdownSum)})</span>
                        </Button>
                      </div>

                      {totalCount && parseInt(totalCount, 10) !== breakdownSum && (
                        <div
                          role="note"
                          className="flex items-start gap-2 rounded-[var(--radius-control)] bg-warning/20 px-3 py-2 text-[13px] text-warning-foreground dark:bg-warning/15 dark:text-warning"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="tabular-nums">
                            Differs from total ({totalCount}) by{' '}
                            {formatCount(Math.abs(parseInt(totalCount, 10) - breakdownSum))}.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="att-headcount-notes" className="text-sm font-medium text-foreground">
                Observations{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="att-headcount-notes"
                name="notes"
                type="text"
                placeholder="e.g. Overflow wing opened at 9:15am"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            {/* Team Selection for Admin */}
            {session.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="att-team-select" className="text-sm font-medium text-foreground">
                  Team
                </Label>
                <Select
                  value={targetTeam}
                  onValueChange={(nextTeam) => {
                    setTargetTeam(nextTeam)
                    setSelectedWorkerIds(new Set())
                    setFormError(null)
                  }}
                >
                  <SelectTrigger id="att-team-select" aria-label="Select team">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Meeting Topic */}
            <div className="space-y-2">
              <Label htmlFor="att-meeting-title" className="text-sm font-medium text-foreground">
                Meeting topic{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="att-meeting-title"
                name="meetingTitle"
                type="text"
                placeholder="e.g. Sunday rehearsal, Prayer vigil"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>

            {/* Worker Roster Checklist */}
            <div className="space-y-3 rounded-[var(--radius-card)] bg-surface-raised p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Team roster
                  </p>
                  <p className="text-[13px] text-muted-foreground tabular-nums">
                    {formatCount(selectedWorkerIds.size)} of {formatCount(filteredTeamWorkers.length)} selected
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={selectAllVisible}
                    disabled={visibleWorkers.length === 0}
                    className="min-h-11 bg-card px-3 text-sm md:min-h-10"
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={deselectAllVisible}
                    disabled={selectedWorkerIds.size === 0}
                    className="min-h-11 px-3 text-sm md:min-h-10"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="att-worker-search" className="sr-only">
                  Filter workers by name or residence hall
                </Label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="att-worker-search"
                    type="text"
                    placeholder="Filter workers by name or hall…"
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    autoComplete="off"
                    className={cn('bg-card pl-9', workerSearch ? 'pr-11' : 'pr-3')}
                  />
                  {workerSearch && (
                    <button
                      type="button"
                      onClick={() => setWorkerSearch('')}
                      aria-label="Clear worker search"
                      className="absolute right-0.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
                {visibleWorkers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No active workers match this team filter.
                  </p>
                ) : (
                  visibleWorkers.map((worker) => {
                    const isChecked = selectedWorkerIds.has(worker._id)
                    const leaderLabel = workerLeaderLabel(worker)
                    return (
                      <button
                        key={worker._id}
                        type="button"
                        aria-pressed={isChecked}
                        onClick={() => toggleWorker(worker._id)}
                        className={cn(
                          'flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isChecked
                            ? 'bg-primary/12 ring-1 ring-inset ring-primary/35'
                            : 'bg-card hover:bg-muted/60'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                              isChecked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-input bg-transparent'
                            )}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {worker.fullName}
                              </span>
                              {leaderLabel && (
                                <StatusBadge variant="primary" dot>
                                  {leaderLabel}
                                </StatusBadge>
                              )}
                            </div>
                            <p className="truncate text-[13px] text-muted-foreground">
                              {worker.hall || 'Campus'}
                            </p>
                          </div>
                        </div>

                        {isChecked ? (
                          <StatusBadge variant="success" dot>
                            Present
                          </StatusBadge>
                        ) : (
                          <span className="shrink-0 text-[13px] text-muted-foreground">
                            Absent
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Extra Guests */}
            <div className="grid grid-cols-1 items-center gap-3 rounded-[var(--radius-card)] bg-surface-raised p-4 sm:grid-cols-2">
              <div className="space-y-0.5">
                <Label htmlFor="att-extra-count" className="text-sm font-medium text-foreground">
                  Visiting / guest attendees
                </Label>
                <p className="text-[13px] text-muted-foreground">
                  Observers or unassigned workers.
                </p>
              </div>
              <Input
                ref={extraInputRef}
                id="att-extra-count"
                name="extraCount"
                type="number"
                min="0"
                inputMode="numeric"
                value={extraCount}
                onChange={(e) => {
                  setExtraCount(Math.max(0, parseInt(e.target.value, 10) || 0))
                  setFormError(null)
                }}
                className="bg-card text-right font-sans font-semibold tabular-nums"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="att-meeting-notes" className="text-sm font-medium text-foreground">
                Meeting notes{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="att-meeting-notes"
                name="notes"
                type="text"
                placeholder="Key decisions, songs rehearsed, prayer focus…"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
              />
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-primary/10 px-4 py-3 text-sm tabular-nums">
              <span className="font-medium text-foreground">Total present</span>
              <span className="font-semibold text-accent-foreground dark:text-primary">
                {formatCount(selectedWorkerIds.size)} workers + {formatCount(extraCount)} guests ={' '}
                {formatCount(totalPresentCount)}
              </span>
            </div>
          </>
        )}
      </form>
    </RecordSheet>
  )
}
