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
import { Badge } from '@/components/dashboard/ui/badge'

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

  return (
    <PageContainer>
      <Suspense fallback={null}>
        <DeniedToast />
      </Suspense>
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-foreground">
              Welcome back, {session.name || 'Leader'}
            </h2>
            {session.excoPosition && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-xs sm:px-3 sm:py-1">
                {session.excoPosition}
              </span>
            )}
            <Badge variant="secondary" className="text-xs font-medium">{ROLE_LABELS[session.role]}</Badge>
            {session.teams && session.teams.length > 0 ? (
              session.teams.slice(0, 2).map((t) => (
                <Badge key={t} variant="outline" className="hidden text-xs sm:inline-flex">
                  {t}
                </Badge>
              ))
            ) : session.team ? (
              <Badge variant="outline" className="hidden text-xs sm:inline-flex">
                {session.team}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across the fellowship.</p>
        </div>

        <div className="shrink-0">
          <Link
            href="/dashboard/workers"
            className="inline-flex w-full items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#0077cc] hover:bg-[#0060aa] text-white font-bold text-xs shadow-xs transition-colors sm:w-auto"
          >
            <Mail className="h-4 w-4 shrink-0 mr-1" />
            {session.role === 'admin' ? 'Broadcast Mail to Workers' : `Send Mail to ${session.team}`}
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
