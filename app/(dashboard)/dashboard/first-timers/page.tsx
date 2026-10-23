/**
 * First-Timers & Connect Intake — /dashboard/first-timers
 *
 * Scoped by role:
 * - Hall Reps: see only visitors residing in their assigned hall
 * - Outreach Team Leader / Follow-up Coordinator: see all campus visitors for follow-up coordination
 * - Admins: global overview across all halls
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import { listFirstTimers } from '@/lib/dashboard/data'
import { isHallScoped, isOutreachLeader } from '@/lib/dashboard/rbac'
import FirstTimersTable from '@/components/dashboard/first-timers/FirstTimersTable'

export const dynamic = 'force-dynamic'

export default async function FirstTimersPage() {
  const session = await requireSection('firstTimers')
  const rows = await listFirstTimers(session)

  const isHallRep = isHallScoped(session.role)
  const isOutreach = isOutreachLeader(session)

  const pageTitle = isHallRep
    ? `${session.hall || 'Hall'} First-Timers`
    : isOutreach
      ? 'Outreach & Follow-Up Portal'
      : 'First-Timers & Connect Intake'

  const pageDescription = isHallRep
    ? `Visitors who connected with ECCF living in ${session.hall || 'your hall'}. Reach out to welcome them and check on their welfare.`
    : isOutreach
      ? 'All first-time visitors and connect submissions across campus for coordinated pastoral follow-up.'
      : 'Connect form submissions from campus services and outreach events.'

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col gap-2 border-b pb-5">
        <h2 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
          {pageTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{pageDescription}</p>
      </div>

      {/* Main Roster & Follow-Up Table */}
      <FirstTimersTable rows={rows} session={session} />
    </PageContainer>
  )
}
