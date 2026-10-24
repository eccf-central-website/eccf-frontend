/**
 * Attendance Ledger & Headcount Console — /dashboard/attendance
 *
 * Implements Dual System:
 * - Ushering Team & Admins: General church service headcount console (Sunday, Wednesday, Academic, Special programmes)
 *   without ticking names. Fast, frictionless numeric entry with optional demographic breakdown.
 * - Team Leaders: Operational team meeting worker attendance, scoped strictly to their team workers.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import { listAttendance, fetchWorkersForAttendance } from '@/lib/dashboard/data'
import { isUsheringTeam } from '@/lib/dashboard/rbac'
import { getTeamUnitOptions } from '@/lib/teams'
import AttendanceHub from '@/components/dashboard/attendance/AttendanceHub'

interface AttendancePageProps {
  searchParams?: Promise<{
    tab?: string
  }>
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const session = await requireSection('attendance')
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const [rows, availableWorkers, teamOptions] = await Promise.all([
    listAttendance(session),
    fetchWorkersForAttendance(session),
    getTeamUnitOptions(),
  ])

  const canUsher = session.role === 'admin' || isUsheringTeam(session)
  const isTeamLead = session.role === 'team_lead'
  const isUshering = isUsheringTeam(session)

  return (
    <PageContainer>
      <AttendanceHub
        session={session}
        rows={rows}
        availableWorkers={availableWorkers}
        canUsher={canUsher}
        isTeamLead={isTeamLead}
        isUshering={isUshering}
        initialTab={resolvedSearchParams?.tab}
        teamOptions={teamOptions}
      />
    </PageContainer>
  )
}
