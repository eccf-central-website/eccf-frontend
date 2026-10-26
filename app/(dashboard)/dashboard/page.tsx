/**
 * Dashboard Overview — /dashboard
 *
 * Implements the calm, attention-first Executive Cockpit:
 * - Date-only eyebrow and role context ("Quiet surface. Loud priorities.").
 * - "Do this now" attention queue sorted strictly by urgency.
 * - Aligned 4-metric pulse strip with cohesive phrase units.
 * - Side-by-side activity lists (First-timers & Welfare) streamed via Suspense.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { CalendarCheck } from 'lucide-react'
import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection, hasPermission, getLeaderPostTitle, SECTION_PATHS } from '@/lib/dashboard/rbac'
import DeniedToast from '@/components/dashboard/shell/DeniedToast'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import ActivityList from '@/components/dashboard/overview/ActivityList'
import AttentionQueue, { AttentionQueueSkeleton } from '@/components/dashboard/overview/AttentionQueue'
import OverviewStats, { OverviewStatsSkeleton } from '@/components/dashboard/overview/OverviewStats'
import RecentFirstTimers from '@/components/dashboard/overview/RecentFirstTimers'
import RecentWelfare from '@/components/dashboard/overview/RecentWelfare'
import BlockErrorBoundary from '@/components/dashboard/states/BlockErrorBoundary'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'

export const dynamic = 'force-dynamic'

/** Body placeholder inside an ActivityList; the stats skeleton does the announcing. */
function ActivitySkeleton() {
  return <FeedSkeleton items={3} search={false} announce={false} className="p-4 sm:p-5" />
}

export default async function DashboardOverviewPage() {
  const session = await requireSession()
  const showPeople = hasPermission(session.role, 'stats:people')
  const showFinance = hasPermission(session.role, 'stats:finance')
  const showFirstTimers = canAccessSection(session.role, 'firstTimers', session)
  const showWelfare = canAccessSection(session.role, 'welfare', session)
  const leaderPost = getLeaderPostTitle(session)

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const firstName = session.name ? session.name.trim().split(/\s+/)[0] : 'Leader'

  return (
    <PageContainer>
      <Suspense fallback={null}>
        <DeniedToast />
      </Suspense>

      {/* Universal Page Header — Date-only eyebrow, clean h1, primary 44px action */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {todayStr}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Good morning, {firstName}
              {leaderPost && (
                <span className="font-normal text-muted-foreground text-base sm:text-lg"> — {leaderPost}</span>
              )}
            </h1>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Link
              href="/dashboard/attendance"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 px-4 rounded-xl border border-border/60 bg-card hover:bg-muted/50 text-foreground text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span>Record attendance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* "Do this now" Attention Queue — Live data, sorted by urgency */}
      <Suspense fallback={<AttentionQueueSkeleton />}>
        <AttentionQueue session={session} />
      </Suspense>

      {/* Aligned KPI Pulse Strip (Streamed Suspense) */}
      <BlockErrorBoundary title="Statistics couldn't load">
        <Suspense fallback={<OverviewStatsSkeleton people={showPeople} finance={showFinance} />}>
          <OverviewStats session={session} />
        </Suspense>
      </BlockErrorBoundary>

      {/* Activity Lists (Two Columns) */}
      {(showFirstTimers || showWelfare) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showFirstTimers && (
            <ActivityList
              id="recent-first-timers"
              title="Recent first-timers"
              viewAllHref={SECTION_PATHS.firstTimers}
              viewAllNoun="first-timers"
            >
              <BlockErrorBoundary title="Recent first-timers couldn't load" className="rounded-none border-0 py-8 sm:py-8">
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
              <BlockErrorBoundary title="Recent welfare requests couldn't load" className="rounded-none border-0 py-8 sm:py-8">
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
