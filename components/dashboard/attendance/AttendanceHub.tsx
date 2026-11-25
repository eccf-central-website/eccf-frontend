'use client'

import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, CalendarPlus, Users } from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import type { AttendanceWorker } from '@/lib/dashboard/attendance-worker'
import { isRegularTeamLeader } from '@/lib/dashboard/rbac'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import UsheringHeadcountView from '@/components/dashboard/attendance/UsheringHeadcountView'
import TeamMeetingAttendanceView from '@/components/dashboard/attendance/TeamMeetingAttendanceView'
import RecordAttendanceSheet, {
  type AttendanceRecordMode,
} from '@/components/dashboard/attendance/RecordAttendanceSheet'

interface AttendanceHubProps {
  session: ECCFSession
  rows: AttendanceRow[]
  availableWorkers: AttendanceWorker[]
  canUsher: boolean
  isTeamLead: boolean
  isUshering: boolean
  initialTab?: string
  teamOptions: TeamUnitOption[]
  dateEyebrow: string
  todayIso: string
}

export default function AttendanceHub({
  session,
  rows,
  availableWorkers,
  canUsher,
  isTeamLead,
  isUshering,
  initialTab,
  teamOptions,
  dateEyebrow,
  todayIso,
}: AttendanceHubProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Admin and Ushering Team Leads have access to both General Headcount and Team Rosters.
  const hasDualAccess = session.role === 'admin' || (isUshering && isTeamLead)
  const canTeamRoster = hasDualAccess || !canUsher

  const defaultTab: AttendanceRecordMode =
    initialTab === 'team' || (!canUsher && isTeamLead) ? 'team' : 'general'

  const [activeTab, setActiveTab] = useState<AttendanceRecordMode>(defaultTab)
  const [localRows, setLocalRows] = useState<AttendanceRow[]>(rows)
  const [recordSheetOpen, setRecordSheetOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const generalTabRef = useRef<HTMLButtonElement>(null)
  const teamTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setLocalRows(rows)
  }, [rows])

  useEffect(() => {
    if (!highlightedId) return
    const timer = window.setTimeout(() => setHighlightedId(null), 3500)
    return () => window.clearTimeout(timer)
  }, [highlightedId])

  const effectiveTeam =
    session.role === 'team_lead'
      ? session.leadingTeam || session.teams?.[0] || session.team
      : session.team

  const handleTabChange = useCallback(
    (nextTab: AttendanceRecordMode) => {
      setActiveTab(nextTab)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        params.set('tab', nextTab)
        const query = params.toString()
        window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
      }
    },
    [pathname]
  )

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const next: AttendanceRecordMode =
        e.key === 'Home'
          ? 'general'
          : e.key === 'End'
            ? 'team'
            : activeTab === 'general'
              ? 'team'
              : 'general'
      handleTabChange(next)
      if (next === 'general') generalTabRef.current?.focus()
      else teamTabRef.current?.focus()
    }
  }

  const handleRecorded = (entry: AttendanceRow) => {
    setLocalRows((prev) => [entry, ...prev.filter((item) => item._id !== entry._id)])
    setHighlightedId(entry._id)
    if (hasDualAccess) {
      const entryMode: AttendanceRecordMode =
        entry.serviceType === 'Team Meeting' ? 'team' : 'general'
      if (entryMode !== activeTab) {
        handleTabChange(entryMode)
      }
    }
    router.refresh()
  }

  const resolvedViewMode: AttendanceRecordMode = hasDualAccess
    ? activeTab
    : canUsher
      ? 'general'
      : 'team'

  const subtitle =
    isRegularTeamLeader(session) || (!canUsher && isTeamLead) || resolvedViewMode === 'team'
      ? 'Record meeting attendance and manage team rosters.'
      : 'Record service headcounts and manage team rosters.'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={dateEyebrow}
        title="Attendance"
        description={subtitle}
        badge={
          isUshering ? (
            <StatusBadge variant="primary" dot>
              Ushering
            </StatusBadge>
          ) : undefined
        }
        primaryAction={
          <Button
            type="button"
            onClick={() => setRecordSheetOpen(true)}
            className="min-h-11 h-11 w-full gap-2 px-4 font-semibold sm:w-auto"
          >
            <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Record attendance</span>
          </Button>
        }
      />

      {hasDualAccess && (
        <div
          role="tablist"
          aria-label="Attendance views"
          className="inline-flex w-full rounded-[var(--radius-card)] bg-surface-raised p-1 sm:w-auto"
        >
          <button
            ref={generalTabRef}
            id="tab-attendance-general"
            type="button"
            role="tab"
            aria-selected={activeTab === 'general'}
            aria-controls="panel-attendance-general"
            tabIndex={activeTab === 'general' ? 0 : -1}
            onClick={() => handleTabChange('general')}
            onKeyDown={handleTabKeyDown}
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[calc(var(--radius-card)-4px)] px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
              activeTab === 'general'
                ? 'bg-card font-semibold text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BarChart3
              className={cn(
                'h-4 w-4 shrink-0',
                activeTab === 'general' ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            />
            <span>General Headcount</span>
          </button>

          <button
            ref={teamTabRef}
            id="tab-attendance-team"
            type="button"
            role="tab"
            aria-selected={activeTab === 'team'}
            aria-controls="panel-attendance-team"
            tabIndex={activeTab === 'team' ? 0 : -1}
            onClick={() => handleTabChange('team')}
            onKeyDown={handleTabKeyDown}
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[calc(var(--radius-card)-4px)] px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
              activeTab === 'team'
                ? 'bg-card font-semibold text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users
              className={cn(
                'h-4 w-4 shrink-0',
                activeTab === 'team' ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            />
            <span>
              {session.role === 'team_lead' ? `${effectiveTeam} Roster` : 'Team Rosters'}
            </span>
          </button>
        </div>
      )}

      {hasDualAccess ? (
        activeTab === 'general' ? (
          <div
            id="panel-attendance-general"
            role="tabpanel"
            aria-labelledby="tab-attendance-general"
          >
            <UsheringHeadcountView
              session={session}
              rows={localRows}
              highlightedId={highlightedId}
              onRecordClick={() => setRecordSheetOpen(true)}
            />
          </div>
        ) : (
          <div
            id="panel-attendance-team"
            role="tabpanel"
            aria-labelledby="tab-attendance-team"
          >
            <TeamMeetingAttendanceView
              session={session}
              rows={localRows}
              availableWorkers={availableWorkers}
              teamOptions={teamOptions}
              highlightedId={highlightedId}
              onRecordClick={() => setRecordSheetOpen(true)}
            />
          </div>
        )
      ) : canUsher ? (
        <UsheringHeadcountView
          session={session}
          rows={localRows}
          highlightedId={highlightedId}
          onRecordClick={() => setRecordSheetOpen(true)}
        />
      ) : (
        <TeamMeetingAttendanceView
          session={session}
          rows={localRows}
          availableWorkers={availableWorkers}
          teamOptions={teamOptions}
          highlightedId={highlightedId}
          onRecordClick={() => setRecordSheetOpen(true)}
        />
      )}

      <RecordAttendanceSheet
        open={recordSheetOpen}
        onOpenChange={setRecordSheetOpen}
        session={session}
        initialMode={resolvedViewMode}
        canUsher={canUsher}
        canTeamRoster={canTeamRoster}
        availableWorkers={availableWorkers}
        teamOptions={teamOptions}
        todayIso={todayIso}
        onRecorded={handleRecorded}
      />
    </div>
  )
}
