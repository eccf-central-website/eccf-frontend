/**
 * OverviewStats — the streamed, data-dependent part of the overview.
 *
 * Async Server Component rendered behind <Suspense> with StatGridSkeleton,
 * so the page header paints immediately and only this block waits on data.
 * Errors propagate to dashboard/error.tsx. When every visible figure is
 * zero it shows the "nothing yet" EmptyState instead.
 *
 * Interim body: feature/dashboard-overview replaces the raw-stats card with
 * the StatCard grid; the fetch, empty check and Suspense wiring stay.
 */

import type { ECCFSession } from '@/types'
import { getOverviewStats } from '@/lib/dashboard/data'
import type { OverviewStats as OverviewStatsData } from '@/lib/dashboard/types'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card'

/** True when the role's visible stats have nothing to show yet. */
export function isOverviewEmpty({ people, finance }: OverviewStatsData): boolean {
  const figures = [
    ...(people ? [people.firstTimersThisMonth, people.pendingWelfare, people.prayerRequestsThisWeek, people.workers] : []),
    ...(finance ? [finance.incomeThisMonth, finance.expenseThisMonth] : []),
  ]
  return figures.every((n) => n === 0) && !people?.lastService
}

export default async function OverviewStats({ session }: { session: ECCFSession }) {
  const stats = await getOverviewStats(session)

  if (isOverviewEmpty(stats)) {
    return (
      <EmptyState
        title="No activity yet"
        description="Once first-timers, welfare requests and ledger entries start coming in, your summary will appear here."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <h3>Summary</h3>
        </CardTitle>
        <CardDescription>
          Stat cards arrive in <code className="font-mono text-xs">feature/dashboard-overview</code>. Raw
          role-filtered stats for now:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
