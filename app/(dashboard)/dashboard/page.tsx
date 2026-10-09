/**
 * Dashboard Overview — /dashboard
 *
 * The header renders straight away. Each data block then streams on its
 * own: it has its own <Suspense> skeleton and its own BlockErrorBoundary,
 * so one slow or failing source never holds up or takes down the rest.
 * Errors outside those blocks still fall through to dashboard/error.tsx.
 *
 * RBAC is decided here on the server: the stat groups come pre-filtered
 * from getOverviewStats(), and the skeleton is sized to the role's cards.
 *
 * Also the landing spot for requireSection() denials (`?denied=<section>`),
 * which DeniedToast turns into a one-off toast.
 */

import { Suspense } from 'react'
import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection, hasPermission, ROLE_LABELS, SECTION_PATHS } from '@/lib/dashboard/rbac'
import DeniedToast from '@/components/dashboard/shell/DeniedToast'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import ActivityList from '@/components/dashboard/overview/ActivityList'
import OverviewStats, { FINANCE_CARD_COUNT, PEOPLE_CARD_COUNT } from '@/components/dashboard/overview/OverviewStats'
import RecentFirstTimers from '@/components/dashboard/overview/RecentFirstTimers'
import RecentWelfare from '@/components/dashboard/overview/RecentWelfare'
import BlockErrorBoundary from '@/components/dashboard/states/BlockErrorBoundary'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import { Badge } from '@/components/dashboard/ui/badge'

export const dynamic = 'force-dynamic'

/** Body placeholder inside an ActivityList; the stats skeleton does the announcing. */
function ActivitySkeleton() {
  return <FeedSkeleton items={3} search={false} announce={false} className="p-4 sm:p-5" />
}

export default async function DashboardOverviewPage() {
  const session = await requireSession()
  const statCount =
    (hasPermission(session.role, 'stats:people') ? PEOPLE_CARD_COUNT : 0) +
    (hasPermission(session.role, 'stats:finance') ? FINANCE_CARD_COUNT : 0)
  const showFirstTimers = canAccessSection(session.role, 'firstTimers')
  const showWelfare = canAccessSection(session.role, 'welfare')

  return (
    <PageContainer>
      <Suspense fallback={null}>
        <DeniedToast />
      </Suspense>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-2xl text-foreground">Welcome back</h2>
          <Badge>{ROLE_LABELS[session.role]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across the fellowship.</p>
      </div>
      <BlockErrorBoundary title="Statistics couldn't load">
        <Suspense fallback={<StatGridSkeleton count={statCount} label="Loading statistics…" />}>
          <OverviewStats session={session} />
        </Suspense>
      </BlockErrorBoundary>
      {(showFirstTimers || showWelfare) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showFirstTimers && (
            <ActivityList
              id="recent-first-timers"
              title="Recent first-timers"
              viewAllHref={SECTION_PATHS.firstTimers}
              viewAllNoun="first-timers"
            >
              <BlockErrorBoundary className="rounded-none border-0 py-8 sm:py-8">
                <Suspense fallback={<ActivitySkeleton />}>
                  <RecentFirstTimers session={session} />
                </Suspense>
              </BlockErrorBoundary>
            </ActivityList>
          )}
          {showWelfare && (
            <ActivityList
              id="recent-welfare"
              title="Recent welfare requests"
              viewAllHref={SECTION_PATHS.welfare}
              viewAllNoun="welfare requests"
            >
              <BlockErrorBoundary className="rounded-none border-0 py-8 sm:py-8">
                <Suspense fallback={<ActivitySkeleton />}>
                  <RecentWelfare session={session} />
                </Suspense>
              </BlockErrorBoundary>
            </ActivityList>
          )}
        </div>
      )}
    </PageContainer>
  )
}
