/**
 * OverviewStats — the streamed, data-dependent stat grid of the overview.
 *
 * Async Server Component rendered behind <Suspense> with StatGridSkeleton
 * (and a BlockErrorBoundary), so the page header paints immediately and
 * only this block waits on data. When every visible figure is zero it
 * shows the "nothing yet" EmptyState instead.
 *
 * RBAC: getOverviewStats() only returns the groups the role may see
 * (stats:people / stats:finance), and only those groups are rendered, so a
 * role never receives a figure it can't see. Card links render only for
 * sections the role can open.
 */

import {
  CalendarCheck,
  HeartHandshake,
  Scale,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { PrayingHands } from '@/components/dashboard/icons/PrayingHands'
import type { ECCFSession, WorkerRole } from '@/types'
import { getOverviewStats } from '@/lib/dashboard/data'
import { lagosMonthLabel } from '@/lib/dashboard/dates'
import { formatCount, formatDate, formatNaira, formatRelativeDay, toDateTimeAttr } from '@/lib/dashboard/format'
import { canAccessSection, isHallScoped, SECTION_PATHS, type DashboardSection } from '@/lib/dashboard/rbac'
import type {
  FinanceStats,
  OverviewStats as OverviewStatsData,
  PeopleStats,
} from '@/lib/dashboard/types'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { cn } from '@/lib/utils'
import StatCard from './StatCard'

/** True when the role's visible stats have nothing to show yet. */
export function isOverviewEmpty({ people, finance }: OverviewStatsData): boolean {
  const figures = [
    ...(people ? [people.firstTimersThisMonth, people.pendingWelfare, people.prayerRequestsThisWeek, people.workers] : []),
    ...(finance ? [finance.incomeThisMonth, finance.expenseThisMonth] : []),
  ]
  return figures.every((n) => n === 0) && !people?.lastService
}

/** Cards rendered per group — keeps the skeleton the same size as the grid. */
export const PEOPLE_CARD_COUNT = 5
export const FINANCE_CARD_COUNT = 3

type LastService = NonNullable<PeopleStats['lastService']>

function serviceLabel(service: LastService): string {
  return service.serviceType
}

function workersCaption(role: WorkerRole): string {
  return isHallScoped(role) ? 'In your hall' : 'Across all halls'
}

function linkFor(role: WorkerRole, section: DashboardSection, session?: ECCFSession) {
  return canAccessSection(role, section, session) ? SECTION_PATHS[section] : undefined
}

function StatGroup({ id, title, className, children }: { id: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 id={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className={cn('grid grid-cols-2 gap-3 sm:gap-4', className)}>{children}</div>
    </section>
  )
}

function PeopleCards({ stats, role, session }: { stats: PeopleStats; role: WorkerRole; session: ECCFSession }) {
  const since = `Since 1 ${lagosMonthLabel()}`
  const firstTimersCaption = isHallScoped(role) ? `In your hall · ${since}` : since
  const { lastService } = stats

  return (
    <StatGroup id="overview-people" title="People" className="xl:grid-cols-5">
      <StatCard
        id="stat-first-timers"
        headingLevel="h4"
        label="First-timers this month"
        icon={<UserPlus />}
        value={formatCount(stats.firstTimersThisMonth)}
        rawValue={stats.firstTimersThisMonth}
        caption={firstTimersCaption}
        tone="primary"
        href={linkFor(role, 'firstTimers', session)}
        linkLabel="View first-timers"
      />
      <StatCard
        id="stat-pending-welfare"
        headingLevel="h4"
        label="Pending welfare requests"
        icon={<HeartHandshake />}
        value={formatCount(stats.pendingWelfare)}
        rawValue={stats.pendingWelfare}
        caption={stats.pendingWelfare > 0 ? 'Needs follow-up' : 'All caught up'}
        tone={stats.pendingWelfare > 0 ? 'warning' : 'success'}
        href={linkFor(role, 'welfare')}
        linkLabel="View welfare"
      />
      <StatCard
        id="stat-prayer-requests"
        headingLevel="h4"
        label="Prayer requests"
        icon={<PrayingHands className="h-5 w-5" />}
        value={formatCount(stats.prayerRequestsThisWeek)}
        rawValue={stats.prayerRequestsThisWeek}
        caption="Last 7 days"
        tone="primary"
        href={linkFor(role, 'prayerRequests')}
        linkLabel="View prayer requests"
      />
      <StatCard
        id="stat-workers"
        headingLevel="h4"
        label="Workers"
        icon={<Users />}
        value={formatCount(stats.workers)}
        rawValue={stats.workers}
        caption={workersCaption(role)}
        tone="muted"
        href={linkFor(role, 'workers')}
        linkLabel="View workers"
      />
      <StatCard
        id="stat-last-service"
        headingLevel="h4"
        label="Last service attendance"
        icon={<CalendarCheck />}
        className="col-span-2 xl:col-span-1"
        value={lastService ? formatCount(lastService.totalCount) : '—'}
        rawValue={lastService?.totalCount}
        caption={
          lastService ? (
            <>
              <span>{serviceLabel(lastService)}</span>
              <span>·</span>
              <time dateTime={toDateTimeAttr(lastService.date)} title={formatDate(lastService.date)}>
                {formatRelativeDay(lastService.date)}
              </time>
            </>
          ) : (
            'No services recorded yet'
          )
        }
        tone="muted"
        href={linkFor(role, 'attendance')}
        linkLabel="View attendance"
      />
    </StatGroup>
  )
}

function FinanceCards({ stats, role }: { stats: FinanceStats; role: WorkerRole }) {
  const since = `Since 1 ${lagosMonthLabel()}`
  const net = stats.incomeThisMonth - stats.expenseThisMonth
  const href = linkFor(role, 'finance')

  return (
    <StatGroup id="overview-finance" title="Finance" className="xl:grid-cols-3">
      <StatCard
        id="stat-income"
        headingLevel="h4"
        label="Income this month"
        icon={<TrendingUp />}
        value={formatNaira(stats.incomeThisMonth)}
        rawValue={stats.incomeThisMonth}
        caption={since}
        tone="success"
        href={href}
        linkLabel="View finance"
      />
      <StatCard
        id="stat-expense"
        headingLevel="h4"
        label="Expenses this month"
        icon={<TrendingDown />}
        value={formatNaira(stats.expenseThisMonth)}
        rawValue={stats.expenseThisMonth}
        caption={since}
        tone="muted"
        href={href}
        linkLabel="View finance"
      />
      <StatCard
        id="stat-net"
        headingLevel="h4"
        label="Net this month"
        icon={<Scale />}
        className="col-span-2 xl:col-span-1"
        value={formatNaira(net)}
        rawValue={net}
        caption={net > 0 ? 'Surplus' : net < 0 ? 'Deficit' : 'Break-even'}
        tone={net < 0 ? 'destructive' : 'success'}
        href={href}
        linkLabel="View finance"
      />
    </StatGroup>
  )
}

export default async function OverviewStats({ session }: { session: ECCFSession }) {
  const stats = await getOverviewStats(session)

  if (isOverviewEmpty(stats)) {
    return (
      <EmptyState
        headingLevel="h3"
        title="No activity yet"
        description="Once first-timers, welfare requests and ledger entries start coming in, your summary will appear here."
      />
    )
  }

  return (
    <div className="space-y-6">
      {stats.people && <PeopleCards stats={stats.people} role={session.role} session={session} />}
      {stats.finance && <FinanceCards stats={stats.finance} role={session.role} />}
    </div>
  )
}

/**
 * Fallback for OverviewStats: the same groups (heading + grid) the role
 * will see, so nothing jumps when the cards stream in. Only the first
 * grid announces "Loading statistics…".
 */
export function OverviewStatsSkeleton({ people, finance }: { people: boolean; finance: boolean }) {
  const groups = [
    ...(people ? [{ count: PEOPLE_CARD_COUNT, grid: 'xl:grid-cols-5' }] : []),
    ...(finance ? [{ count: FINANCE_CARD_COUNT, grid: 'xl:grid-cols-3' }] : []),
  ]
  return (
    <div className="space-y-6">
      {groups.map(({ count, grid }, i) => (
        <div key={i} className="space-y-3">
          <Skeleton aria-hidden="true" className="h-3 w-16 shrink-0" />
          <StatGridSkeleton
            count={count}
            gridClassName={cn('grid grid-cols-2 gap-3 sm:gap-4', grid)}
            label="Loading statistics…"
            announce={i === 0}
          />
        </div>
      ))}
    </div>
  )
}
