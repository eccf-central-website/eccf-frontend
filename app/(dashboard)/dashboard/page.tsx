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
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection, hasPermission, ROLE_LABELS, SECTION_PATHS } from '@/lib/dashboard/rbac'
import DeniedToast from '@/components/dashboard/shell/DeniedToast'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import ActivityList from '@/components/dashboard/overview/ActivityList'
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
  const teamsList = session.teams && session.teams.length > 0 ? session.teams.slice(0, 2).join(' · ') : session.team

  return (
    <PageContainer>
      <Suspense fallback={null}>
        <DeniedToast />
      </Suspense>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Welcome back, {session.name || 'Leader'}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {ROLE_LABELS[session.role]}
            {session.excoPosition && ` · ${session.excoPosition}`}
            {teamsList && ` · ${teamsList}`}
          </p>
          <p className="hidden text-sm text-muted-foreground sm:block">Here&apos;s what&apos;s happening across the fellowship.</p>
        </div>
        <div className="shrink-0">
          <Link
            href="/dashboard/workers"
            className="inline-flex w-full items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm transition-colors sm:w-auto"
          >
            <Mail className="h-4 w-4 shrink-0" />
            {session.role === 'admin' ? 'Mail All Workers' : `Mail ${session.team}`}
          </Link>
        </div>
      </div>
      <BlockErrorBoundary title="Statistics couldn't load">
        <Suspense fallback={<OverviewStatsSkeleton people={showPeople} finance={showFinance} />}>
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
