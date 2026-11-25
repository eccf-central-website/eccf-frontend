/**
 * Dashboard Overview — /dashboard
 *
 * Implements the calm, attention-first Executive Cockpit:
 * - Date-only eyebrow via formatDate and Belleza greeting with quiet Work Sans role context.
 * - Single primary header CTA scoped to the role's highest-priority permitted workflow.
 * - "Do this now" attention queue sorted strictly by urgency.
 * - Unified 4-metric Pulse Strip (<= 4 tiles) with tabular Work Sans figures.
 * - Side-by-side recent activity lists (max 4 hairline-divided rows) streamed via Suspense.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { CalendarCheck, Scale, UserPlus, Users } from 'lucide-react'
import { requireSession } from '@/lib/dashboard/auth'
import { RECENT_LIMIT } from '@/lib/dashboard/data/overview'
import { lagosDate, lagosGreeting } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import {
  canAccessSection,
  getLeaderPostTitle,
  hasPermission,
  SECTION_PATHS,
} from '@/lib/dashboard/rbac'
import DeniedToast from '@/components/dashboard/shell/DeniedToast'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import ActivityList, { ActivityListSkeleton } from '@/components/dashboard/overview/ActivityList'
import AttentionQueue, { AttentionQueueSkeleton } from '@/components/dashboard/overview/AttentionQueue'
import OverviewStats, {
  getPulseCardCount,
  OverviewStatsSkeleton,
} from '@/components/dashboard/overview/OverviewStats'
import RecentFirstTimers from '@/components/dashboard/overview/RecentFirstTimers'
import RecentWelfare from '@/components/dashboard/overview/RecentWelfare'
import BlockErrorBoundary from '@/components/dashboard/states/BlockErrorBoundary'
import { Button } from '@/components/dashboard/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardOverviewPage() {
  const session = await requireSession()
  const showPeople = hasPermission(session.role, 'stats:people')
  const showFinance = hasPermission(session.role, 'stats:finance')
  const showFirstTimers = canAccessSection(session.role, 'firstTimers', session)
  const showWelfare = canAccessSection(session.role, 'welfare', session)
  const canAttendance = canAccessSection(session.role, 'attendance', session)
  const canFinance = canAccessSection(session.role, 'finance', session)
  const canWorkers = canAccessSection(session.role, 'workers', session)
  const leaderPost = getLeaderPostTitle(session)

  const now = new Date()
  const todayIso = lagosDate(now)
  const todayLabel = formatDate(todayIso)
  const greeting = lagosGreeting(now)
  const firstName = session.name ? session.name.trim().split(/\s+/)[0] : 'Leader'

  const headerAction = canAttendance
    ? { href: SECTION_PATHS.attendance, label: 'Record attendance', icon: CalendarCheck }
    : canFinance
      ? { href: SECTION_PATHS.finance, label: 'Open finance', icon: Scale }
      : showFirstTimers
        ? { href: SECTION_PATHS.firstTimers, label: 'View first-timers', icon: UserPlus }
        : canWorkers
          ? { href: SECTION_PATHS.workers, label: 'Review workers', icon: Users }
          : null

  const pulseCount = getPulseCardCount(session)

  return (
    <PageContainer>
      <Suspense fallback={null}>
        <DeniedToast />
      </Suspense>

      {/* Universal Page Header — Date-only eyebrow, Belleza greeting, single 44px CTA */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
            <time dateTime={todayIso}>{todayLabel}</time>
          </p>
          <h1 className="font-heading font-normal text-[1.75rem] leading-[2.125rem] tracking-tight text-foreground [text-wrap:balance] sm:text-[2rem] sm:leading-[2.375rem]">
            {greeting}, {firstName}
            {leaderPost && (
              <span className="font-sans font-normal tracking-normal text-base text-muted-foreground sm:text-lg">
                {' '}— {leaderPost}
              </span>
            )}
          </h1>
        </div>

        {headerAction && (
          <div className="shrink-0 sm:flex sm:items-center">
            <Button asChild className="min-h-11 w-full font-semibold shadow-none sm:w-auto">
              <Link href={headerAction.href}>
                <headerAction.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>{headerAction.label}</span>
              </Link>
            </Button>
          </div>
        )}
      </header>

      {/* "Do this now" Attention Queue — Live data, sorted by urgency */}
      <BlockErrorBoundary title="Attention queue couldn't load" headingLevel="h2">
        <Suspense fallback={<AttentionQueueSkeleton />}>
          <AttentionQueue session={session} />
        </Suspense>
      </BlockErrorBoundary>

      {/* Unified KPI Pulse Strip (Streamed Suspense, <= 4 cards) */}
      {pulseCount > 0 && (
        <BlockErrorBoundary title="Statistics couldn't load" headingLevel="h2">
          <Suspense
            fallback={
              <OverviewStatsSkeleton
                count={pulseCount}
                people={showPeople}
                finance={showFinance}
              />
            }
          >
            <OverviewStats session={session} />
          </Suspense>
        </BlockErrorBoundary>
      )}

      {/* Activity Lists (Two Columns on lg when both are permitted, max 4 rows each) */}
      {(showFirstTimers || showWelfare) && (
        <div
          className={cn(
            'grid grid-cols-1 gap-4',
            showFirstTimers && showWelfare && 'lg:grid-cols-2'
          )}
        >
          {showFirstTimers && (
            <ActivityList
              id="recent-first-timers"
              title="Recent first-timers"
              viewAllHref={SECTION_PATHS.firstTimers}
              viewAllNoun="first-timers"
            >
              <BlockErrorBoundary
                title="Recent first-timers couldn't load"
                className="rounded-none border-0 py-8 sm:py-8"
              >
                <Suspense fallback={<ActivityListSkeleton rows={RECENT_LIMIT} />}>
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
              <BlockErrorBoundary
                title="Recent welfare requests couldn't load"
                className="rounded-none border-0 py-8 sm:py-8"
              >
                <Suspense fallback={<ActivityListSkeleton rows={RECENT_LIMIT} />}>
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
