'use client'

import * as React from 'react'
import { useState } from 'react'
import { BarChart3, Users } from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import UsheringHeadcountView from '@/components/dashboard/attendance/UsheringHeadcountView'
import TeamMeetingAttendanceView from '@/components/dashboard/attendance/TeamMeetingAttendanceView'
import { Badge } from '@/components/dashboard/ui/badge'

interface AttendanceHubProps {
  session: ECCFSession
  rows: AttendanceRow[]
  availableWorkers: Array<{
    _id: string
    fullName: string
    team: string
    teams?: string[]
    hall: string
  }>
  canUsher: boolean
  isTeamLead: boolean
  isUshering: boolean
  initialTab?: string
  teamOptions: TeamUnitOption[]
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
}: AttendanceHubProps) {
  // Determine if dual view tabs should be shown:
  // Admin has access to both views.
  // Ushering Team Lead also has access to both (General headcount + their Ushering team meeting roster).
  const hasDualAccess = session.role === 'admin' || (isUshering && isTeamLead)

  // Default active tab
  const defaultTab = initialTab === 'team' || (!canUsher && isTeamLead)
    ? 'team'
    : 'general'

  const [activeTab, setActiveTab] = useState<'general' | 'team'>(defaultTab)

  const effectiveTeam =
    session.role === 'team_lead'
      ? session.leadingTeam || session.teams?.[0] || session.team
      : session.team

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              {!canUsher && isTeamLead
                ? `${effectiveTeam} Worker Attendance`
                : isUshering && !session.role.includes('admin')
                ? 'Ushering Attendance Console'
                : 'Attendance & Headcount Hub'}
            </h2>
            {isUshering && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                Ushering Unit
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {!canUsher && isTeamLead
              ? `Track and mark attendance for registered ${effectiveTeam} workers at unit meetings, rehearsals, and prayer vigils.`
              : isUshering && !session.role.includes('admin')
              ? 'Log general church service headcounts from ushers tally sheets. No names or ticking required.'
              : 'Dual Attendance System: General service headcount console (Ushering) and team meeting worker rosters.'}
          </p>
        </div>

        {/* Dual Tab Segmented Control (if Admin or Ushering Lead) */}
        {hasDualAccess && (
          <div className="inline-flex w-full rounded-xl bg-muted/80 p-1.5 text-xs font-semibold shadow-inner border border-border/50 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 transition-all sm:flex-none ${
                activeTab === 'general'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
              <span>General Headcount</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal hidden sm:inline-block">
                Ushering
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 transition-all sm:flex-none ${
                activeTab === 'team'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {session.role === 'team_lead' ? `${effectiveTeam} Roster` : 'Team Rosters'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* View Rendering Based on Role & Tab */}
      {hasDualAccess ? (
        activeTab === 'general' ? (
          <UsheringHeadcountView session={session} rows={rows} />
        ) : (
          <TeamMeetingAttendanceView
            session={session}
            rows={rows}
            availableWorkers={availableWorkers}
            teamOptions={teamOptions}
          />
        )
      ) : canUsher ? (
        <UsheringHeadcountView session={session} rows={rows} />
      ) : (
        <TeamMeetingAttendanceView
          session={session}
          rows={rows}
          availableWorkers={availableWorkers}
          teamOptions={teamOptions}
        />
      )}
    </div>
  )
}
