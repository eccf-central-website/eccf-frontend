/**
 * OverviewStats — the streamed, unified 4-metric Pulse Strip of the overview.
 *
 * Async Server Component rendered behind <Suspense> with OverviewStatsSkeleton
 * (and a BlockErrorBoundary), so the page header paints immediately and
 * only this block waits on data. When every visible figure is zero it
 * shows the "nothing yet" EmptyState instead.
 *
 * RBAC: getOverviewStats() only returns the groups the role may see
 * (stats:people / stats:finance), and only permitted priority metrics render
 * in a single compact row (<= 4 metrics max).
 */

import {
  CalendarCheck,
  Scale,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import type { ECCFSession, WorkerRole } from '@/types'
import { getOverviewStats } from '@/lib/dashboard/data'
import { lagosMonthLabel } from '@/lib/dashboard/dates'
import { formatCount, formatDate, formatNaira, formatRelativeDay, toDateTimeAttr } from '@/lib/dashboard/format'
import {
  canAccessSection,
  hasPermission,
  isHallScoped,
  isRegularTeamLeader,
  SECTION_PATHS,
  type DashboardSection,
} from '@/lib/dashboard/rbac'
import type { OverviewStats as OverviewStatsData, PeopleStats } from '@/lib/dashboard/types'
import EmptyState from '@/components/dashboard/states/EmptyState'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import { StatCardSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { cn } from '@/lib/utils'
import StatCard, { type StatCardProps } from './StatCard'

/** True when the role's visible stats have nothing to show yet. */
export function isOverviewEmpty({ people, finance }: OverviewStatsData): boolean {
  const figures = [
    ...(people ? [people.firstTimersThisMonth, people.pendingWelfare, people.prayerRequestsThisWeek, people.workers] : []),
    ...(finance ? [finance.incomeThisMonth, finance.expenseThisMonth] : []),
  ]
  return figures.every((n) => n === 0) && !people?.lastService
}

/** Exact number of Pulse Strip tiles rendered for this session (<= 4). */
export function getPulseCardCount(session: ECCFSession): number {
  const showPeople = hasPermission(session.role, 'stats:people')
  const showFinance = hasPermission(session.role, 'stats:finance')

  if (!showPeople && showFinance) return 3

  let count = 0
  if (showPeople) {
    if (canAccessSection(session.role, 'attendance', session)) count += 1
    if (canAccessSection(session.role, 'firstTimers', session)) count += 1
    if (canAccessSection(session.role, 'workers', session)) count += 1
  }
  if (showFinance) count += 1
  return Math.min(count, 4)
}

export function pulseGridClass(count: number): string {
  if (count <= 1) return 'grid grid-cols-1 gap-3 sm:gap-4'
  if (count === 2) return 'grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4'
  if (count === 3) return 'grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3'
  return 'grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'
}

type LastService = NonNullable<PeopleStats['lastService']>

function serviceLabel(service: LastService): string {
  return service.meetingTitle || service.serviceType
}

function workersCaption(role: WorkerRole, session?: ECCFSession): string {
  if (isHallScoped(role)) return 'In your hall'
  if (isRegularTeamLeader(session)) {
    const teamName = session?.leadingTeam || session?.team
    return teamName && teamName.toLowerCase() !== 'exco' ? `In ${teamName}` : 'In your team'
  }
  return 'Across all halls'
}

function linkFor(role: WorkerRole, section: DashboardSection, session?: ECCFSession) {
  return canAccessSection(role, section, session) ? SECTION_PATHS[section] : undefined
}

export default async function OverviewStats({ session }: { session: ECCFSession }) {
  const stats = await getOverviewStats(session)

  if (isOverviewEmpty(stats)) {
    return (
      <EmptyState
        headingLevel="h2"
        title="No activity yet"
        description="Once first-timers, welfare requests and ledger entries start coming in, your summary will appear here."
      />
    )
  }

  const { role } = session
  const since = `Since 1 ${lagosMonthLabel()}`
  const isTeamLead = isRegularTeamLeader(session)

  const cards: StatCardProps[] = []

  if (!stats.people && stats.finance) {
    const net = stats.finance.incomeThisMonth - stats.finance.expenseThisMonth
    const financeHref = linkFor(role, 'finance', session)

    cards.push(
      {
        id: 'stat-income',
        headingLevel: 'h3',
        label: 'Income this month',
        icon: <TrendingUp />,
        value: formatNaira(stats.finance.incomeThisMonth),
        rawValue: stats.finance.incomeThisMonth,
        caption: since,
        tone: 'success',
        href: financeHref,
      },
      {
        id: 'stat-expense',
        headingLevel: 'h3',
        label: 'Expenses this month',
        icon: <TrendingDown />,
        value: formatNaira(stats.finance.expenseThisMonth),
        rawValue: stats.finance.expenseThisMonth,
        caption: since,
        tone: 'muted',
        href: financeHref,
      },
      {
        id: 'stat-net',
        headingLevel: 'h3',
        label: 'Net this month',
        icon: <Scale />,
        value: formatNaira(net),
        rawValue: net,
        caption: net > 0 ? 'Surplus' : net < 0 ? 'Deficit' : 'Break-even',
        tone: net < 0 ? 'destructive' : 'success',
        href: financeHref,
      }
    )
  } else {
    if (stats.people && canAccessSection(role, 'attendance', session)) {
      const { lastService } = stats.people
      cards.push({
        id: 'stat-last-service',
        headingLevel: 'h3',
        label: isTeamLead ? 'Last meeting attendance' : 'Last service attendance',
        icon: <CalendarCheck />,
        value: lastService ? formatCount(lastService.totalCount) : '—',
        rawValue: lastService?.totalCount,
        caption: lastService ? (
          <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>{serviceLabel(lastService)}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={toDateTimeAttr(lastService.date)} title={formatDate(lastService.date)}>
              {formatRelativeDay(lastService.date)}
            </time>
          </span>
        ) : isTeamLead ? (
          'No meetings recorded yet'
        ) : (
          'No services recorded yet'
        ),
        tone: 'muted',
        href: linkFor(role, 'attendance', session),
      })
    }

    if (stats.people && canAccessSection(role, 'firstTimers', session)) {
      cards.push({
        id: 'stat-first-timers',
        headingLevel: 'h3',
        label: 'First-timers this month',
        icon: <UserPlus />,
        value: formatCount(stats.people.firstTimersThisMonth),
        rawValue: stats.people.firstTimersThisMonth,
        caption: isHallScoped(role) ? `In your hall · ${since}` : since,
        tone: 'primary',
        href: linkFor(role, 'firstTimers', session),
      })
    }

    if (stats.people && canAccessSection(role, 'workers', session)) {
      cards.push({
        id: 'stat-workers',
        headingLevel: 'h3',
        label: 'Workers',
        icon: <Users />,
        value: formatCount(stats.people.workers),
        rawValue: stats.people.workers,
        caption: workersCaption(role, session),
        tone: 'muted',
        href: linkFor(role, 'workers', session),
      })
    }

    if (stats.finance && cards.length < 4) {
      const net = stats.finance.incomeThisMonth - stats.finance.expenseThisMonth
      cards.push({
        id: 'stat-net',
        headingLevel: 'h3',
        label: 'Net this month',
        icon: <Scale />,
        value: formatNaira(net),
        rawValue: net,
        caption: net > 0 ? 'Surplus' : net < 0 ? 'Deficit' : 'Break-even',
        tone: net < 0 ? 'destructive' : 'success',
        href: linkFor(role, 'finance', session),
      })
    }
  }

  if (cards.length === 0) return null

  return (
    <section aria-labelledby="overview-pulse-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h2
          id="overview-pulse-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Fellowship pulse
        </h2>
        <span className="text-[13px] font-medium text-muted-foreground">{since}</span>
      </div>

      <div className={pulseGridClass(cards.length)}>
        {cards.map((card, index) => (
          <StatCard
            key={card.id}
            {...card}
            className={cn(
              cards.length === 3 && index === 2 && 'min-[360px]:col-span-2 lg:col-span-1',
              card.className
            )}
          />
        ))}
      </div>
    </section>
  )
}

/**
 * Fallback for OverviewStats: single Pulse Strip matching the permitted tile
 * count (<= 4) so nothing jumps when metrics stream in.
 */
export function OverviewStatsSkeleton({
  count,
  people = true,
  finance = true,
  announce = true,
}: {
  count?: number
  people?: boolean
  finance?: boolean
  announce?: boolean
}) {
  const resolvedCount = Math.min(
    count ?? (!people && finance ? 3 : people && finance ? 4 : people ? 3 : 0),
    4
  )
  if (resolvedCount <= 0) return null

  return (
    <LoadingRegion label="Loading statistics…" announce={announce} className="space-y-2">
      <div aria-hidden="true" className="flex items-center justify-between px-0.5">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-3.5 w-24 rounded-md" />
      </div>
      <div aria-hidden="true" className={pulseGridClass(resolvedCount)}>
        {Array.from({ length: resolvedCount }, (_, i) => (
          <StatCardSkeleton
            key={i}
            className={resolvedCount === 3 && i === 2 ? 'min-[360px]:col-span-2 lg:col-span-1' : undefined}
          />
        ))}
      </div>
    </LoadingRegion>
  )
}
