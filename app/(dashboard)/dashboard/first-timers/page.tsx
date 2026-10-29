/**
 * First-timers — /dashboard/first-timers
 *
 * Implements the first-timers follow-up queue:
 * - One semantic h1: First-timers
 * - Subtitle: Follow up with every new person within 48 hours.
 * - Date-only eyebrow.
 * - Scoped by role: hall reps see assigned hall visitors, admins and outreach leads see fellowship-wide.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import { listFirstTimers } from '@/lib/dashboard/data'
import { isHallScoped } from '@/lib/dashboard/rbac'
import FirstTimersTable from '@/components/dashboard/first-timers/FirstTimersTable'

export const dynamic = 'force-dynamic'

export default async function FirstTimersPage() {
  const session = await requireSection('firstTimers')
  const rows = await listFirstTimers(session)

  const isHallRep = isHallScoped(session.role)

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const pageTitle = isHallRep
    ? `${session.hall || 'Hall'} first-timers`
    : 'First-timers'

  const pageDescription = isHallRep
    ? `Visitors living in ${session.hall || 'your hall'}. Follow up within 48 hours.`
    : 'Follow up with every new person within 48 hours.'

  return (
    <PageContainer>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {todayStr}
        </p>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {pageTitle}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{pageDescription}</p>
      </div>

      {/* Main Roster & Follow-Up Table */}
      <FirstTimersTable rows={rows} session={session} />
    </PageContainer>
  )
}
