/**
 * First-timers — /dashboard/first-timers
 *
 * Implements the first-timers follow-up queue:
 * - PageHeader with Lagos date eyebrow, single Belleza <h1>, and Work Sans subtitle.
 * - Streamed follow-up roster inside Suspense + BlockErrorBoundary.
 * - Scoped by role: hall reps see assigned hall visitors, admins and outreach leads see fellowship-wide.
 */

import { Suspense } from 'react'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import FirstTimersTable from '@/components/dashboard/first-timers/FirstTimersTable'
import BlockErrorBoundary from '@/components/dashboard/states/BlockErrorBoundary'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { requireSection } from '@/lib/dashboard/auth'
import { listFirstTimers } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import { isHallScoped } from '@/lib/dashboard/rbac'
import type { ECCFSession } from '@/types'

export const dynamic = 'force-dynamic'

function FirstTimersContentSkeleton() {
  return (
    <div className="space-y-6">
      <LoadingRegion announce={false}>
        <div className="rounded-[var(--radius-card)] bg-card p-1.5 shadow-sm sm:p-2">
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 shrink-0 rounded-[var(--radius-control)]" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
      <TableSkeleton rows={6} columns={5} pagination={false} label="Loading first-timers…" />
    </div>
  )
}

async function FirstTimersContent({ session }: { session: ECCFSession }) {
  const rows = await listFirstTimers(session)
  return <FirstTimersTable rows={rows} session={session} />
}

export default async function FirstTimersPage() {
  const session = await requireSection('firstTimers')
  const isHallRep = isHallScoped(session.role)

  const pageTitle = isHallRep
    ? `${session.hall || 'Hall'} first-timers`
    : 'First-timers'

  return (
    <PageContainer>
      <PageHeader
        eyebrow={formatDate(lagosDate())}
        title={pageTitle}
        description="Follow up with every new person within 48 hours."
      />

      <BlockErrorBoundary title="First-timers couldn't load">
        <Suspense fallback={<FirstTimersContentSkeleton />}>
          <FirstTimersContent session={session} />
        </Suspense>
      </BlockErrorBoundary>
    </PageContainer>
  )
}
