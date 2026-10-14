/**
 * Attendance Ledger — /dashboard/attendance
 *
 * Provides meeting attendance tracking and worker tick-off rosters.
 * - Team leads: scoped to their operational team meetings and workers
 * - Admins: full visibility across all 14 teams and central fellowship meetings
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import { Card, CardContent } from '@/components/dashboard/ui/card'
import { CalendarCheck, Users, BarChart3 } from 'lucide-react'
import { requireSection } from '@/lib/dashboard/auth'
import { listAttendance, fetchWorkersForAttendance } from '@/lib/dashboard/data'
import RecordAttendanceModal from '@/components/dashboard/attendance/RecordAttendanceModal'
import AttendanceTable from '@/components/dashboard/attendance/AttendanceTable'

export default async function AttendancePage() {
  const session = await requireSection('attendance')
  const [rows, availableWorkers] = await Promise.all([
    listAttendance(session),
    fetchWorkersForAttendance(session),
  ])

  const totalHeadcountSum = rows.reduce((acc, curr) => acc + (curr.totalCount || 0), 0)
  const averageAttendance = rows.length > 0 ? Math.round(totalHeadcountSum / rows.length) : 0

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {session.role === 'team_lead'
              ? `${session.teams && session.teams.length > 0 ? session.teams.join(' & ') : session.team} Attendance Ledger`
              : 'Attendance & Meeting Ledger'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.role === 'team_lead'
              ? `Manage meeting rosters, tick off registered ${session.teams && session.teams.length > 0 ? session.teams.join(' & ') : session.team} crew, and view attendance logs.`
              : 'Global fellowship attendance files, team meeting records, and worker attendee rosters.'}
          </p>
        </div>

        <RecordAttendanceModal
          session={session}
          availableWorkers={availableWorkers}
        />
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Meetings Recorded</p>
              <h3 className="text-2xl font-bold text-foreground">{rows.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cumulative Attendance</p>
              <h3 className="text-2xl font-bold text-foreground">{totalHeadcountSum.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Average Attendance</p>
              <h3 className="text-2xl font-bold text-foreground">{averageAttendance}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Table */}
      <AttendanceTable rows={rows} session={session} />
    </PageContainer>
  )
}
